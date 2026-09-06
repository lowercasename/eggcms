// src/admin/pages/Singleton.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Singleton from './Singleton'

const { mockApi } = vi.hoisted(() => ({ mockApi: { getSingleton: vi.fn(), updateSingleton: vi.fn() } }))
vi.mock('wouter', () => ({ useParams: () => ({ schema: 'settings' }), useLocation: () => ['/', vi.fn()] }))
vi.mock('../lib/api', () => ({ api: mockApi }))
vi.mock('../App', () => ({
  useSchemas: () => ({
    schemas: [{ name: 'settings', label: 'Site Settings', type: 'singleton', fields: [{ name: 'siteName', type: 'string' }] }],
    siteName: 'Elena Govor',
  }),
}))
vi.mock('../editors/StringEditor', async () => {
  const React = await import('react')
  return {
    default: ({ field, value, onChange }: { field: { name: string }; value: unknown; onChange: (v: unknown) => void }) =>
      React.createElement('input', { 'data-testid': `string-editor-${field.name}`, value: (value as string) || '', onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value) }),
  }
})

import { DirtyStateProvider } from '../contexts/DirtyStateContext'

beforeEach(() => {
  vi.clearAllMocks()
  mockApi.getSingleton.mockResolvedValue({ data: { siteName: 'Elena Govor' } })
  mockApi.updateSingleton.mockImplementation((_s: string, data: Record<string, unknown>) => Promise.resolve({ data }))
})

describe('Singleton', () => {
  it('shows the fields with nothing to save until something changes', async () => {
    render(
      <DirtyStateProvider>
        <Singleton />
      </DirtyStateProvider>
    )
    expect(await screen.findByRole('heading', { name: 'Site Settings' })).toBeInTheDocument()
    expect(screen.getByTestId('string-editor-siteName')).toHaveValue('Elena Govor')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('shows the unsaved bar and saves the changes', async () => {
    const user = userEvent.setup()
    render(
      <DirtyStateProvider>
        <Singleton />
      </DirtyStateProvider>
    )
    await screen.findByTestId('string-editor-siteName')
    await user.type(screen.getByTestId('string-editor-siteName'), '!')
    expect(screen.getByRole('status')).toHaveTextContent('1 unsaved change.')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    await waitFor(() => expect(mockApi.updateSingleton).toHaveBeenCalledWith('settings', { siteName: 'Elena Govor!' }))
    expect(await screen.findByText(/Saved just now/)).toBeInTheDocument()
  })
})
