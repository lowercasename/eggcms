// src/admin/extensions/TextStyles.ts
import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import type { RichtextStyle } from '../../lib/schema'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    textStyles: {
      /** Give the selected paragraphs a named style, or none with null. */
      setParagraphStyle: (name: string | null) => ReturnType
    }
  }
}

/*
 * Named paragraph styles that a site defines in its schema, such as an
 * epigraph. A styled paragraph is saved as <p class="epigraph"> and the site's
 * stylesheet decides how it looks. The editor marks it with the style's label,
 * as a decoration, so the label never reaches the saved HTML.
 */
export const TextStyles = Extension.create<{ styles: RichtextStyle[] }>({
  name: 'textStyles',

  addOptions() {
    return { styles: [] }
  },

  addGlobalAttributes() {
    const names = this.options.styles.map((s) => s.name)
    return [
      {
        types: ['paragraph'],
        attributes: {
          paragraphStyle: {
            default: null,
            parseHTML: (element) => names.find((name) => element.classList.contains(name)) ?? null,
            renderHTML: (attributes) => (attributes.paragraphStyle ? { class: attributes.paragraphStyle } : {}),
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      setParagraphStyle:
        (name) =>
        ({ commands }) => {
          if (name !== null && !this.options.styles.some((s) => s.name === name)) return false
          return commands.updateAttributes('paragraph', { paragraphStyle: name })
        },
    }
  },

  addProseMirrorPlugins() {
    const labels = new Map(this.options.styles.map((s) => [s.name, s.label]))
    if (!labels.size) return []
    return [
      new Plugin({
        key: new PluginKey('textStyles'),
        props: {
          decorations: (state) => {
            const marks: Decoration[] = []
            state.doc.descendants((node, pos) => {
              if (node.type.name === 'paragraph') {
                const label = labels.get(node.attrs.paragraphStyle)
                if (label) marks.push(Decoration.node(pos, pos + node.nodeSize, { 'data-style-label': label }))
              }
              return !node.isTextblock
            })
            return DecorationSet.create(state.doc, marks)
          },
        },
      }),
    ]
  },
})

export default TextStyles
