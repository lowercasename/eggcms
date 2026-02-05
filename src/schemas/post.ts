import { defineCollection, f } from '../lib/schema'

export default defineCollection({
  name: 'post',
  label: 'Blog Posts',
  fields: [
    f.string('title', { required: true }),
    f.slug('slug', { from: 'title' }),
    f.richtext('content'),
    f.image('featuredImage'),
    f.datetime('publishedAt'),
  ],
})
