// src/admin/components/ui/EmptyState.stories.tsx
import type { Meta, StoryObj } from '@storybook/react-vite'
import { FilePlus, SearchX, Upload, Layers, Plus } from 'lucide-react'
import EmptyState from './EmptyState'
import Button from './Button'

const meta = { title: 'Primitives/EmptyState', component: EmptyState } satisfies Meta<typeof EmptyState>
export default meta
type Story = StoryObj<typeof meta>

export const NoPages: Story = {
  args: {
    icon: <FilePlus />,
    title: 'No pages yet',
    description: 'Every page on the website starts here.',
    action: <Button icon={<Plus />}>Make the first page</Button>,
  },
}
export const NoMatch: Story = {
  args: {
    icon: <SearchX />,
    title: 'No pages match “anzacs 1919”',
    description: 'Try fewer words, or clear the search to see all 7 pages.',
    action: <Button variant="secondary">Clear search</Button>,
  },
}
export const NoFiles: Story = {
  args: {
    dashed: 'strong',
    icon: <Upload />,
    title: 'No files yet',
    description: 'Drag images and PDFs here, or choose them from your computer.',
    action: <Button icon={<Upload />}>Choose files</Button>,
  },
}
export const NoSections: Story = {
  args: {
    dashed: 'structure',
    icon: <Layers />,
    title: 'No sections yet',
    description: 'Sections are the pieces this is built from: Heading, Text, Book or Article list. Add them in any order and move them around later.',
    action: (
      <>
        <Button variant="structure">Add heading</Button>
        <Button variant="structure">Add text</Button>
        <Button variant="structure">Add book</Button>
      </>
    ),
  },
}
