// src/admin/editors/RichtextEditor.options.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Editor } from '@tiptap/react'
import RichtextEditor from './RichtextEditor'

const field = { name: 'text', label: 'Text', type: 'richtext' as const }

/** Put the caret inside the editor's text, after `offset` characters of `text`. */
async function placeCaret(text: string, offset: number) {
  // ProseMirror only follows the DOM selection while the editor has focus,
  // and reads it a moment after the selection changes.
  const dom = document.querySelector('.ProseMirror') as HTMLElement & { editor: Editor }
  dom.focus()
  const node = [...dom.querySelectorAll('*')]
    .flatMap((el) => [...el.childNodes])
    .find((n) => n.nodeType === Node.TEXT_NODE && n.textContent!.includes(text))!
  const at = node.textContent!.indexOf(text) + offset
  const range = document.createRange()
  range.setStart(node, at)
  range.collapse(true)
  const selection = window.getSelection()!
  selection.removeAllRanges()
  selection.addRange(range)
  document.dispatchEvent(new Event('selectionchange'))
  const pos = dom.editor.view.posAtDOM(node, at)
  await waitFor(() => expect(dom.editor.state.selection.from).toBe(pos))
}

describe('RichtextEditor heading levels', () => {
  it('offers a button for each level the field allows', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<RichtextEditor field={{ ...field, headings: [2, 3, 4] }} value="<p>Литература</p>" onChange={onChange} />)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Heading' })).toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Sub-heading' })).toBeInTheDocument()

    await placeCaret('Литература', 2)
    await user.click(screen.getByRole('button', { name: 'Minor heading' }))
    expect(onChange.mock.lastCall![0]).toMatch(/^<h4>Литература<\/h4>/)
  })

  it('offers only Heading and Sub-heading by default', async () => {
    render(<RichtextEditor field={field} value="" onChange={vi.fn()} />)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Heading' })).toBeInTheDocument())
    expect(screen.queryByRole('button', { name: 'Minor heading' })).not.toBeInTheDocument()
  })
})

describe('RichtextEditor text styles', () => {
  const styled = {
    ...field,
    styles: [
      { name: 'epigraph', label: 'Epigraph' },
      { name: 'signature', label: 'Signature' },
    ],
  }

  it('styles the paragraph at the caret from the Text style menu', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<RichtextEditor field={styled} value="<p>Жене моей Лене посвящаю</p>" onChange={onChange} />)
    const menu = await screen.findByRole('combobox', { name: 'Text style' })
    expect([...(menu as HTMLSelectElement).options].map((o) => o.text)).toEqual(['Normal', 'Epigraph', 'Signature'])

    await placeCaret('Лене', 1)
    await user.selectOptions(menu, 'Epigraph')
    expect(onChange).toHaveBeenLastCalledWith('<p class="epigraph">Жене моей Лене посвящаю</p>')
    expect(menu).toHaveValue('epigraph')
  })

  it('makes a styled paragraph normal again with Normal text', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<RichtextEditor field={styled} value='<p class="signature">Канберра, 2003</p>' onChange={onChange} />)
    await screen.findByRole('combobox', { name: 'Text style' })

    await placeCaret('Канберра', 3)
    await user.click(screen.getByRole('button', { name: 'Normal text' }))
    expect(onChange).toHaveBeenLastCalledWith('<p>Канберра, 2003</p>')
  })

  it('has no Text style menu when the field defines no styles', async () => {
    render(<RichtextEditor field={field} value="" onChange={vi.fn()} />)
    await waitFor(() => expect(screen.getByTitle('Bold')).toBeInTheDocument())
    expect(screen.queryByRole('combobox', { name: 'Text style' })).not.toBeInTheDocument()
  })
})

describe('RichtextEditor footnotes', () => {
  it('adds a footnote at the caret from the Footnote button', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<RichtextEditor field={{ ...field, footnotes: true }} value="<p>The Arbat.</p>" onChange={onChange} />)
    await screen.findByRole('button', { name: 'Footnote' })

    await placeCaret('Arbat', 5)
    // The toolbar redraws as the caret moves, so find the button again.
    await user.click(screen.getByRole('button', { name: 'Footnote' }))
    const html = onChange.mock.lastCall![0] as string
    expect(html).toMatch(/^<p>The Arbat<sup id="fnref:1"><a class="footnote-ref" href="#fn:1" data-footnote="[^"]+">1<\/a><\/sup>\.<\/p><ol class="footnotes"><li id="fn:1" data-footnote="[^"]+"><p><\/p><\/li><\/ol>$/)
  })

  it('cannot add a footnote inside a note', async () => {
    const value =
      '<p>Text<sup id="fnref:1"><a class="footnote-ref" href="#fn:1" data-footnote="a">1</a></sup></p>' +
      '<ol class="footnotes"><li id="fn:1" data-footnote="a"><p>The note.</p></li></ol>'
    render(<RichtextEditor field={{ ...field, footnotes: true }} value={value} onChange={vi.fn()} />)
    await screen.findByRole('button', { name: 'Footnote' })

    await placeCaret('The note', 3)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Footnote' })).toBeDisabled())
  })

  it('has no Footnote button unless the field has footnotes', async () => {
    render(<RichtextEditor field={field} value="" onChange={vi.fn()} />)
    await waitFor(() => expect(screen.getByTitle('Bold')).toBeInTheDocument())
    expect(screen.queryByRole('button', { name: 'Footnote' })).not.toBeInTheDocument()
  })
})
