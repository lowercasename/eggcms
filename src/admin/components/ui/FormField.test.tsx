// src/admin/components/ui/FormField.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import FormField from './FormField'
import FieldActions from './FieldActions'
import Button from './Button'

describe('FormField layout by type', () => {
  it('lays a scalar field out as a row with the label in a fixed column', () => {
    render(
      <FormField field={{ name: 'title', type: 'string', required: true }}>
        <input aria-label="Title" />
      </FormField>
    )
    const row = screen.getByTestId('field-row')
    expect(row).toHaveAttribute('data-layout', 'row')
    expect(screen.getByText('Title')).toBeInTheDocument()
    // Required is a terracotta asterisk after the label, hidden from screen readers.
    expect(row.querySelector('[aria-hidden]')?.textContent).toBe('*')
  })

  it('lays a tall field out with the label above and a type chip', () => {
    render(
      <FormField field={{ name: 'body', type: 'richtext' }}>
        <div>editor</div>
      </FormField>
    )
    const block = screen.getByTestId('field-block')
    expect(block).toHaveAttribute('data-layout', 'block')
    expect(screen.getByText('Body')).toBeInTheDocument()
    expect(screen.getByText('Rich text')).toBeInTheDocument()
  })

  it('uses the schema label when there is one', () => {
    render(
      <FormField field={{ name: 'menuOrder', type: 'number', label: 'Order in the menu' }}>
        <input />
      </FormField>
    )
    expect(screen.getByText('Order in the menu')).toBeInTheDocument()
  })

  it('shows helper text under the control', () => {
    render(
      <FormField field={{ name: 'title', type: 'string' }} hint="Start here.">
        <input />
      </FormField>
    )
    expect(screen.getByText('Start here.')).toBeInTheDocument()
  })

  it('lets an editor place actions in the label row of a tall field', () => {
    render(
      <FormField field={{ name: 'body', type: 'richtext' }}>
        <FieldActions>
          <Button size="sm">Full screen</Button>
        </FieldActions>
        <div>editor</div>
      </FormField>
    )
    const block = screen.getByTestId('field-block')
    const labelRow = block.querySelector('[data-testid="field-label-row"]')!
    expect(labelRow).toContainElement(screen.getByRole('button', { name: 'Full screen' }))
  })

  it('renders actions inline when there is no field wrapper', () => {
    render(
      <FieldActions>
        <Button size="sm">Full screen</Button>
      </FieldActions>
    )
    expect(screen.getByRole('button', { name: 'Full screen' })).toBeInTheDocument()
  })

  it('accepts a custom chip for a tall field', () => {
    render(
      <FormField field={{ name: 'sections', type: 'blocks' }} chip="12 blocks">
        <div />
      </FormField>
    )
    expect(screen.getByText('12 blocks')).toBeInTheDocument()
  })
})
