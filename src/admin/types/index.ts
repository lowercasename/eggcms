// src/admin/types/index.ts

export interface BlockDefinition {
  name: string
  label: string
  fields: FieldDefinition[]
}

export interface FieldDefinition {
  name: string
  type: string
  label?: string
  required?: boolean
  default?: unknown
  placeholder?: string
  options?: string[]  // For select fields
  from?: string       // For slug fields (source field name)
  blocks?: BlockDefinition[]  // For blocks fields
}

/**
 * Convert camelCase or PascalCase to "Sentence case"
 * e.g., "siteTitle" -> "Site title", "firstName" -> "First name"
 */
export function fieldNameToLabel(name: string): string {
  return name
    .replace(/([A-Z])/g, ' $1')  // Add space before capitals
    .replace(/^./, (s) => s.toUpperCase())  // Capitalize first letter
    .trim()
    .toLowerCase()
    .replace(/^./, (s) => s.toUpperCase())  // Capitalize first letter again after lowercase
}

/**
 * Get the display label for a field (custom label or derived from name)
 */
export function getFieldLabel(field: FieldDefinition): string {
  return field.label || fieldNameToLabel(field.name)
}

export interface Schema {
  name: string
  label: string
  type: 'singleton' | 'collection'
  fields: FieldDefinition[]
  labelField?: string  // Field to use as display label in lists (defaults to 'title')
}
