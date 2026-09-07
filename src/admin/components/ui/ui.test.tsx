// src/admin/components/ui/ui.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Layers } from 'lucide-react'
import {
  Button,
  Chip,
  SegmentedControl,
  SearchInput,
  NoticeBar,
  EmptyState,
  Stepper,
  Toggle,
  InsertDivider,
  TypeMenu,
  Input,
  Textarea,
} from './index'

describe('placeholders', () => {
  // A placeholder must not read as a value: quieter ink than text, and italic.
  it('are muted and italic in inputs', () => {
    render(<Input placeholder="https://…" aria-label="Link" />)
    const input = screen.getByRole('textbox', { name: 'Link' })
    expect(input.className).toMatch(/placeholder:text-ink-3/)
    expect(input.className).toMatch(/placeholder:italic/)
    expect(input.className).not.toMatch(/placeholder:text-ink-2/)
  })

  it('are muted and italic in textareas', () => {
    render(<Textarea placeholder="Notes" aria-label="Notes" />)
    const area = screen.getByRole('textbox', { name: 'Notes' })
    expect(area.className).toMatch(/placeholder:text-ink-3/)
    expect(area.className).toMatch(/placeholder:italic/)
  })

  it('are muted and italic in the search box', () => {
    render(<SearchInput value="" onChange={() => {}} placeholder="Search pages" />)
    const box = screen.getByRole('searchbox', { name: 'Search pages' })
    expect(box.className).toMatch(/placeholder:text-ink-3/)
    expect(box.className).toMatch(/placeholder:italic/)
  })
})

describe('Button', () => {
  it('renders its label and fires onClick', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Publish changes</Button>)
    await userEvent.click(screen.getByRole('button', { name: 'Publish changes' }))
    expect(onClick).toHaveBeenCalled()
  })

  it('is disabled and shows nothing clickable while loading', () => {
    render(<Button loading>Save</Button>)
    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled()
  })

  it('exposes an icon button by its accessible name only', () => {
    render(
      <Button variant="icon" aria-label="Move up">
        <span aria-hidden>↑</span>
      </Button>
    )
    expect(screen.getByRole('button', { name: 'Move up' })).toBeInTheDocument()
  })

  it('renders a leading icon next to the label', () => {
    render(<Button icon={<Layers data-testid="icon" />}>Add heading</Button>)
    expect(screen.getByTestId('icon')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add heading/i })).toBeInTheDocument()
  })
})

describe('Chip', () => {
  it.each([
    ['published', 'Published'],
    ['edited', 'Edited'],
    ['draft', 'Draft'],
  ] as const)('%s status chip carries its word, not only a colour', (variant, word) => {
    render(<Chip variant={variant} />)
    expect(screen.getByText(word)).toBeInTheDocument()
    // Status is also shown by an icon so it survives greyscale.
    expect(screen.getByText(word).parentElement?.querySelector('svg')).toBeTruthy()
  })

  it('type chip shows arbitrary content with an optional icon', () => {
    render(
      <Chip variant="type" icon={<Layers data-testid="icon" />}>
        12 blocks
      </Chip>
    )
    expect(screen.getByText('12 blocks')).toBeInTheDocument()
    expect(screen.getByTestId('icon')).toBeInTheDocument()
  })
})

describe('SegmentedControl', () => {
  const options = [
    { value: 'all', label: 'All', count: 7 },
    { value: 'live', label: 'Live', count: 6 },
    { value: 'draft', label: 'Draft', count: 1 },
  ]

  it('shows each option with its count and marks the selected one', () => {
    render(<SegmentedControl aria-label="Filter" options={options} value="all" onChange={() => {}} />)
    expect(screen.getByRole('button', { name: 'All 7' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Live 6' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'Draft 1' })).toBeInTheDocument()
  })

  it('reports the chosen value', async () => {
    const onChange = vi.fn()
    render(<SegmentedControl aria-label="Filter" options={options} value="all" onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'Draft 1' }))
    expect(onChange).toHaveBeenCalledWith('draft')
  })
})

describe('SearchInput', () => {
  it('is a labelled search box with a placeholder', () => {
    render(<SearchInput value="" onChange={() => {}} placeholder="Search pages" />)
    expect(screen.getByRole('searchbox', { name: 'Search pages' })).toBeInTheDocument()
  })

  it('offers a clear button only when there is text', async () => {
    const onChange = vi.fn()
    const { rerender } = render(<SearchInput value="" onChange={onChange} placeholder="Search pages" />)
    expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument()

    rerender(<SearchInput value="anzacs" onChange={onChange} placeholder="Search pages" />)
    await userEvent.click(screen.getByRole('button', { name: /clear/i }))
    expect(onChange).toHaveBeenCalledWith('')
  })

  it('passes typed text up', () => {
    const onChange = vi.fn()
    render(<SearchInput value="" onChange={onChange} placeholder="Search" />)
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'anz' } })
    expect(onChange).toHaveBeenCalledWith('anz')
  })
})

