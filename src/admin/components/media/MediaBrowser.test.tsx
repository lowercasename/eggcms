// src/admin/components/media/MediaBrowser.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MediaBrowser from './MediaBrowser'
import MediaPickerDialog from './MediaPickerDialog'
import { api } from '../../lib/api'

const library = [
  {
    id: '1',
    filename: 'Russian Anzacs.jpg',
    path: '/uploads/russian-anzacs.jpg',
    mimetype: 'image/jpeg',
    kind: 'image',
    size: 5900,
    created_at: '2026-08-03T00:00:00.000Z',
    references: [
      { schema: 'page', schemaLabel: 'Pages', id: 'p1', label: 'Australia' },
      { schema: 'page', schemaLabel: 'Pages', id: 'p2', label: 'Anzacs' },
    ],
  },
  {
    id: '2',
    filename: 'mapping-2025.pdf',
    path: '/uploads/mapping-2025.pdf',
    mimetype: 'application/pdf',
    kind: 'document',
    size: 1.2 * 1024 * 1024,
    created_at: '2026-08-02T00:00:00.000Z',
    references: [],
  },
  {
    id: '3',
    filename: 'interview.mp3',
    path: '/uploads/interview.mp3',
    mimetype: 'audio/mpeg',
    kind: 'audio',
    size: 4096,
    created_at: '2026-08-01T00:00:00.000Z',
    references: [],
  },
]

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(api.getMedia).mockResolvedValue({ data: library } as never)
  vi.mocked(api.uploadMedia).mockResolvedValue({ data: { id: 'new', path: '/uploads/new.pdf' } } as never)
  ;(api as unknown as { deleteMedia: ReturnType<typeof vi.fn> }).deleteMedia = vi.fn().mockResolvedValue({ data: { success: true } })
})

