// src/admin/editors/ImageEditor.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ImageEditor from './ImageEditor'

const field = {
  name: 'image',
  label: 'Image',
  type: 'image' as const,
}

describe('ImageEditor', () => {
  it('renders empty state when no value', () => {
    render(<ImageEditor field={field} value={null} onChange={vi.fn()} />)
    expect(screen.getByText('Upload new')).toBeInTheDocument()
    expect(screen.getByText('Choose from library')).toBeInTheDocument()
  })

  it('shows filename derived from path when value is set', () => {
    render(
      <ImageEditor
        field={field}
        value="/uploads/1234567890-my-photo.jpg"
        onChange={vi.fn()}
      />,
    )
    expect(screen.getByText('1234567890-my-photo.jpg')).toBeInTheDocument()
  })

  it('shows filename when value is an absolute URL with PUBLIC_URL prefix', () => {
    render(
      <ImageEditor
        field={field}
        value="https://cms.example.com/uploads/abc-image.png"
        onChange={vi.fn()}
      />,
    )
    expect(screen.getByText('abc-image.png')).toBeInTheDocument()
  })

  it('does not show a filename element when no value', () => {
    const { container } = render(
      <ImageEditor field={field} value={null} onChange={vi.fn()} />,
    )
    expect(container.querySelector('[data-testid="image-filename"]')).toBeNull()
  })
})
