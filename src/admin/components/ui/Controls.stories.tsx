// src/admin/components/ui/Controls.stories.tsx
import type { Meta, StoryObj } from '@storybook/react-vite'
import Input from './Input'
import Select from './Select'
import Textarea from './Textarea'
import Label from './Label'
import Card from './Card'
import OverflowMenu from './OverflowMenu'
import { Trash2, EyeOff } from 'lucide-react'

const meta = { title: 'Primitives/Controls' } satisfies Meta
export default meta
type Story = StoryObj

export const Inputs: Story = {
  render: () => (
    <div className="flex flex-col gap-5 w-[480px]">
      <div className="flex flex-col gap-2">
        <Label htmlFor="i1" required>
          Title
        </Label>
        <Input id="i1" defaultValue="South Pacific" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="i2">Placeholder</Label>
        <Input id="i2" placeholder="Optional" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="i3">Mono</Label>
        <Input id="i3" mono defaultValue="/south-pacific" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="i4">Read only</Label>
        <Input id="i4" readOnly defaultValue="Cannot change this" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="s1">Select</Label>
        <Select id="s1" options={[{ value: 'small', label: 'small' }, { value: 'medium', label: 'medium' }, { value: 'large', label: 'large' }]} defaultValue="medium" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="t1">Textarea</Label>
        <Textarea id="t1" defaultValue="A few lines of plain text." />
      </div>
    </div>
  ),
}

export const CardAndMenu: Story = {
  render: () => (
    <div className="flex flex-col gap-5 w-[480px]">
      <Card divided>
        <div className="px-4 py-3.5">One row</div>
        <div className="px-4 py-3.5">Another row</div>
      </Card>
      <div className="flex justify-end">
        <OverflowMenu
          items={[
            { label: 'Take off the website', icon: <EyeOff />, onSelect: () => {} },
            { label: 'Delete page', icon: <Trash2 />, destructive: true, onSelect: () => {} },
          ]}
        />
      </div>
    </div>
  ),
}
