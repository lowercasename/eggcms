// src/admin/editors/Editors.stories.tsx
import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import FormField from '../components/ui/FormField'
import Card from '../components/ui/Card'
import { EntryProvider } from '../contexts/EntryContext'
import type { FieldDefinition } from '../types'
import type { EditorComponent } from './types'
import StringEditor from './StringEditor'
import SlugEditor from './SlugEditor'
import NumberEditor from './NumberEditor'
import BooleanEditor from './BooleanEditor'
import SelectEditor from './SelectEditor'
import DatetimeEditor from './DatetimeEditor'
import TextEditor from './TextEditor'
import LinkFieldEditor from './LinkFieldEditor'
import ImageEditor from './ImageEditor'
import FileEditor from './FileEditor'

const meta = { title: 'Editors/Scalar and media' } satisfies Meta
export default meta
type Story = StoryObj

function Field({ Editor, field, initial, formData }: { Editor: EditorComponent; field: FieldDefinition; initial?: unknown; formData?: Record<string, unknown> }) {
  const [value, setValue] = useState<unknown>(initial)
  return (
    <FormField field={field}>
      <Editor field={field} value={value} onChange={setValue} formData={{ ...formData, [field.name]: value }} />
    </FormField>
  )
}

export const ScalarRows: Story = {
  render: () => (
    <Card divided className="w-[780px]">
      <Field Editor={StringEditor} field={{ name: 'title', type: 'string', required: true }} initial="South Pacific" />
      <Field Editor={SlugEditor} field={{ name: 'slug', type: 'slug', from: 'title' }} initial="south-pacific" formData={{ title: 'South Pacific' }} />
      <Field Editor={StringEditor} field={{ name: 'subtitle', type: 'string', placeholder: 'Optional' }} initial="Russians and the South Pacific" />
      <Field Editor={NumberEditor} field={{ name: 'menuOrder', type: 'number', label: 'Order in the menu' }} initial={3} />
      <Field Editor={BooleanEditor} field={{ name: 'isFrontPage', type: 'boolean', label: 'This is the front page' }} initial={false} />
      <Field Editor={SelectEditor} field={{ name: 'size', type: 'select', options: ['small', 'medium', 'large', 'full'] }} initial="medium" />
      <Field Editor={DatetimeEditor} field={{ name: 'publishedAt', type: 'datetime' }} initial="2026-08-22T09:00:00.000Z" />
      <Field Editor={LinkFieldEditor} field={{ name: 'cta', type: 'link', label: 'Read more link' }} initial={{ type: 'external', url: 'https://doi.org/10.1080/00223344.2025' }} />
      <Field Editor={LinkFieldEditor} field={{ name: 'cta2', type: 'link', label: 'Empty link' }} initial={null} />
    </Card>
  ),
}

export const SlugOnNewEntry: Story = {
  render: () => (
    <EntryProvider value={{ isNew: true }}>
      <Card divided className="w-[780px]">
        <Field Editor={SlugEditor} field={{ name: 'slug', type: 'slug', from: 'title' }} initial="" formData={{ title: '' }} />
        <Field Editor={SlugEditor} field={{ name: 'slug2', type: 'slug', from: 'title', label: 'Slug (title typed)' }} initial="" formData={{ title: 'South Pacific' }} />
      </Card>
    </EntryProvider>
  ),
}

export const TallFields: Story = {
  render: () => (
    <div className="w-[780px] flex flex-col gap-[22px]">
      <Field Editor={TextEditor} field={{ name: 'bio', type: 'text' }} initial="A few lines of plain text, without formatting." />
      <Field Editor={ImageEditor} field={{ name: 'cover', type: 'image', label: 'Cover image' }} initial="/uploads/nuku-hiva.png" />
      <Field Editor={ImageEditor} field={{ name: 'cover2', type: 'image', label: 'Cover image (empty)' }} initial={null} />
      <Field Editor={FileEditor} field={{ name: 'pdf', type: 'file', label: 'Documents' }} initial="/uploads/hood-bay-documents.pdf" />
      <Field Editor={FileEditor} field={{ name: 'pdf2', type: 'file', label: 'Documents (empty)' }} initial={null} />
    </div>
  ),
}
