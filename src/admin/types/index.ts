// src/admin/types/index.ts

export interface FieldDefinition {
  name: string
  type: string
  required?: boolean
  default?: unknown
  placeholder?: string
  options?: string[]  // For select fields
  from?: string       // For slug fields (source field name)
}

export interface Schema {
  name: string
  label: string
  type: 'singleton' | 'collection'
  fields: FieldDefinition[]
}
