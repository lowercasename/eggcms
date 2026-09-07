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
import type { FieldDefinition } from '../types'

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

describe('every editor answers to its field label', () => {
  it('number, boolean and link controls are reachable by the field label', () => {
    render(
      <>
        <FormField field={{ name: 'menuOrder', type: 'number', label: 'Order in the menu' }}>
          <NumberEditor field={{ name: 'menuOrder', type: 'number', label: 'Order in the menu' }} value={3} onChange={() => {}} />
        </FormField>
        <FormField field={{ name: 'isFrontPage', type: 'boolean', label: 'Front page' }}>
          <BooleanEditor field={{ name: 'isFrontPage', type: 'boolean', label: 'Front page' }} value={false} onChange={() => {}} />
        </FormField>
      </>
    )
    expect(screen.getByLabelText('Order in the menu')).toHaveValue('3')
    expect(screen.getByLabelText('Front page')).toHaveAttribute('role', 'switch')
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
  const field: FieldDefinition = { name: 'slug', type: 'slug', from: 'title' }

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
  const field = { name: 'when', type: 'datetime' as const, label: 'When' }
  const localMidnight = (day: string) => new Date(`${day}T00:00`).toISOString()

  it('is a date picker; without a time the date alone is stored as local midnight', () => {
    const onChange = vi.fn()
    render(<DatetimeEditor field={field} value={null} onChange={onChange} />)
    const date = screen.getByLabelText('When') as HTMLInputElement
    expect(date.type).toBe('date')
    expect(screen.queryByLabelText('Time')).not.toBeInTheDocument()
    fireEvent.change(date, { target: { value: '2026-08-22' } })
    expect(onChange).toHaveBeenCalledWith(localMidnight('2026-08-22'))
  })

  it('shows a stored midnight as a date only, and offers to add a time', async () => {
    const onChange = vi.fn()
    render(<DatetimeEditor field={field} value={localMidnight('2026-08-22')} onChange={onChange} />)
    expect(screen.getByLabelText('When')).toHaveValue('2026-08-22')
    expect(screen.queryByLabelText('Time')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Add time' }))
    const time = screen.getByLabelText('Time')
    fireEvent.change(time, { target: { value: '09:30' } })
    expect(onChange).toHaveBeenLastCalledWith(new Date('2026-08-22T09:30').toISOString())
  })

  it('shows the time picker already when the stored value has a time, and can drop it', async () => {
    const onChange = vi.fn()
    render(<DatetimeEditor field={field} value={new Date('2026-08-22T09:30').toISOString()} onChange={onChange} />)
    expect(screen.getByLabelText('When')).toHaveValue('2026-08-22')
    expect(screen.getByLabelText('Time')).toHaveValue('09:30')

    await userEvent.click(screen.getByRole('button', { name: 'Remove time' }))
    expect(onChange).toHaveBeenLastCalledWith(localMidnight('2026-08-22'))
  })

  it('keeps the time when the date changes', () => {
    const onChange = vi.fn()
    render(<DatetimeEditor field={field} value={new Date('2026-08-22T09:30').toISOString()} onChange={onChange} />)
    fireEvent.change(screen.getByLabelText('When'), { target: { value: '2026-08-23' } })
    expect(onChange).toHaveBeenLastCalledWith(new Date('2026-08-23T09:30').toISOString())
  })

  it('clearing the date stores nothing', () => {
    const onChange = vi.fn()
    render(<DatetimeEditor field={field} value={localMidnight('2026-08-22')} onChange={onChange} />)
    fireEvent.change(screen.getByLabelText('When'), { target: { value: '' } })
    expect(onChange).toHaveBeenLastCalledWith(null)
  })
})
