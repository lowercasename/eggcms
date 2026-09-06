// src/admin/components/ui/EmptyState.tsx
import { type ReactNode } from 'react'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description?: ReactNode
  action?: ReactNode
  /** Dashed drop-zone framing (media, blocks). */
  dashed?: 'strong' | 'structure'
  className?: string
}

/** Names the situation in plain words and carries the one action that resolves it. */
export default function EmptyState({ icon, title, description, action, dashed, className = '' }: EmptyStateProps) {
  const frame =
    dashed === 'strong'
      ? 'border-[2.5px] border-dashed border-line-input rounded-menu'
      : dashed === 'structure'
        ? 'border-[2.5px] border-dashed border-structure-border rounded-panel bg-panel'
        : ''
  return (
    <div className={`flex flex-col items-center text-center gap-2 px-6 py-8 ${frame} ${className}`}>
      <span
        className={`[&_svg]:w-7 [&_svg]:h-7 ${dashed === 'structure' ? 'text-structure' : 'text-ink-2'}`}
        aria-hidden
      >
        {icon}
      </span>
      <h2 className="text-[16px] font-bold text-ink m-0">{title}</h2>
      {description && <p className="text-[15px] text-ink-2 m-0 max-w-[52ch] text-pretty">{description}</p>}
      {action && <div className="mt-2.5 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  )
}
