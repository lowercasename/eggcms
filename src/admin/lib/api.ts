// src/admin/lib/api.ts

import type { PublicSchema } from '../../lib/schema'
import type { MediaItemResponse, MediaKind } from '../../lib/media'

export interface MediaQuery {
  q?: string
  kinds?: MediaKind[]
  sort?: 'newest' | 'oldest' | 'name'
  limit?: number
  offset?: number
}

export interface MediaPage {
  data: MediaItemResponse[]
  meta: { total: number; counts: Record<'all' | MediaKind, number>; limit: number; offset: number }
}

const BASE_URL = '/api'

/** An error from the server, carrying its status and code so callers can tell "not found" from "broken". */
export class ApiError extends Error {
  status: number
  code?: string
  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  })

  // A proxy or crash can answer with HTML; do not let that become a JSON parse error.
  const text = await response.text()
  let data: any = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = null
  }

  if (!response.ok) {
    throw new ApiError(data?.error?.message || `The server answered ${response.status}`, response.status, data?.error?.code)
  }

  return data
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<{ data: { email: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  logout: () =>
    request<{ data: { success: boolean } }>('/auth/logout', {
      method: 'POST',
    }),

  me: () =>
    request<{ data: { email: string } }>('/auth/me'),

  // Schemas
  getSchemas: () =>
    request<{ data: PublicSchema[]; siteName?: string }>('/schemas'),

  // Content
  getContent: <T>(schema: string, drafts = true) =>
    request<{ data: T[]; meta: { total: number } }>(
      `/content/${schema}${drafts ? '?drafts=true' : ''}`
    ),

  getSingleton: <T>(schema: string) =>
    request<{ data: T }>(`/content/${schema}`),

  getItem: <T>(schema: string, id: string) =>
    request<{ data: T }>(`/content/${schema}/${id}`),

  createItem: <T>(schema: string, data: Record<string, unknown>) =>
    request<{ data: T }>(`/content/${schema}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateItem: <T>(schema: string, id: string, data: Record<string, unknown>) =>
    request<{ data: T }>(`/content/${schema}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  updateSingleton: <T>(schema: string, data: Record<string, unknown>) =>
    request<{ data: T }>(`/content/${schema}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteItem: (schema: string, id: string) =>
    request<{ data: { success: boolean } }>(`/content/${schema}/${id}`, {
      method: 'DELETE',
    }),

  // Media
  /** One page of the library; see MediaQuery. */
  getMedia: (query: MediaQuery = {}) => {
    const params = new URLSearchParams()
    if (query.q) params.set('q', query.q)
    if (query.kinds && query.kinds.length > 0) params.set('kinds', query.kinds.join(','))
    if (query.sort) params.set('sort', query.sort)
    if (query.limit !== undefined) params.set('limit', String(query.limit))
    if (query.offset !== undefined) params.set('offset', String(query.offset))
    const qs = params.toString()
    return request<MediaPage>(`/media${qs ? `?${qs}` : ''}`)
  },

  /** The library entry behind a stored path, or null if it is not in the library. */
  findMedia: async (path: string): Promise<MediaItemResponse | null> => {
    try {
      const res = await request<{ data: MediaItemResponse }>(`/media/by-path?path=${encodeURIComponent(path)}`)
      return res.data
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return null
      throw err
    }
  },

  uploadMedia: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${BASE_URL}/media`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    })

    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error?.message || 'Upload failed')
    }
    return data as { data: { id: string; path: string } }
  },

  deleteMedia: (id: string) =>
    request<{ data: { success: boolean } }>(`/media/${id}`, {
      method: 'DELETE',
    }),
}
