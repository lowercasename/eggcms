// src/admin/lib/sample.ts
// Sample schemas and content used by Storybook and the in-memory API mock.
// Modelled on a historian's site: pages built from heading / text / book /
// article-list sections, a settings singleton, and a media library.
import type { Schema, BlockDefinition } from '../types'
import type { MediaItem } from './media'

export const headingBlock: BlockDefinition = {
  name: 'heading',
  label: 'Heading',
  icon: 'heading-2',
  description: 'A large title that starts a part of the page',
  fields: [{ name: 'text', type: 'string', label: 'Heading text', required: true, placeholder: 'Type the heading' }],
}

export const textBlock: BlockDefinition = {
  name: 'text',
  label: 'Text',
  icon: 'align-left',
  description: 'Paragraphs, links and lists',
  fields: [{ name: 'body', type: 'richtext', label: 'Text' }],
}

export const articleBlock: BlockDefinition = {
  name: 'article',
  label: 'Article',
  fields: [
    { name: 'title', type: 'string' },
    { name: 'link', type: 'string', placeholder: 'https://…' },
  ],
}

export const bookBlock: BlockDefinition = {
  name: 'book',
  label: 'Book',
  icon: 'book-open',
  description: 'Title, cover image and publication details',
  fields: [
    { name: 'title', type: 'string', required: true },
    { name: 'otherTitle', type: 'string', label: 'Other language' },
    { name: 'cover', type: 'image', label: 'Cover image' },
    { name: 'details', type: 'richtext', label: 'Publication details', toolbar: 'minimal' },
  ],
}

export const articlesBlock: BlockDefinition = {
  name: 'articles',
  label: 'Article list',
  icon: 'layers',
  description: 'A numbered list of articles with links',
  fields: [{ name: 'items', type: 'blocks', label: 'Articles', blocks: [articleBlock] }],
}

export const pageSchema: Schema = {
  name: 'page',
  label: 'Pages',
  type: 'collection',
  labelField: 'title',
  fields: [
    { name: 'title', type: 'string', required: true },
    { name: 'slug', type: 'slug', from: 'title' },
    { name: 'subtitle', type: 'string', placeholder: 'Optional' },
    { name: 'menuOrder', type: 'number', label: 'Order in the menu' },
    { name: 'isFrontPage', type: 'boolean', label: 'This is the front page' },
    { name: 'sections', type: 'blocks', blocks: [headingBlock, textBlock, bookBlock, articlesBlock] },
  ],
}

export const settingsSchema: Schema = {
  name: 'settings',
  label: 'Site Settings',
  type: 'singleton',
  fields: [
    { name: 'siteName', type: 'string', required: true },
    { name: 'tagline', type: 'string' },
    { name: 'background', type: 'image', label: 'Background image' },
    { name: 'footer', type: 'richtext', label: 'Footer text', toolbar: 'minimal' },
  ],
}

export const sampleSchemas: Schema[] = [settingsSchema, pageSchema]

export const sampleSections = [
  { _type: 'heading', _id: 'h1', text: 'Books by Elena Govor / Книги Елены Говор' },
  {
    _type: 'book',
    _id: 'b1',
    title: 'Douze jours à Nuku Hiva : Rencontres et révolte russe dans le Pacifique Sud',
    otherTitle: 'Двенадцать дней на Нуку Хиве',
    cover: '/uploads/nuku-hiva.png',
    details: '<p>Ed. by Marie-Noëlle Ottino-Garanger, Leiden: <b>Sidestone Press</b>, 2021, 406 pp., 194 ills.</p>',
  },
  {
    _type: 'book',
    _id: 'b2',
    title: 'Early accounts of Hood Bay and the Aroma people, 1875–1880',
    otherTitle: 'Первые сообщения о жителях залива Худ и побережья Арома',
    cover: '/uploads/hood.png',
    details: '<p>Canberra, Australian National University, 2014, 200 pp., ills. (with Chris Ballard)</p>',
  },
  { _type: 'heading', _id: 'h2', text: 'Articles / Статьи' },
  {
    _type: 'articles',
    _id: 'a1',
    items: [
      { _type: 'article', _id: 'ar1', title: "Ethnographic and Imperial Mapping: Miklouho-Maclay's New Guinea Placenames", link: 'https://doi.org/10.1080/00223344.2025' },
      { _type: 'article', _id: 'ar2', title: 'Русский бунт на острове Нуку-Хива', link: '' },
    ],
  },
  {
    _type: 'text',
    _id: 't1',
    body: '<h2>Media and talks</h2><p><a href="#">Знакомьтесь, ваш сосед Папуа-Новая Гвинея</a>: SBS Russian, 2024.</p><p><a href="#">The story of a Russian visit to Australia 200 years ago</a>: ABC Radio National.</p>',
  },
]

const meta = (draft: boolean, day: number) => ({
  draft,
  createdAt: `2026-08-${String(day).padStart(2, '0')}T09:00:00.000Z`,
  updatedAt: `2026-08-${String(day).padStart(2, '0')}T12:00:00.000Z`,
})

