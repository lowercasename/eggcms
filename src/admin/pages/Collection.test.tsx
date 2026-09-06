// src/admin/pages/Collection.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Collection from './Collection'
import { DirtyStateProvider } from '../contexts/DirtyStateContext'

const { mockApi } = vi.hoisted(() => ({ mockApi: { getContent: vi.fn(), getItem: vi.fn() } }))
vi.mock('wouter', () => ({
  useParams: () => ({ schema: 'post' }),
  useLocation: () => ['/collections/post', vi.fn()],
  Link: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))
vi.mock('../lib/api', () => ({ api: mockApi }))
vi.mock('../App', () => ({
  useSchemas: () => ({
    schemas: [{ name: 'post', label: 'Blog Posts', type: 'collection', fields: [{ name: 'title', type: 'string' }] }],
    siteName: 'Site',
  }),
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockApi.getContent.mockResolvedValue({ data: [], meta: { total: 0 } })
})

describe('Collection list panel', () => {
  it('collapses to a rail that can reopen it, even with no entry chosen', async () => {
    const user = userEvent.setup()
    render(
      <DirtyStateProvider>
        <Collection />
      </DirtyStateProvider>
    )
    await waitFor(() => expect(screen.getByRole('button', { name: 'Hide this list' })).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: 'Hide this list' }))
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
    const show = screen.getByRole('button', { name: 'Show the list' })
    expect(show).toBeInTheDocument()

    await user.click(show)
    expect(await screen.findByRole('searchbox')).toBeInTheDocument()
  })
})
