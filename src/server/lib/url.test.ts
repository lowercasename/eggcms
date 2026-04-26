// src/server/lib/url.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { toPublicUrl, transformHtmlImageUrls } from './url'

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

describe('transformHtmlImageUrls', () => {
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

  it('returns html unchanged when PUBLIC_URL not set', () => {
    const html = '<p>Hello</p><img src="/uploads/x.png">'
    expect(transformHtmlImageUrls(html)).toBe(html)
  })

  it('rewrites relative image src when PUBLIC_URL is set', () => {
    process.env.PUBLIC_URL = 'https://cms.example.com'
    expect(transformHtmlImageUrls('<img src="/uploads/x.png">')).toContain(
      'src="https://cms.example.com/uploads/x.png"',
    )
  })

  it('preserves Cyrillic characters as raw UTF-8 (does not encode entities)', () => {
    process.env.PUBLIC_URL = 'https://cms.example.com'
    const html = '<p>Д.и.н. Владимир Рафаилович Кабо</p>'
    const out = transformHtmlImageUrls(html)
    expect(out).toContain('Д.и.н. Владимир Рафаилович Кабо')
    expect(out).not.toMatch(/&#x[0-9a-f]+;/i)
  })

  it('round-trips Cyrillic content with internal links unchanged when no images present', () => {
    process.env.PUBLIC_URL = 'https://cms.example.com'
    const html =
      '<p>Сын <a data-content-ref="person:abc" href="#">Рафаила Кабо</a>.</p>'
    expect(transformHtmlImageUrls(html)).toBe(html)
  })
})
