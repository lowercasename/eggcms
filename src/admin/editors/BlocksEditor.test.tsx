// src/admin/editors/BlocksEditor.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BlocksEditor from './BlocksEditor'
import type { FieldDefinition } from '../types'

// Mock child editors
vi.mock('./StringEditor', () => ({
  default: ({ value, onChange }: { value: unknown; onChange: (v: unknown) => void }) => (
    <input
      data-testid="string-editor"
      value={(value as string) || ''}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}))

vi.mock('./TextEditor', () => ({
  default: () => <div data-testid="text-editor" />,
}))

vi.mock('./NumberEditor', () => ({
  default: ({ value, onChange }: { value: unknown; onChange: (v: unknown) => void }) => (
    <input
      data-testid="number-editor"
      type="number"
      value={(value as number) || 0}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  ),
}))

vi.mock('./BooleanEditor', () => ({
  default: () => <div data-testid="boolean-editor" />,
}))

vi.mock('./RichtextEditor', () => ({
  default: () => <div data-testid="richtext-editor" />,
}))

vi.mock('./DatetimeEditor', () => ({
  default: () => <div data-testid="datetime-editor" />,
}))

vi.mock('./SelectEditor', () => ({
  default: () => <div data-testid="select-editor" />,
}))

vi.mock('./SlugEditor', () => ({
  default: () => <div data-testid="slug-editor" />,
}))

vi.mock('./ImageEditor', () => ({
  default: () => <div data-testid="image-editor" />,
}))

vi.mock('./BlockEditor', () => ({
  default: () => <div data-testid="block-editor" />,
}))

describe('BlocksEditor', () => {
  const textBlock = {
    name: 'text',
    label: 'Text Block',
    fields: [
      { name: 'content', type: 'string', required: true },
    ],
  }

  const imageBlock = {
    name: 'image',
    label: 'Image Block',
    fields: [
      { name: 'src', type: 'string', required: true },
      { name: 'alt', type: 'string' },
    ],
  }

  const defaultField: FieldDefinition & { blocks?: typeof textBlock[] } = {
    name: 'blocks',
    type: 'blocks',
    blocks: [textBlock, imageBlock],
  }

  const mockOnChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('empty state', () => {
    it('shows empty message when no blocks', () => {
      render(
        <BlocksEditor field={defaultField} value={[]} onChange={mockOnChange} />
      )

      expect(screen.getByText('No blocks added yet')).toBeInTheDocument()
      expect(screen.getByText('Add your first block below')).toBeInTheDocument()
    })

    it('shows message when no block types defined', () => {
      const fieldWithoutBlocks: FieldDefinition = {
        name: 'blocks',
        type: 'blocks',
      }

      render(
        <BlocksEditor field={fieldWithoutBlocks} value={[]} onChange={mockOnChange} />
      )

      expect(screen.getByText('No block types defined for this field.')).toBeInTheDocument()
    })
  })

  describe('block selection', () => {
    it('shows block type options in select', () => {
      render(
        <BlocksEditor field={defaultField} value={[]} onChange={mockOnChange} />
      )

      const select = screen.getByRole('combobox')
      expect(select).toBeInTheDocument()

      // Options should be available
      const options = within(select).getAllByRole('option')
      expect(options).toHaveLength(3) // placeholder + 2 blocks
      expect(options[1]).toHaveTextContent('Text Block')
      expect(options[2]).toHaveTextContent('Image Block')
    })

    it('disables Add Block button when no type selected', () => {
      render(
        <BlocksEditor field={defaultField} value={[]} onChange={mockOnChange} />
      )

      const addButton = screen.getByRole('button', { name: /add block/i })
      expect(addButton).toBeDisabled()
    })

    it('enables Add Block button when type selected', async () => {
      const user = userEvent.setup()

      render(
        <BlocksEditor field={defaultField} value={[]} onChange={mockOnChange} />
      )

      const select = screen.getByRole('combobox')
      await user.selectOptions(select, 'text')

      const addButton = screen.getByRole('button', { name: /add block/i })
      expect(addButton).not.toBeDisabled()
    })
  })

  describe('adding blocks', () => {
    it('adds block when Add Block clicked', async () => {
      const user = userEvent.setup()

      render(
        <BlocksEditor field={defaultField} value={[]} onChange={mockOnChange} />
      )

      const select = screen.getByRole('combobox')
      await user.selectOptions(select, 'text')

      const addButton = screen.getByRole('button', { name: /add block/i })
      await user.click(addButton)

      expect(mockOnChange).toHaveBeenCalledWith([
        expect.objectContaining({
          _type: 'text',
          _id: expect.any(String),
        }),
      ])
    })

    it('initializes block with field defaults', async () => {
      const user = userEvent.setup()

      const fieldWithDefaults: FieldDefinition & { blocks?: typeof textBlock[] } = {
        name: 'blocks',
        type: 'blocks',
        blocks: [{
          name: 'withDefault',
          label: 'With Default',
          fields: [
            { name: 'title', type: 'string', default: 'Untitled' },
            { name: 'count', type: 'number', default: 0 },
          ],
        }],
      }

      render(
        <BlocksEditor field={fieldWithDefaults} value={[]} onChange={mockOnChange} />
      )

      const select = screen.getByRole('combobox')
      await user.selectOptions(select, 'withDefault')

      const addButton = screen.getByRole('button', { name: /add block/i })
      await user.click(addButton)

      expect(mockOnChange).toHaveBeenCalledWith([
        expect.objectContaining({
          _type: 'withDefault',
          title: 'Untitled',
          count: 0,
        }),
      ])
    })

    it('resets select after adding block', async () => {
      const user = userEvent.setup()

      render(
        <BlocksEditor field={defaultField} value={[]} onChange={mockOnChange} />
      )

      const select = screen.getByRole('combobox')
      await user.selectOptions(select, 'text')

      const addButton = screen.getByRole('button', { name: /add block/i })
      await user.click(addButton)

      // Select should be reset
      expect(select).toHaveValue('')
    })
  })

  describe('displaying blocks', () => {
    it('renders existing blocks', () => {
      const existingBlocks = [
        { _type: 'text', _id: 'block-1', content: 'Hello' },
        { _type: 'image', _id: 'block-2', src: '/image.jpg', alt: 'Test' },
      ]

      render(
        <BlocksEditor field={defaultField} value={existingBlocks} onChange={mockOnChange} />
      )

      // Text appears in both dropdown AND block headers, so use getAllByText
      const textBlockElements = screen.getAllByText('Text Block')
      const imageBlockElements = screen.getAllByText('Image Block')
      // At least 2 for each: one in dropdown option, one in block header
      expect(textBlockElements.length).toBeGreaterThanOrEqual(2)
      expect(imageBlockElements.length).toBeGreaterThanOrEqual(2)
    })

    it('shows block label', () => {
      const existingBlocks = [
        { _type: 'text', _id: 'block-1', content: 'Hello' },
      ]

      render(
        <BlocksEditor field={defaultField} value={existingBlocks} onChange={mockOnChange} />
      )

      // Text Block appears in dropdown AND block header
      const textBlockElements = screen.getAllByText('Text Block')
      expect(textBlockElements.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('removing blocks', () => {
    it('removes block when delete clicked', async () => {
      const user = userEvent.setup()

      const existingBlocks = [
        { _type: 'text', _id: 'block-1', content: 'First' },
        { _type: 'text', _id: 'block-2', content: 'Second' },
      ]

      render(
        <BlocksEditor field={defaultField} value={existingBlocks} onChange={mockOnChange} />
      )

      const deleteButtons = screen.getAllByTitle('Remove block')
      await user.click(deleteButtons[0])

      expect(mockOnChange).toHaveBeenCalledWith([
        { _type: 'text', _id: 'block-2', content: 'Second' },
      ])
    })
  })

  describe('collapse/expand', () => {
    it('blocks start collapsed by default', () => {
      const existingBlocks = [
        { _type: 'text', _id: 'block-1', content: 'Hello' },
      ]

      render(
        <BlocksEditor field={defaultField} value={existingBlocks} onChange={mockOnChange} />
      )

      // Should show expand button (ChevronRight), not collapse
      expect(screen.getByTitle('Expand')).toBeInTheDocument()
      // Field editor should not be visible
      expect(screen.queryByTestId('string-editor')).not.toBeInTheDocument()
    })

    it('expands block when clicked', async () => {
      const user = userEvent.setup()

      const existingBlocks = [
        { _type: 'text', _id: 'block-1', content: 'Hello' },
      ]

      render(
        <BlocksEditor field={defaultField} value={existingBlocks} onChange={mockOnChange} />
      )

      const expandButton = screen.getByTitle('Expand')
      await user.click(expandButton)

      // Should now show collapse button
      expect(screen.getByTitle('Collapse')).toBeInTheDocument()
      // Field editor should be visible
      expect(screen.getByTestId('string-editor')).toBeInTheDocument()
    })

    it('collapses block when clicked again', async () => {
      const user = userEvent.setup()

      const existingBlocks = [
        { _type: 'text', _id: 'block-1', content: 'Hello' },
      ]

      render(
        <BlocksEditor field={defaultField} value={existingBlocks} onChange={mockOnChange} />
      )

      // Expand
      await user.click(screen.getByTitle('Expand'))
      // Collapse
      await user.click(screen.getByTitle('Collapse'))

      expect(screen.getByTitle('Expand')).toBeInTheDocument()
      expect(screen.queryByTestId('string-editor')).not.toBeInTheDocument()
    })

    it('shows preview when collapsed', () => {
      const existingBlocks = [
        { _type: 'text', _id: 'block-1', content: 'This is the preview text' },
      ]

      render(
        <BlocksEditor field={defaultField} value={existingBlocks} onChange={mockOnChange} />
      )

      expect(screen.getByText(/This is the preview text/)).toBeInTheDocument()
    })

    it('truncates long preview text', () => {
      const longText = 'A'.repeat(60)
      const existingBlocks = [
        { _type: 'text', _id: 'block-1', content: longText },
      ]

      render(
        <BlocksEditor field={defaultField} value={existingBlocks} onChange={mockOnChange} />
      )

      // Preview truncates at 50 chars + "...". Look for the truncated text (50 A's + ...)
      const truncatedText = 'A'.repeat(50) + '...'
      expect(screen.getByText(new RegExp(truncatedText))).toBeInTheDocument()
    })
  })

  describe('editing blocks', () => {
    it('updates block field when editor changes', async () => {
      const user = userEvent.setup()

      const existingBlocks = [
        { _type: 'text', _id: 'block-1', content: 'Hello' },
      ]

      render(
        <BlocksEditor field={defaultField} value={existingBlocks} onChange={mockOnChange} />
      )

      // Expand the block
      await user.click(screen.getByTitle('Expand'))

      // Find the editor and change value using fireEvent.change
      // (user.clear/type doesn't work reliably with mocked inputs)
      const editor = screen.getByTestId('string-editor')
      fireEvent.change(editor, { target: { value: 'Updated' } })

      expect(mockOnChange).toHaveBeenLastCalledWith([
        expect.objectContaining({
          _type: 'text',
          _id: 'block-1',
          content: 'Updated',
        }),
      ])
    })
  })

  describe('handles null/undefined value', () => {
    it('treats null as empty array', () => {
      render(
        <BlocksEditor field={defaultField} value={null} onChange={mockOnChange} />
      )

      expect(screen.getByText('No blocks added yet')).toBeInTheDocument()
    })

    it('treats undefined as empty array', () => {
      render(
        <BlocksEditor field={defaultField} value={undefined} onChange={mockOnChange} />
      )

      expect(screen.getByText('No blocks added yet')).toBeInTheDocument()
    })
  })
})
