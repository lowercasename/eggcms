// src/lib/media.ts
// The media vocabulary shared by the server and the admin: what kinds of file
// exist, and the shape a library item and a usage reference take on the wire.

export const MEDIA_KINDS = ['image', 'document', 'audio', 'video'] as const
export type MediaKind = (typeof MEDIA_KINDS)[number]

export function isMediaKind(value: unknown): value is MediaKind {
  return typeof value === 'string' && (MEDIA_KINDS as readonly string[]).includes(value)
}

/** One content item that uses a media file. */
export interface MediaReference {
  schema: string
  schemaLabel: string
  schemaType: 'collection' | 'singleton'
  id: string
  label: string
}

/** A media library item as GET /api/media returns it. */
export interface MediaItemResponse {
  id: string
  filename: string
  path: string
  mimetype: string
  kind: MediaKind | null
  size: number
  width?: number | null
  height?: number | null
  created_at: string
  /** Present for signed-in users only. */
  references?: MediaReference[]
}