export const samplePages = [
  { id: 'p1', title: 'Belarus Ukraine Russia', slug: 'belarus-ukraine-russia', menuOrder: 1, isFrontPage: false, sections: [], _meta: meta(false, 22) },
  { id: 'p2', title: 'Genealogy', slug: 'genealogy', menuOrder: 2, isFrontPage: false, sections: [], _meta: meta(false, 21) },
  { id: 'p3', title: 'Russian Anzacs', slug: 'russian-anzacs', menuOrder: 3, isFrontPage: false, sections: [], _meta: meta(false, 20) },
  { id: 'p4', title: 'Australia', slug: 'australia', menuOrder: 4, isFrontPage: true, sections: [], _meta: meta(false, 19) },
  {
    id: 'p5',
    title: 'South Pacific',
    slug: 'south-pacific',
    subtitle: 'Russians and the South Pacific',
    menuOrder: 3,
    isFrontPage: false,
    sections: sampleSections,
    _meta: meta(false, 18),
  },
  { id: 'p6', title: 'My family', slug: 'my-family', menuOrder: 6, isFrontPage: false, sections: [], _meta: meta(false, 17) },
  { id: 'p7', title: 'About', slug: 'about', menuOrder: 7, isFrontPage: false, sections: [], _meta: meta(false, 16) },
  { id: 'p8', title: 'Talks and media', slug: 'talks-and-media', menuOrder: 8, isFrontPage: false, sections: [], _meta: meta(true, 23) },
]

export const sampleSettings = {
  siteName: 'Elena Govor',
  tagline: 'Historian of Russians in the Pacific',
  background: '/uploads/background.png',
  footer: '<p>© Elena Govor</p>',
}

const ref = (id: string, label: string) => ({ schema: 'page', schemaLabel: 'Pages', schemaType: 'collection' as const, id, label })


export const sampleMedia: MediaItem[] = [
  { id: 'm1', filename: 'Tattoo.png', path: '/uploads/tattoo.png', mimetype: 'image/png', kind: 'image', size: 3400, created_at: '2026-08-10T10:00:00.000Z', references: [ref('p3', 'Russian Anzacs')] },
  { id: 'm2', filename: 'Shabashev_02.png', path: '/uploads/shabashev-02.png', mimetype: 'image/png', kind: 'image', size: 28300, created_at: '2026-08-09T10:00:00.000Z', references: [] },
  { id: 'm3', filename: 'Shabashev_01.png', path: '/uploads/shabashev-01.png', mimetype: 'image/png', kind: 'image', size: 23800, created_at: '2026-08-08T10:00:00.000Z', references: [ref('p3', 'Russian Anzacs')] },
  { id: 'm4', filename: 'Russian sailors in Australia.png', path: '/uploads/russian-sailors-in-australia.png', mimetype: 'image/png', kind: 'image', size: 5500, created_at: '2026-08-07T10:00:00.000Z', references: [ref('p4', 'Australia'), ref('p1', 'Belarus Ukraine Russia'), ref('p6', 'My family')] },
  { id: 'm5', filename: 'hood-bay-documents.pdf', path: '/uploads/hood-bay-documents.pdf', mimetype: 'application/pdf', kind: 'document', size: 4.1 * 1024 * 1024, created_at: '2026-08-06T10:00:00.000Z', references: [ref('p5', 'South Pacific')] },
  { id: 'm6', filename: 'background.png', path: '/uploads/background.png', mimetype: 'image/png', kind: 'image', size: 73800, created_at: '2026-08-05T10:00:00.000Z', references: [{ schema: 'settings', schemaLabel: 'Site Settings', schemaType: 'singleton' as const, id: 'settings', label: 'Site Settings' }] },
  { id: 'm7', filename: 'nuku-hiva-interview.mp3', path: '/uploads/nuku-hiva-interview.mp3', mimetype: 'audio/mpeg', kind: 'audio', size: 18.6 * 1024 * 1024, created_at: '2026-08-04T10:00:00.000Z', references: [] },
  { id: 'm8', filename: 'maclay-coast.pdf', path: '/uploads/maclay-coast.pdf', mimetype: 'application/pdf', kind: 'document', size: 2.3 * 1024 * 1024, created_at: '2026-08-03T10:00:00.000Z', references: [ref('p5', 'South Pacific'), ref('p2', 'Genealogy')] },
  { id: 'm9', filename: 'genealogy-chart.png', path: '/uploads/genealogy-chart.png', mimetype: 'image/png', kind: 'image', size: 412 * 1024, created_at: '2026-08-02T10:00:00.000Z', references: [ref('p2', 'Genealogy')] },
  { id: 'm10', filename: 'anzacs-list-1919.pdf', path: '/uploads/anzacs-list-1919.pdf', mimetype: 'application/pdf', kind: 'document', size: 860 * 1024, created_at: '2026-08-01T10:00:00.000Z', references: [] },
  { id: 'm11', filename: 'Russian Anzacs.png', path: '/uploads/russian-anzacs.png', mimetype: 'image/png', kind: 'image', size: 5800, created_at: '2026-07-30T10:00:00.000Z', references: [ref('p3', 'Russian Anzacs'), ref('p4', 'Australia')] },
  { id: 'm12', filename: 'mapping-2025.pdf', path: '/uploads/mapping-2025.pdf', mimetype: 'application/pdf', kind: 'document', size: 1.2 * 1024 * 1024, created_at: '2026-07-29T10:00:00.000Z', references: [] },
  { id: 'm13', filename: 'nuku-hiva.png', path: '/uploads/nuku-hiva.png', mimetype: 'image/png', kind: 'image', size: 91000, created_at: '2026-07-28T10:00:00.000Z', references: [ref('p5', 'South Pacific')] },
  { id: 'm14', filename: 'hood.png', path: '/uploads/hood.png', mimetype: 'image/png', kind: 'image', size: 120000, created_at: '2026-07-27T10:00:00.000Z', references: [ref('p5', 'South Pacific')] },
]
