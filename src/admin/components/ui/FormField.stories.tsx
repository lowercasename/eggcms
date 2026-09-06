// src/admin/components/ui/FormField.stories.tsx
import type { Meta, StoryObj } from '@storybook/react-vite'
import FormField from './FormField'
import Card from './Card'
import Input from './Input'
import Button from './Button'
import FieldActions from './FieldActions'
import { useFieldControl } from './FieldContext'

/** A bare input wired to the surrounding label, as a real editor would be. */
function Field(props: React.ComponentProps<typeof Input>) {
  const { id } = useFieldControl()
  return <Input id={id} {...props} />
}
import { Maximize2 } from 'lucide-react'

const meta = { title: 'Fields/FormField', component: FormField } satisfies Meta<typeof FormField>
export default meta
type Story = StoryObj<typeof meta>

export const ScalarRows: Story = {
  args: { field: { name: 'title', type: 'string' }, children: null },
  render: () => (
    <Card divided className="w-[680px]">
      <FormField field={{ name: 'title', type: 'string', required: true }}>
        <Field defaultValue="South Pacific" />
      </FormField>
      <FormField field={{ name: 'subtitle', type: 'string' }}>
        <Field placeholder="Optional" />
      </FormField>
      <FormField field={{ name: 'menuOrder', type: 'number', label: 'Order in the menu' }} hint="Lower numbers come first.">
        <Field defaultValue="3" className="max-w-[120px]" />
      </FormField>
    </Card>
  ),
}

export const HighlightedRow: Story = {
  args: { field: { name: 'title', type: 'string' }, children: null },
  render: () => (
    <Card divided className="w-[680px]">
      <FormField field={{ name: 'title', type: 'string', required: true }} highlight hint="Start here — this is the name shown across the website.">
        <Field autoFocus />
      </FormField>
      <FormField field={{ name: 'subtitle', type: 'string' }}>
        <Field placeholder="Optional" />
      </FormField>
    </Card>
  ),
}

export const TallField: Story = {
  args: { field: { name: 'details', type: 'richtext' }, children: null },
  render: () => (
    <div className="w-[680px]">
      <FormField field={{ name: 'details', type: 'richtext', label: 'Publication details' }}>
        <FieldActions>
          <Button variant="secondary" size="sm" icon={<Maximize2 />}>
            Full screen
          </Button>
        </FieldActions>
        <div className="control min-h-[160px] p-4 text-ink-2">The editor goes here.</div>
      </FormField>
    </div>
  ),
}

export const BlocksFieldChip: Story = {
  args: { field: { name: 'sections', type: 'blocks' }, children: null, chip: '12 blocks' },
  render: (args) => (
    <div className="w-[680px]">
      <FormField {...args}>
        <div className="control min-h-[80px] p-4 text-ink-2">Blocks go here.</div>
      </FormField>
    </div>
  ),
}
