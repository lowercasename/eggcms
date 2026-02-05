import { defineCollection, defineBlock, f } from '../lib/schema'

// Define reusable blocks
const heroBlock = defineBlock({
  name: 'hero',
  label: 'Hero Section',
  fields: [
    f.string('heading', { required: true }),
    f.text('subheading'),
    f.image('backgroundImage'),
    f.string('ctaText', { label: 'Button text' }),
    f.string('ctaUrl', { label: 'Button URL' }),
  ],
})

const textBlock = defineBlock({
  name: 'text',
  label: 'Text Block',
  fields: [
    f.richtext('content', { required: true }),
  ],
})

const imageBlock = defineBlock({
  name: 'image',
  label: 'Image',
  fields: [
    f.image('image', { required: true }),
    f.string('alt', { label: 'Alt text' }),
    f.string('caption'),
  ],
})

const calloutBlock = defineBlock({
  name: 'callout',
  label: 'Callout Box',
  fields: [
    f.select('type', { options: ['info', 'warning', 'success', 'error'], required: true }),
    f.string('title'),
    f.text('message', { required: true }),
  ],
})

export default defineCollection({
  name: 'page',
  label: 'Pages',
  fields: [
    f.string('title', { required: true }),
    f.slug('slug', { from: 'title' }),
    f.blocks('content', {
      label: 'Page content',
      blocks: [heroBlock, textBlock, imageBlock, calloutBlock],
    }),
  ],
})
