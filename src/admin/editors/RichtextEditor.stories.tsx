// src/admin/editors/RichtextEditor.stories.tsx
import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import RichtextEditor from './RichtextEditor'
import FormField from '../components/ui/FormField'
import { SectionProvider } from '../contexts/SectionContext'
import type { FieldDefinition } from '../types'

const meta = { title: 'Editors/Rich text', component: RichtextEditor } satisfies Meta<typeof RichtextEditor>
export default meta
type Story = StoryObj<typeof meta>

const body =
  '<h2>Media and talks</h2><p><a href="#">Знакомьтесь, ваш сосед Папуа-Новая Гвинея</a>: SBS Russian, 2024.</p><p><a href="#">The story of a Russian visit to Australia 200 years ago</a>: ABC Radio National.</p><ul><li>One thing</li><li>Another thing</li></ul>'

function Demo({ toolbar, initial, label, options }: { toolbar?: 'full' | 'minimal'; initial: string; label: string; options?: Partial<FieldDefinition> }) {
  const [value, setValue] = useState(initial)
  const field: FieldDefinition = { name: 'body', type: 'richtext', label, toolbar, ...options }
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

const essay =
  '<p class="epigraph">Что было, то и будет; и что делалось, то и будет делаться.<br><br>Еккл. 1:9</p>' +
  '<h2>The Arbat</h2><p>The Arbat spirit which Okudzhava<sup id="fnref:1"><a class="footnote-ref" href="#fn:1" data-footnote="a">1</a></sup> celebrated in song has gone.</p>' +
  '<h3>Moscow</h3><h4>Stoleshnikov Lane</h4><p>It is now a shout-filled bazaar<sup id="fnref:2"><a class="footnote-ref" href="#fn:2" data-footnote="b">2</a></sup>.</p>' +
  '<p class="signature">Канберра, 2003</p>' +
  '<ol class="footnotes"><li id="fn:1" data-footnote="a"><p>Bulat Okudzhava (1924-97): singer-poet known for his <em>chanson</em> style.</p></li>' +
  '<li id="fn:2" data-footnote="b"><p>An exultant “victors\' feast”.</p></li></ol>'

export const FootnotesAndStyles: Story = {
  args: { field: { name: 'body', type: 'richtext' }, value: '', onChange: () => {} },
  render: () => (
    <Demo
      initial={essay}
      label="Text"
      options={{
        headings: [2, 3, 4],
        footnotes: true,
        styles: [
          { name: 'epigraph', label: 'Epigraph' },
          { name: 'signature', label: 'Signature' },
        ],
      }}
    />
  ),
}

const longText = Array.from(
  { length: 40 },
  (_, i) => `<p>${i + 1}. Студенческие аттестаты обычно хранятся в деканате, но мой почему-то лежал у меня дома среди других бумаг.</p>`
).join('')

/** Text longer than the screen stays on the page in full screen. */
export const FullScreenLongText: Story = {
  args: { field: { name: 'body', type: 'richtext' }, value: '', onChange: () => {} },
  render: () => <Demo initial={longText} label="Text" />,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Full screen' }))
    const page = await within(document.body).findByTestId('writing-page')
    expect(page.scrollHeight).toBeLessThanOrEqual(page.clientHeight)
  },
}
