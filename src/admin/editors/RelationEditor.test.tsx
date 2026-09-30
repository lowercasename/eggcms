import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import RelationEditor from './RelationEditor'
import { api } from '../lib/api'
import type { FieldDefinition } from '../types'

const field: FieldDefinition = { name: 'related', type: 'relation', collections: ['person', 'place'] }

const schemas = [
  { name: 'person', label: 'People', type: 'collection' as const, labelField: 'name', fields: [] },
  { name: 'place', label: 'Places', type: 'collection' as const, labelField: 'name', fields: [] },
  { name: 'page', label: 'Pages', type: 'collection' as const, fields: [] },
]

const content: Record<string, Array<{ id: string; name?: string; title?: string }>> = {
  person: [
    { id: 'p1', name: 'Лазарь Михельс' },
    { id: 'p2', name: 'Руся' },
  ],
  place: [{ id: 'k1', name: 'Куба' }],
  page: [{ id: 'x1', title: 'Home' }],
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(api.getSchemas).mockResolvedValue({ data: schemas } as never)
  vi.mocked(api.getContent).mockImplementation(async (name: string) => ({ data: content[name] ?? [], meta: { total: 0 } }) as never)
})

describe('RelationEditor', () => {
  it('offers to choose items when empty', () => {
    render(<RelationEditor field={field} value={null} onChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Choose items...' })).toBeInTheDocument()
  })

  it('shows each related item under its current name', async () => {
    const value = [{ ref: 'person:p1', label: 'Old name' }, { ref: 'place:k1', label: 'Куба' }]
    render(<RelationEditor field={field} value={value} onChange={vi.fn()} />)
    expect(await screen.findByText('Лазарь Михельс')).toBeInTheDocument()
    expect(screen.getByText('Куба')).toBeInTheDocument()
  })

  it('marks an item that no longer exists', async () => {
    render(<RelationEditor field={field} value={[{ ref: 'person:gone', label: 'Натан' }]} onChange={vi.fn()} />)
    expect(await screen.findByText('(deleted)')).toBeInTheDocument()
  })

  it('removes an item', () => {
    const onChange = vi.fn()
    const value = [{ ref: 'person:p1', label: 'Лазарь Михельс' }, { ref: 'place:k1', label: 'Куба' }]
    render(<RelationEditor field={field} value={value} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'Remove Куба' }))
    expect(onChange).toHaveBeenCalledWith([{ ref: 'person:p1', label: 'Лазарь Михельс' }])
  })

  it('stores null, not an empty list, when the last item is removed', () => {
    const onChange = vi.fn()
    render(<RelationEditor field={field} value={[{ ref: 'place:k1', label: 'Куба' }]} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'Remove Куба' }))
    expect(onChange).toHaveBeenCalledWith(null)
  })

  it('reorders items', () => {
    const onChange = vi.fn()
    const value = [{ ref: 'person:p1', label: 'A' }, { ref: 'place:k1', label: 'B' }]
    render(<RelationEditor field={field} value={value} onChange={onChange} />)
    fireEvent.click(screen.getAllByRole('button', { name: 'Move down' })[0])
    expect(onChange).toHaveBeenCalledWith([value[1], value[0]])
  })

  it('adds several items in one go, only from the allowed collections', async () => {
    const onChange = vi.fn()
    render(<RelationEditor field={field} value={[{ ref: 'place:k1', label: 'Куба' }]} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'Add or remove...' }))

    const dialog = await screen.findByRole('dialog')
    const menu = await within(dialog).findByLabelText('Kind of page')
    expect(within(menu).queryByRole('option', { name: 'Pages' })).not.toBeInTheDocument()

    fireEvent.change(menu, { target: { value: 'person' } })
    fireEvent.click(await within(dialog).findByRole('button', { name: 'Лазарь Михельс' }))
    fireEvent.click(within(dialog).getByRole('button', { name: 'Руся' }))
    fireEvent.click(within(dialog).getByRole('button', { name: 'Done' }))

    expect(onChange).toHaveBeenCalledWith([
      { ref: 'place:k1', label: 'Куба' },
      { ref: 'person:p1', label: 'Лазарь Михельс' },
      { ref: 'person:p2', label: 'Руся' },
    ])
  })

  it('leaves the value alone when the dialog is cancelled', async () => {
    const onChange = vi.fn()
    render(<RelationEditor field={field} value={null} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'Choose items...' }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.change(await within(dialog).findByLabelText('Kind of page'), { target: { value: 'person' } })
    fireEvent.click(await within(dialog).findByRole('button', { name: 'Руся' }))
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    expect(onChange).not.toHaveBeenCalled()
  })
})
