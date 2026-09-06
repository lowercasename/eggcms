// src/admin/editors/BlocksEditor.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BlocksEditor from './BlocksEditor'
import type { FieldDefinition } from '../types'

vi.mock('./StringEditor', () => ({
  default: ({ field, value, onChange }: { field: { name: string }; value: unknown; onChange: (v: unknown) => void }) => (
    <input data-testid={`string-editor-${field.name}`} value={(value as string) || ''} onChange={(e) => onChange(e.target.value)} />
  ),
}))
vi.mock('./RichtextEditor', () => ({ default: () => <div data-testid="richtext-editor" /> }))
vi.mock('./ImageEditor', () => ({ default: () => <div data-testid="image-editor" /> }))

const heading = { name: 'heading', label: 'Heading', description: 'A large title', fields: [{ name: 'text', type: 'string', required: true }] }
const text = { name: 'text', label: 'Text', fields: [{ name: 'body', type: 'richtext' }] }
const book = {
  name: 'book',
  label: 'Book',
  icon: 'book-open',
  fields: [
    { name: 'title', type: 'string' },
    { name: 'details', type: 'richtext' },
  ],
}

const field: FieldDefinition = { name: 'sections', type: 'blocks', blocks: [heading, text, book] }

const three = [
  { _type: 'heading', _id: 'h1', text: 'Books by Elena Govor' },
  { _type: 'book', _id: 'b1', title: 'Early accounts of Hood Bay' },
  { _type: 'text', _id: 't1', body: '<p>Media and talks</p>' },
]

const onChange = vi.fn()
beforeEach(() => vi.clearAllMocks())

describe('BlocksEditor: rows', () => {
  it('shows every block collapsed with its type, preview and move buttons', () => {
    render(<BlocksEditor field={field} value={three} onChange={onChange} />)
    const rows = screen.getAllByTestId('block-row')
    expect(rows).toHaveLength(3)
    expect(within(rows[0]).getByText('Heading')).toBeInTheDocument()
    expect(within(rows[0]).getByText('Books by Elena Govor')).toBeInTheDocument()
    expect(within(rows[2]).getByText('Media and talks')).toBeInTheDocument()
    expect(within(rows[0]).getByRole('button', { name: /heading/i })).toHaveAttribute('aria-expanded', 'false')
    expect(within(rows[0]).getByRole('button', { name: 'Move up' })).toBeDisabled()
    expect(within(rows[2]).getByRole('button', { name: 'Move down' })).toBeDisabled()
    expect(screen.queryByTestId('string-editor-text')).not.toBeInTheDocument()
  })

  it('shows a message when no block types are defined', () => {
    render(<BlocksEditor field={{ name: 'x', type: 'blocks' }} value={[]} onChange={onChange} />)
    expect(screen.getByText('No block types defined for this field.')).toBeInTheDocument()
  })
})

describe('BlocksEditor: accordion', () => {
  it('opens one block at a time and shows its position while open', async () => {
    const user = userEvent.setup()
    render(<BlocksEditor field={field} value={three} onChange={onChange} />)
    const rows = screen.getAllByTestId('block-row')

    await user.click(within(rows[1]).getByRole('button', { name: /^book/i }))
    expect(within(rows[1]).getByRole('button', { name: /^book/i })).toHaveAttribute('aria-expanded', 'true')
    expect(within(rows[1]).getByText('2 of 3')).toBeInTheDocument()
    expect(screen.getByTestId('string-editor-title')).toBeInTheDocument()

    await user.click(within(rows[0]).getByRole('button', { name: /heading/i }))
    expect(within(rows[0]).getByRole('button', { name: /heading/i })).toHaveAttribute('aria-expanded', 'true')
    expect(within(rows[1]).getByRole('button', { name: /^book/i })).toHaveAttribute('aria-expanded', 'false')
    await waitFor(() => expect(screen.queryByTestId('string-editor-title')).not.toBeInTheDocument())
    expect(screen.getByTestId('string-editor-text')).toBeInTheDocument()
  })

  it('clicking the open header closes it', async () => {
    const user = userEvent.setup()
    render(<BlocksEditor field={field} value={three} onChange={onChange} />)
    const header = within(screen.getAllByTestId('block-row')[0]).getByRole('button', { name: /heading/i })
    await user.click(header)
    await user.click(header)
    expect(header).toHaveAttribute('aria-expanded', 'false')
  })

  it('offers Collapse all in the field label row', async () => {
    const user = userEvent.setup()
    render(<BlocksEditor field={field} value={three} onChange={onChange} />)
    await user.click(within(screen.getAllByTestId('block-row')[0]).getByRole('button', { name: /heading/i }))
    await user.click(screen.getByRole('button', { name: 'Collapse all' }))
    expect(within(screen.getAllByTestId('block-row')[0]).getByRole('button', { name: /heading/i })).toHaveAttribute('aria-expanded', 'false')
  })

  it('edits a field inside the open block', async () => {
    const user = userEvent.setup()
    render(<BlocksEditor field={field} value={three} onChange={onChange} />)
    await user.click(within(screen.getAllByTestId('block-row')[0]).getByRole('button', { name: /heading/i }))
    fireEvent.change(screen.getByTestId('string-editor-text'), { target: { value: 'Updated' } })
    expect(onChange).toHaveBeenLastCalledWith([
      { _type: 'heading', _id: 'h1', text: 'Updated' },
      three[1],
      three[2],
    ])
  })
})

