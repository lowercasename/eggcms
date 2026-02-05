// src/admin/lib/api.ts

const BASE_URL = '/api'

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

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error?.message || 'Request failed')
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
    request<{ data: Array<{ name: string; label: string; type: string; fields: Array<{ name: string; type: string; label?: string; required?: boolean; default?: unknown; placeholder?: string; options?: string[]; from?: string }> }> }>('/content/_schemas'),

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
    request<{ data: Array<{ id: string; filename: string; path: string }> }>('/media'),

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
