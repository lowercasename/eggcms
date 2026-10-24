// src/admin/extensions/Footnotes.test.ts
import { describe, it, expect, afterEach, vi } from 'vitest'
import { Editor } from '@tiptap/core'
import { TextSelection } from '@tiptap/pm/state'
import { richtextExtensions } from './richtext'
import { syncFootnotes } from './Footnotes'

const editors: Editor[] = []

function makeEditor(content: string) {
  const editor = new Editor({
    element: document.createElement('div'),
    extensions: richtextExtensions({ footnotes: true }),
    content,
  })
  editors.push(editor)
  return editor
}

afterEach(() => {
  while (editors.length) editors.pop()!.destroy()
})

const ref = (n: number, id: string) =>
  `<sup id="fnref:${n}"><a class="footnote-ref" href="#fn:${n}" data-footnote="${id}">${n}</a></sup>`
const note = (n: number, id: string, text: string) => `<li id="fn:${n}" data-footnote="${id}"><p>${text}</p></li>`

/** Where the text `needle` starts in the document, as a ProseMirror position. */
function posOf(editor: Editor, needle: string): number {
  let found = -1
  editor.state.doc.descendants((node, pos) => {
    if (found >= 0) return false
    if (node.isText && node.text!.includes(needle)) found = pos + node.text!.indexOf(needle)
  })
  if (found < 0) throw new Error(`"${needle}" is not in the document`)
  return found
}

function placeCursor(editor: Editor, pos: number) {
  editor.view.dispatch(editor.state.tr.setSelection(TextSelection.create(editor.state.doc, pos)))
}

/** The note the cursor is in, by its text, or null in the body. */
function noteAtCursor(editor: Editor): string | null {
  const { $from } = editor.state.selection
  for (let d = $from.depth; d > 0; d--) {
    if ($from.node(d).type.name === 'footnote') return $from.node(d).textContent
  }
  return null
}

