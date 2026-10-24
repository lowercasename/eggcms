// src/admin/components/richtext/RichtextToolbar.tsx
import type { Editor } from '@tiptap/react'
import type { Level } from '@tiptap/extension-heading'
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
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  Pilcrow,
  Superscript,
} from 'lucide-react'
import { DEFAULT_HEADINGS, type RichtextStyle } from '../../../lib/schema'

export type ToolbarPreset = 'full' | 'minimal'
export type ToolbarSize = 'md' | 'lg'

interface RichtextToolbarProps {
  editor: Editor
  preset?: ToolbarPreset
  /** md = 38px buttons inline; lg = 42px buttons in the full-screen overlay. */
  size?: ToolbarSize
  onLink: () => void
  onImage: () => void
  /** The heading levels the field offers, one button each. */
  headings?: number[]
  /** The field's paragraph styles, offered in a Text style menu. */
  styles?: RichtextStyle[]
  /** Whether the field has footnotes, which adds a Footnote button. */
  footnotes?: boolean
}

// Heading buttons are named and drawn by rank, not by level, so a field
// whose headings are h2 and h3 shows "Heading" with an H1 icon.
const HEADING_NAMES = ['Heading', 'Sub-heading', 'Minor heading']
const HEADING_ICONS = [Heading1, Heading2, Heading3, Heading4, Heading5, Heading6]

/**
 * The one rich text toolbar. Formatting is icon-only (H1, H2 and ¶ for
 * headings and normal text); Link, Image and Footnote, which people cannot
 * guess from an icon, are worded. A field with paragraph styles gets a Text
 * style menu beside the headings.
 */
export default function RichtextToolbar({
  editor,
  preset = 'full',
  size = 'md',
  onLink,
  onImage,
  headings = DEFAULT_HEADINGS,
  styles = [],
  footnotes = false,
}: RichtextToolbarProps) {
  const isMinimal = preset === 'minimal'
  const paragraphStyle: string = editor.isActive('paragraph') ? (editor.getAttributes('paragraph').paragraphStyle ?? '') : ''

  const box = size === 'lg' ? 'h-[42px] min-w-[42px] rounded-control text-[16px] [&_svg]:w-[19px] [&_svg]:h-[19px]' : 'h-[38px] min-w-[38px] rounded-tile text-[15px] [&_svg]:w-[18px] [&_svg]:h-[18px]'
  const divider = <span aria-hidden className={`w-[1.5px] bg-line-soft mx-1 ${size === 'lg' ? 'h-[26px]' : 'h-6'}`} />

  const Tool = ({
    active,
    disabled,
    onClick,
    title,
    children,
    worded,
  }: {
    active?: boolean
    disabled?: boolean
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
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={[
        'inline-flex items-center justify-center gap-2 border font-bold leading-none transition-colors duration-100',
        box,
        worded ? 'px-3' : 'px-0',
        active ? 'bg-selected text-white border-selected' : 'bg-panel text-ink border-line-strong hover:bg-page',
        'disabled:bg-disabled disabled:text-ink-3 disabled:border-line-hair disabled:cursor-not-allowed',
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
          {headings.map((level, rank) => {
            const Icon = HEADING_ICONS[rank] ?? Heading6
            return (
              <Tool
                key={level}
                active={editor.isActive('heading', { level })}
                onClick={() => editor.chain().focus().toggleHeading({ level: level as Level }).run()}
                title={HEADING_NAMES[rank] ?? `Heading ${level}`}
              >
                <Icon aria-hidden />
              </Tool>
            )
          })}
          <Tool
            active={editor.isActive('paragraph') && !paragraphStyle}
            onClick={() => {
              const chain = editor.chain().focus().setParagraph()
              ;(styles.length ? chain.setParagraphStyle(null) : chain).run()
            }}
            title="Normal text"
          >
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

      {styles.length > 0 && (
        <>
          {divider}
          <select
            aria-label="Text style"
            title="Text style"
            value={paragraphStyle}
            onChange={(e) => editor.chain().focus().setParagraph().setParagraphStyle(e.target.value || null).run()}
            className={`border border-line-strong bg-panel text-ink font-bold px-2 ${size === 'lg' ? 'h-[42px] rounded-control text-[16px]' : 'h-[38px] rounded-tile text-[15px]'}`}
          >
            <option value="">Normal</option>
            {styles.map((style) => (
              <option key={style.name} value={style.name}>
                {style.label}
              </option>
            ))}
          </select>
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
        </>
      )}

      {footnotes && (
        <Tool
          worded
          disabled={!editor.can().insertFootnote()}
          onClick={() => editor.chain().focus().insertFootnote().run()}
          title="Add a footnote here. Click its number to go to the note."
        >
          <Superscript aria-hidden />
          Footnote
        </Tool>
      )}

      {!isMinimal && (
        <>
          {divider}
          <Tool onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} title="Remove formatting">
            <RemoveFormatting aria-hidden />
          </Tool>
        </>
      )}
    </div>
  )
}
