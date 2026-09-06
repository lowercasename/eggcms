// src/admin/editors/BlockEditor.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import BlockEditor from './BlockEditor'

vi.mock('./StringEditor', () => ({
  default: ({ field, value, onChange }: { field: { name: string }; value: unknown; onChange: (v: unknown) => void }) => (
    <input data-testid={`string-editor-${field.name}`} value={(value as string) || ''} onChange={(e) => onChange(e.target.value)} />
  ),
}))

const block = { name: 'featured', label: 'Featured image', fields: [{ name: 'alt', type: 'string' }, { name: 'caption', type: 'string' }] }

describe('BlockEditor (a single group of fields)', () => {
  it('renders the group fields with the block label column and merges changes', () => {
    const onChange = vi.fn()
    render(<BlockEditor field={{ name: 'featured', type: 'block', block }} value={{ alt: 'A', caption: 'C' }} onChange={onChange} />)
    expect(screen.getByTestId('string-editor-alt')).toHaveValue('A')
    fireEvent.change(screen.getByTestId('string-editor-caption'), { target: { value: 'New' } })
    expect(onChange).toHaveBeenCalledWith({ alt: 'A', caption: 'New' })
  })

  it('treats a non-object value as empty', () => {
    render(<BlockEditor field={{ name: 'featured', type: 'block', block }} value="old-string" onChange={() => {}} />)
    expect(screen.getByTestId('string-editor-alt')).toHaveValue('')
  })

  it('says when no block definition was provided', () => {
    render(<BlockEditor field={{ name: 'featured', type: 'block' }} value={null} onChange={() => {}} />)
    expect(screen.getByText('No block definition provided.')).toBeInTheDocument()
  })
})