describe('Footnotes', () => {
  const doc =
    `<p>Okudzhava${ref(1, 'a')} sang of the Arbat${ref(2, 'b')}.</p>` +
    `<ol class="footnotes">${note(1, 'a', 'Bulat Okudzhava (1924-97).')}${note(2, 'b', 'A street in <em>Moscow</em>.')}</ol>`

  it('keeps footnoted HTML exactly as it was given', () => {
    expect(makeEditor(doc).getHTML()).toBe(doc)
  })

  it('opens a consistent document without changing it', () => {
    const onUpdate = vi.fn()
    const editor = new Editor({
      element: document.createElement('div'),
      extensions: richtextExtensions({ footnotes: true }),
      content: doc,
      onUpdate,
    })
    editors.push(editor)
    expect(syncFootnotes(editor.state.tr).docChanged).toBe(false)
    expect(onUpdate).not.toHaveBeenCalled()
  })

  it('pairs references and notes by their old anchors when there are no ids', () => {
    // The shape Markdown converters write, which is how most footnoted text arrives.
    const editor = makeEditor(
      '<p>One<sup id="fnref:1"><a href="#fn:1" class="footnote-ref">1</a></sup></p>' +
        '<ol class="footnotes"><li id="fn:1"><p>The note.</p></li></ol>'
    )
    expect(editor.getHTML()).toBe(`<p>One${ref(1, 'fn:1')}</p><ol class="footnotes">${note(1, 'fn:1', 'The note.')}</ol>`)
  })

  it('adds a numbered reference at the cursor and an empty note at the end, and moves into the note', () => {
    const editor = makeEditor('<p>Hunters and gatherers.</p>')
    placeCursor(editor, posOf(editor, ' and'))

    expect(editor.commands.insertFootnote()).toBe(true)

    const html = editor.getHTML()
    expect(html).toMatch(/^<p>Hunters<sup id="fnref:1"><a class="footnote-ref" href="#fn:1" data-footnote="([^"]+)">1<\/a><\/sup> and gatherers\.<\/p>/)
    const id = html.match(/data-footnote="([^"]+)"/)![1]
    expect(html).toContain(`<ol class="footnotes"><li id="fn:1" data-footnote="${id}"><p></p></li></ol>`)
    expect(noteAtCursor(editor)).toBe('')

    editor.commands.insertContent('Australian Aborigines.')
    expect(editor.getHTML()).toContain(`<li id="fn:1" data-footnote="${id}"><p>Australian Aborigines.</p></li>`)
  })

  it('renumbers when a footnote is added before the others, and each note keeps its text', () => {
    const editor = makeEditor(doc)
    placeCursor(editor, posOf(editor, 'Okudzhava'))
    editor.commands.insertFootnote()
    editor.commands.insertContent('New.')

    const html = editor.getHTML()
    const newId = html.match(/^<p><sup id="fnref:1"><a class="footnote-ref" href="#fn:1" data-footnote="([^"]+)">/)![1]
    expect(html).toBe(
      `<p>${ref(1, newId)}Okudzhava${ref(2, 'a')} sang of the Arbat${ref(3, 'b')}.</p>` +
        `<ol class="footnotes">${note(1, newId, 'New.')}${note(2, 'a', 'Bulat Okudzhava (1924-97).')}${note(3, 'b', 'A street in <em>Moscow</em>.')}</ol>`
    )
  })

  it('removes the note with its reference, and the list with the last one', () => {
    const editor = makeEditor(doc)
    const first = posOf(editor, 'Okudzhava') + 'Okudzhava'.length
    editor.commands.deleteRange({ from: first, to: first + 1 })
    expect(editor.getHTML()).toBe(
      `<p>Okudzhava sang of the Arbat${ref(1, 'b')}.</p><ol class="footnotes">${note(1, 'b', 'A street in <em>Moscow</em>.')}</ol>`
    )

    const second = posOf(editor, 'Arbat') + 'Arbat'.length
    editor.commands.deleteRange({ from: second, to: second + 1 })
    expect(editor.getHTML()).toBe('<p>Okudzhava sang of the Arbat.</p>')
  })

  it('brings a note back when its reference is cut and pasted elsewhere', () => {
    const editor = makeEditor(`<p>First${ref(1, 'a')} line.</p><p>Second line.</p><ol class="footnotes">${note(1, 'a', 'Kept.')}</ol>`)
    const at = posOf(editor, ' line.')
    const slice = editor.state.doc.slice(at - 1, at)
    editor.commands.deleteRange({ from: at - 1, to: at })
    expect(editor.getHTML()).toBe('<p>First line.</p><p>Second line.</p>')

    const target = posOf(editor, 'Second') + 'Second'.length
    editor.view.dispatch(editor.state.tr.replace(target, target, slice))
    expect(editor.getHTML()).toBe(`<p>First line.</p><p>Second${ref(1, 'a')} line.</p><ol class="footnotes">${note(1, 'a', 'Kept.')}</ol>`)
  })

  it('gives a copied reference its own note rather than sharing one', () => {
    const editor = makeEditor(`<p>First${ref(1, 'a')}.</p><p>Second.</p><ol class="footnotes">${note(1, 'a', 'Original.')}</ol>`)
    const at = posOf(editor, 'First') + 'First'.length
    const slice = editor.state.doc.slice(at, at + 1)
    const target = posOf(editor, 'Second') + 'Second'.length
    editor.view.dispatch(editor.state.tr.replace(target, target, slice))

    const html = editor.getHTML()
    const ids = [...html.matchAll(/<a class="footnote-ref"[^>]*data-footnote="([^"]+)"/g)].map((m) => m[1])
    expect(ids[0]).toBe('a')
    expect(ids[1]).not.toBe('a')
    expect(html).toContain(`<ol class="footnotes">${note(1, 'a', 'Original.')}${note(2, ids[1], '')}</ol>`)
  })

  it('will not put a footnote inside a note', () => {
    const editor = makeEditor(doc)
    placeCursor(editor, posOf(editor, 'Bulat'))
    expect(editor.can().insertFootnote()).toBe(false)
    expect(editor.commands.insertFootnote()).toBe(false)
    expect(editor.getHTML()).toBe(doc)
  })

  it('removes a reference pasted into a note', () => {
    const editor = makeEditor(doc)
    const at = posOf(editor, 'Okudzhava') + 'Okudzhava'.length
    const slice = editor.state.doc.slice(at, at + 1)
    const inNote = posOf(editor, 'Moscow')
    editor.view.dispatch(editor.state.tr.replace(inNote, inNote, slice))
    expect(editor.getHTML()).toBe(doc)
  })

  it('jumps between a reference and its note', () => {
    const editor = makeEditor(doc)
    expect(editor.commands.focusFootnote('b')).toBe(true)
    expect(noteAtCursor(editor)).toBe('A street in Moscow.')

    expect(editor.commands.focusFootnoteReference('b')).toBe(true)
    expect(noteAtCursor(editor)).toBe(null)
    expect(editor.state.selection.$from.nodeBefore?.type.name).toBe('footnoteReference')
    expect(editor.state.selection.$from.nodeBefore?.attrs.id).toBe('b')
  })

  it('clears everything, notes included, from a select-all and delete', () => {
    const editor = makeEditor(doc)
    editor.commands.selectAll()
    editor.commands.deleteSelection()
    expect(editor.getHTML()).toBe('<p></p>')
  })

  it('does not add an empty paragraph after the notes as you type', () => {
    const editor = makeEditor(doc)
    placeCursor(editor, posOf(editor, 'sang'))
    editor.commands.insertContent('x')
    expect(editor.getHTML().endsWith('</ol>')).toBe(true)
  })

  it('repairs a document whose notes do not match its references when it loads', () => {
    const editor = makeEditor(`<p>One${ref(7, 'a')} two${ref(9, 'z')}.</p><ol class="footnotes">${note(3, 'a', 'Kept.')}${note(4, 'orphan', 'Dropped.')}</ol>`)
    expect(editor.getHTML()).toBe(
      `<p>One${ref(1, 'a')} two${ref(2, 'z')}.</p><ol class="footnotes">${note(1, 'a', 'Kept.')}${note(2, 'z', '')}</ol>`
    )
  })

  it('reads a superscript that is not a footnote as plain text', () => {
    const editor = makeEditor('<p>1<sup>st</sup> edition</p>')
    expect(editor.getHTML()).toBe('<p>1st edition</p>')
  })
})

describe('richtextExtensions without footnotes', () => {
  it('reads footnoted HTML as ordinary text and lists', () => {
    const editor = new Editor({
      element: document.createElement('div'),
      extensions: richtextExtensions({}),
      content: `<p>One${ref(1, 'a')}</p><ol class="footnotes">${note(1, 'a', 'Note')}</ol>`,
    })
    editors.push(editor)
    expect(editor.schema.nodes.footnoteReference).toBeUndefined()
    expect(editor.getHTML()).not.toContain('<sup')
    expect(editor.getHTML()).not.toContain('<ol class="footnotes">')
  })
})
