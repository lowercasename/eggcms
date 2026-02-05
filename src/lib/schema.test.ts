import { describe, it, expect } from 'vitest'
import { validateSchema, defineCollection, f } from './schema'

describe('validateSchema', () => {
  it('rejects reserved field names', () => {
    const schema = defineCollection({
      name: 'post',
      label: 'Posts',
      fields: [f.string('id')],
    })
    expect(() => validateSchema(schema)).toThrow('Field \'id\' is reserved')
  })

  it('rejects duplicate field names', () => {
    const schema = defineCollection({
      name: 'post',
      label: 'Posts',
      fields: [f.string('title'), f.string('title')],
    })
    expect(() => validateSchema(schema)).toThrow('Field \'title\' defined twice')
  })

  it('requires from option for slug fields', () => {
    const schema = defineCollection({
      name: 'post',
      label: 'Posts',
      fields: [f.string('slug', { type: 'slug' } as any)],
    })
    expect(() => validateSchema(schema)).toThrow('requires \'from\' option')
  })

  it('accepts valid schema', () => {
    const schema = defineCollection({
      name: 'post',
      label: 'Posts',
      fields: [
        f.string('title', { required: true }),
        f.slug('slug', { from: 'title' }),
      ],
    })
    expect(() => validateSchema(schema)).not.toThrow()
  })
})
