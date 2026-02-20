// src/admin/editors/LinkFieldEditor.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import LinkFieldEditor from './LinkFieldEditor'
import type { FieldDefinition } from '../types'

// Mock LinkModal to avoid complex dependencies
vi.mock('../components/richtext/LinkModal', () => ({
  default: ({ onSaveExternal, onSaveInternal, onRemove, onClose }: {
    onSaveExternal: (url: string) => void
    onSaveInternal: (ref: string, label: string) => void
    onRemove: () => void
    onClose: () => void
  }) => (
    <div data-testid="link-modal">
      <button onClick={() => onSaveExternal('https://example.com')}>Save External</button>
      <button onClick={() => onSaveInternal('posts:abc-123', 'My Post')}>Save Internal</button>
      <button onClick={onRemove}>Remove</button>
      <button onClick={onClose}>Close</button>
    </div>
  ),
}))

const linkField: FieldDefinition = {
  name: 'cta',
  type: 'link',
}

describe('LinkFieldEditor', () => {
  it('shows "Choose link..." button when value is null', () => {
    render(<LinkFieldEditor field={linkField} value={null} onChange={() => {}} />)
    expect(screen.getByText('Choose link...')).toBeInTheDocument()
  })

  it('shows external link with URL when value is external', () => {
    const value = { type: 'external', url: 'https://example.com' }
    render(<LinkFieldEditor field={linkField} value={value} onChange={() => {}} />)
    expect(screen.getByText('https://example.com')).toBeInTheDocument()
    expect(screen.getByText('Edit')).toBeInTheDocument()
  })

  it('shows internal link with label when value is internal', () => {
    const value = { type: 'internal', ref: 'posts:abc-123', label: 'My Post' }
    render(<LinkFieldEditor field={linkField} value={value} onChange={() => {}} />)
    expect(screen.getByText('My Post')).toBeInTheDocument()
    expect(screen.getByText('Edit')).toBeInTheDocument()
  })

  it('shows internal link ref when no label provided', () => {
    const value = { type: 'internal', ref: 'posts:abc-123' }
    render(<LinkFieldEditor field={linkField} value={value} onChange={() => {}} />)
    expect(screen.getByText('posts:abc-123')).toBeInTheDocument()
  })

  it('clears value when X button is clicked', () => {
    const onChange = vi.fn()
    const value = { type: 'external', url: 'https://example.com' }
    render(<LinkFieldEditor field={linkField} value={value} onChange={onChange} />)

    // The X button is the one with the X icon - find by role
    const clearButton = screen.getByText('Edit').parentElement!.querySelector('button:last-child')!
    fireEvent.click(clearButton)

    expect(onChange).toHaveBeenCalledWith(null)
  })

  it('opens modal when "Choose link..." button is clicked', () => {
    render(<LinkFieldEditor field={linkField} value={null} onChange={() => {}} />)

    fireEvent.click(screen.getByText('Choose link...'))

    expect(screen.getByTestId('link-modal')).toBeInTheDocument()
  })

  it('opens modal when Edit button is clicked', () => {
    const value = { type: 'external', url: 'https://example.com' }
    render(<LinkFieldEditor field={linkField} value={value} onChange={() => {}} />)

    fireEvent.click(screen.getByText('Edit'))

    expect(screen.getByTestId('link-modal')).toBeInTheDocument()
  })

  it('saves external link from modal', () => {
    const onChange = vi.fn()
    render(<LinkFieldEditor field={linkField} value={null} onChange={onChange} />)

    fireEvent.click(screen.getByText('Choose link...'))
    fireEvent.click(screen.getByText('Save External'))

    expect(onChange).toHaveBeenCalledWith({ type: 'external', url: 'https://example.com' })
  })

  it('saves internal link from modal', () => {
    const onChange = vi.fn()
    render(<LinkFieldEditor field={linkField} value={null} onChange={onChange} />)

    fireEvent.click(screen.getByText('Choose link...'))
    fireEvent.click(screen.getByText('Save Internal'))

    expect(onChange).toHaveBeenCalledWith({ type: 'internal', ref: 'posts:abc-123', label: 'My Post' })
  })
})
