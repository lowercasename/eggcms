// src/admin/components/ui/Stepper.stories.tsx
import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import Stepper from './Stepper'

const meta = { title: 'Primitives/Stepper', component: Stepper } satisfies Meta<typeof Stepper>
export default meta
type Story = StoryObj<typeof meta>

function Demo(props: Partial<React.ComponentProps<typeof Stepper>>) {
  const [value, setValue] = useState<number | null>(3)
  return <Stepper aria-label="Order in the menu" {...props} value={value} onChange={setValue} />
}

export const Default: Story = { args: { 'aria-label': 'Order in the menu', value: 3, onChange: () => {} }, render: () => <Demo /> }
export const Bounded: Story = { args: { 'aria-label': 'Order in the menu', value: 3, onChange: () => {} }, render: () => <Demo min={0} max={5} /> }
