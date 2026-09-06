// src/admin/components/ui/Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Plus, Upload, ArrowUp, Trash2, Check, Layers } from 'lucide-react'
import Button from './Button'

const meta = {
  title: 'Primitives/Button',
  component: Button,
  args: { children: 'Publish changes' },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {}
export const Secondary: Story = { args: { variant: 'secondary', children: 'Discard' } }
export const Destructive: Story = { args: { variant: 'destructive', icon: <Trash2 />, children: 'Delete 2 files' } }
export const DestructiveSolid: Story = { args: { variant: 'destructive-solid', children: 'Yes, remove' } }
export const Dark: Story = { args: { variant: 'dark', icon: <Check />, children: 'Done writing' } }
export const Structure: Story = { args: { variant: 'structure', icon: <Layers />, children: 'Add heading' } }
export const WithIcon: Story = { args: { icon: <Upload />, children: 'Upload files' } }
export const Small: Story = { args: { variant: 'secondary', size: 'sm', children: 'Collapse all' } }
export const Loading: Story = { args: { loading: true, children: 'Publishing…' } }
export const Disabled: Story = { args: { disabled: true, children: 'Publish' } }
export const Icon: Story = { args: { variant: 'icon', size: 'sm', 'aria-label': 'Move up', children: <ArrowUp /> } }

export const All: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button icon={<Plus />}>New page</Button>
      <Button variant="secondary">Discard</Button>
      <Button variant="destructive" icon={<Trash2 />}>
        Delete 2 files
      </Button>
      <Button variant="destructive-solid">Yes, delete</Button>
      <Button variant="dark" icon={<Check />}>
        Done writing
      </Button>
      <Button variant="structure" icon={<Layers />}>
        Add book
      </Button>
      <Button variant="ghost">Cancel</Button>
      <Button variant="icon" aria-label="Move up">
        <ArrowUp />
      </Button>
      <Button disabled>Publish</Button>
    </div>
  ),
}
