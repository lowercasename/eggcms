// src/admin/components/ItemList.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, act, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ItemList from './ItemList'
import { resolveLabelField } from '../pages/Collection'
import { DirtyStateProvider, useDirtyStateContext } from '../contexts/DirtyStateContext'
import type { Schema } from '../types'

vi.mock('wouter', () => ({
  useLocation: () => ['/collections/page/2'],
  Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}))

vi.mock('./NavLink', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

const items = [
  { id: '1', title: 'Belarus Ukraine Russia', _meta: { draft: false } },
  { id: '2', title: 'South Pacific', _meta: { draft: false } },
  { id: '3', title: 'Talks and media', _meta: { draft: true } },
]

const base = { items, schemaName: 'page', schemaLabel: 'Pages', labelField: 'title' as const }

describe('ItemList', () => {
  it('shows the collection name with its count and a New button named for one entry', () => {
    render(<ItemList {...base} />)
    expect(screen.getByRole('heading', { name: 'Pages 3' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'New page' })).toHaveAttribute('href', '/collections/page/new')
  })

  it('shows every entry with its status as an icon and word, and marks the selected one', () => {
    render(<ItemList {...base} />)
    const rows = screen.getAllByRole('link', { name: /Published|Draft/ })
    expect(rows).toHaveLength(3)
    expect(screen.getByRole('link', { name: 'Published South Pacific' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Draft Talks and media' })).toBeInTheDocument()
    // No dates on rows.
    expect(screen.queryByText(/Aug|Jan|\d{4}/)).not.toBeInTheDocument()
  })

  it('filters between all, live and draft entries', async () => {
    render(<ItemList {...base} />)
    expect(screen.getByRole('button', { name: 'All 3' })).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(screen.getByRole('button', { name: 'Draft 1' }))
    expect(screen.queryByText('South Pacific')).not.toBeInTheDocument()
    expect(screen.getByText('Talks and media')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Live 2' }))
    expect(screen.getByText('South Pacific')).toBeInTheDocument()
    expect(screen.queryByText('Talks and media')).not.toBeInTheDocument()
  })

  it('searches by label and quotes the term back when nothing matches', async () => {
    render(<ItemList {...base} />)
    const search = screen.getByRole('searchbox', { name: 'Search pages' })
    await userEvent.type(search, 'pacific')
    expect(screen.getByText('South Pacific')).toBeInTheDocument()
    expect(screen.queryByText('Belarus Ukraine Russia')).not.toBeInTheDocument()

    await userEvent.clear(search)
    await userEvent.type(search, 'anzacs 1919')
    expect(screen.getByText('No pages match “anzacs 1919”')).toBeInTheDocument()
    expect(screen.getByText('Try fewer words, or clear the search to see all 3 pages.')).toBeInTheDocument()
    await userEvent.click(screen.getAllByRole('button', { name: 'Clear search' }).at(-1)!)
    expect(screen.getByText('Belarus Ukraine Russia')).toBeInTheDocument()
  })

  it('shows an empty state with the one thing to do when there are no entries', () => {
    render(<ItemList {...base} items={[]} />)
    expect(screen.getByText('No pages yet')).toBeInTheDocument()
    expect(screen.getByText('Every page on the website starts here.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Make the first page' })).toHaveAttribute('href', '/collections/page/new')
  })

  it('can be hidden from its header button', async () => {
    const onHide = vi.fn()
    render(<ItemList {...base} onHide={onHide} />)
    await userEvent.click(screen.getByRole('button', { name: 'Hide this list' }))
    expect(onHide).toHaveBeenCalled()
  })

  it('shows an entry being created as an untitled draft at the top', () => {
    render(<ItemList {...base} creating />)
    const rows = screen.getAllByRole('link', { name: /Published|Draft/ })
    expect(rows[0]).toHaveTextContent('Untitled page')
    expect(rows[0]).toHaveAttribute('aria-current', 'page')
  })

  it('builds a label from several fields and falls back to Untitled', () => {
    render(
      <ItemList
        {...base}
        schemaName="person"
        schemaLabel="People"
        labelField={['firstName', 'lastName']}
        items={[{ id: '1', firstName: 'Raphael', lastName: 'Kabo', _meta: { draft: false } } as any, { id: '9', _meta: { draft: false } }]}
      />
    )
    expect(screen.getByText('Raphael Kabo')).toBeInTheDocument()
    expect(screen.getByText('Untitled person')).toBeInTheDocument()
  })

  it('marks an entry with unsaved changes as edited', () => {
    let markDirty: () => void
    function DirtyMarker() {
      const { setItemDirty } = useDirtyStateContext()
      markDirty = () => setItemDirty('2', true)
      return null
    }
    render(
      <DirtyStateProvider>
        <DirtyMarker />
        <ItemList {...base} />
      </DirtyStateProvider>
    )
    act(() => markDirty())
    expect(screen.getByRole('link', { name: 'Edited South Pacific' })).toBeInTheDocument()
  })
})

describe('resolveLabelField', () => {
  it('uses explicit labelField when set', () => {
    const schema = {
      name: 'person', label: 'People', type: 'collection', labelField: 'name',
      fields: [{ name: 'name', type: 'string' }, { name: 'slug', type: 'slug', from: ['lastName', 'firstName'] }],
    } as Schema
    expect(resolveLabelField(schema)).toBe('name')
  })

  it('uses slug from fields when no labelField set', () => {
    const schema = {
      name: 'person', label: 'People', type: 'collection',
      fields: [{ name: 'firstName', type: 'string' }, { name: 'lastName', type: 'string' }, { name: 'slug', type: 'slug', from: ['lastName', 'firstName'] }],
    } as Schema
    expect(resolveLabelField(schema)).toEqual(['lastName', 'firstName'])
  })

  it('defaults to title', () => {
    const schema = { name: 'post', label: 'Posts', type: 'collection', fields: [{ name: 'title', type: 'string' }] } as Schema
    expect(resolveLabelField(schema)).toBe('title')
  })
})
