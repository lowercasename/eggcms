// src/admin/components/ui/FieldRow.tsx
import { type ReactNode } from 'react'

interface FieldRowProps {
  id: string
  label: string
  required?: boolean
  hint?: ReactNode
  hintId?: string
  /** Width of the label column in px: 180 at the top level, 140 inside blocks. */
  labelWidth?: number
  /** The one row the person should look at first (a new entry's title). */
  highlight?: boolean
  children: ReactNode
}

/**
 * Scalar layout: label in a fixed left column, control filling the rest.
 * Consecutive rows live inside one card and are separated by a hairline.
 */
export default function FieldRow({ id, label, required, hint, hintId, labelWidth = 180, highlight, children }: FieldRowProps) {
  return (
    <div
      data-testid="field-row"
      data-layout="row"
      data-highlight={highlight || undefined}
      className={`flex items-start gap-4 px-4 py-3.5 min-h-[48px] ${highlight ? 'bg-action-tint' : ''}`}
    >
      <label
        htmlFor={id}
        style={{ width: labelWidth, flex: `0 0 ${labelWidth}px` }}
        className={`pt-[11px] text-[15px] leading-snug ${highlight ? 'font-bold text-action-text' : 'font-semibold text-ink'}`}
      >
        {label}
        {required && (
          <span className="text-action ml-1" aria-hidden>
            *
          </span>
        )}
      </label>
      <div className="flex-1 min-w-0 flex flex-col gap-[7px]">
        {children}
        {hint && (
          <p id={hintId} className="m-0 text-[14px] text-ink-2">
            {hint}
          </p>
        )}
      </div>
    </div>
  )
}
