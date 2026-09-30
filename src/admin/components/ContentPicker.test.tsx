import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ContentPicker from './ContentPicker'
import { api } from '../lib/api'

const schemas = [
  { name: 'person', label: 'People', type: 'collection' as const, labelField: 'name', fields: [] },
  { name: 'page', label: 'Pages', type: 'collection' as const, fields: [] },
  { name: 'settings', label: 'Settings', type: 'singleton' as const, fields: [] },
]

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(api.getSchemas).mockResolvedValue({ data: schemas } as never)
  vi.mocked(api.getContent).mockImplementation(
    async (name: string) =>
      ({ data: name === 'person' ? [{ id: 'p1', name: 'Руся' }, { id: 'p2', name: 'Елена' }] : [{ id: 'x1', title: 'Home' }], meta: { total: 0 } }) as never,
  )
})

describe('ContentPicker', () => {
  it('offers collections only, not singletons', async () => {
    render(<ContentPicker selected={[]} onToggle={vi.fn()} />)
    const menu = await screen.findByLabelText('Kind of page')
    expect(menu).toHaveTextContent('People')
    expect(menu).toHaveTextContent('Pages')
    expect(menu).not.toHaveTextContent('Settings')
  })

  it('skips the collection menu when only one collection is allowed', async () => {
    render(<ContentPicker collections={['person']} selected={[]} onToggle={vi.fn()} />)
    expect(await screen.findByRole('button', { name: 'Руся' })).toBeInTheDocument()
    expect(screen.queryByLabelText('Kind of page')).not.toBeInTheDocument()
  })

  it('lists items by their labelField and reports a click as ref and label', async () => {
    const onToggle = vi.fn()
    render(<ContentPicker collections={['person']} selected={[]} onToggle={onToggle} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Елена' }))
    expect(onToggle).toHaveBeenCalledWith('person:p2', 'Елена')
  })

  it('marks the selected items', async () => {
    render(<ContentPicker collections={['person']} selected={['person:p1']} onToggle={vi.fn()} />)
    expect(await screen.findByRole('button', { name: 'Руся' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Елена' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('opens on the collection of the current selection', async () => {
    render(<ContentPicker selected={['page:x1']} onToggle={vi.fn()} />)
    expect(await screen.findByRole('button', { name: 'Home' })).toHaveAttribute('aria-pressed', 'true')
  })
})
