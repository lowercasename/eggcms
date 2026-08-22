// src/server/lib/mediaTypes.ts
//
// The single source of truth for what the media library accepts and how each
// file is classified. Uploads are served from the same origin as the admin, so
// this is an allowlist rather than a denylist: anything not named here is
// refused.

export type MediaKind = 'image' | 'document' | 'audio' | 'video'

export const ALLOWED_MIME_TYPES: Record<string, MediaKind> = {
  // Images
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/gif': 'image',
  'image/webp': 'image',
  'image/avif': 'image',
  'image/svg+xml': 'image',

  // Documents
  'application/pdf': 'document',
  'application/epub+zip': 'document',
  'application/msword': 'document',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document',
  'application/vnd.oasis.opendocument.text': 'document',
  'application/vnd.ms-excel': 'document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'document',
  'application/rtf': 'document',
  'text/plain': 'document',
  'text/csv': 'document',

  // Audio
  'audio/mpeg': 'audio',
  'audio/mp4': 'audio',
  'audio/ogg': 'audio',
  'audio/wav': 'audio',
  'audio/x-wav': 'audio',
  'audio/flac': 'audio',

  // Video
  'video/mp4': 'video',
  'video/webm': 'video',
  'video/quicktime': 'video',
}

/** Extension fallbacks for browsers that send no type, or octet-stream. */
const EXTENSION_MIME_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  avif: 'image/avif',
  svg: 'image/svg+xml',
  pdf: 'application/pdf',
  epub: 'application/epub+zip',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  odt: 'application/vnd.oasis.opendocument.text',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  rtf: 'application/rtf',
  txt: 'text/plain',
  csv: 'text/csv',
  mp3: 'audio/mpeg',
  m4a: 'audio/mp4',
  ogg: 'audio/ogg',
  wav: 'audio/wav',
  flac: 'audio/flac',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
}

/** A generic type tells us nothing, so fall back to the file extension. */
const GENERIC_MIME_TYPES = ['', 'application/octet-stream', 'binary/octet-stream']

export function kindForMimeType(mimetype: string): MediaKind | null {
  return ALLOWED_MIME_TYPES[mimetype] ?? null
}

export function isAllowedMimeType(mimetype: string): boolean {
  return mimetype in ALLOWED_MIME_TYPES
}

/**
 * Work out the real type of an upload. Browsers are inconsistent: Safari and
 * some Windows browsers report `application/octet-stream` for PDFs and epubs,
 * which would otherwise be refused.
 */
export function resolveMimeType(reported: string | undefined, filename: string): string {
  const type = (reported ?? '').toLowerCase()
  if (!GENERIC_MIME_TYPES.includes(type)) return type

  const ext = filename.includes('.') ? filename.split('.').pop()!.toLowerCase() : ''
  return EXTENSION_MIME_TYPES[ext] ?? type
}

const DEFAULT_MAX_UPLOAD_MB = 100

/** Upload ceiling in bytes, from MAX_UPLOAD_MB. */
export function maxUploadBytes(env: Record<string, string | undefined> = process.env): number {
  const raw = Number(env.MAX_UPLOAD_MB)
  const mb = Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_MAX_UPLOAD_MB
  return mb * 1024 * 1024
}

/** Human-readable file size, shared by the API error messages and the admin UI. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}
