// src/admin/components/ui/Toggle.stories.tsx
import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import Toggle from './Toggle'

const meta = { title: 'Primitives/Toggle', component: Toggle } satisfies Meta<typeof Toggle>
export default meta
type Story = StoryObj<typeof meta>

function Demo({ initial }: { initial: boolean }) {
  const [on, setOn] = useState(initial)
  return <Toggle aria-label="This is the front page" checked={on} onChange={setOn} />
}

export const Off: Story = { args: { checked: false, onChange: () => {} }, render: () => <Demo initial={false} /> }
export const On: Story = { args: { checked: true, onChange: () => {} }, render: () => <Demo initial /> }
