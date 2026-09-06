// src/admin/components/ui/Chip.tsx
import { type ReactNode } from 'react'
import { Check, CircleDot, CircleDashed } from 'lucide-react'

export type ChipVariant = 'published' | 'edited' | 'draft' | 'type'

interface ChipProps {
  variant: ChipVariant
  /** Type chips take arbitrary content; status chips default to their word. */
  children?: ReactNode
  icon?: ReactNode
  className?: string
}

const status: Record<Exclude<ChipVariant, 'type'>, { word: string; Icon: typeof Check; classes: string }> = {
  published: {
    word: 'Published',
    Icon: Check,
    classes: 'bg-published-tint text-published border-published-border',
  },
  edited: {
    word: 'Edited',
    Icon: CircleDot,
    classes: 'bg-draft-tint text-draft border-draft-border',
  },
  draft: {
    word: 'Draft',
    Icon: CircleDashed,
    classes: 'bg-draft-tint text-draft border-draft-border',
  },
}

/**
 * A small labelled pill. Status chips (published / edited / draft) always show
 * an icon and a word, so the state survives greyscale and colour-blindness.
 * Type chips (slate) name what a field holds: "Rich text", "12 blocks".
 */
export default function Chip({ variant, children, icon, className = '' }: ChipProps) {
  const base =
    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-chip border text-[13px] font-bold leading-tight whitespace-nowrap [&_svg]:w-3.5 [&_svg]:h-3.5'

  if (variant === 'type') {
    return (
      <span className={`${base} bg-structure-tint text-structure border-structure-border ${className}`}>
        {icon}
        {children}
      </span>
    )
  }

  const { word, Icon, classes } = status[variant]
  return (
    <span className={`${base} ${classes} ${className}`}>
      {icon ?? <Icon aria-hidden />}
      {children ?? word}
    </span>
  )
}
