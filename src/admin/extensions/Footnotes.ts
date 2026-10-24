// src/admin/extensions/Footnotes.ts
import { Extension, Node } from '@tiptap/core'
import type { Fragment, Node as PMNode, ResolvedPos } from '@tiptap/pm/model'
import { Plugin, PluginKey, TextSelection, type Transaction } from '@tiptap/pm/state'

/*
 * Footnotes, on the model of Buttondown's tiptap-footnotes: a reference is an
 * inline atom in the text, and its note is an item in one list at the very
 * end of the document. The list follows the references. A plugin keeps the
 * notes in the references' order and numbers both, gives a new reference an
 * empty note, and drops the note of a deleted one. A reference and its note
 * share an opaque id, so a note goes wherever its reference is moved.
 *
 *   <p>Okudzhava<sup id="fnref:1"><a class="footnote-ref" href="#fn:1" data-footnote="k3x9">1</a></sup> …</p>
 *   <ol class="footnotes"><li id="fn:1" data-footnote="k3x9"><p>The note.</p></li></ol>
 *
 * Back links from a note to its reference are left to the site, which knows
 * how it wants them to look.
 */

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    footnotes: {
      /** Add a footnote after the selection and put the cursor in its note. */
      insertFootnote: () => ReturnType
      /** Put the cursor at the end of a footnote's note. */
      focusFootnote: (id: string) => ReturnType
      /** Put the cursor just after a footnote's reference in the text. */
      focusFootnoteReference: (id: string) => ReturnType
    }
  }
}

const REFERENCE = 'footnoteReference'
const NOTE = 'footnote'
const LIST = 'footnotes'

const newId = () => Math.random().toString(36).slice(2, 10)

const isInNotes = ($pos: ResolvedPos) => {
  for (let depth = $pos.depth; depth > 0; depth--) {
    if ($pos.node(depth).type.name === LIST) return true
  }
  return false
}

function find(doc: PMNode, type: string, id: string): { pos: number; node: PMNode } | null {
  let found: { pos: number; node: PMNode } | null = null
  doc.descendants((node, pos) => {
    if (found) return false
    if (node.type.name === type && node.attrs.id === id) found = { pos, node }
  })
  return found
}

/**
 * Make the notes match the references, in place on `tr`. `removed` holds the
 * text of notes dropped earlier, by id, so cutting a reference and pasting it
 * elsewhere brings its note back.
 */
export function syncFootnotes(tr: Transaction, removed: Map<string, Fragment> = new Map()): Transaction {
  const { schema } = tr.doc.type
  const refs: { pos: number; node: PMNode }[] = []
  const strays: number[] = []
  let listPos = -1

  tr.doc.descendants((node, pos) => {
    if (node.type.name === LIST) {
      listPos = pos
      node.descendants((child, at) => {
        if (child.type.name === REFERENCE) strays.push(pos + 1 + at)
      })
      return false
    }
    if (node.type.name === REFERENCE) refs.push({ pos, node })
  })

  // A note cannot have a footnote of its own. The list is the last thing in
  // the document, so removing these moves nothing before it.
  for (const pos of strays.reverse()) tr.delete(pos, pos + 1)

  const ids: string[] = []
  refs.forEach(({ pos, node }, i) => {
    let id: string = node.attrs.id
    if (!id || ids.includes(id)) id = newId()
    ids.push(id)
    if (id !== node.attrs.id || node.attrs.number !== i + 1) {
      tr.setNodeMarkup(pos, undefined, { ...node.attrs, id, number: i + 1 })
    }
  })

  // Renumbering keeps every node's size, so the list has not moved.
  const current = listPos >= 0 ? { pos: listPos, node: tr.doc.nodeAt(listPos)! } : null
  const notes: PMNode[] = []
  current?.node.forEach((child) => notes.push(child))

  const inStep =
    notes.length === ids.length && notes.every((n, i) => n.attrs.id === ids[i] && n.attrs.number === i + 1)
  if (inStep) return tr

  const byId = new Map<string, PMNode>()
  for (const n of notes) if (n.attrs.id && !byId.has(n.attrs.id)) byId.set(n.attrs.id, n)
  for (const [id, n] of byId) if (!ids.includes(id)) removed.set(id, n.content)

  if (!ids.length) {
    if (current) tr.delete(current.pos, current.pos + current.node.nodeSize)
    return tr
  }

  const rebuilt = schema.nodes[LIST].create(
    null,
    ids.map((id, i) =>
      schema.nodes[NOTE].create({ id, number: i + 1 }, byId.get(id)?.content ?? removed.get(id) ?? schema.nodes.paragraph.create())
    )
  )
  if (current) tr.replaceWith(current.pos, current.pos + current.node.nodeSize, rebuilt)
  else tr.insert(tr.doc.content.size, rebuilt)
  return tr
}

/** The top node, with room for the notes after everything else. */
export const FootnotesDocument = Node.create({
  name: 'doc',
  topNode: true,
  content: `block+ ${LIST}?`,
})

export const FootnoteReference = Node.create({
  name: REFERENCE,
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      // Without an id, the anchor pairs it with its note, as Markdown
      // converters write them.
      id: {
        default: null,
        rendered: false,
        parseHTML: (element) => {
          const link = element.querySelector('a.footnote-ref')
          return link?.getAttribute('data-footnote') || link?.getAttribute('href')?.replace(/^#/, '') || null
        },
      },
      number: {
        default: null,
        rendered: false,
        parseHTML: (element) => parseInt(element.querySelector('a.footnote-ref')?.textContent ?? '', 10) || null,
      },
    }
  },

  parseHTML() {
    return [{ tag: 'sup', priority: 60, getAttrs: (element) => (element.querySelector('a.footnote-ref') ? null : false) }]
  },

  renderHTML({ node }) {
    const n = node.attrs.number
    return ['sup', { id: `fnref:${n}` }, ['a', { class: 'footnote-ref', href: `#fn:${n}`, 'data-footnote': node.attrs.id }, String(n)]]
  },

  renderText({ node }) {
    return `[${node.attrs.number}]`
  },

  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement('sup')
      dom.className = 'footnote-ref'
      const show = (n: PMNode) => {
        dom.textContent = String(n.attrs.number ?? '')
        dom.title = `Footnote ${n.attrs.number}: click to go to the note`
      }
      show(node)
      return {
        dom,
        update: (next) => {
          if (next.type.name !== REFERENCE) return false
          show(next)
          return true
        },
      }
    }
  },
})