describe('MediaBrowser in manage mode', () => {
  it('shows each file with its name, size, type and where it is used', async () => {
    render(<MediaBrowser mode="manage" />)
    const card = (await screen.findByText('Russian Anzacs.jpg')).closest<HTMLElement>('[data-testid="media-card"]')!
    expect(within(card).getByText('5.8 KB')).toBeInTheDocument()
    expect(within(card).getByText('JPG')).toBeInTheDocument()
    expect(within(card).getByText('Used on 2 pages')).toBeInTheDocument()
    const pdf = screen.getByText('mapping-2025.pdf').closest<HTMLElement>('[data-testid="media-card"]')!
    expect(within(pdf).getByText('Not used yet')).toBeInTheDocument()
  })

  it('offers a type filter with counts', async () => {
    render(<MediaBrowser mode="manage" />)
    await screen.findByText('Russian Anzacs.jpg')
    expect(screen.getByRole('button', { name: 'All 3' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Images 1' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Documents 1' }))
    expect(screen.queryByText('Russian Anzacs.jpg')).not.toBeInTheDocument()
    expect(screen.getByText('mapping-2025.pdf')).toBeInTheDocument()
  })

  it('searches by file name and offers a way out when nothing matches', async () => {
    render(<MediaBrowser mode="manage" />)
    await screen.findByText('Russian Anzacs.jpg')
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search by file name' }), 'zzz')
    expect(screen.getByText(/No files match “zzz”/)).toBeInTheDocument()
    // Both the search box and the empty state offer a way out; take the empty state's.
    await userEvent.click(screen.getAllByRole('button', { name: 'Clear search' }).at(-1)!)
    expect(screen.getByText('Russian Anzacs.jpg')).toBeInTheDocument()
  })

  it('selects files and says how many are in use before deleting', async () => {
    render(<MediaBrowser mode="manage" />)
    await screen.findByText('Russian Anzacs.jpg')

    await userEvent.click(screen.getByRole('checkbox', { name: 'Select Russian Anzacs.jpg' }))
    const bar = screen.getByRole('status')
    expect(bar).toHaveTextContent('1 file selected.')
    expect(bar).toHaveTextContent('It is used on 2 pages.')

    await userEvent.click(screen.getByRole('checkbox', { name: 'Select mapping-2025.pdf' }))
    expect(screen.getByRole('status')).toHaveTextContent('2 files selected.')
    expect(screen.getByRole('status')).toHaveTextContent('One of them is used on a page.')

    await userEvent.click(screen.getByRole('button', { name: 'Clear selection' }))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('asks before deleting, then deletes each selected file and reports the ones that were refused', async () => {
    vi.mocked(api.deleteMedia)
      .mockRejectedValueOnce(new Error('This file is used by Australia (page). Remove it there first.'))
      .mockResolvedValueOnce({ data: { success: true } } as never)

    render(<MediaBrowser mode="manage" />)
    await screen.findByText('Russian Anzacs.jpg')
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select Russian Anzacs.jpg' }))
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select mapping-2025.pdf' }))

    await userEvent.click(screen.getByRole('button', { name: 'Delete 2 files' }))
    expect(api.deleteMedia).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'Yes, delete' }))

    await waitFor(() => expect(api.deleteMedia).toHaveBeenCalledTimes(2))
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('1 file was not deleted')
    expect(alert).toHaveTextContent(/Russian Anzacs\.jpg/)
    expect(alert).toHaveTextContent(/used by Australia/)
    // The selection is gone and the library was read again.
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(api.getMedia).toHaveBeenCalledTimes(2)
  })

  it('forgets a pending delete confirmation when the selection changes', async () => {
    render(<MediaBrowser mode="manage" />)
    await screen.findByText('Russian Anzacs.jpg')
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select mapping-2025.pdf' }))
    await userEvent.click(screen.getByRole('button', { name: 'Delete 1 file' }))
    expect(screen.getByRole('button', { name: 'Yes, delete' })).toBeInTheDocument()

    // Untick, tick something else: back to the first step, never straight to "Yes, delete".
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select mapping-2025.pdf' }))
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select interview.mp3' }))
    expect(screen.queryByRole('button', { name: 'Yes, delete' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete 1 file' })).toBeInTheDocument()
  })

  it('clears the selection when the search or filter changes, so nothing hidden gets deleted', async () => {
    render(<MediaBrowser mode="manage" />)
    await screen.findByText('Russian Anzacs.jpg')
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select Russian Anzacs.jpg' }))
    expect(screen.getByRole('status')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Documents 1' }))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('shows files whose type the server did not recognise, so they can still be deleted', async () => {
    vi.mocked(api.getMedia).mockResolvedValue({
      data: [...library, { id: '9', filename: 'mystery.bin', path: '/uploads/mystery.bin', mimetype: 'application/octet-stream', kind: null, size: 10, created_at: '2026-01-01T00:00:00.000Z', references: [] }],
    } as never)
    render(<MediaBrowser mode="manage" />)
    expect(await screen.findByText('mystery.bin')).toBeInTheDocument()
  })

  it('says what went wrong when the library cannot be loaded', async () => {
    vi.mocked(api.getMedia).mockRejectedValue(new Error('Request failed'))
    render(<MediaBrowser mode="manage" />)
    expect(await screen.findByRole('alert')).toHaveTextContent(/could not load/i)
  })

  it('uploads dropped files and lists them again afterwards', async () => {
    render(<MediaBrowser mode="manage" />)
    await screen.findByText('Russian Anzacs.jpg')
    vi.mocked(api.getMedia).mockClear()

    const { fireEvent } = await import('@testing-library/react')
    fireEvent.drop(screen.getByTestId('dropzone'), {
      dataTransfer: { files: [new File(['a'], 'one.pdf', { type: 'application/pdf' })], items: [], types: ['Files'] },
    })

    await waitFor(() => expect(api.uploadMedia).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(api.getMedia).toHaveBeenCalled())
  })

  it('tells the person what to do when the library is empty', async () => {
    vi.mocked(api.getMedia).mockResolvedValue({ data: [] } as never)
    render(<MediaBrowser mode="manage" />)
    expect(await screen.findByText('No files yet')).toBeInTheDocument()
    expect(screen.getByText(/Drag images, PDFs, audio or video here/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Choose files' })).toBeInTheDocument()
  })
})

describe('MediaBrowser in pick mode', () => {
  it('shows only the allowed kinds and chooses on click', async () => {
    const onPick = vi.fn()
    render(<MediaBrowser mode="pick" kinds={['document', 'audio']} onPick={onPick} />)
    expect(await screen.findByText('mapping-2025.pdf')).toBeInTheDocument()
    expect(screen.getByText('interview.mp3')).toBeInTheDocument()
    expect(screen.queryByText('Russian Anzacs.jpg')).not.toBeInTheDocument()
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /mapping-2025\.pdf/ }))
    expect(onPick).toHaveBeenCalledWith('/uploads/mapping-2025.pdf')
  })

  it('hides the type filter when only one kind is allowed', async () => {
    render(<MediaBrowser mode="pick" kinds={['image']} onPick={() => {}} />)
    await screen.findByText('Russian Anzacs.jpg')
    expect(screen.queryByRole('group', { name: 'Type' })).not.toBeInTheDocument()
  })

  it('refuses a dropped file of the wrong kind instead of attaching it', async () => {
    const onPick = vi.fn()
    render(<MediaBrowser mode="pick" kinds={['image']} onPick={onPick} />)
    await screen.findByText('Russian Anzacs.jpg')
    const { fireEvent } = await import('@testing-library/react')
    fireEvent.drop(screen.getByTestId('dropzone'), {
      dataTransfer: { files: [new File(['a'], 'one.pdf', { type: 'application/pdf' })], items: [], types: ['Files'] },
    })
    expect(await screen.findByRole('alert')).toHaveTextContent(/one\.pdf/)
    expect(screen.getByRole('alert')).toHaveTextContent(/only images/i)
    expect(api.uploadMedia).not.toHaveBeenCalled()
    expect(onPick).not.toHaveBeenCalled()
  })

  it('uploads a file and picks it straight away', async () => {
    const onPick = vi.fn()
    render(<MediaBrowser mode="pick" kinds={['document']} onPick={onPick} />)
    await screen.findByText('mapping-2025.pdf')
    const { fireEvent } = await import('@testing-library/react')
    fireEvent.drop(screen.getByTestId('dropzone'), {
      dataTransfer: { files: [new File(['a'], 'one.pdf', { type: 'application/pdf' })], items: [], types: ['Files'] },
    })
    await waitFor(() => expect(onPick).toHaveBeenCalledWith('/uploads/new.pdf'))
  })
})

describe('MediaPickerDialog', () => {
  it('is a dialog titled for the job, with a Cancel button', async () => {
    const onClose = vi.fn()
    render(<MediaPickerDialog title="Choose an image" kinds={['image']} onSelect={() => {}} onClose={onClose} />)
    expect(screen.getByRole('dialog', { name: 'Choose an image' })).toBeInTheDocument()
    await screen.findByText('Russian Anzacs.jpg')
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalled()
  })
})
