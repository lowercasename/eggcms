// src/admin/editors/MoveButtons.tsx
import { ArrowUp, ArrowDown } from 'lucide-react'
import { Button } from '../components/ui'

interface MoveButtonsProps {
  index: number
  total: number
  onMove: (delta: -1 | 1) => void
}

/**
 * The ↑/↓ pair on a reorderable row, greyed out at the ends of the list. The
 * clicks stop here: a row header is itself clickable.
 */
export default function MoveButtons({ index, total, onMove }: MoveButtonsProps) {
  const disabled = 'disabled:opacity-40 disabled:bg-panel disabled:border-line-strong'
  return (
    <>
      <Button
        variant="icon"
        size="sm"
        aria-label="Move up"
        disabled={index === 0}
        onClick={(e) => {
          e.stopPropagation()
          onMove(-1)
        }}
        className={disabled}
      >
        <ArrowUp aria-hidden />
      </Button>
      <Button
        variant="icon"
        size="sm"
        aria-label="Move down"
        disabled={index === total - 1}
        onClick={(e) => {
          e.stopPropagation()
          onMove(1)
        }}
        className={disabled}
      >
        <ArrowDown aria-hidden />
      </Button>
    </>
  )
}
