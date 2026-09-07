// src/admin/components/EntryHeader.tsx
import { type ReactNode } from 'react'
import { Chip, type OverflowItem, OverflowMenu } from './ui'

interface EntryHeaderProps {
  title: string
  /** Shown in italics as a stand-in when there is no title yet. */
  untitled?: boolean
  status: 'published' | 'edited' | 'draft' | null
  actions?: ReactNode
  menu?: OverflowItem[]
}

/** The editor's top bar: title, status chip, and the rarer actions on the right. */
export default function EntryHeader({ title, untitled, status, actions, menu }: EntryHeaderProps) {
  return (
    <div className="flex items-center gap-3.5 px-6 py-3.5 bg-panel border-b border-line-strong">
      <h1 className={`m-0 text-[19px] font-bold truncate ${untitled ? 'italic text-ink-2' : 'text-ink'}`}>{title}</h1>
      {status && <Chip variant={status} />}
      <div className="flex-1" />
      {actions}
      {menu && menu.length > 0 && <OverflowMenu items={menu} />}
    </div>
  )
}
