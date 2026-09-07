// src/admin/lib/api.mock.ts
// An in-memory stand-in for ./api, used by Storybook (see .storybook/main.ts).
// It keeps state for the life of the page so stories behave like the app:
// saving a page updates the list, uploading adds to the library, and so on.
import { sampleMedia, samplePages, sampleSchemas, sampleSettings } from './sample'
import type { MediaItem } from './media'

const delay = (ms = 120) => new Promise((r) => setTimeout(r, ms))
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v))

const state = {
  pages: clone(samplePages) as Array<Record<string, unknown> & { id: string }>,
  settings: clone(sampleSettings) as Record<string, unknown>,
  media: clone(sampleMedia) as MediaItem[],
  user: { email: 'elena@example.org' } as { email: string } | null,
}

/** Reset the fake server between stories. */
export function resetMockApi() {
  state.pages = clone(samplePages)
  state.settings = clone(sampleSettings)
  state.media = clone(sampleMedia)
  state.user = { email: 'elena@example.org' }
}

export const api = {
  login: async (email: string) => {
    await delay()
    state.user = { email }
    return { data: { email } }
  },
  logout: async () => {
    await delay()
    state.user = null
    return { data: { success: true } }
  },
  me: async () => {
    await delay(30)
    if (!state.user) throw new Error('Not signed in')
    return { data: state.user }
  },

  getSchemas: async () => {
    await delay(30)
    return { data: clone(sampleSchemas), siteName: 'Elena Govor' }
  },

  getContent: async <T>(schema: string) => {
    await delay()
    const data = schema === 'page' ? clone(state.pages) : []
    return { data: data as T[], meta: { total: data.length } }
  },
  getSingleton: async <T>() => {
    await delay()
    return { data: clone(state.settings) as T }
  },
  getItem: async <T>(_schema: string, id: string) => {
    await delay()
    const item = state.pages.find((p) => p.id === id)
    if (!item) throw new Error('Not found')
    return { data: clone(item) as T }
  },
  createItem: async <T>(_schema: string, data: Record<string, unknown>) => {
    await delay(200)
    const { draft, ...fields } = data
    const item = { ...fields, id: `p${Date.now()}`, _meta: { draft: !!draft, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } }
    state.pages.unshift(item)
    return { data: clone(item) as T }
  },
  updateItem: async <T>(_schema: string, id: string, data: Record<string, unknown>) => {
    await delay(200)
    const { draft, ...fields } = data
    const index = state.pages.findIndex((p) => p.id === id)
    const existing = state.pages[index] as { _meta?: Record<string, unknown> }
    const item = { ...fields, id, _meta: { ...(existing?._meta ?? {}), draft: !!draft, updatedAt: new Date().toISOString() } }
    if (index >= 0) state.pages[index] = item
    return { data: clone(item) as T }
  },
  updateSingleton: async <T>(_schema: string, data: Record<string, unknown>) => {
    await delay(200)
    state.settings = clone(data)
    return { data: clone(data) as T }
  },
  deleteItem: async (_schema: string, id: string) => {
    await delay()
    state.pages = state.pages.filter((p) => p.id !== id)
    return { data: { success: true } }
  },

  getMedia: async () => {
    await delay()
    return { data: clone(state.media) }
  },
  uploadMedia: async (file: File) => {
    await delay(300)
    const isImage = file.type.startsWith('image/')
    const item: MediaItem = {
      id: `m${Date.now()}`,
      filename: file.name,
      path: isImage ? URL.createObjectURL(file) : `/uploads/${file.name}`,
      mimetype: file.type || 'application/octet-stream',
      kind: isImage ? 'image' : file.type.startsWith('audio/') ? 'audio' : file.type.startsWith('video/') ? 'video' : 'document',
      size: file.size,
      created_at: new Date().toISOString(),
      references: [],
    }
    state.media.unshift(item)
    return { data: { id: item.id, path: item.path } }
  },
  deleteMedia: async (id: string) => {
    await delay()
    const item = state.media.find((m) => m.id === id)
    if (item && item.references && item.references.length > 0) {
      throw new Error(`This file is used by the page “${item.references[0].label}”. Remove it there first.`)
    }
    state.media = state.media.filter((m) => m.id !== id)
    return { data: { success: true } }
  },
}
