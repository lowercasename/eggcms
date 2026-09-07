// src/admin/types/index.ts
// The admin reads the same wire types the server writes; see src/lib/schema.ts.
export type { PublicField as FieldDefinition, PublicBlock as BlockDefinition, PublicSchema as Schema, FieldType, RichtextToolbar } from '../../lib/schema'
export { fieldNameToLabel, getFieldLabel, FIELD_TYPES } from '../../lib/schema'
