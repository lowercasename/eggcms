// src/admin/components/ui/InsertDivider.tsx
import { Plus } from 'lucide-react'

interface InsertDividerProps {
  onClick: () => void
  label: string
  /** The menu below this divider is open. */
  active?: boolean
}

/** A 30px-tall rule with a persistent round "+" in the middle. */
export default function InsertDivider({ onClick, label, active }: InsertDividerProps) {
  const line = active ? 'bg-structure' : 'bg-line-hair'
  return (
    <div className="flex items-center gap-2.5 h-[30px]">
      <div className={`flex-1 h-[2px] transition-colors duration-150 ${line}`} />
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        aria-expanded={!!active}
        className={[
          'w-[30px] h-[30px] rounded-full border-[1.5px] flex items-center justify-center',
          'transition-colors duration-150',
          active
            ? 'bg-structure border-structure text-white'
            : 'bg-panel border-structure-border text-structure hover:bg-structure hover:border-structure hover:text-white',
        ].join(' ')}
      >
        <Plus className="w-4 h-4" aria-hidden />
      </button>
      <div className={`flex-1 h-[2px] transition-colors duration-150 ${line}`} />
    </div>
  )
}
