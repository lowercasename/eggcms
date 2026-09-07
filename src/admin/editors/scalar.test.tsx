// src/admin/editors/scalar.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import StringEditor from './StringEditor'
import NumberEditor from './NumberEditor'
import BooleanEditor from './BooleanEditor'
import SelectEditor from './SelectEditor'
import DatetimeEditor from './DatetimeEditor'
import TextEditor from './TextEditor'
import SlugEditor from './SlugEditor'
import FormField from '../components/ui/FormField'
import { EntryProvider } from '../contexts/EntryContext'

describe('scalar editors wire up to their FormField label', () => {
  it('string input is labelled by the field label and marked required', () => {
    render(
      <FormField field={{ name: 'title', type: 'string', required: true }}>
        <StringEditor field={{ name: 'title', type: 'string', required: true }} value="" onChange={() => {}} />
      </FormField>
    )
    const input = screen.getByRole('textbox', { name: 'Title' })
    expect(input).toHaveAttribute('aria-required', 'true')
  })

  it('string input can focus itself on mount', () => {
    render(<StringEditor field={{ name: 'title', type: 'string' }} value="" onChange={() => {}} autoFocus />)
    expect(screen.getByRole('textbox')).toHaveFocus()
  })

  it('textarea is labelled by the field label', () => {
    render(
      <FormField field={{ name: 'bio', type: 'text' }}>
        <TextEditor field={{ name: 'bio', type: 'text' }} value="" onChange={() => {}} />
      </FormField>
    )
    expect(screen.getByRole('textbox', { name: 'Bio' })).toBeInTheDocument()
  })

  it('select is labelled by the field label', () => {
    render(
      <FormField field={{ name: 'size', type: 'select', options: ['small', 'large'] }}>
        <SelectEditor field={{ name: 'size', type: 'select', options: ['small', 'large'] }} value="small" onChange={() => {}} />
      </FormField>
    )
    expect(screen.getByRole('combobox', { name: 'Size' })).toHaveValue('small')
  })

  it('datetime input is labelled by the field label', () => {
    render(
      <FormField field={{ name: 'publishedAt', type: 'datetime' }}>
        <DatetimeEditor field={{ name: 'publishedAt', type: 'datetime' }} value={null} onChange={() => {}} />
      </FormField>
    )
    expect(screen.getByLabelText('Published at')).toBeInTheDocument()
  })
})

describe('NumberEditor', () => {
  it('is a stepper named after the field', async () => {
    const onChange = vi.fn()
    render(<NumberEditor field={{ name: 'menuOrder', type: 'number' }} value={3} onChange={onChange} />)
    expect(screen.getByRole('textbox', { name: 'Menu order' })).toHaveValue('3')
    await userEvent.click(screen.getByRole('button', { name: 'Increase' }))
    expect(onChange).toHaveBeenCalledWith(4)
  })
})

describe('BooleanEditor', () => {
  it('is a switch that says Yes or No', async () => {
    const onChange = vi.fn()
    render(<BooleanEditor field={{ name: 'isFrontPage', type: 'boolean' }} value={false} onChange={onChange} />)
    expect(screen.getByText('No')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('switch', { name: 'Is front page' }))
    expect(onChange).toHaveBeenCalledWith(true)
  })
})

describe('SlugEditor', () => {
  const field = { name: 'slug', type: 'slug', from: 'title' }

  it('shows the value in mono with a leading slash and a Generate button', () => {
    render(<SlugEditor field={field} value="south-pacific" onChange={() => {}} formData={{ title: 'South Pacific' }} />)
    expect(screen.getByText('/')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toHaveValue('south-pacific')
    expect(screen.getByRole('button', { name: 'Generate' })).toBeInTheDocument()
  })

  it('on a new entry it is read-only, writes itself from the title and explains why', () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <EntryProvider value={{ isNew: true }}>
        <SlugEditor field={field} value="" onChange={onChange} formData={{ title: 'South Pacific' }} />
      </EntryProvider>
    )
    expect(screen.getByRole('textbox')).toHaveAttribute('readonly')
    expect(screen.getByText('Made from the title. You can change it later.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Generate' })).not.toBeInTheDocument()
    expect(onChange).toHaveBeenCalledWith('south-pacific')

    rerender(
      <EntryProvider value={{ isNew: true }}>
        <SlugEditor field={field} value="south-pacific" onChange={onChange} formData={{ title: 'Pacific' }} />
      </EntryProvider>
    )
    expect(onChange).toHaveBeenLastCalledWith('pacific')
  })

  it('on a new entry with no title yet it shows an ellipsis and stays quiet', () => {
    const onChange = vi.fn()
    render(
      <EntryProvider value={{ isNew: true }}>
        <SlugEditor field={field} value="" onChange={onChange} formData={{ title: '' }} />
      </EntryProvider>
    )
    expect(screen.getByRole('textbox')).toHaveAttribute('placeholder', '…')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('on an existing entry, typing changes the slug', () => {
    const onChange = vi.fn()
    render(<SlugEditor field={field} value="a" onChange={onChange} formData={{ title: 'A' }} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'b' } })
    expect(onChange).toHaveBeenCalledWith('b')
  })
})

describe('DatetimeEditor', () => {
  it('shows the stored instant in local time and stores what is typed as an instant', () => {
    const onChange = vi.fn()
    render(<DatetimeEditor field={{ name: 'when', type: 'datetime' }} value="2026-08-22T09:30:00.000Z" onChange={onChange} />)
    const input = screen.getByDisplayValue(/2026-08-22T\d{2}:\d{2}/) as HTMLInputElement
    const shown = new Date(input.value)
    // The local wall-clock value shown must denote the same instant.
    expect(shown.toISOString()).toBe('2026-08-22T09:30:00.000Z')
    fireEvent.change(input, { target: { value: '2026-08-22T10:00' } })
    expect(onChange).toHaveBeenCalledWith(new Date('2026-08-22T10:00').toISOString())
  })
})
