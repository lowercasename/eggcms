// src/admin/components/ui/NoticeBar.stories.tsx
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Trash2 } from 'lucide-react'
import NoticeBar from './NoticeBar'
import Button from './Button'

const meta = { title: 'Primitives/NoticeBar', component: NoticeBar, parameters: { layout: 'fullscreen' } } satisfies Meta<typeof NoticeBar>
export default meta
type Story = StoryObj<typeof meta>

export const Unsaved: Story = {
  args: {
    variant: 'unsaved',
    children: (
      <>
        <b>3 unsaved changes.</b> The website still shows the last published version.
      </>
    ),
    actions: (
      <>
        <Button variant="secondary" className="!border-draft-2 !text-draft">
          Discard
        </Button>
        <Button>Publish changes</Button>
      </>
    ),
  },
}
export const Info: Story = {
  args: {
    variant: 'info',
    children: 'Not on the website yet — give it a title, then publish.',
    actions: (
      <>
        <Button variant="secondary">Save draft</Button>
        <Button disabled>Publish</Button>
      </>
    ),
  },
}
export const Selection: Story = {
  args: {
    variant: 'selection',
    children: (
      <>
        <b>2 files selected.</b> One of them is used on a page.
      </>
    ),
    actions: (
      <>
        <Button variant="secondary" className="!border-draft-2 !text-draft">
          Clear selection
        </Button>
        <Button variant="destructive" icon={<Trash2 />}>
          Delete 2 files
        </Button>
      </>
    ),
  },
}
export const Published: Story = { args: { variant: 'published', children: <b>Published just now.</b> } }
export const Error: Story = { args: { variant: 'error', children: 'This file is used by Australia (page). Remove it there first.' } }
