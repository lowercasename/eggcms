// src/admin/components/ui/InsertDivider.stories.tsx
import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Heading2, AlignLeft, BookOpen, Layers } from 'lucide-react'
import InsertDivider from './InsertDivider'
import TypeMenu from './TypeMenu'

const meta = { title: 'Primitives/InsertDivider', component: InsertDivider } satisfies Meta<typeof InsertDivider>
export default meta
type Story = StoryObj<typeof meta>

export const Resting: Story = { args: { label: 'Insert a section here', onClick: () => {} }, render: (args) => <div className="w-[600px]"><InsertDivider {...args} /></div> }
export const Active: Story = { args: { label: 'Insert a section here', onClick: () => {}, active: true }, render: (args) => <div className="w-[600px]"><InsertDivider {...args} /></div> }

function WithMenuDemo() {
  const [open, setOpen] = useState(true)
  return (
    <div className="w-[600px]">
      <InsertDivider label="Insert a section here" active={open} onClick={() => setOpen(!open)} />
      {open && (
        <div className="flex justify-center -mt-1">
          <TypeMenu
            heading="Insert a section after “Book”"
            options={[
              { value: 'heading', label: 'Heading', description: 'A large title that starts a part of the page', icon: <Heading2 /> },
              { value: 'text', label: 'Text', description: 'Paragraphs, links and lists', icon: <AlignLeft /> },
              { value: 'book', label: 'Book', description: 'Title, cover image and publication details', icon: <BookOpen /> },
              { value: 'articles', label: 'Article list', description: 'A numbered list of articles with links', icon: <Layers /> },
            ]}
            onSelect={() => setOpen(false)}
            onClose={() => setOpen(false)}
          />
        </div>
      )}
    </div>
  )
}
export const WithMenu: Story = { args: { label: 'Insert a section here', onClick: () => {} }, render: () => <WithMenuDemo /> }
