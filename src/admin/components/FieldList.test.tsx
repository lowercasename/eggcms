// src/admin/components/FieldList.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import FieldList from './FieldList'
import type { EditorProps } from '../editors/types'

const FakeInput = ({ field, value, onChange }: EditorProps) => (
  <input
    data-testid={`editor-${field.name}`}
    aria-label={field.name}
    value={(value as string) || ''}
    onChange={(e) => onChange(e.target.value)}
  />
)
const FakeTall = ({ field }: EditorProps) => <div data-testid={`editor-${field.name}`}>tall</div>

const editors = { string: FakeInput, number: FakeInput, richtext: FakeTall, blocks: FakeTall, image: FakeTall }

describe('FieldList', () => {
  it('renders fields in schema order, grouping consecutive scalar rows into one card', () => {
    render(
      <FieldList
        fields={[
          { name: 'title', type: 'string' },
          { name: 'order', type: 'number' },
          { name: 'body', type: 'richtext' },
          { name: 'subtitle', type: 'string' },
        ]}
        data={{}}
        onChange={() => {}}
        editors={editors}
      />
    )
    const cards = screen.getAllByTestId('field-card')
    expect(cards).toHaveLength(2)
    expect(cards[0]).toContainElement(screen.getByTestId('editor-title'))
    expect(cards[0]).toContainElement(screen.getByTestId('editor-order'))
    expect(cards[1]).toContainElement(screen.getByTestId('editor-subtitle'))
    expect(screen.getByTestId('field-block')).toContainElement(screen.getByTestId('editor-body'))

    // Order on the page follows the schema.
    const all = screen.getAllByTestId(/^editor-/)
    expect(all.map((e) => e.dataset.testid)).toEqual(['editor-title', 'editor-order', 'editor-body', 'editor-subtitle'])
  })

  it('passes values in and merges changes back by field name', () => {
    const onChange = vi.fn()
    render(
      <FieldList
        fields={[{ name: 'title', type: 'string' }]}
        data={{ title: 'South Pacific', other: 1 }}
        onChange={onChange}
        editors={editors}
      />
    )
    const input = screen.getByLabelText('title')
    expect(input).toHaveValue('South Pacific')
    fireEvent.change(input, { target: { value: 'Pacific' } })
    expect(onChange).toHaveBeenCalledWith({ title: 'Pacific', other: 1 })
  })

  it('labels a blocks field with its count', () => {
    render(
      <FieldList
        fields={[{ name: 'sections', type: 'blocks', blocks: [{ name: 'a', label: 'A', fields: [] }, { name: 'b', label: 'B', fields: [] }] }]}
        data={{ sections: [{ _type: 'a', _id: '1' }, { _type: 'b', _id: '2' }] }}
        onChange={() => {}}
        editors={editors}
      />
    )
    expect(screen.getByText('2 blocks')).toBeInTheDocument()
  })

  it('says a blocks field is empty rather than showing a zero', () => {
    render(
      <FieldList
        fields={[{ name: 'sections', type: 'blocks', blocks: [{ name: 'a', label: 'A', fields: [] }] }]}
        data={{}}
        onChange={() => {}}
        editors={editors}
      />
    )
    expect(screen.getByText('Empty')).toBeInTheDocument()
  })

  it('says plainly when there is no editor for a field type, rather than offering a text box', () => {
    render(
      <FieldList fields={[{ name: 'mystery', type: 'whatever' }]} data={{ mystery: [1, 2] }} onChange={() => {}} editors={editors} />
    )
    expect(screen.queryByTestId('editor-mystery')).not.toBeInTheDocument()
    expect(screen.getByText(/no editor for “whatever” fields/i)).toBeInTheDocument()
  })

  it('highlights and focuses the named field', () => {
    render(
      <FieldList
        fields={[{ name: 'title', type: 'string' }, { name: 'subtitle', type: 'string' }]}
        data={{}}
        onChange={() => {}}
        editors={editors}
        highlight={{ field: 'title', hint: 'Start here.' }}
      />
    )
    const rows = screen.getAllByTestId('field-row')
    expect(rows[0]).toHaveAttribute('data-highlight', 'true')
    expect(rows[1]).not.toHaveAttribute('data-highlight')
    expect(screen.getByText('Start here.')).toBeInTheDocument()
  })
})