describe('BlocksEditor: reorder', () => {
  it('moves a block down with the arrow button without opening it', async () => {
    const user = userEvent.setup()
    render(<BlocksEditor field={field} value={three} onChange={onChange} />)
    const rows = screen.getAllByTestId('block-row')
    await user.click(within(rows[0]).getByRole('button', { name: 'Move down' }))
    expect(onChange).toHaveBeenCalledWith([three[1], three[0], three[2]])
    expect(within(rows[0]).getByRole('button', { name: /heading/i })).toHaveAttribute('aria-expanded', 'false')
  })

  it('moves a block up', async () => {
    const user = userEvent.setup()
    render(<BlocksEditor field={field} value={three} onChange={onChange} />)
    await user.click(within(screen.getAllByTestId('block-row')[2]).getByRole('button', { name: 'Move up' }))
    expect(onChange).toHaveBeenCalledWith([three[0], three[2], three[1]])
  })

  it('reorders by dragging a row by its handle onto another', () => {
    render(<BlocksEditor field={field} value={three} onChange={onChange} />)
    const rows = screen.getAllByTestId('block-row')
    // Only the handle is draggable: a draggable row would stop the caret being
    // placed inside the block's rich text.
    expect(rows[2]).not.toHaveAttribute('draggable', 'true')
    const handle = within(rows[2]).getByRole('img', { name: 'Drag to move' })
    expect(handle).toHaveAttribute('draggable', 'true')
    const dataTransfer = { effectAllowed: '', setData: vi.fn(), getData: vi.fn() }
    fireEvent.dragStart(handle, { dataTransfer })
    fireEvent.dragOver(rows[0], { dataTransfer })
    expect(rows[0]).toHaveAttribute('data-drop-target', 'true')
    fireEvent.drop(rows[0], { dataTransfer })
    expect(onChange).toHaveBeenCalledWith([three[2], three[0], three[1]])
  })
})

