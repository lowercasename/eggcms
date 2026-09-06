// src/admin/components/media/Media.stories.tsx
import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import MediaCard from './MediaCard'
import MediaBrowser from './MediaBrowser'
import MediaPickerDialog from './MediaPickerDialog'
import { sampleMedia } from '../../lib/sample'
import { Button } from '../ui'

const meta = { title: 'Media/Library' } satisfies Meta
export default meta
type Story = StoryObj

export const Cards: Story = {
  render: () => {
    const [selected, setSelected] = useState<Set<string>>(new Set(['m11']))
    return (
      <div className="grid grid-cols-4 gap-[18px] w-[980px]">
        {sampleMedia.slice(0, 8).map((item) => (
          <MediaCard
            key={item.id}
            item={item}
            mode="manage"
            selected={selected.has(item.id)}
            onToggle={(on) =>
              setSelected((prev) => {
                const next = new Set(prev)
                if (on) next.add(item.id)
                else next.delete(item.id)
                return next
              })
            }
          />
        ))}
      </div>
    )
  },
}

export const PickCards: Story = {
  render: () => (
    <div className="grid grid-cols-4 gap-[18px] w-[980px]">
      {sampleMedia.slice(0, 4).map((item, i) => (
        <MediaCard key={item.id} item={item} mode="pick" selected={i === 0} onPick={() => {}} />
      ))}
    </div>
  ),
}

export const Manage: Story = {
  parameters: { layout: 'fullscreen' },
  render: () => (
    <div className="h-[820px] bg-page">
      <MediaBrowser mode="manage" header className="h-full" />
    </div>
  ),
}

export const Pick: Story = {
  parameters: { layout: 'fullscreen' },
  render: () => (
    <div className="h-[700px] bg-page">
      <MediaBrowser mode="pick" kinds={['image']} onPick={() => {}} className="h-full" />
    </div>
  ),
}

export const PickerDialog: Story = {
  render: () => {
    const [open, setOpen] = useState(true)
    return (
      <>
        <Button onClick={() => setOpen(true)}>Choose from library</Button>
        {open && <MediaPickerDialog title="Choose an image" kinds={['image']} onSelect={() => setOpen(false)} onClose={() => setOpen(false)} />}
      </>
    )
  },
}
