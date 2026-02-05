// src/admin/types/index.ts

export interface FieldDefinition {
  name: string
  type: string
  required?: boolean
  default?: unknown
  placeholder?: string
}

export interface Schema {
  name: string
  label: string
  type: 'singleton' | 'collection'
  fields: FieldDefinition[]
}
