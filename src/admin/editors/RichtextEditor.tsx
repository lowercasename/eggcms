// src/admin/editors/RichtextEditor.tsx
import { useState, useEffect, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Maximize2, AlignLeft } from 'lucide-react'
import { LinkWithRef } from '../extensions/LinkWithRef'
import { ImageWithControls } from '../extensions/ImageWithControls'
import LinkModal from '../components/richtext/LinkModal'
import ImageInsertModal from '../components/richtext/ImageInsertModal'
import RichtextToolbar from '../components/richtext/RichtextToolbar'
import FullscreenOverlay from '../components/richtext/FullscreenOverlay'
import FieldActions from '../components/ui/FieldActions'
import { Button } from '../components/ui'
import { useFieldControl } from '../components/ui/FieldContext'
import { useSection, describeSection } from '../contexts/SectionContext'
import { getFieldLabel } from '../types'
import type { EditorProps } from './types'

/**
 * Rich text on TipTap. One document instance is shown either inline (bordered
 * box, 38px toolbar) or full screen (overlay, 42px toolbar, 21px text); the
 * field's schema `toolbar` option picks the full or minimal button set.
 */
export default function RichtextEditor({ field, value, onChange }: EditorProps) {
  const [showImagePicker, setShowImagePicker] = useState(false)
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const { id } = useFieldControl()
  const section = useSection()
  const preset = field.toolbar === 'minimal' ? 'minimal' : 'full'

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      LinkWithRef.configure({ openOnClick: false }),
      ImageWithControls,
    ],
    content: (value as string) || '',
    // The editable element is the field's control: give it the label's id and a name.
    editorProps: { attributes: { ...(id ? { id } : {}), role: 'textbox', 'aria-multiline': 'true', 'aria-label': getFieldLabel(field) } },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  })

  // Disable the editor while a modal is open so keystrokes go to the modal.
  // emitUpdate=false keeps the form from going dirty just from toggling.
  useEffect(() => {
    if (!editor) return
    editor.setEditable(!showLinkModal && !showImagePicker, false)
  }, [editor, showLinkModal, showImagePicker])

  const exitFullscreen = useCallback(() => setFullscreen(false), [])

  if (!editor) return null

  const linkAttrs = editor.getAttributes('link')
  const currentHref = linkAttrs.href && linkAttrs.href !== '#' ? linkAttrs.href : undefined
  const currentContentRef = linkAttrs.contentRef

  const toolbar = (size: 'md' | 'lg') => (
    <RichtextToolbar
      editor={editor}
      preset={preset}
      size={size}
      onLink={() => setShowLinkModal(true)}
      onImage={() => setShowImagePicker(true)}
    />
  )

  const content = (
    <EditorContent
      editor={editor}
      className="richtext-editor [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[inherit]"
      data-variant={fullscreen ? 'fullscreen' : 'inline'}
    />
  )

  return (
    <>
      <FieldActions>
        <Button variant="secondary" size="sm" icon={<Maximize2 aria-hidden />} onClick={() => setFullscreen(true)}>
          Full screen
        </Button>
      </FieldActions>

      <div className="control overflow-hidden rounded-button" onClick={() => !fullscreen && editor.commands.focus()}>
        {toolbar('md')}
        <div className={`px-6 py-5 ${preset === 'minimal' ? 'min-h-[120px]' : 'min-h-[220px]'} [&_.ProseMirror]:min-h-[inherit]`}>
          {!fullscreen && content}
        </div>
      </div>

      {fullscreen && (
        <FullscreenOverlay
          title={getFieldLabel(field)}
          subtitle={describeSection(section)}
          icon={<AlignLeft aria-hidden />}
          toolbar={toolbar('lg')}
          onDone={exitFullscreen}
        >
          <div className="min-h-[50vh] [&_.ProseMirror]:min-h-[inherit]">{content}</div>
        </FullscreenOverlay>
      )}

      {showImagePicker && (
        <ImageInsertModal
          onSelect={(path) => {
            editor.chain().focus().setImage({ src: path }).run()
            setShowImagePicker(false)
          }}
          onClose={() => setShowImagePicker(false)}
        />
      )}

      {showLinkModal && (
        <LinkModal
          currentHref={currentHref}
          currentContentRef={currentContentRef}
          onSaveExternal={(href) => {
            editor.chain().focus().extendMarkRange('link').setLink({ href, contentRef: null }).run()
            setShowLinkModal(false)
          }}
          onSaveInternal={(contentRef) => {
            editor.chain().focus().extendMarkRange('link').setLink({ href: '#', contentRef }).run()
            setShowLinkModal(false)
          }}
          onRemove={() => {
            editor.chain().focus().unsetLink().run()
            setShowLinkModal(false)
          }}
          onClose={() => setShowLinkModal(false)}
        />
      )}
    </>
  )
}