describe('BlocksEditor: insert between', () => {
  it('has an insert point before the first block and after every block', () => {
    render(<BlocksEditor field={field} value={three} onChange={onChange} />)
    expect(screen.getAllByRole('button', { name: 'Insert a section here' })).toHaveLength(4)
  })

  it('opens a type menu under the divider, inserts at that place and opens the new block', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<BlocksEditor field={field} value={three} onChange={onChange} />)
    const inserts = screen.getAllByRole('button', { name: 'Insert a section here' })

    await user.click(inserts[2])
    const menu = screen.getByRole('menu', { name: 'Insert a section after “Book”' })
    expect(within(menu).getByText('A large title')).toBeInTheDocument()
    expect(within(menu).getByText('Title and Details')).toBeInTheDocument()

    await user.click(within(menu).getByRole('menuitem', { name: /text/i }))
    expect(onChange).toHaveBeenCalledTimes(1)
    const next = onChange.mock.calls[0][0]
    expect(next.map((b: { _type: string }) => b._type)).toEqual(['heading', 'book', 'text', 'text'])
    expect(next[2]._id).toEqual(expect.any(String))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()

    rerender(<BlocksEditor field={field} value={next} onChange={onChange} />)
    const rows = screen.getAllByTestId('block-row')
    expect(within(rows[2]).getByRole('button', { name: /text/i })).toHaveAttribute('aria-expanded', 'true')
  })

  it('names the top insert point differently and closes the menu with ×', async () => {
    const user = userEvent.setup()
    render(<BlocksEditor field={field} value={three} onChange={onChange} />)
    await user.click(screen.getAllByRole('button', { name: 'Insert a section here' })[0])
    expect(screen.getByRole('menu', { name: 'Insert a section at the top' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('initialises a new block with field defaults', async () => {
    const user = userEvent.setup()
    const withDefault = { name: 'quote', label: 'Quote', fields: [{ name: 'text', type: 'string', default: 'Say something' }] }
    render(<BlocksEditor field={{ ...field, blocks: [heading, withDefault] }} value={[three[0]]} onChange={onChange} />)
    await user.click(screen.getAllByRole('button', { name: 'Insert a section here' })[1])
    await user.click(screen.getByRole('menuitem', { name: /quote/i }))
    expect(onChange.mock.calls[0][0][1]).toEqual(expect.objectContaining({ _type: 'quote', text: 'Say something' }))
  })
})

describe('BlocksEditor: remove', () => {
  it('asks before removing, then removes', async () => {
    const user = userEvent.setup()
    render(<BlocksEditor field={field} value={three} onChange={onChange} />)
    await user.click(within(screen.getAllByTestId('block-row')[1]).getByRole('button', { name: /^book/i }))
    await user.click(screen.getByRole('button', { name: 'Remove section' }))
    expect(screen.getByText('Remove this book section?')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Keep it' }))
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.queryByText('Remove this book section?')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Remove section' }))
    await user.click(screen.getByRole('button', { name: 'Yes, remove' }))
    await waitFor(() => expect(onChange).toHaveBeenCalledWith([three[0], three[2]]))
  })
})

describe('BlocksEditor: empty state', () => {
  it('explains what sections are and offers one button per type', async () => {
    const user = userEvent.setup()
    render(<BlocksEditor field={field} value={[]} onChange={onChange} />)
    expect(screen.getByText('No sections yet')).toBeInTheDocument()
    expect(screen.getByText(/Add them in any order/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Insert a section here' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Add book' }))
    expect(onChange).toHaveBeenCalledWith([expect.objectContaining({ _type: 'book' })])
  })

  it('treats null as empty', () => {
    render(<BlocksEditor field={field} value={null} onChange={onChange} />)
    expect(screen.getByText('No sections yet')).toBeInTheDocument()
  })
})

describe('BlocksEditor with a single block type is a repeater', () => {
  const article = { name: 'article', label: 'Article', fields: [{ name: 'title', type: 'string' }, { name: 'link', type: 'string' }] }
  const list: FieldDefinition = { name: 'items', type: 'blocks', label: 'Articles', blocks: [article] }
  const items = [
    { _type: 'article', _id: 'a1', title: 'Mapping', link: '' },
    { _type: 'article', _id: 'a2', title: 'Nuku Hiva', link: '' },
  ]

  it('numbers every item, shows its fields open, and adds to the end', async () => {
    const user = userEvent.setup()
    render(<BlocksEditor field={list} value={items} onChange={onChange} />)
    const rows = screen.getAllByTestId('repeater-item')
    expect(rows).toHaveLength(2)
    expect(within(rows[0]).getByText('1')).toBeInTheDocument()
    expect(within(rows[1]).getByText('2')).toBeInTheDocument()
    expect(within(rows[0]).getByTestId('string-editor-title')).toHaveValue('Mapping')

    await user.click(screen.getByRole('button', { name: 'Add an article to this list' }))
    expect(onChange.mock.calls[0][0]).toHaveLength(3)
    expect(onChange.mock.calls[0][0][2]).toEqual(expect.objectContaining({ _type: 'article' }))
  })

  it('removes an item', async () => {
    const user = userEvent.setup()
    render(<BlocksEditor field={list} value={items} onChange={onChange} />)
    await user.click(within(screen.getAllByTestId('repeater-item')[0]).getByRole('button', { name: /remove/i }))
    await waitFor(() => expect(onChange).toHaveBeenCalledWith([items[1]]))
  })

  it('starts with a single add button when empty', async () => {
    const user = userEvent.setup()
    render(<BlocksEditor field={list} value={[]} onChange={onChange} />)
    await user.click(screen.getByRole('button', { name: 'Add an article to this list' }))
    expect(onChange).toHaveBeenCalledWith([expect.objectContaining({ _type: 'article' })])
  })
})
