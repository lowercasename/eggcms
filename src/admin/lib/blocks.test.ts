// src/admin/lib/blocks.test.ts
import { describe, it, expect } from 'vitest'
import { getBlockPreview, getBlockThumbnail, describeBlockType, makeBlock, iconForBlock, normalizeBlocks, singularize, indefinite } from './blocks'
import type { BlockDefinition } from '../types'

const heading: BlockDefinition = { name: 'heading', label: 'Heading', fields: [{ name: 'text', type: 'string' }] }
const text: BlockDefinition = { name: 'text', label: 'Text', fields: [{ name: 'body', type: 'richtext' }] }
const book: BlockDefinition = {
  name: 'book',
  label: 'Book',
  fields: [
    { name: 'title', type: 'string' },
    { name: 'otherTitle', type: 'string', label: 'Other language' },
    { name: 'cover', type: 'image' },
    { name: 'details', type: 'richtext' },
  ],
}
const article: BlockDefinition = { name: 'article', label: 'Article', fields: [{ name: 'title', type: 'string' }, { name: 'link', type: 'string' }] }
const articles: BlockDefinition = { name: 'articles', label: 'Article list', fields: [{ name: 'items', type: 'blocks', blocks: [article] }] }

describe('getBlockPreview: first non-empty text-like field, in schema order', () => {
  it('uses a string field', () => {
    expect(getBlockPreview({ _type: 'heading', _id: '1', text: 'Books by Elena Govor' }, heading)).toBe('Books by Elena Govor')
  })
  it('strips HTML from rich text', () => {
    expect(getBlockPreview({ _type: 'text', _id: '1', body: '<h2>Media</h2><p>SBS &amp; ABC&nbsp;Radio</p>' }, text)).toBe('Media SBS & ABC Radio')
  })
  it('skips empty fields and non-text fields', () => {
    expect(getBlockPreview({ _type: 'book', _id: '1', title: '  ', otherTitle: 'Двенадцать дней', cover: '/uploads/x.jpg' }, book)).toBe('Двенадцать дней')
    expect(getBlockPreview({ _type: 'book', _id: '1', cover: '/uploads/x.jpg', details: '<p>Canberra, 2014</p>' }, book)).toBe('Canberra, 2014')
  })
  it('summarises a nested list with its count and first title', () => {
    const block = { _type: 'articles', _id: '1', items: [{ _type: 'article', _id: 'a', title: 'Mapping', link: '' }, { _type: 'article', _id: 'b', title: '', link: '' }] }
    expect(getBlockPreview(block, articles)).toBe('2 articles · Mapping')
  })
  it('says when a nested list has no titles yet', () => {
    const block = { _type: 'articles', _id: '1', items: [{ _type: 'article', _id: 'a', title: '', link: '' }] }
    expect(getBlockPreview(block, articles)).toBe('1 article, none titled yet')
  })
  it('falls back to (empty)', () => {
    expect(getBlockPreview({ _type: 'book', _id: '1' }, book)).toBe('(empty)')
    expect(getBlockPreview({ _type: 'articles', _id: '1', items: [] }, articles)).toBe('(empty)')
  })
})

describe('getBlockThumbnail', () => {
  it('uses the first image field that has a value', () => {
    expect(getBlockThumbnail({ _type: 'book', _id: '1', cover: '/uploads/hood.png' }, book)).toBe('/uploads/hood.png')
    expect(getBlockThumbnail({ _type: 'book', _id: '1', cover: '' }, book)).toBeNull()
    expect(getBlockThumbnail({ _type: 'heading', _id: '1', text: 'x' }, heading)).toBeNull()
  })
})

describe('normalizeBlocks', () => {
  it('returns an array of blocks each with its own id, keeping the ids that exist', () => {
    const blocks = normalizeBlocks([{ _type: 'a' }, { _type: 'b', _id: 'keep' }, { _type: 'c', _id: 'keep' }])
    expect(blocks).toHaveLength(3)
    expect(blocks[1]._id).toBe('keep')
    expect(new Set(blocks.map((b) => b._id)).size).toBe(3)
    expect(blocks.every((b) => typeof b._id === 'string' && b._id.length > 0)).toBe(true)
  })

  it('treats anything that is not an array of blocks as empty', () => {
    expect(normalizeBlocks(null)).toEqual([])
    expect(normalizeBlocks('x')).toEqual([])
    expect(normalizeBlocks([1, null, { _type: 'a', _id: '1' }])).toHaveLength(1)
  })
})

describe('describeBlockType', () => {
  it('prefers the schema description', () => {
    expect(describeBlockType({ ...book, description: 'Title, cover image and publication details' })).toBe('Title, cover image and publication details')
  })
  it('otherwise lists the fields', () => {
    expect(describeBlockType(book)).toBe('Title, Other language, Cover and Details')
    expect(describeBlockType(heading)).toBe('Text')
  })
})

describe('iconForBlock', () => {
  it('uses the schema icon when it names a Lucide icon', () => {
    expect(iconForBlock({ ...book, icon: 'book-open' }).displayName ?? iconForBlock({ ...book, icon: 'book-open' }).name).toMatch(/BookOpen/)
  })
  it('guesses from the fields otherwise', () => {
    expect((iconForBlock(articles).displayName ?? iconForBlock(articles).name)).toMatch(/Layers/)
    expect((iconForBlock(text).displayName ?? iconForBlock(text).name)).toMatch(/AlignLeft|TextAlignStart/)
    expect((iconForBlock(heading).displayName ?? iconForBlock(heading).name)).toMatch(/Heading2/)
    const img: BlockDefinition = { name: 'i', label: 'Image', fields: [{ name: 'src', type: 'image' }] }
    expect((iconForBlock(img).displayName ?? iconForBlock(img).name)).toMatch(/Image/)
  })
})

describe('makeBlock', () => {
  it('creates a block with an id, its type and field defaults', () => {
    const def: BlockDefinition = { name: 'x', label: 'X', fields: [{ name: 'a', type: 'string', default: 'hi' }, { name: 'b', type: 'number' }] }
    const block = makeBlock(def)
    expect(block._type).toBe('x')
    expect(block._id).toEqual(expect.any(String))
    expect(block.a).toBe('hi')
    expect('b' in block).toBe(false)
  })
})

describe('words', () => {
  it('singularizes a plural label', () => {
    expect(singularize('Sections')).toBe('Section')
    expect(singularize('Address')).toBe('Address')
    expect(singularize('Article list')).toBe('Article list')
    expect(singularize('Page sections')).toBe('Page section')
  })
  it('picks a or an', () => {
    expect(indefinite('article')).toBe('an article')
    expect(indefinite('book')).toBe('a book')
  })
})
