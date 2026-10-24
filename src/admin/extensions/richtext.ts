// src/admin/extensions/richtext.ts
import type { AnyExtension } from '@tiptap/core'
import type { Level } from '@tiptap/extension-heading'
import StarterKit from '@tiptap/starter-kit'
import { LinkWithRef } from './LinkWithRef'
import { ImageWithControls } from './ImageWithControls'
import { Footnotes } from './Footnotes'
import { TextStyles } from './TextStyles'
import { DEFAULT_HEADINGS, type PublicField } from '../../lib/schema'

/**
 * The TipTap extensions for one rich text field, from its schema options:
 * which heading levels it offers, whether it has footnotes, and the site's
 * paragraph styles. The editor and anything that needs to read or write a
 * field's HTML the way the editor does (tests, imports) share this.
 */
export function richtextExtensions(field: Pick<PublicField, 'headings' | 'footnotes' | 'styles'>): AnyExtension[] {
  return [
    StarterKit.configure({
      heading: { levels: (field.headings ?? DEFAULT_HEADINGS) as Level[] },
      // LinkWithRef below is the link; StarterKit's own would be a second one.
      link: false,
      // Footnotes bring their own document, which ends with the notes; and
      // nothing may follow the notes, so no empty paragraph is added after them.
      ...(field.footnotes ? { document: false, trailingNode: { notAfter: ['paragraph', 'footnotes'] } } : {}),
    }),
    LinkWithRef.configure({ openOnClick: false }),
    ImageWithControls,
    ...(field.footnotes ? [Footnotes] : []),
    ...(field.styles?.length ? [TextStyles.configure({ styles: field.styles })] : []),
  ]
}
