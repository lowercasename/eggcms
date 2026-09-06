// src/admin/components/ui/Chip.stories.tsx
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Layers } from 'lucide-react'
import Chip from './Chip'

const meta = { title: 'Primitives/Chip', component: Chip } satisfies Meta<typeof Chip>
export default meta
type Story = StoryObj<typeof meta>

export const Published: Story = { args: { variant: 'published' } }
export const Edited: Story = { args: { variant: 'edited' } }
export const Draft: Story = { args: { variant: 'draft' } }
export const Type: Story = { args: { variant: 'type', icon: <Layers />, children: '12 blocks' } }
export const All: Story = {
  args: { variant: 'type' },
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Chip variant="published" />
      <Chip variant="edited" />
      <Chip variant="draft" />
      <Chip variant="type" icon={<Layers />}>
        12 blocks
      </Chip>
      <Chip variant="type">Rich text</Chip>
      <Chip variant="type">Empty</Chip>
    </div>
  ),
}
