// src/admin/components/ui/SegmentedControl.stories.tsx
import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import SegmentedControl from './SegmentedControl'

const meta = { title: 'Primitives/SegmentedControl', component: SegmentedControl } satisfies Meta<typeof SegmentedControl>
export default meta
type Story = StoryObj<typeof meta>

function Demo({ fullWidth, options }: { fullWidth?: boolean; options: { value: string; label: string; count?: number }[] }) {
  const [value, setValue] = useState(options[0].value)
  return <SegmentedControl aria-label="Filter" fullWidth={fullWidth} options={options} value={value} onChange={setValue} className={fullWidth ? 'w-[222px]' : ''} />
}

export const EntryFilter: Story = {
  args: { 'aria-label': 'Show', options: [], value: 'all', onChange: () => {} },
  render: () => <Demo fullWidth options={[{ value: 'all', label: 'All', count: 7 }, { value: 'live', label: 'Live', count: 6 }, { value: 'draft', label: 'Draft', count: 1 }]} />,
}
export const MediaTypes: Story = {
  args: { 'aria-label': 'Type', options: [], value: 'all', onChange: () => {} },
  render: () => (
    <Demo
      options={[
        { value: 'all', label: 'All', count: 224 },
        { value: 'image', label: 'Images', count: 49 },
        { value: 'document', label: 'Documents', count: 173 },
        { value: 'audio', label: 'Audio', count: 1 },
        { value: 'video', label: 'Video', count: 1 },
      ]}
    />
  ),
}
