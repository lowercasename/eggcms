// src/admin/pages/ItemEdit.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ItemEdit from './ItemEdit'
import type { Schema } from '../types'

const { mockNavigate, mockApi } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockApi: { getItem: vi.fn(), createItem: vi.fn(), updateItem: vi.fn(), deleteItem: vi.fn() },
}))

vi.mock('wouter', () => ({ useLocation: () => ['/', mockNavigate] }))
vi.mock('../lib/api', () => ({ api: mockApi }))

vi.mock('../editors/StringEditor', async () => {
  const React = await import('react')
  return {
    default: ({ field, value, onChange, autoFocus }: { field: { name: string }; value: unknown; onChange: (v: unknown) => void; autoFocus?: boolean }) =>
      React.createElement('input', {
        'data-testid': `string-editor-${field.name}`,
        value: (value as string) || '',
        autoFocus,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value),
      }),
  }
})
vi.mock('../editors/ImageEditor', async () => {
  const React = await import('react')
  return {
    default: ({ value, onChange }: { value: unknown; onChange: (v: unknown) => void }) =>
      React.createElement('button', { type: 'button', 'data-testid': 'select-image-btn', onClick: () => onChange('/uploads/new-image.jpg') }, String(value || 'none')),
  }
})
vi.mock('../editors/RichtextEditor', async () => {
  const React = await import('react')
  return { default: () => React.createElement('div', { 'data-testid': 'richtext-editor' }) }
})
vi.mock('../editors/BlocksEditor', async () => {
  const React = await import('react')
  return { default: () => React.createElement('div', { 'data-testid': 'blocks-editor' }) }
})

import { DirtyStateProvider } from '../contexts/DirtyStateContext'

function renderEdit(ui: React.ReactElement) {
  return render(<DirtyStateProvider>{ui}</DirtyStateProvider>)
}

const schema: Schema = {
  name: 'page',
  label: 'Pages',
  type: 'collection',
  fields: [
    { name: 'title', type: 'string', required: true },
    { name: 'subtitle', type: 'string' },
  ],
}

const refreshList = vi.fn()
const loaded = () => waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument())

beforeEach(() => {
  vi.clearAllMocks()
  // The server keeps `draft` in _meta, not as a field.
  mockApi.updateItem.mockImplementation((_s: string, _id: string, data: Record<string, unknown>) => {
    const { draft, ...fields } = data
    return Promise.resolve({ data: { id: '123', ...fields, _meta: { draft: Boolean(draft) } } })
  })
})

describe('ItemEdit header', () => {
  it('shows the entry title and a Published chip, and nothing to save', async () => {
    mockApi.getItem.mockResolvedValue({ data: { id: '123', title: 'South Pacific', _meta: { draft: false } } })
    renderEdit(<ItemEdit schema={schema} itemId="123" refreshList={refreshList} />)
    await loaded()
    expect(screen.getByRole('heading', { name: 'South Pacific' })).toBeInTheDocument()
    expect(screen.getByText('Published')).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /publish/i })).not.toBeInTheDocument()
  })

  it('offers Unpublish and Delete in an overflow menu', async () => {
    mockApi.getItem.mockResolvedValue({ data: { id: '123', title: 'South Pacific', _meta: { draft: false } } })
    mockApi.deleteItem.mockResolvedValue({ data: { success: true } })
    const user = userEvent.setup()
    renderEdit(<ItemEdit schema={schema} itemId="123" refreshList={refreshList} />)
    await loaded()

    await user.click(screen.getByRole('button', { name: 'More actions' }))
    expect(screen.getByRole('menuitem', { name: 'Take off the website' })).toBeInTheDocument()
    await user.click(screen.getByRole('menuitem', { name: 'Delete page' }))
    // Deleting asks first.
    expect(screen.getByText('Delete “South Pacific”? This cannot be undone.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Yes, delete' }))
    await waitFor(() => expect(mockApi.deleteItem).toHaveBeenCalledWith('page', '123'))
    expect(mockNavigate).toHaveBeenCalledWith('/collections/page')
  })

  it('unpublishes from the overflow menu', async () => {
    mockApi.getItem.mockResolvedValue({ data: { id: '123', title: 'South Pacific', _meta: { draft: false } } })
    const user = userEvent.setup()
    renderEdit(<ItemEdit schema={schema} itemId="123" refreshList={refreshList} />)
    await loaded()
    await user.click(screen.getByRole('button', { name: 'More actions' }))
    await user.click(screen.getByRole('menuitem', { name: 'Take off the website' }))
    await waitFor(() => expect(mockApi.updateItem).toHaveBeenCalledWith('page', '123', expect.objectContaining({ draft: 1 })))
    await waitFor(() => expect(screen.getByText('Draft')).toBeInTheDocument())
  })
})

