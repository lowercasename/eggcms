// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { storageFilename } from './filenames'

const never = () => false

describe('storageFilename', () => {
  it('keeps a readable version of the original name', () => {
    expect(storageFilename('Utkin.jpg', never)).toBe('utkin.jpg')
    expect(storageFilename('2021_Govor_Belarus.pdf', never)).toBe('2021-govor-belarus.pdf')
  })

  it('transliterates Cyrillic rather than dropping it', () => {
    expect(storageFilename('Мой брат.pdf', never)).toBe('moi-brat.pdf')
  })

  it('lowercases the extension', () => {
    expect(storageFilename('SCAN.PDF', never)).toBe('scan.pdf')
    expect(storageFilename('photo.JPEG', never)).toBe('photo.jpeg')
  })

  it('handles a name with no extension', () => {
    expect(storageFilename('README', never)).toBe('readme')
  })

  it('handles a name that is only an extension', () => {
    expect(storageFilename('.gitignore', never)).toBe('gitignore')
  })

  it('falls back when the name slugifies to nothing', () => {
    expect(storageFilename('???.png', never)).toBe('file.png')
    expect(storageFilename('', never)).toBe('file')
  })

  it('never lets a name escape the uploads directory', () => {
    expect(storageFilename('../../etc/passwd', never)).toBe('passwd')
    expect(storageFilename('/etc/shadow', never)).toBe('shadow')
    expect(storageFilename('a/b/c.png', never)).toBe('c.png')
  })

  it('truncates a very long name', () => {
    const name = `${'a'.repeat(300)}.pdf`
    const out = storageFilename(name, never)

    expect(out.endsWith('.pdf')).toBe(true)
    expect(out.length).toBeLessThanOrEqual(100)
  })

  it('adds a suffix when the name is taken', () => {
    const taken = new Set(['utkin.jpg'])
    expect(storageFilename('Utkin.jpg', (n) => taken.has(n))).toBe('utkin-2.jpg')
  })

  it('keeps counting past the first collision', () => {
    const taken = new Set(['utkin.jpg', 'utkin-2.jpg', 'utkin-3.jpg'])
    expect(storageFilename('Utkin.jpg', (n) => taken.has(n))).toBe('utkin-4.jpg')
  })

  it('suffixes an extensionless name too', () => {
    const taken = new Set(['readme'])
    expect(storageFilename('README', (n) => taken.has(n))).toBe('readme-2')
  })

  it('gives up on a readable name rather than looping forever', () => {
    // Pathological case: everything is taken. A random suffix ends it.
    const out = storageFilename('utkin.jpg', () => true)
    expect(out).toMatch(/^utkin-[a-z0-9]{8}\.jpg$/)
  })
})
