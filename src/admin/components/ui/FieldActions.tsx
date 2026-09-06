// src/admin/components/ui/FieldActions.tsx
import { useContext, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { FieldActionsSlotContext } from './FieldContext'

/**
 * Right-aligned actions for a tall field. Inside a FieldBlock they render in
 * the label row; on their own they render inline, so an editor looks the same
 * in tests and stories.
 */
export default function FieldActions({ children }: { children: ReactNode }) {
  const slot = useContext(FieldActionsSlotContext)
  if (slot === undefined) {
    return <div className="flex items-center justify-end gap-2 mb-2.5">{children}</div>
  }
  if (slot === null) return null
  return createPortal(children, slot)
}
