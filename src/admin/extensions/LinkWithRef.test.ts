// src/admin/extensions/LinkWithRef.test.ts
import { describe, it, expect, afterEach } from 'vitest'
import { Editor } from '@tiptap/core'
import { richtextExtensions } from './richtext'

const editors: Editor[] = []

function saved(content: string) {
  const editor = new Editor({ element: document.createElement('div'), extensions: richtextExtensions({}), content })
  editors.push(editor)
  return editor.getHTML()
}

afterEach(() => {
  while (editors.length) editors.pop()!.destroy()
})

describe('LinkWithRef', () => {
  it('opens a link to another site in a new tab', () => {
    expect(saved('<p><a href="https://kabo.family">Rafail and Elena Kabo</a></p>')).toBe(
      '<p><a href="https://kabo.family" target="_blank" rel="noopener noreferrer nofollow">Rafail and Elena Kabo</a></p>'
    )
    expect(saved('<p><a href="//example.com/x">x</a></p>')).toBe(
      '<p><a href="//example.com/x" target="_blank" rel="noopener noreferrer nofollow">x</a></p>'
    )
  })

  it.each([
    ['a path on this site', '/articles/jinimin'],
    ['a relative path', 'chapter-2'],
    ['an anchor on the page', '#fn:1'],
    ['an email address', 'mailto:someone@example.com'],
  ])('keeps %s in the same tab', (_, href) => {
    expect(saved(`<p><a href="${href}">link</a></p>`)).toBe(`<p><a href="${href}">link</a></p>`)
  })

  it('takes the new tab off a link on this site that was saved with one', () => {
    expect(saved('<p><a href="/" target="_blank" rel="noopener noreferrer nofollow">Главная</a></p>')).toBe('<p><a href="/">Главная</a></p>')
  })

  it('keeps a link to a page in the CMS in the same tab', () => {
    expect(saved('<p><a href="#" data-content-ref="page:abc">Jinimin</a></p>')).toBe(
      '<p><a href="#" data-content-ref="page:abc">Jinimin</a></p>'
    )
  })
})
