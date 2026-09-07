// src/admin/components/ui/FieldBlock.tsx
import { useState, type ReactNode } from 'react'
import { FieldActionsSlotContext } from './FieldContext'

interface FieldBlockProps {
  id: string
  labelId?: string
  label: string
  required?: boolean
  chip?: ReactNode
  hint?: ReactNode
  hintId?: string
  children: ReactNode
}

/**
 * Tall layout: label above, control full width. The label row carries a type
 * chip ("Rich text", "12 blocks") and, on the right, whatever actions the
 * editor places with <FieldActions>.
 */
export default function FieldBlock({ id, labelId, label, required, chip, hint, hintId, children }: FieldBlockProps) {
  const [slot, setSlot] = useState<HTMLElement | null>(null)
  return (
    <div data-testid="field-block" data-layout="block">
      <div data-testid="field-label-row" className="flex items-center gap-2.5 mb-3 min-h-[34px]">
        <label id={labelId} htmlFor={id} className="text-[15px] font-semibold text-ink leading-snug">
          {label}
          {required && (
            <span className="text-action ml-1" aria-hidden>
              *
            </span>
          )}
        </label>
        {chip}
        <div className="flex-1" />
        <div ref={setSlot} className="flex items-center gap-2" />
      </div>
      <FieldActionsSlotContext.Provider value={slot}>{children}</FieldActionsSlotContext.Provider>
      {hint && (
        <p id={hintId} className="mt-2 mb-0 text-[14px] text-ink-2">
          {hint}
        </p>
      )}
    </div>
  )
}
