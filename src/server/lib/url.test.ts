// src/server/lib/url.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { toPublicUrl } from './url'

describe('toPublicUrl', () => {
  const originalEnv = process.env.PUBLIC_URL

  beforeEach(() => {
    delete process.env.PUBLIC_URL
  })

  afterEach(() => {
    if (originalEnv) {
      process.env.PUBLIC_URL = originalEnv
    } else {
      delete process.env.PUBLIC_URL
    }
  })

  it('returns path unchanged when PUBLIC_URL not set', () => {
    expect(toPublicUrl('/uploads/image.jpg')).toBe('/uploads/image.jpg')
  })

  it('prepends PUBLIC_URL to relative paths', () => {
    process.env.PUBLIC_URL = 'https://cms.example.com'
    expect(toPublicUrl('/uploads/image.jpg')).toBe('https://cms.example.com/uploads/image.jpg')
  })

  it('handles PUBLIC_URL with trailing slash', () => {
    process.env.PUBLIC_URL = 'https://cms.example.com/'
    expect(toPublicUrl('/uploads/image.jpg')).toBe('https://cms.example.com/uploads/image.jpg')
  })

  it('handles paths without leading slash', () => {
    process.env.PUBLIC_URL = 'https://cms.example.com'
    expect(toPublicUrl('uploads/image.jpg')).toBe('https://cms.example.com/uploads/image.jpg')
  })

  it('does not modify absolute http URLs', () => {
    process.env.PUBLIC_URL = 'https://cms.example.com'
    expect(toPublicUrl('http://other.com/image.jpg')).toBe('http://other.com/image.jpg')
  })

  it('does not modify absolute https URLs', () => {
    process.env.PUBLIC_URL = 'https://cms.example.com'
    expect(toPublicUrl('https://s3.amazonaws.com/bucket/image.jpg')).toBe('https://s3.amazonaws.com/bucket/image.jpg')
  })

  it('handles PUBLIC_URL with path prefix', () => {
    process.env.PUBLIC_URL = 'https://example.com/cms'
    expect(toPublicUrl('/uploads/image.jpg')).toBe('https://example.com/cms/uploads/image.jpg')
  })
})
