// src/admin/types/index.ts
export interface Schema {
  name: string
  label: string
  type: 'singleton' | 'collection'
}
