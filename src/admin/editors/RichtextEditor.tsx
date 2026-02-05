// src/admin/editors/RichtextEditor.tsx
import { useState, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import type { FieldDefinition } from '../types'
import { Bold, Italic, List, ListOrdered, Link as LinkIcon, Image as ImageIcon, AlignLeft, AlignCenter, AlignRight } from 'lucide-react'

// Extend Image with alignment support
const ImageWithAlignment = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      alignment: {
        default: 'center',
        parseHTML: (element) => element.getAttribute('data-alignment') || 'center',
        renderHTML: (attributes) => ({
          'data-alignment': attributes.alignment,
          class: `image-${attributes.alignment}`,
        }),
      },
    }
  },
})

interface Props {
  field: FieldDefinition
  value: unknown
  onChange: (v: unknown) => void
}

export default function RichtextEditor({ value, onChange }: Props) {
  const [isImageSelected, setIsImageSelected] = useState(false)
  const [currentAlignment, setCurrentAlignment] = useState('center')

  const updateImageState = useCallback((editor: ReturnType<typeof useEditor>) => {
    if (!editor) return
    const isImage = editor.isActive('image')
    setIsImageSelected(isImage)
    if (isImage) {
      const attrs = editor.getAttributes('image')
      setCurrentAlignment(attrs.alignment || 'center')
    }
  }, [])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Link.configure({ openOnClick: false }),
      ImageWithAlignment,
    ],
    content: (value as string) || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
      updateImageState(editor)
    },
    onSelectionUpdate: ({ editor }) => {
      updateImageState(editor)
    },
  })

  if (!editor) return null

  const setImageAlignment = (alignment: string) => {
    editor.chain().focus().updateAttributes('image', { alignment }).run()
    setCurrentAlignment(alignment)
  }

  return (
    <div className="border border-[#E8E8E3] rounded-lg overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex gap-1 px-3 py-2 border-b border-[#E8E8E3] bg-[#FAFAF8] flex-wrap">
        <ToolbarButton
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <div className="w-px bg-[#E8E8E3] mx-1" />
        <ToolbarButton
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Heading 2"
        >
          <span className="text-xs font-bold">H2</span>
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          title="Heading 3"
        >
          <span className="text-xs font-bold">H3</span>
        </ToolbarButton>
        <div className="w-px bg-[#E8E8E3] mx-1" />
        <ToolbarButton
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet list"
        >
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Numbered list"
        >
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>
        <div className="w-px bg-[#E8E8E3] mx-1" />
        <ToolbarButton
          active={editor.isActive('link')}
          onClick={() => {
            const url = window.prompt('URL:')
            if (url) {
              editor.chain().focus().setLink({ href: url }).run()
            }
          }}
          title="Add link"
        >
          <LinkIcon className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          active={false}
          onClick={() => {
            const url = window.prompt('Image URL:')
            if (url) {
              editor.chain().focus().setImage({ src: url }).run()
            }
          }}
          title="Insert image"
        >
          <ImageIcon className="w-4 h-4" />
        </ToolbarButton>

        {/* Image alignment buttons - shown when image is selected */}
        {isImageSelected && (
          <>
            <div className="w-px bg-[#E8E8E3] mx-1" />
            <ToolbarButton
              active={currentAlignment === 'left'}
              onClick={() => setImageAlignment('left')}
              title="Float left"
            >
              <AlignLeft className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              active={currentAlignment === 'center'}
              onClick={() => setImageAlignment('center')}
              title="Center"
            >
              <AlignCenter className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              active={currentAlignment === 'right'}
              onClick={() => setImageAlignment('right')}
              title="Float right"
            >
              <AlignRight className="w-4 h-4" />
            </ToolbarButton>
          </>
        )}
      </div>

      {/* Editor */}
      <EditorContent
        editor={editor}
        className="richtext-editor prose prose-sm max-w-none p-4 min-h-[200px] focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[168px]"
      />
    </div>
  )
}

function ToolbarButton({
  active,
  onClick,
  children,
  title,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  title?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`
        p-1.5 rounded-md text-[#6B6B63] transition-colors
        ${active
          ? 'bg-[#E5644E]/10 text-[#E5644E]'
          : 'hover:bg-[#F5F5F3] hover:text-[#1A1A18]'
        }
      `}
    >
      {children}
    </button>
  )
}
