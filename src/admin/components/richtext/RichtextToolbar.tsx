// src/admin/components/richtext/RichtextToolbar.tsx
import type { Editor } from '@tiptap/react'
import { type ReactNode } from 'react'
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Minus,
  Link as LinkIcon,
  Image as ImageIcon,
  RemoveFormatting,
  Heading1,
  Heading2,
  Pilcrow,
} from 'lucide-react'

export type ToolbarPreset = 'full' | 'minimal'
export type ToolbarSize = 'md' | 'lg'

interface RichtextToolbarProps {
  editor: Editor
  preset?: ToolbarPreset
  /** md = 38px buttons inline; lg = 42px buttons in the full-screen overlay. */
  size?: ToolbarSize
  onLink: () => void
  onImage: () => void
}

/**
 * The one rich text toolbar. Bold/Italic/lists are icons; the things people
 * cannot guess from an icon (Heading, Normal, Link, Image) are worded.
 */
export default function RichtextToolbar({ editor, preset = 'full', size = 'md', onLink, onImage }: RichtextToolbarProps) {
  const isMinimal = preset === 'minimal'

  const box = size === 'lg' ? 'h-[42px] min-w-[42px] rounded-control text-[16px] [&_svg]:w-[19px] [&_svg]:h-[19px]' : 'h-[38px] min-w-[38px] rounded-tile text-[15px] [&_svg]:w-[18px] [&_svg]:h-[18px]'
  const divider = <span aria-hidden className={`w-[1.5px] bg-line-soft mx-1 ${size === 'lg' ? 'h-[26px]' : 'h-6'}`} />

  const Tool = ({
    active,
    onClick,
    title,
    children,
    worded,
  }: {
    active?: boolean
    onClick: () => void
    title: string
    children: ReactNode
    worded?: boolean
  }) => (
    <button
      type="button"
      title={title}
      aria-label={worded ? undefined : title}
      aria-pressed={active}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={[
        'inline-flex items-center justify-center gap-2 border font-bold leading-none transition-colors duration-100',
        box,
        worded ? 'px-3' : 'px-0',
        active ? 'bg-selected text-white border-selected' : 'bg-panel text-ink border-line-strong hover:bg-page',
      ].join(' ')}
    >
      {children}
    </button>
  )

  return (
    <div
      role="toolbar"
      aria-label="Formatting"
      className={`flex flex-wrap items-center gap-1.5 ${size === 'lg' ? 'px-6 py-2.5 bg-panel border-b-[1.5px] border-line-hair' : 'px-3 py-2 bg-page border-b-[1.5px] border-line-hair'}`}
    >
      <Tool active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold">
        <Bold aria-hidden />
      </Tool>
      <Tool active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic">
        <Italic aria-hidden />
      </Tool>

      {!isMinimal && (
        <>
          {divider}
          <Tool active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading">
            <Heading1 aria-hidden />
          </Tool>
          <Tool active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Sub-heading">
            <Heading2 aria-hidden />
          </Tool>
          <Tool active={editor.isActive('paragraph')} onClick={() => editor.chain().focus().setParagraph().run()} title="Normal text">
            <Pilcrow aria-hidden />
          </Tool>
          {divider}
          <Tool active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet list">
            <List aria-hidden />
          </Tool>
          <Tool active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered list">
            <ListOrdered aria-hidden />
          </Tool>
          <Tool active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Blockquote">
            <Quote aria-hidden />
          </Tool>
          <Tool onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal rule">
            <Minus aria-hidden />
          </Tool>
        </>
      )}

      {divider}
      <Tool worded active={editor.isActive('link')} onClick={onLink} title={editor.isActive('link') ? 'Edit link' : 'Add link'}>
        <LinkIcon aria-hidden />
        Link
      </Tool>

      {!isMinimal && (
        <>
          <Tool worded onClick={onImage} title="Insert image">
            <ImageIcon aria-hidden />
            Image
          </Tool>
          {divider}
          <Tool onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} title="Remove formatting">
            <RemoveFormatting aria-hidden />
          </Tool>
        </>
      )}
    </div>
  )
}