describe('ItemEdit unsaved changes', () => {
  beforeEach(() => {
    mockApi.getItem.mockResolvedValue({ data: { id: '123', title: 'South Pacific', subtitle: '', _meta: { draft: false } } })
  })

  it('shows an unsaved bar counting changed fields, with Discard and Publish changes', async () => {
    const user = userEvent.setup()
    renderEdit(<ItemEdit schema={schema} itemId="123" refreshList={refreshList} />)
    await loaded()

    await user.type(screen.getByTestId('string-editor-title'), '!')
    const bar = screen.getByRole('status')
    expect(bar).toHaveTextContent('1 unsaved change.')
    expect(bar).toHaveTextContent('The website still shows the last published version.')
    expect(screen.getByText('Edited')).toBeInTheDocument()

    await user.type(screen.getByTestId('string-editor-subtitle'), 'x')
    expect(screen.getByRole('status')).toHaveTextContent('2 unsaved changes.')

    // Discard asks first, and can be backed out of.
    await user.click(within(screen.getByRole('status')).getByRole('button', { name: 'Discard' }))
    expect(screen.getByRole('status')).toHaveTextContent('Throw away 2 unsaved changes?')
    await user.click(screen.getByRole('button', { name: 'Keep editing' }))
    expect(screen.getByTestId('string-editor-title')).toHaveValue('South Pacific!')

    await user.click(within(screen.getByRole('status')).getByRole('button', { name: 'Discard' }))
    await user.click(screen.getByRole('button', { name: 'Yes, discard' }))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByTestId('string-editor-title')).toHaveValue('South Pacific')
  })

  it('publishes the changes, says so for a moment, then goes quiet', async () => {
    const user = userEvent.setup()
    renderEdit(<ItemEdit schema={schema} itemId="123" refreshList={refreshList} />)
    await loaded()
    await user.type(screen.getByTestId('string-editor-title'), '!')
    await user.click(screen.getByRole('button', { name: 'Publish changes' }))

    await waitFor(() => expect(mockApi.updateItem).toHaveBeenCalledWith('page', '123', expect.objectContaining({ title: 'South Pacific!', draft: 0 })))
    expect(await screen.findByText(/Published just now/)).toBeInTheDocument()
    expect(refreshList).toHaveBeenCalled()
    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument(), { timeout: 3000 })
    expect(screen.getByText('Published')).toBeInTheDocument()
  })

  it('marks the entry dirty when an image field changes', async () => {
    const withImage: Schema = { ...schema, fields: [...schema.fields, { name: 'image', type: 'image' }] }
    mockApi.getItem.mockResolvedValue({ data: { id: '123', title: 'South Pacific', image: null, _meta: { draft: false } } })
    const user = userEvent.setup()
    renderEdit(<ItemEdit schema={withImage} itemId="123" refreshList={refreshList} />)
    await loaded()
    await user.click(screen.getByTestId('select-image-btn'))
    expect(screen.getByRole('status')).toHaveTextContent('1 unsaved change.')
  })
})

describe('ItemEdit for a saved draft', () => {
  it('explains it is not live and offers Save draft and Publish', async () => {
    mockApi.getItem.mockResolvedValue({ data: { id: '123', title: 'Talks', _meta: { draft: true } } })
    const user = userEvent.setup()
    renderEdit(<ItemEdit schema={schema} itemId="123" refreshList={refreshList} />)
    await loaded()
    expect(screen.getByText('Draft')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Not on the website yet')
    expect(screen.getByRole('button', { name: 'Save draft' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Publish' }))
    await waitFor(() => expect(mockApi.updateItem).toHaveBeenCalledWith('page', '123', expect.objectContaining({ draft: 0 })))
    await waitFor(() => expect(screen.getByText('Published')).toBeInTheDocument())
  })

  it('saves edits as a draft without publishing', async () => {
    mockApi.getItem.mockResolvedValue({ data: { id: '123', title: 'Talks', _meta: { draft: true } } })
    const user = userEvent.setup()
    renderEdit(<ItemEdit schema={schema} itemId="123" refreshList={refreshList} />)
    await loaded()
    await user.type(screen.getByTestId('string-editor-title'), '!')
    await user.click(screen.getByRole('button', { name: 'Save draft' }))
    await waitFor(() => expect(mockApi.updateItem).toHaveBeenCalledWith('page', '123', expect.objectContaining({ title: 'Talks!', draft: 1 })))
  })
})

describe('ItemEdit for a brand-new entry', () => {
  beforeEach(() => {
    mockApi.createItem.mockResolvedValue({ data: { id: 'new-123' } })
  })

  it('is titled Untitled, focuses the title with a hint, and keeps Publish off until there is a title', async () => {
    const user = userEvent.setup()
    renderEdit(<ItemEdit schema={schema} itemId="new" refreshList={refreshList} />)
    await loaded()
    expect(screen.getByRole('heading', { name: 'Untitled page' })).toBeInTheDocument()
    expect(screen.getByText('Draft')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Not on the website yet — give it a title, then publish.')
    expect(screen.getByTestId('string-editor-title')).toHaveFocus()
    expect(screen.getByText(/Start here/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Publish' })).toBeDisabled()

    await user.type(screen.getByTestId('string-editor-title'), 'New page')
    expect(screen.getByRole('heading', { name: 'New page' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Publish' })).toBeEnabled()
    await user.click(screen.getByRole('button', { name: 'Publish' }))
    await waitFor(() => expect(mockApi.createItem).toHaveBeenCalledWith('page', expect.objectContaining({ title: 'New page', draft: 0 })))
    expect(mockNavigate).toHaveBeenCalledWith('/collections/page/new-123', { replace: true })
  })

  it('saves a draft', async () => {
    const user = userEvent.setup()
    renderEdit(<ItemEdit schema={schema} itemId="new" refreshList={refreshList} />)
    await loaded()
    await user.type(screen.getByTestId('string-editor-title'), 'Draft page')
    await user.click(screen.getByRole('button', { name: 'Save draft' }))
    await waitFor(() => expect(mockApi.createItem).toHaveBeenCalledWith('page', expect.objectContaining({ draft: 1 })))
  })
})
