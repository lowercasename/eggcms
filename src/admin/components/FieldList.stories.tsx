// src/admin/components/FieldList.stories.tsx
import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import FieldList from './FieldList'
import { pageSchema, samplePages, settingsSchema, sampleSettings } from '../lib/sample'

const meta = { title: 'Fields/FieldList', component: FieldList } satisfies Meta<typeof FieldList>
export default meta
type Story = StoryObj<typeof meta>

function Demo({ fields, initial, highlight }: { fields: typeof pageSchema.fields; initial: Record<string, unknown>; highlight?: { field: string; hint?: string } }) {
  const [data, setData] = useState(initial)
  return (
    <div className="w-[780px]">
      <FieldList fields={fields} data={data} onChange={setData} highlight={highlight} />
    </div>
  )
}

export const PageSchema: Story = {
  args: { fields: pageSchema.fields, data: {}, onChange: () => {} },
  render: () => <Demo fields={pageSchema.fields} initial={samplePages[4]} />,
}
export const NewPage: Story = {
  args: { fields: pageSchema.fields, data: {}, onChange: () => {} },
  render: () => <Demo fields={pageSchema.fields} initial={{}} highlight={{ field: 'title', hint: 'Start here — this is the name shown across the website.' }} />,
}
export const Settings: Story = {
  args: { fields: settingsSchema.fields, data: {}, onChange: () => {} },
  render: () => <Demo fields={settingsSchema.fields} initial={sampleSettings} />,
}
