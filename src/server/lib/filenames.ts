// src/server/lib/filenames.ts
import path from 'path'
import { randomBytes } from 'crypto'
import { slugify } from '../../lib/slugify'

/** Longest stored name, including the extension. */
const MAX_LENGTH = 100

/** Tries before giving up on a tidy name and appending something random. */
const MAX_ATTEMPTS = 50

/** Slug with dots and underscores folded into hyphens, so URLs read evenly. */
function tidy(text: string): string {
  return slugify(text)
    .replace(/[._]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * The name an upload is stored under.
 *
 * Uploads used to be stored as a UUID, which made every public URL unreadable:
 * a paper cited as /uploads/8d966bc5-….pdf tells a reader nothing, and cannot
 * be typed or checked by eye. This keeps a slugified version of the name the
 * file arrived with, which for a site of scanned papers is most of the value.
 *
 * `exists` is asked whether a candidate name is already in use; a number is
 * appended until it is not.
 */
export function storageFilename(originalName: string, exists: (name: string) => boolean): string {
  // basename first: a name like "../../etc/passwd" must not escape anywhere.
  const base = path.basename(originalName || '')
  const rawExt = path.extname(base)

  const ext = /^\.[A-Za-z0-9]{1,8}$/.test(rawExt) ? rawExt.toLowerCase() : ''
  const stem = ext ? base.slice(0, -ext.length) : base

  const slug = tidy(stem) || 'file'
  const trimmed = slug.slice(0, MAX_LENGTH - ext.length - 10).replace(/-+$/, '') || 'file'

  const candidate = `${trimmed}${ext}`
  if (!exists(candidate)) return candidate

  for (let n = 2; n < MAX_ATTEMPTS; n++) {
    const next = `${trimmed}-${n}${ext}`
    if (!exists(next)) return next
  }

  return `${trimmed}-${randomBytes(4).toString('hex')}${ext}`
}
