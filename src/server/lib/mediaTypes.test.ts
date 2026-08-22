// @vitest-environment node
import { describe, it, expect } from 'vitest'
import {
  ALLOWED_MIME_TYPES,
  isAllowedMimeType,
  kindForMimeType,
  resolveMimeType,
  maxUploadBytes,
} from './mediaTypes'

describe('kindForMimeType', () => {
  it('classifies images', () => {
    expect(kindForMimeType('image/jpeg')).toBe('image')
    expect(kindForMimeType('image/svg+xml')).toBe('image')
  })

  it('classifies PDFs as documents', () => {
    expect(kindForMimeType('application/pdf')).toBe('document')
  })

  it('classifies audio and video', () => {
    expect(kindForMimeType('audio/mpeg')).toBe('audio')
    expect(kindForMimeType('video/mp4')).toBe('video')
  })

  it('returns null for types that are not allowed', () => {
    expect(kindForMimeType('application/x-msdownload')).toBeNull()
    expect(kindForMimeType('')).toBeNull()
  })
})

describe('isAllowedMimeType', () => {
  it('accepts every type in the allowlist', () => {
    for (const type of Object.keys(ALLOWED_MIME_TYPES)) {
      expect(isAllowedMimeType(type)).toBe(true)
    }
  })

  it('rejects executables and unknown types', () => {
    expect(isAllowedMimeType('application/x-msdownload')).toBe(false)
    expect(isAllowedMimeType('application/x-sh')).toBe(false)
  })
})

describe('resolveMimeType', () => {
  it('trusts a usable type from the browser', () => {
    expect(resolveMimeType('application/pdf', 'essay.pdf')).toBe('application/pdf')
  })

  it('falls back to the extension when the browser sends a generic type', () => {
    // Safari and some Windows browsers send octet-stream for PDFs and epubs.
    expect(resolveMimeType('application/octet-stream', 'essay.pdf')).toBe('application/pdf')
    expect(resolveMimeType('', 'book.epub')).toBe('application/epub+zip')
    expect(resolveMimeType(undefined, 'talk.mp3')).toBe('audio/mpeg')
  })

  it('is case insensitive about extensions', () => {
    expect(resolveMimeType('', 'SCAN.PDF')).toBe('application/pdf')
  })

  it('returns the original type when the extension is unknown', () => {
    expect(resolveMimeType('application/octet-stream', 'archive.xyz')).toBe(
      'application/octet-stream'
    )
  })

  it('returns an empty string when there is nothing to go on', () => {
    expect(resolveMimeType('', 'noextension')).toBe('')
  })
})

describe('maxUploadBytes', () => {
  it('defaults to 100 MB', () => {
    expect(maxUploadBytes({})).toBe(100 * 1024 * 1024)
  })

  it('reads MAX_UPLOAD_MB from the environment', () => {
    expect(maxUploadBytes({ MAX_UPLOAD_MB: '250' })).toBe(250 * 1024 * 1024)
  })

  it('ignores a value that is not a positive number', () => {
    expect(maxUploadBytes({ MAX_UPLOAD_MB: 'lots' })).toBe(100 * 1024 * 1024)
    expect(maxUploadBytes({ MAX_UPLOAD_MB: '0' })).toBe(100 * 1024 * 1024)
    expect(maxUploadBytes({ MAX_UPLOAD_MB: '-5' })).toBe(100 * 1024 * 1024)
  })
})
