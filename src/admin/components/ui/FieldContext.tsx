// src/admin/components/ui/FieldContext.tsx
import { createContext, useContext } from 'react'

export interface FieldControl {
  /** id for the primary control, so the label points at it. */
  id: string
  required: boolean
  /** id of the helper text, for aria-describedby. */
  hintId?: string
  /** id of the label element, for editors that are a group rather than one control. */
  labelId?: string
}

const FieldControlContext = createContext<FieldControl | null>(null)

export const FieldControlProvider = FieldControlContext.Provider

/** Editors read this to wire their control to the surrounding label and hint. */
export function useFieldControl(): Partial<FieldControl> {
  return useContext(FieldControlContext) ?? {}
}

/**
 * The element in a tall field's label row where an editor may put actions
 * ("Full screen", "Collapse all"). `undefined` means there is no wrapper at
 * all; `null` means the wrapper has not mounted its slot yet.
 */
export const FieldActionsSlotContext = createContext<HTMLElement | null | undefined>(undefined)
