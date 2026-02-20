import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ItemList from './ItemList'
import { resolveLabelField } from '../pages/Collection'
import { DirtyStateProvider, useDirtyStateContext } from '../contexts/DirtyStateContext'
import type { Schema } from '../types'
import { act } from '@testing-library/react'

// Mock wouter
vi.mock('wouter', () => ({
  useLocation: () => ['/collections/test/1'],
  Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}))

// Mock NavLink to just render an anchor
vi.mock('./NavLink', () => ({
  default: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>,
}))

describe('ItemList', () => {
  it('displays item label from a single labelField', () => {
    render(
      <ItemList
        items={[{ id: '1', title: 'Hello World', _meta: { draft: false } }]}
        schemaName="post"
        labelField="title"
      />
    )

    expect(screen.getByText('Hello World')).toBeTruthy()
  })

  it('displays item label from multiple labelFields', () => {
    render(
      <ItemList
        items={[{ id: '1', firstName: 'Raphael', lastName: 'Kabo', _meta: { draft: false } } as any]}
        schemaName="person"
        labelField={['firstName', 'lastName']}
      />
    )

    expect(screen.getByText('Raphael Kabo')).toBeTruthy()
  })

  it('shows Untitled when labelField value is empty', () => {
    render(
      <ItemList
        items={[{ id: '1', _meta: { draft: false } }]}
        schemaName="post"
        labelField="title"
      />
    )

    expect(screen.getByText('Untitled')).toBeTruthy()
  })

  it('skips empty fields when using multiple labelFields', () => {
    render(
      <ItemList
        items={[{ id: '1', firstName: 'Raphael', lastName: '', _meta: { draft: false } } as any]}
        schemaName="person"
        labelField={['firstName', 'lastName']}
      />
    )

    expect(screen.getByText('Raphael')).toBeTruthy()
  })

  it('shows Unsaved badge when item is in dirtyItems', () => {
    // Helper to mark an item dirty from inside the provider
    let markDirty: () => void
    function DirtyMarker() {
      const { setItemDirty } = useDirtyStateContext()
      markDirty = () => setItemDirty('1', true)
      return null
    }

    render(
      <DirtyStateProvider>
        <DirtyMarker />
        <ItemList
          items={[{ id: '1', title: 'My Post', _meta: { draft: false } }]}
          schemaName="post"
          labelField="title"
        />
      </DirtyStateProvider>
    )

    // Initially no Unsaved badge
    expect(screen.queryByText('Unsaved')).toBeNull()

    // Mark item dirty
    act(() => {
      markDirty()
    })

    // Now Unsaved badge should appear
    expect(screen.getByText('Unsaved')).toBeTruthy()
  })

  it('does not show Unsaved badge when item is not in dirtyItems', () => {
    render(
      <DirtyStateProvider>
        <ItemList
          items={[{ id: '1', title: 'My Post', _meta: { draft: false } }]}
          schemaName="post"
          labelField="title"
        />
      </DirtyStateProvider>
    )

    expect(screen.queryByText('Unsaved')).toBeNull()
    expect(screen.getByText('Published')).toBeTruthy()
  })

  it('works without DirtyStateProvider (no Unsaved badge)', () => {
    // Renders without provider - should not crash, no Unsaved badge
    render(
      <ItemList
        items={[{ id: '1', title: 'My Post', _meta: { draft: true } }]}
        schemaName="post"
        labelField="title"
      />
    )

    expect(screen.queryByText('Unsaved')).toBeNull()
    expect(screen.getByText('Draft')).toBeTruthy()
  })
})

describe('resolveLabelField', () => {
  it('uses explicit labelField when set', () => {
    const schema = {
      name: 'person', label: 'People', type: 'collection',
      labelField: 'name',
      fields: [
        { name: 'name', type: 'string' },
        { name: 'slug', type: 'slug', from: ['lastName', 'firstName'] },
      ],
    } as Schema

    expect(resolveLabelField(schema)).toBe('name')
  })

  it('uses slug from fields when no labelField set', () => {
    const schema = {
      name: 'person', label: 'People', type: 'collection',
      fields: [
        { name: 'firstName', type: 'string' },
        { name: 'lastName', type: 'string' },
        { name: 'slug', type: 'slug', from: ['lastName', 'firstName'] },
      ],
    } as Schema

    expect(resolveLabelField(schema)).toEqual(['lastName', 'firstName'])
  })

  it('uses single slug from field', () => {
    const schema = {
      name: 'post', label: 'Posts', type: 'collection',
      fields: [
        { name: 'headline', type: 'string' },
        { name: 'slug', type: 'slug', from: 'headline' },
      ],
    } as Schema

    expect(resolveLabelField(schema)).toBe('headline')
  })

  it('defaults to title when no labelField or slug', () => {
    const schema = {
      name: 'post', label: 'Posts', type: 'collection',
      fields: [
        { name: 'title', type: 'string' },
        { name: 'content', type: 'richtext' },
      ],
    } as Schema

    expect(resolveLabelField(schema)).toBe('title')
  })
})
