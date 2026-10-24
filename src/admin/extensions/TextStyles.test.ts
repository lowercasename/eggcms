// src/admin/extensions/TextStyles.test.ts
import { describe, it, expect, afterEach } from 'vitest'
import { Editor } from '@tiptap/core'
import { richtextExtensions } from './richtext'

const styles = [
  { name: 'epigraph', label: 'Epigraph' },
  { name: 'signature', label: 'Signature' },
]

const editors: Editor[] = []

function makeEditor(content: string, withStyles = styles) {
  const element = document.createElement('div')
  const editor = new Editor({ element, extensions: richtextExtensions({ styles: withStyles }), content })
  editors.push(editor)
  return editor
}

afterEach(() => {
  while (editors.length) editors.pop()!.destroy()
})

describe('TextStyles', () => {
  it('keeps a styled paragraph as it was given, line breaks and all', () => {
    const html = '<p class="epigraph">Что было, то и будет<br><br>Еккл. 1:9</p><p>Text.</p>'
    expect(makeEditor(html).getHTML()).toBe(html)
  })

  it('drops a class that is not one of the field\'s styles', () => {
    expect(makeEditor('<p class="lead">Text.</p>').getHTML()).toBe('<p>Text.</p>')
  })

  it('styles the paragraph at the cursor, and unstyles it with null', () => {
    const editor = makeEditor('<p>Канберра, 2003</p>')
    editor.commands.setTextSelection(3)
    expect(editor.commands.setParagraphStyle('signature')).toBe(true)
    expect(editor.getHTML()).toBe('<p class="signature">Канберра, 2003</p>')
    expect(editor.isActive('paragraph', { paragraphStyle: 'signature' })).toBe(true)

    editor.commands.setParagraphStyle(null)
    expect(editor.getHTML()).toBe('<p>Канберра, 2003</p>')
  })

  it('refuses a style the field does not have', () => {
    const editor = makeEditor('<p>Text.</p>')
    editor.commands.setTextSelection(2)
    expect(editor.commands.setParagraphStyle('lead')).toBe(false)
    expect(editor.getHTML()).toBe('<p>Text.</p>')
  })

  it('labels a styled paragraph in the editor without saving the label', () => {
    const editor = makeEditor('<p class="epigraph">Жене моей Лене посвящаю</p>')
    const paragraph = editor.view.dom.querySelector('p')!
    expect(paragraph.getAttribute('data-style-label')).toBe('Epigraph')
    expect(editor.getHTML()).not.toContain('data-style-label')
  })

  it('reads styled paragraphs as plain ones in a field without styles', () => {
    const editor = new Editor({ element: document.createElement('div'), extensions: richtextExtensions({}), content: '<p class="epigraph">Text.</p>' })
    editors.push(editor)
    expect(editor.getHTML()).toBe('<p>Text.</p>')
  })
})

describe('heading levels', () => {
  it('keeps the levels a field offers and turns others into paragraphs', () => {
    const editor = new Editor({
      element: document.createElement('div'),
      extensions: richtextExtensions({ headings: [2, 3, 4] }),
      content: '<h1>One</h1><h2>Two</h2><h3>Three</h3><h4>Four</h4>',
    })
    editors.push(editor)
    expect(editor.getHTML()).toBe('<p>One</p><h2>Two</h2><h3>Three</h3><h4>Four</h4>')
  })

  it('offers h2 and h3 by default', () => {
    const editor = new Editor({ element: document.createElement('div'), extensions: richtextExtensions({}), content: '<h2>Two</h2><h3>Three</h3><h4>Four</h4>' })
    editors.push(editor)
    expect(editor.getHTML()).toBe('<h2>Two</h2><h3>Three</h3><p>Four</p>')
  })
})
