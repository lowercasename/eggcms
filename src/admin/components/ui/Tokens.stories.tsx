// src/admin/components/ui/Tokens.stories.tsx
import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = { title: 'Foundations/Tokens' } satisfies Meta
export default meta
type Story = StoryObj

const colours: Array<[string, string, string]> = [
  ['page', 'Page background', 'bg-page'],
  ['panel', 'Panel / card', 'bg-panel'],
  ['stripe', 'Row stripe', 'bg-stripe'],
  ['ink', 'Text primary', 'bg-ink'],
  ['ink-2', 'Text secondary (≥7:1)', 'bg-ink-2'],
  ['ink-3', 'Icons, dividers only', 'bg-ink-3'],
  ['line-strong', 'Panel border', 'bg-line-strong'],
  ['line-input', 'Input border 1.5px', 'bg-line-input'],
  ['line-hair', 'Row divider', 'bg-line-hair'],
  ['action', 'Action (terracotta)', 'bg-action'],
  ['action-text', 'Action text on tint', 'bg-action-text'],
  ['action-tint', 'Action tint', 'bg-action-tint'],
  ['structure', 'Structure (slate)', 'bg-structure'],
  ['structure-border', 'Structure border', 'bg-structure-border'],
  ['structure-tint', 'Structure tint', 'bg-structure-tint'],
  ['published', 'Published text', 'bg-published'],
  ['published-tint', 'Published tint', 'bg-published-tint'],
  ['published-border', 'Published border', 'bg-published-border'],
  ['draft', 'Draft text', 'bg-draft'],
  ['draft-2', 'Draft accent', 'bg-draft-2'],
  ['draft-tint', 'Draft tint', 'bg-draft-tint'],
  ['draft-border', 'Draft border', 'bg-draft-border'],
  ['danger', 'Destructive', 'bg-danger'],
  ['danger-text', 'Destructive text', 'bg-danger-text'],
]

export const Colours: Story = {
  render: () => (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
      {colours.map(([name, desc, cls]) => (
        <div key={name} className="bg-panel border border-line-strong rounded-block overflow-hidden">
          <div className={`h-14 ${cls}`} />
          <div className="px-3 py-2">
            <div className="font-mono text-[13px] text-ink">--color-{name}</div>
            <div className="text-[14px] text-ink-2">{desc}</div>
          </div>
        </div>
      ))}
    </div>
  ),
}

export const Type: Story = {
  render: () => (
    <div className="flex flex-col gap-4 max-w-[720px]">
      <p className="m-0 text-[19px] font-bold">Page title in header · 19px/700</p>
      <p className="m-0 text-[16px] font-bold">Entry list heading · 16px/700</p>
      <p className="m-0 text-[15px] font-semibold">Field label · 15px/600</p>
      <p className="m-0 text-[17px]">Input value · 17px/400 — what she reads and types is the largest text in the row</p>
      <p className="m-0 text-[14px] text-ink-2">Helper text · 14px ink-2</p>
      <p className="m-0 text-[15px] font-bold">Block header title · 15px/700</p>
      <p className="m-0 text-[13px] font-bold">Chip · 13px/700</p>
      <p className="m-0 font-mono text-[16px]">/slug-in-ibm-plex-mono · 16px</p>
      <p className="m-0 text-[18px] leading-[1.75] max-w-[68ch]">
        Rich text · 18px, line-height 1.75, max-width 68ch. Canberra, Australian National University, 2014, 200 pp., ills. (with Chris Ballard). Первые сообщения о жителях залива Худ и побережья Арома.
      </p>
      <p className="m-0 text-[14px] text-ink-2">Minimum anywhere: 14px. No uppercase-tracking labels.</p>
    </div>
  ),
}
