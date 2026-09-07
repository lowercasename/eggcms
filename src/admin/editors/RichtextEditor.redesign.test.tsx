// src/admin/editors/RichtextEditor.redesign.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RichtextEditor from './RichtextEditor'
import FormField from '../components/ui/FormField'
import { SectionProvider } from '../contexts/SectionContext'

const field = { name: 'details', label: 'Publication details', type: 'richtext' as const }

describe('RichtextEditor toolbar presets', () => {
  it('shows compact heading buttons in the full toolbar', async () => {
    render(<RichtextEditor field={field} value="" onChange={vi.fn()} />)
    await waitFor(() => expect(screen.getByTitle('Bold')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Heading' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sub-heading' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Normal text' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Link' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Image' })).toBeInTheDocument()
  })

  it('shows only bold, italic and link for a minimal field', async () => {
    render(<RichtextEditor field={{ ...field, toolbar: 'minimal' }} value="" onChange={vi.fn()} />)
    await waitFor(() => expect(screen.getByTitle('Bold')).toBeInTheDocument())
    expect(screen.getByTitle('Italic')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Link' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Heading' })).not.toBeInTheDocument()
    expect(screen.queryByTitle('Bullet list')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Image' })).not.toBeInTheDocument()
  })
})

describe('RichtextEditor full screen', () => {
  it('opens from the field label row and closes with Done writing, keeping one document', async () => {
    const user = userEvent.setup()
    render(
      <SectionProvider value={{ typeLabel: 'Book', index: 2, total: 12 }}>
        <FormField field={field}>
          <RichtextEditor field={field} value="<p>Canberra, 2014</p>" onChange={vi.fn()} />
        </FormField>
      </SectionProvider>
    )
    await waitFor(() => expect(screen.getByTitle('Bold')).toBeInTheDocument())

    const labelRow = screen.getByTestId('field-label-row')
    const fullScreen = screen.getByRole('button', { name: 'Full screen' })
    expect(labelRow).toContainElement(fullScreen)

    await user.click(fullScreen)

    const dialog = screen.getByRole('dialog', { name: /publication details/i })
    expect(dialog).toHaveTextContent('Book · section 3 of 12')
    expect(dialog).toContainElement(screen.getByText('Canberra, 2014'))
    // The same TipTap document moved into the overlay: no second copy exists.
    expect(document.querySelectorAll('.ProseMirror')).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: 'Done writing' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(document.querySelectorAll('.ProseMirror')).toHaveLength(1)
    expect(screen.getByText('Canberra, 2014')).toBeInTheDocument()
  })

  it('closes on Escape', async () => {
    const user = userEvent.setup()
    render(<RichtextEditor field={field} value="" onChange={vi.fn()} />)
    await waitFor(() => expect(screen.getByTitle('Bold')).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: 'Full screen' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })
})

describe('RichtextEditor follows its value', () => {
  it('shows a new value from outside, such as after Discard, without reporting a change', async () => {
    const onChange = vi.fn()
    const { rerender } = render(<RichtextEditor field={field} value="<p>Edited text</p>" onChange={onChange} />)
    await waitFor(() => expect(screen.getByText('Edited text')).toBeInTheDocument())

    rerender(<RichtextEditor field={field} value="<p>Saved text</p>" onChange={onChange} />)
    await waitFor(() => expect(screen.getByText('Saved text')).toBeInTheDocument())
    expect(screen.queryByText('Edited text')).not.toBeInTheDocument()
    expect(onChange).not.toHaveBeenCalled()
  })
})

describe('Escape with a dialog open in full screen', () => {
  it('closes only the link dialog, not the writing room', async () => {
    const user = userEvent.setup()
    render(<RichtextEditor field={field} value="<p>Hi</p>" onChange={vi.fn()} />)
    await waitFor(() => expect(screen.getByTitle('Bold')).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: 'Full screen' }))
    // The full-screen toolbar is the last one rendered.
    await user.click(screen.getAllByRole('button', { name: 'Link' }).at(-1)!)
    expect(screen.getByRole('dialog', { name: 'Add a link' })).toBeInTheDocument()
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Add a link' })).not.toBeInTheDocument())
    expect(screen.getByRole('dialog', { name: /publication details/i })).toBeInTheDocument()
  })
})
