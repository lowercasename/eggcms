// src/admin/editors/RichtextEditor.stories.tsx
import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import RichtextEditor from './RichtextEditor'
import FormField from '../components/ui/FormField'
import { SectionProvider } from '../contexts/SectionContext'
import type { FieldDefinition } from '../types'

const meta = { title: 'Editors/Rich text', component: RichtextEditor } satisfies Meta<typeof RichtextEditor>
export default meta
type Story = StoryObj<typeof meta>

const body =
  '<h2>Media and talks</h2><p><a href="#">Знакомьтесь, ваш сосед Папуа-Новая Гвинея</a>: SBS Russian, 2024.</p><p><a href="#">The story of a Russian visit to Australia 200 years ago</a>: ABC Radio National.</p><ul><li>One thing</li><li>Another thing</li></ul>'

function Demo({ toolbar, initial, label }: { toolbar?: 'full' | 'minimal'; initial: string; label: string }) {
  const [value, setValue] = useState(initial)
  const field: FieldDefinition = { name: 'body', type: 'richtext', label, toolbar }
  return (
    <div className="w-[780px]">
      <SectionProvider value={{ typeLabel: 'Book', index: 2, total: 12 }}>
        <FormField field={field}>
          <RichtextEditor field={field} value={value} onChange={(v) => setValue(v as string)} />
        </FormField>
      </SectionProvider>
    </div>
  )
}

export const Full: Story = { args: { field: { name: 'body', type: 'richtext' }, value: '', onChange: () => {} }, render: () => <Demo initial={body} label="Text" /> }
export const Minimal: Story = {
  args: { field: { name: 'body', type: 'richtext' }, value: '', onChange: () => {} },
  render: () => <Demo toolbar="minimal" initial="<p>Canberra, Australian National University, 2014, 200 pp., ills. (with Chris Ballard)</p>" label="Publication details" />,
}
export const Empty: Story = { args: { field: { name: 'body', type: 'richtext' }, value: '', onChange: () => {} }, render: () => <Demo initial="" label="Text" /> }
