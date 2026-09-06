// src/admin/editors/BlocksEditor.stories.tsx
import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import BlocksEditor from './BlocksEditor'
import BlockEditor from './BlockEditor'
import FormField from '../components/ui/FormField'
import { articleBlock, bookBlock, pageSchema, sampleSections } from '../lib/sample'
import type { FieldDefinition } from '../types'

const meta = { title: 'Editors/Blocks', component: BlocksEditor } satisfies Meta<typeof BlocksEditor>
export default meta
type Story = StoryObj<typeof meta>

const sectionsField = pageSchema.fields.find((f) => f.name === 'sections')!

function Demo({ field, initial }: { field: FieldDefinition; initial: unknown[] }) {
  const [value, setValue] = useState<unknown>(initial)
  const n = Array.isArray(value) ? value.length : 0
  const chip = n === 0 ? 'Empty' : (field.blocks?.length ?? 0) === 1 ? `List · ${n}` : `${n} block${n === 1 ? '' : 's'}`
  return (
    <div className="w-[780px]">
      <FormField field={field} chip={chip}>
        <BlocksEditor field={field} value={value} onChange={setValue} />
      </FormField>
    </div>
  )
}

export const Sections: Story = { args: { field: sectionsField, value: [], onChange: () => {} }, render: () => <Demo field={sectionsField} initial={sampleSections} /> }
export const EmptyPage: Story = { args: { field: sectionsField, value: [], onChange: () => {} }, render: () => <Demo field={sectionsField} initial={[]} /> }
export const Repeater: Story = {
  args: { field: sectionsField, value: [], onChange: () => {} },
  render: () => (
    <Demo
      field={{ name: 'items', type: 'blocks', label: 'Articles', blocks: [articleBlock] }}
      initial={[
        { _type: 'article', _id: 'ar1', title: "Ethnographic and Imperial Mapping: Miklouho-Maclay's New Guinea Placenames", link: 'https://doi.org/10.1080/00223344.2025' },
        { _type: 'article', _id: 'ar2', title: 'Русский бунт на острове Нуку-Хива', link: '' },
      ]}
    />
  ),
}

function GroupDemo() {
  const [value, setValue] = useState<unknown>({ title: 'Early accounts of Hood Bay and the Aroma people, 1875–1880', cover: '/uploads/hood.png', details: '<p>Canberra, 2014</p>' })
  const field: FieldDefinition = { name: 'featuredBook', type: 'block', label: 'Featured book', block: bookBlock }
  return (
    <div className="w-[780px]">
      <FormField field={field}>
        <BlockEditor field={field} value={value} onChange={setValue} />
      </FormField>
    </div>
  )
}
export const SingleGroup: Story = { args: { field: sectionsField, value: [], onChange: () => {} }, render: () => <GroupDemo /> }
