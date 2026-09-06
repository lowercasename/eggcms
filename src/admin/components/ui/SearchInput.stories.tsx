// src/admin/components/ui/SearchInput.stories.tsx
import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import SearchInput from './SearchInput'

const meta = { title: 'Primitives/SearchInput', component: SearchInput } satisfies Meta<typeof SearchInput>
export default meta
type Story = StoryObj<typeof meta>

function Demo({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial)
  return <SearchInput value={value} onChange={setValue} placeholder="Search pages" className="w-[280px]" />
}

export const Empty: Story = { args: { value: '', onChange: () => {}, placeholder: 'Search pages' }, render: () => <Demo initial="" /> }
export const WithText: Story = { args: { value: 'anzacs 1919', onChange: () => {}, placeholder: 'Search pages' }, render: () => <Demo initial="anzacs 1919" /> }
