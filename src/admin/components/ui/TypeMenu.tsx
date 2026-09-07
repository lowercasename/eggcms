// src/admin/components/ui/TypeMenu.tsx
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

export interface TypeMenuOption<T extends string = string> {
  value: T
  label: string
  description?: string
  icon?: ReactNode
}

interface TypeMenuProps<T extends string> {
  heading: string
  options: TypeMenuOption<T>[]
  onSelect: (value: T) => void
  onClose: () => void
  className?: string
}

/** The "which kind of section?" chooser: one row per type, name and one line of help. */
export default function TypeMenu<T extends string>({ heading, options, onSelect, onClose, className = '' }: TypeMenuProps<T>) {
  const ref = useRef<HTMLDivElement>(null)
  const headingId = useId()
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  // Once, on mount: focus the first choice so keyboard users land inside the
  // menu, and close on Escape. onClose is read through a ref so a parent
  // re-render never re-steals focus.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current()
    }
    document.addEventListener('keydown', onKey)
    ref.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div
      ref={ref}
      className={`w-full max-w-[420px] bg-panel border-[1.5px] border-ink rounded-menu shadow-menu p-2 animate-menu-in origin-top ${className}`}
    >
      <div className="flex items-center gap-2 px-2.5 pt-1.5 pb-2">
        <span id={headingId} className="flex-1 text-[14px] font-bold text-ink-2">
          {heading}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="w-[30px] h-[30px] rounded-[6px] flex items-center justify-center text-ink-nav hover:bg-page"
        >
          <X className="w-4 h-4" aria-hidden />
        </button>
      </div>
      <div role="menu" aria-labelledby={headingId}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="menuitem"
          onClick={() => onSelect(opt.value)}
          className="w-full flex items-center gap-3 p-2.5 rounded-control text-left hover:bg-structure-tint focus-visible:bg-structure-tint focus-visible:outline-offset-[-3px]"
        >
          <span className="w-[34px] h-[34px] shrink-0 rounded-control bg-structure-tint border border-structure-border flex items-center justify-center text-structure [&_svg]:w-[18px] [&_svg]:h-[18px]">
            {opt.icon}
          </span>
          <span className="flex flex-col min-w-0">
            <span className="text-[15px] font-bold text-ink leading-tight">{opt.label}</span>
            {opt.description && <span className="text-[14px] text-ink-2 leading-snug">{opt.description}</span>}
          </span>
        </button>
      ))}
      </div>
    </div>
  )
}