export const Footnote = Node.create({
  name: NOTE,
  content: 'paragraph+',
  defining: true,
  isolating: true,

  addAttributes() {
    return {
      id: {
        default: null,
        rendered: false,
        parseHTML: (element) => element.getAttribute('data-footnote') || element.getAttribute('id') || null,
      },
      number: {
        default: null,
        rendered: false,
        parseHTML: (element) => parseInt(element.getAttribute('id')?.match(/^fn:(\d+)$/)?.[1] ?? '', 10) || null,
      },
    }
  },

  parseHTML() {
    return [{ tag: 'li', context: `${LIST}/`, priority: 60 }]
  },

  renderHTML({ node }) {
    return ['li', { id: `fn:${node.attrs.number}`, 'data-footnote': node.attrs.id }, 0]
  },

  addNodeView() {
    return ({ node, editor }) => {
      let current = node
      const dom = document.createElement('li')
      const content = document.createElement('div')
      const back = document.createElement('button')
      back.type = 'button'
      back.contentEditable = 'false'
      back.className = 'footnote-back'
      back.textContent = '↩'
      const label = () => `Back to footnote ${current.attrs.number} in the text`
      back.title = label()
      back.setAttribute('aria-label', label())
      back.addEventListener('mousedown', (event) => event.preventDefault())
      back.addEventListener('click', (event) => {
        event.preventDefault()
        editor.commands.focusFootnoteReference(current.attrs.id)
      })
      dom.append(content, back)
      return {
        dom,
        contentDOM: content,
        update: (next) => {
          if (next.type.name !== NOTE) return false
          current = next
          back.title = label()
          back.setAttribute('aria-label', label())
          return true
        },
        stopEvent: (event) => back.contains(event.target as globalThis.Node),
        ignoreMutation: (mutation) => back.contains(mutation.target),
      }
    }
  },
})

export const FootnoteList = Node.create({
  name: LIST,
  content: `${NOTE}+`,
  isolating: true,
  selectable: false,

  parseHTML() {
    return [{ tag: 'ol.footnotes', priority: 60 }]
  },

  renderHTML() {
    return ['ol', { class: 'footnotes' }, 0]
  },
})

const footnotesKey = new PluginKey('footnotes')

/** Everything footnotes need: the document shape, the three nodes, the commands and the plugin. */
export const Footnotes = Extension.create<Record<string, never>, { removed: Map<string, Fragment> }>({
  name: 'footnotesKit',

  addStorage() {
    return { removed: new Map() }
  },

  addExtensions() {
    return [FootnotesDocument, FootnoteReference, Footnote, FootnoteList]
  },

  onBeforeCreate() {
    // Notes that disagree with their references are repaired as soon as the
    // document is shown, so what the editor saves is always consistent.
    this.editor.on('mount', () => {
      const tr = syncFootnotes(this.editor.state.tr, this.storage.removed)
      if (tr.docChanged) this.editor.view.dispatch(tr.setMeta('addToHistory', false))
    })
  },

  addCommands() {
    return {
      insertFootnote:
        () =>
        ({ state, tr, dispatch }) => {
          const reference = state.schema.nodes[REFERENCE]
          const $to = state.selection.$to
          if (isInNotes($to) || !$to.parent.canReplaceWith($to.index(), $to.index(), reference)) return false
          if (dispatch) {
            const id = newId()
            tr.insert($to.pos, reference.create({ id }))
            syncFootnotes(tr, this.storage.removed)
            const note = find(tr.doc, NOTE, id)!
            tr.setSelection(TextSelection.create(tr.doc, note.pos + note.node.nodeSize - 2)).scrollIntoView()
          }
          return true
        },

      focusFootnote:
        (id) =>
        ({ tr, dispatch }) => {
          const note = find(tr.doc, NOTE, id)
          if (!note) return false
          if (dispatch) tr.setSelection(TextSelection.create(tr.doc, note.pos + note.node.nodeSize - 2)).scrollIntoView()
          return true
        },

      focusFootnoteReference:
        (id) =>
        ({ tr, dispatch }) => {
          const ref = find(tr.doc, REFERENCE, id)
          if (!ref) return false
          if (dispatch) tr.setSelection(TextSelection.create(tr.doc, ref.pos + 1)).scrollIntoView()
          return true
        },
    }
  },

  addProseMirrorPlugins() {
    const { editor, storage } = this
    return [
      new Plugin({
        key: footnotesKey,
        appendTransaction: (transactions, _oldState, state) => {
          if (!transactions.some((tr) => tr.docChanged)) return null
          const tr = syncFootnotes(state.tr, storage.removed)
          return tr.docChanged ? tr : null
        },
        props: {
          // A reference is a link to its note: clicking one goes there.
          handleClickOn: (_view, _pos, node, _nodePos, event, direct) => {
            if (!direct || node.type.name !== REFERENCE) return false
            event.preventDefault()
            return editor.commands.focusFootnote(node.attrs.id)
          },
        },
      }),
    ]
  },
})

export default Footnotes