describe('NoticeBar', () => {
  it('announces its message as a status and renders its actions', () => {
    render(
      <NoticeBar variant="unsaved" actions={<Button>Publish changes</Button>}>
        <b>3 unsaved changes.</b> The website still shows the last published version.
      </NoticeBar>
    )
    expect(screen.getByRole('status')).toHaveTextContent('3 unsaved changes.')
    expect(screen.getByRole('button', { name: 'Publish changes' })).toBeInTheDocument()
  })

  it('uses the alert role for errors', () => {
    render(<NoticeBar variant="error">Save failed</NoticeBar>)
    expect(screen.getByRole('alert')).toHaveTextContent('Save failed')
  })
})

describe('EmptyState', () => {
  it('names the situation and carries one resolving action', () => {
    render(
      <EmptyState
        icon={<Layers />}
        title="No pages yet"
        description="Every page on the website starts here."
        action={<Button>Make the first page</Button>}
      />
    )
    expect(screen.getByRole('heading', { name: 'No pages yet' })).toBeInTheDocument()
    expect(screen.getByText('Every page on the website starts here.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Make the first page' })).toBeInTheDocument()
  })
})

describe('Stepper', () => {
  it('steps the value down and up', async () => {
    const onChange = vi.fn()
    render(<Stepper aria-label="Order in the menu" value={3} onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: /decrease/i }))
    expect(onChange).toHaveBeenLastCalledWith(2)
    await userEvent.click(screen.getByRole('button', { name: /increase/i }))
    expect(onChange).toHaveBeenLastCalledWith(4)
  })

  it('treats an empty value as zero when stepping', async () => {
    const onChange = vi.fn()
    render(<Stepper aria-label="Count" value={null} onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: /increase/i }))
    expect(onChange).toHaveBeenLastCalledWith(1)
  })

  it('accepts a typed number and clears to null', () => {
    const onChange = vi.fn()
    render(<Stepper aria-label="Count" value={3} onChange={onChange} />)
    const input = screen.getByRole('textbox', { name: 'Count' })
    fireEvent.change(input, { target: { value: '12.5' } })
    expect(onChange).toHaveBeenLastCalledWith(12.5)
    fireEvent.change(input, { target: { value: '' } })
    expect(onChange).toHaveBeenLastCalledWith(null)
  })

  it('respects min and max', async () => {
    const onChange = vi.fn()
    render(<Stepper aria-label="Count" value={0} min={0} max={1} onChange={onChange} />)
    expect(screen.getByRole('button', { name: /decrease/i })).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: /increase/i }))
    expect(onChange).toHaveBeenLastCalledWith(1)
  })
})

describe('Toggle', () => {
  it('is a switch that says which state it is in', async () => {
    const onChange = vi.fn()
    const { rerender } = render(<Toggle checked={false} onChange={onChange} />)
    const sw = screen.getByRole('switch')
    expect(sw).toHaveAttribute('aria-checked', 'false')
    expect(screen.getByText('No')).toBeInTheDocument()

    await userEvent.click(sw)
    expect(onChange).toHaveBeenCalledWith(true)

    rerender(<Toggle checked={true} onChange={onChange} />)
    expect(screen.getByText('Yes')).toBeInTheDocument()
  })
})

describe('InsertDivider', () => {
  it('is a labelled button that reports whether its menu is open', async () => {
    const onClick = vi.fn()
    const { rerender } = render(<InsertDivider onClick={onClick} label="Insert a section here" />)
    const btn = screen.getByRole('button', { name: 'Insert a section here' })
    expect(btn).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(btn)
    expect(onClick).toHaveBeenCalled()

    rerender(<InsertDivider onClick={onClick} label="Insert a section here" active />)
    expect(btn).toHaveAttribute('aria-expanded', 'true')
  })
})

describe('TypeMenu', () => {
  const options = [
    { value: 'heading', label: 'Heading', description: 'A large title', icon: <Layers /> },
    { value: 'text', label: 'Text', description: 'Paragraphs, links and lists' },
  ]

  it('lists each type with name and description and reports the choice', async () => {
    const onSelect = vi.fn()
    render(
      <TypeMenu heading="Insert a section after “Book”" options={options} onSelect={onSelect} onClose={() => {}} />
    )
    expect(screen.getByRole('menu', { name: 'Insert a section after “Book”' })).toBeInTheDocument()
    expect(screen.getByText('Paragraphs, links and lists')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('menuitem', { name: /heading/i }))
    expect(onSelect).toHaveBeenCalledWith('heading')
  })

  it('closes from its × button and on Escape', async () => {
    const onClose = vi.fn()
    render(<TypeMenu heading="Insert" options={options} onSelect={() => {}} onClose={onClose} />)
    await userEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})

describe('Stepper typing', () => {
  it('lets a decimal and a negative number be typed in full', () => {
    const onChange = vi.fn()
    const { rerender } = render(<Stepper aria-label="Price" value={null} onChange={onChange} />)
    const input = screen.getByRole('textbox', { name: 'Price' })
    fireEvent.change(input, { target: { value: '2.' } })
    expect(input).toHaveValue('2.')
    fireEvent.change(input, { target: { value: '2.5' } })
    expect(onChange).toHaveBeenLastCalledWith(2.5)
    rerender(<Stepper aria-label="Price" value={2.5} onChange={onChange} />)
    expect(input).toHaveValue('2.5')

    fireEvent.change(input, { target: { value: '-' } })
    expect(input).toHaveValue('-')
    fireEvent.change(input, { target: { value: '-3' } })
    expect(onChange).toHaveBeenLastCalledWith(-3)
  })
})
