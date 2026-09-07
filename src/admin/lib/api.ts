// src/admin/lib/api.ts

import type { PublicSchema } from '../../lib/schema'
import type { MediaItemResponse } from '../../lib/media'

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
  getMedia: () =>
    request<{ data: MediaItemResponse[]; meta: { total: number } }>('/media'),

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
