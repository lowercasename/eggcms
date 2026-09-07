// src/admin/lib/media.ts
// Shared shape of a media library item and the little rules for describing one.
import { Image, FileText, Music, Video, File as FileIcon, type LucideIcon } from 'lucide-react'

export type MediaKind = 'image' | 'document' | 'audio' | 'video'

export interface MediaReference {
  schema: string
  schemaLabel: string
  /** Optional for older servers; a singleton is named in full ("Used in Site Settings"). */
  schemaType?: 'collection' | 'singleton'
  id: string
  label: string
}

export interface MediaItem {
  id: string
  filename: string
  path: string
  mimetype: string
  kind: MediaKind | null
  size: number
  created_at: string
  references?: MediaReference[]
}

export type MediaSort = 'newest' | 'oldest' | 'name'

export const KIND_LABELS: Record<MediaKind, string> = {
  image: 'Images',
  document: 'Documents',
  audio: 'Audio',
  video: 'Video',
}

export const KIND_ORDER: MediaKind[] = ['image', 'document', 'audio', 'video']

const KIND_ICONS: Record<MediaKind, LucideIcon> = {
  image: Image,
  document: FileText,
  audio: Music,
  video: Video,
}

export function iconForKind(kind: MediaKind | null): LucideIcon {
  return (kind && KIND_ICONS[kind]) || FileIcon
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

/** "JPG", "PDF" – from the file name, or the mime subtype if there is no extension. */
export function extensionOf(item: Pick<MediaItem, 'filename' | 'mimetype'>): string {
  const dot = item.filename.lastIndexOf('.')
  if (dot > 0 && dot < item.filename.length - 1) return item.filename.slice(dot + 1).toUpperCase()
  return (item.mimetype.split('/')[1] || '').replace(/^x-/, '').toUpperCase()
}

/** Lower-case singular / plural of a schema label: "Pages" → "page" / "pages". */
function nounFor(label: string, count: number): string {
  const lower = label.toLowerCase()
  if (count === 1) return lower.endsWith('s') && !lower.endsWith('ss') ? lower.slice(0, -1) : lower
  return lower.endsWith('s') ? lower : `${lower}s`
}

/**
 * The usage line on a media card: "Used on 2 pages", "Used in Site Settings",
 * "Used in 3 places", or "Not used yet".
 */
export function describeUsage(refs: MediaReference[] | undefined): { text: string; used: boolean } {
  if (!refs || refs.length === 0) return { text: 'Not used yet', used: false }
  const schemas = new Set(refs.map((r) => r.schema))
  if (schemas.size === 1) {
    const first = refs[0]
    // A singleton has one row, so its label is its name: "Used in Site Settings".
    const singleton = first.schemaType ? first.schemaType === 'singleton' : first.id === first.schema
    if (refs.length === 1 && singleton) return { text: `Used in ${first.schemaLabel}`, used: true }
    return { text: `Used on ${refs.length} ${nounFor(first.schemaLabel, refs.length)}`, used: true }
  }
  return { text: `Used in ${refs.length} places`, used: true }
}

/** The kind a file will be filed under, judged from its browser-reported type and name. */
export function kindOfFile(file: File): MediaKind {
  const type = file.type || ''
  if (type.startsWith('image/')) return 'image'
  if (type.startsWith('audio/')) return 'audio'
  if (type.startsWith('video/')) return 'video'
  const ext = file.name.toLowerCase().split('.').pop() || ''
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif'].includes(ext)) return 'image'
  if (['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'].includes(ext)) return 'audio'
  if (['mp4', 'webm', 'mov', 'm4v'].includes(ext)) return 'video'
  return 'document'
}

/** "only images", "only documents or audio" – what a field will take. */
export function describeKinds(kinds: MediaKind[]): string {
  const words = kinds.map((k) => KIND_LABELS[k].toLowerCase())
  if (words.length === 1) return `only ${words[0]}`
  return `only ${words.slice(0, -1).join(', ')} or ${words[words.length - 1]}`
}

const KIND_NOUN: Record<MediaKind, string> = { image: 'an image', document: 'a document', audio: 'an audio file', video: 'a video' }

/** Splits dropped files into those a field takes and those it must refuse, with a sentence for each refusal. */
export function rejectWrongKinds(files: File[], kinds: MediaKind[]): { accepted: File[]; refused: Array<{ name: string; message: string }> } {
  const accepted: File[] = []
  const refused: Array<{ name: string; message: string }> = []
  for (const file of files) {
    const kind = kindOfFile(file)
    if (kinds.includes(kind)) accepted.push(file)
    else refused.push({ name: file.name, message: `This is ${KIND_NOUN[kind]}; this field takes ${describeKinds(kinds)}.` })
  }
  return { accepted, refused }
}

export function sortMedia(items: MediaItem[], sort: MediaSort): MediaItem[] {
  const copy = [...items]
  switch (sort) {
    case 'oldest':
      return copy.sort((a, b) => (a.created_at ?? '').localeCompare(b.created_at ?? ''))
    case 'name':
      return copy.sort((a, b) => a.filename.localeCompare(b.filename, undefined, { sensitivity: 'base' }))
    default:
      return copy.sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
  }
}
