// src/admin/editors/types.ts
import type { ComponentType } from 'react'
import type { FieldDefinition, FieldType } from '../types'

/** Every field editor takes the same props, so the layout never has to know the type. */
export interface EditorProps {
  field: FieldDefinition
  value: unknown
  onChange: (v: unknown) => void
  /** The whole record the field belongs to (a slug reads its source field from here). */
  formData?: Record<string, unknown>
  /** Focus the control on mount. */
  autoFocus?: boolean
}

export type EditorComponent = ComponentType<EditorProps>
/** One editor per field type; the compiler refuses a missing entry. */
export type EditorMap = Record<FieldType, EditorComponent>
