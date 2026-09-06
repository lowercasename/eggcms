// src/admin/lib/words.test.ts
import { describe, it, expect } from 'vitest'
import { singularize, entryNoun, plural } from './words'

describe('singularize', () => {
  it('handles single words', () => {
    expect(singularize('Pages')).toBe('Page')
    expect(singularize('Address')).toBe('Address')
    expect(singularize('People')).toBe('Person')
  })
  it('singularises the last word of a multi-word label', () => {
    expect(singularize('Blog Posts')).toBe('Blog Post')
    expect(singularize('Team Members')).toBe('Team Member')
    expect(singularize('Article list')).toBe('Article list')
  })
})

describe('entryNoun and plural', () => {
  it('gives the prose noun for one entry and pluralises it back', () => {
    expect(entryNoun('Blog Posts')).toBe('blog post')
    expect(plural('blog post', 3)).toBe('blog posts')
    expect(plural('blog post', 1)).toBe('blog post')
  })
})
