// src/admin/lib/entries.ts

/** The schema fields of a record, without the `_meta` envelope the API wraps its system fields in. */
export function fieldsOf(record: Record<string, unknown>): Record<string, unknown> {
  const { _meta, ...fields } = record
  return fields
}
