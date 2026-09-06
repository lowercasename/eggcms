// src/admin/components/ui/OverflowMenu.tsx
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { MoreHorizontal } from 'lucide-react'

export interface OverflowItem {
  label: string
  icon?: ReactNode
  onSelect: () => void
  destructive?: boolean
}

interface OverflowMenuProps {
  items: OverflowItem[]
  label?: string
}

/** A "…" button that opens a short list of rarer actions (delete, unpublish). */
export default function OverflowMenu({ items, label = 'More actions' }: OverflowMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="w-[38px] h-[38px] rounded-control border-[1.5px] border-line-input bg-panel text-ink-nav flex items-center justify-center hover:bg-page"
      >
        <MoreHorizontal className="w-[18px] h-[18px]" aria-hidden />
      </button>
      {open && (
        <div
          role="menu"
          aria-label={label}
          className="absolute right-0 top-[calc(100%+6px)] z-30 min-w-[220px] bg-panel border-[1.5px] border-ink rounded-menu shadow-menu p-1.5 animate-menu-in origin-top-right"
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                item.onSelect()
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-control text-left text-[15px] font-semibold hover:bg-page [&_svg]:w-[17px] [&_svg]:h-[17px] ${
                item.destructive ? 'text-danger-text' : 'text-ink'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
