// src/admin/editors/ImageEditor.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import ImageEditor from './ImageEditor'
import { api } from '../lib/api'

const field = {
  name: 'image',
  label: 'Image',
  type: 'image' as const,
}

describe('ImageEditor', () => {
  beforeEach(() => {
    vi.mocked(api.getMedia).mockReset()
    vi.mocked(api.getMedia).mockResolvedValue({ data: [] })
  })

  it('renders empty state when no value', () => {
    render(<ImageEditor field={field} value={null} onChange={vi.fn()} />)
    expect(screen.getByText('Upload new')).toBeInTheDocument()
    expect(screen.getByText('Choose from library')).toBeInTheDocument()
  })

  it('shows the original filename from the media library when matched by path', async () => {
    vi.mocked(api.getMedia).mockResolvedValue({
      data: [
        {
          id: 'm1',
          filename: 'family-portrait-1925.jpg',
          path: '/uploads/d10d840e-9e0b-400d-80af-dbccb23ec375.jpg',
        },
      ],
    })

    render(
      <ImageEditor
        field={field}
        value="/uploads/d10d840e-9e0b-400d-80af-dbccb23ec375.jpg"
        onChange={vi.fn()}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('family-portrait-1925.jpg')).toBeInTheDocument()
    })
    expect(
      screen.queryByText('d10d840e-9e0b-400d-80af-dbccb23ec375.jpg'),
    ).not.toBeInTheDocument()
  })

  it('matches by path when value is an absolute URL and library entry is relative', async () => {
    vi.mocked(api.getMedia).mockResolvedValue({
      data: [
        {
          id: 'm1',
          filename: 'photo.png',
          path: 'https://cms.example.com/uploads/uuid.png',
        },
      ],
    })

    render(
      <ImageEditor
        field={field}
        value="https://cms.example.com/uploads/uuid.png"
        onChange={vi.fn()}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('photo.png')).toBeInTheDocument()
    })
  })

  it('falls back to path basename when value is not in the media library', async () => {
    vi.mocked(api.getMedia).mockResolvedValue({ data: [] })

    render(
      <ImageEditor
        field={field}
        value="/uploads/orphan-image.jpg"
        onChange={vi.fn()}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('orphan-image.jpg')).toBeInTheDocument()
    })
  })

  it('does not show a filename element when no value', () => {
    const { container } = render(
      <ImageEditor field={field} value={null} onChange={vi.fn()} />,
    )
    expect(container.querySelector('[data-testid="image-filename"]')).toBeNull()
  })
})
