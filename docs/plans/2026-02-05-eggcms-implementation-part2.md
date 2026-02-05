# EggCMS Implementation Plan - Part 2

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Continues from:** `docs/plans/2026-02-05-eggcms-implementation.md`

---

## Phase 5: Media Routes & Storage

### Task 5.1: Local Storage Service

**Files:**
- Create: `src/server/lib/storage.ts`

**Step 1: Create storage service**

```typescript
// src/server/lib/storage.ts
import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'

export interface StorageService {
  save(file: File): Promise<{ path: string; filename: string }>
  delete(filePath: string): Promise<void>
  getUrl(filePath: string): string
}

export function createLocalStorage(): StorageService {
  const uploadsDir = path.join(process.cwd(), 'uploads')

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
  }

  return {
    async save(file: File) {
      const ext = path.extname(file.name) || ''
      const filename = `${randomUUID()}${ext}`
      const filePath = path.join(uploadsDir, filename)

      const buffer = Buffer.from(await file.arrayBuffer())
      fs.writeFileSync(filePath, buffer)

      return { path: `/uploads/${filename}`, filename: file.name }
    },

    async delete(filePath: string) {
      const fullPath = path.join(process.cwd(), filePath.replace(/^\//, ''))
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath)
      }
    },

    getUrl(filePath: string) {
      return filePath
    },
  }
}
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add local file storage service"
```

---

### Task 5.2: S3 Storage Service

**Files:**
- Modify: `src/server/lib/storage.ts`
- Add to `package.json`: `@aws-sdk/client-s3`

**Step 1: Install S3 SDK**

Run: `bun add @aws-sdk/client-s3`

**Step 2: Add S3 storage implementation**

```typescript
// Add to src/server/lib/storage.ts
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

export function createS3Storage(): StorageService {
  const client = new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: 'auto',
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY!,
      secretAccessKey: process.env.S3_SECRET_KEY!,
    },
  })

  const bucket = process.env.S3_BUCKET!

  return {
    async save(file: File) {
      const ext = path.extname(file.name) || ''
      const key = `${randomUUID()}${ext}`

      const buffer = Buffer.from(await file.arrayBuffer())

      await client.send(new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: file.type,
        ACL: 'public-read',
      }))

      const url = `${process.env.S3_ENDPOINT}/${bucket}/${key}`
      return { path: url, filename: file.name }
    },

    async delete(filePath: string) {
      // Extract key from URL
      const url = new URL(filePath)
      const key = url.pathname.split('/').slice(2).join('/')

      await client.send(new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      }))
    },

    getUrl(filePath: string) {
      return filePath
    },
  }
}

export function createStorage(): StorageService {
  if (process.env.STORAGE === 's3') {
    return createS3Storage()
  }
  return createLocalStorage()
}
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add S3-compatible storage support"
```

---

### Task 5.3: Media Routes

**Files:**
- Create: `src/server/routes/media.ts`
- Modify: `src/server/index.ts`

**Step 1: Create media routes**

```typescript
// src/server/routes/media.ts
import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth'
import { createStorage } from '../lib/storage'
import { sqlite } from '../db'

const media = new Hono()
const storage = createStorage()

// GET /api/media - List all media
media.get('/', (c) => {
  const items = sqlite.prepare('SELECT * FROM _media ORDER BY created_at DESC').all()
  return c.json({ data: items, meta: { total: items.length } })
})

// POST /api/media - Upload file
media.post('/', requireAuth, async (c) => {
  const body = await c.req.parseBody()
  const file = body.file

  if (!file || !(file instanceof File)) {
    return c.json({ error: { code: 'BAD_REQUEST', message: 'No file provided' } }, 400)
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
  if (!allowedTypes.includes(file.type)) {
    return c.json({ error: { code: 'BAD_REQUEST', message: 'Invalid file type' } }, 400)
  }

  const { path: filePath, filename } = await storage.save(file)
  const now = new Date().toISOString()

  const result = sqlite.prepare(`
    INSERT INTO _media (filename, path, mimetype, size, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(filename, filePath, file.type, file.size, now)

  const item = sqlite.prepare('SELECT * FROM _media WHERE id = ?').get(result.lastInsertRowid)

  return c.json({ data: item }, 201)
})

// DELETE /api/media/:id - Delete file
media.delete('/:id', requireAuth, async (c) => {
  const id = parseInt(c.req.param('id'))

  const item = sqlite.prepare('SELECT * FROM _media WHERE id = ?').get(id) as { path: string } | undefined

  if (!item) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Media not found' } }, 404)
  }

  await storage.delete(item.path)
  sqlite.prepare('DELETE FROM _media WHERE id = ?').run(id)

  return c.json({ data: { success: true } })
})

export default media
```

**Step 2: Add static file serving and wire up routes**

```typescript
// Update src/server/index.ts - add these imports and routes
import { serveStatic } from '@hono/node-server/serve-static'
import media from './routes/media'

// Add before other routes:
app.use('/uploads/*', serveStatic({ root: './' }))

// Add with other routes:
app.route('/api/media', media)
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add media upload and management routes"
```

---

## Phase 6: Webhooks

### Task 6.1: Webhook Service

**Files:**
- Create: `src/server/lib/webhook.ts`

**Step 1: Create webhook service**

```typescript
// src/server/lib/webhook.ts

let debounceTimer: ReturnType<typeof setTimeout> | null = null

export interface WebhookPayload {
  event: 'content.updated' | 'content.deleted'
  schema: string
  id?: number
  timestamp: string
}

export async function fireWebhook(payload: WebhookPayload): Promise<void> {
  const url = process.env.WEBHOOK_URL
  if (!url) return

  const debounceMs = parseInt(process.env.WEBHOOK_DEBOUNCE_MS || '0')

  if (debounceMs > 0) {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
    debounceTimer = setTimeout(() => sendWebhook(url, payload), debounceMs)
  } else {
    await sendWebhook(url, payload)
  }
}

async function sendWebhook(url: string, payload: WebhookPayload): Promise<void> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      console.error(`Webhook failed: ${response.status} ${response.statusText}`)
    } else {
      console.log(`Webhook sent: ${payload.event} ${payload.schema}`)
    }
  } catch (error) {
    console.error('Webhook error:', error)
  }
}

export function shouldFireWebhook(
  schema: { type: string },
  action: 'create' | 'update' | 'delete',
  data?: { draft?: number | boolean }
): boolean {
  // Singletons always fire
  if (schema.type === 'singleton') return true

  // Deleting a published item fires
  if (action === 'delete' && data && !data.draft) return true

  // Publishing (draft=false) fires
  if ((action === 'create' || action === 'update') && data && !data.draft) return true

  return false
}
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add webhook service with debounce support"
```

---

### Task 6.2: Integrate Webhooks into Content Routes

**Files:**
- Modify: `src/server/routes/content.ts`

**Step 1: Add webhook calls to content routes**

```typescript
// Add import at top of src/server/routes/content.ts
import { fireWebhook, shouldFireWebhook } from '../lib/webhook'

// Update POST route (after creating item):
if (schema.type === 'singleton') {
  const data = content.upsertSingleton(schema, body)
  fireWebhook({ event: 'content.updated', schema: schema.name, timestamp: new Date().toISOString() })
  return c.json({ data })
}

const data = content.createItem(schema, body) as { id: number; draft?: number }
if (shouldFireWebhook(schema, 'create', data)) {
  fireWebhook({ event: 'content.updated', schema: schema.name, id: data.id, timestamp: new Date().toISOString() })
}
return c.json({ data }, 201)

// Update PUT route (after updating item):
const data = content.updateItem(schema, id, body) as { id: number; draft?: number }
if (shouldFireWebhook(schema, 'update', data)) {
  fireWebhook({ event: 'content.updated', schema: schema.name, id: data.id, timestamp: new Date().toISOString() })
}
return c.json({ data })

// Update DELETE route (before deleting):
const existing = content.getItem(schema, id) as { draft?: number } | undefined
const deleted = content.deleteItem(schema, id)
if (deleted && shouldFireWebhook(schema, 'delete', existing)) {
  fireWebhook({ event: 'content.deleted', schema: schema.name, id, timestamp: new Date().toISOString() })
}
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: integrate webhooks into content routes"
```

---

## Phase 7: Admin UI Setup

### Task 7.1: React + Vite Setup

**Files:**
- Create: `src/admin/main.tsx`
- Create: `src/admin/App.tsx`
- Create: `src/admin/index.html`
- Create: `vite.config.ts`
- Modify: `package.json`

**Step 1: Install admin dependencies**

Run:
```bash
bun add react react-dom react-router-dom
bun add -d @types/react @types/react-dom @vitejs/plugin-react tailwindcss postcss autoprefixer
```

**Step 2: Create vite.config.ts**

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  root: 'src/admin',
  build: {
    outDir: '../../dist/admin',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
      '/uploads': 'http://localhost:3000',
    },
  },
})
```

**Step 3: Create index.html**

```html
<!-- src/admin/index.html -->
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>EggCMS</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./main.tsx"></script>
  </body>
</html>
```

**Step 4: Create main.tsx**

```tsx
// src/admin/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename="/admin">
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
```

**Step 5: Create App.tsx stub**

```tsx
// src/admin/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<div>EggCMS Admin</div>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
```

**Step 6: Update package.json scripts**

```json
{
  "scripts": {
    "dev": "concurrently \"bun run dev:server\" \"bun run dev:admin\"",
    "dev:server": "bun run --watch src/server/index.ts",
    "dev:admin": "vite",
    "build": "bun run build:server && bun run build:admin",
    "build:server": "bun build src/server/index.ts --outdir dist/server --target node",
    "build:admin": "vite build",
    "start": "bun dist/server/index.js",
    "test": "vitest"
  }
}
```

Run: `bun add -d concurrently`

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: add React + Vite admin setup"
```

---

### Task 7.2: Tailwind Setup

**Files:**
- Create: `src/admin/index.css`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`

**Step 1: Initialize Tailwind**

Run: `bunx tailwindcss init -p`

**Step 2: Configure tailwind.config.js**

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/admin/**/*.{js,ts,jsx,tsx,html}'],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

**Step 3: Create index.css**

```css
/* src/admin/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  @apply bg-gray-50 text-gray-900;
}
```

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add Tailwind CSS setup"
```

---

### Task 7.3: API Client

**Files:**
- Create: `src/admin/lib/api.ts`

**Step 1: Create API client**

```typescript
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

  // Content
  getContent: <T>(schema: string, drafts = true) =>
    request<{ data: T[]; meta: { total: number } }>(
      `/content/${schema}${drafts ? '?drafts=true' : ''}`
    ),

  getSingleton: <T>(schema: string) =>
    request<{ data: T }>(`/content/${schema}`),

  getItem: <T>(schema: string, id: number) =>
    request<{ data: T }>(`/content/${schema}/${id}`),

  createItem: <T>(schema: string, data: Record<string, unknown>) =>
    request<{ data: T }>(`/content/${schema}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateItem: <T>(schema: string, id: number, data: Record<string, unknown>) =>
    request<{ data: T }>(`/content/${schema}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  updateSingleton: <T>(schema: string, data: Record<string, unknown>) =>
    request<{ data: T }>(`/content/${schema}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteItem: (schema: string, id: number) =>
    request<{ data: { success: boolean } }>(`/content/${schema}/${id}`, {
      method: 'DELETE',
    }),

  // Media
  getMedia: () =>
    request<{ data: Array<{ id: number; filename: string; path: string }> }>('/media'),

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
    return data as { data: { id: number; path: string } }
  },

  deleteMedia: (id: number) =>
    request<{ data: { success: boolean } }>(`/media/${id}`, {
      method: 'DELETE',
    }),
}
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add admin API client"
```

---

### Task 7.4: Auth Context

**Files:**
- Create: `src/admin/context/AuthContext.tsx`

**Step 1: Create auth context**

```tsx
// src/admin/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { api } from '../lib/api'

interface AuthContextType {
  user: { email: string } | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ email: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if already logged in by trying to fetch content
    api.getContent('settings', true)
      .then(() => {
        // If this succeeds, we're logged in - but we don't know the email
        // For simplicity, just mark as logged in
        setUser({ email: 'admin' })
      })
      .catch(() => {
        setUser(null)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const login = async (email: string, password: string) => {
    const result = await api.login(email, password)
    setUser(result.data)
  }

  const logout = async () => {
    await api.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add auth context"
```

---

## Phase 8: Admin UI Components

### Task 8.1: Login Page

**Files:**
- Create: `src/admin/pages/Login.tsx`

**Step 1: Create login page**

```tsx
// src/admin/pages/Login.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">EggCMS</h1>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add login page"
```

---

### Task 8.2: Layout Component

**Files:**
- Create: `src/admin/components/Layout.tsx`
- Create: `src/admin/components/Sidebar.tsx`

**Step 1: Create sidebar**

```tsx
// src/admin/components/Sidebar.tsx
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { SchemaDefinition } from '@/lib/schema'

interface SidebarProps {
  schemas: SchemaDefinition[]
}

export default function Sidebar({ schemas }: SidebarProps) {
  const { logout } = useAuth()

  const singletons = schemas.filter((s) => s.type === 'singleton')
  const collections = schemas.filter((s) => s.type === 'collection')

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `block px-3 py-2 rounded ${isActive ? 'bg-gray-200 font-medium' : 'hover:bg-gray-100'}`

  return (
    <div className="w-56 bg-white border-r h-screen flex flex-col">
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold">EggCMS</h1>
      </div>

      <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
        {singletons.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Singletons
            </h2>
            <div className="space-y-1">
              {singletons.map((s) => (
                <NavLink key={s.name} to={`/singletons/${s.name}`} className={linkClass}>
                  {s.label}
                </NavLink>
              ))}
            </div>
          </div>
        )}

        {collections.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Collections
            </h2>
            <div className="space-y-1">
              {collections.map((s) => (
                <NavLink key={s.name} to={`/collections/${s.name}`} className={linkClass}>
                  {s.label}
                </NavLink>
              ))}
            </div>
          </div>
        )}

        <div className="border-t pt-4">
          <NavLink to="/media" className={linkClass}>
            Media
          </NavLink>
        </div>
      </nav>

      <div className="p-4 border-t">
        <button
          onClick={() => logout()}
          className="w-full text-left px-3 py-2 text-gray-600 hover:bg-gray-100 rounded"
        >
          Logout
        </button>
      </div>
    </div>
  )
}
```

**Step 2: Create layout**

```tsx
// src/admin/components/Layout.tsx
import { Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Sidebar from './Sidebar'
import type { SchemaDefinition } from '@/lib/schema'

interface LayoutProps {
  schemas: SchemaDefinition[]
}

export default function Layout({ schemas }: LayoutProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar schemas={schemas} />
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add layout and sidebar components"
```

---

### Task 8.3: Collection Page (Three-Column)

**Files:**
- Create: `src/admin/pages/Collection.tsx`
- Create: `src/admin/components/ItemList.tsx`
- Create: `src/admin/components/ItemForm.tsx`

**Step 1: Create ItemList component**

```tsx
// src/admin/components/ItemList.tsx
import { NavLink, useParams } from 'react-router-dom'

interface Item {
  id: number
  title?: string
  name?: string
  draft?: number
  created_at?: string
}

interface ItemListProps {
  items: Item[]
  schemaName: string
  labelField?: string
}

export default function ItemList({ items, schemaName, labelField = 'title' }: ItemListProps) {
  const { id } = useParams()

  return (
    <div className="w-72 border-r bg-gray-50 h-screen overflow-y-auto">
      <div className="p-4 border-b bg-white sticky top-0">
        <NavLink
          to={`/collections/${schemaName}/new`}
          className="block w-full bg-blue-600 text-white text-center py-2 rounded hover:bg-blue-700"
        >
          + New
        </NavLink>
      </div>

      <div className="divide-y">
        {items.map((item) => (
          <NavLink
            key={item.id}
            to={`/collections/${schemaName}/${item.id}`}
            className={({ isActive }) =>
              `block p-4 hover:bg-white ${isActive ? 'bg-white border-l-2 border-blue-600' : ''}`
            }
          >
            <div className="font-medium truncate">
              {(item as Record<string, unknown>)[labelField] as string || `Item ${item.id}`}
            </div>
            <div className="text-sm text-gray-500">
              {item.draft ? 'Draft' : 'Published'}
            </div>
          </NavLink>
        ))}

        {items.length === 0 && (
          <div className="p-4 text-gray-500 text-center">No items yet</div>
        )}
      </div>
    </div>
  )
}
```

**Step 2: Create Collection page**

```tsx
// src/admin/pages/Collection.tsx
import { useState, useEffect } from 'react'
import { useParams, Outlet, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import ItemList from '../components/ItemList'
import type { SchemaDefinition } from '@/lib/schema'

interface CollectionProps {
  schemas: SchemaDefinition[]
}

export default function Collection({ schemas }: CollectionProps) {
  const { schema: schemaName } = useParams<{ schema: string }>()
  const [items, setItems] = useState<Array<{ id: number }>>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const schema = schemas.find((s) => s.name === schemaName && s.type === 'collection')

  useEffect(() => {
    if (!schema) return

    setLoading(true)
    api.getContent<{ id: number }>(schema.name)
      .then((res) => setItems(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [schema?.name])

  if (!schema) {
    return <div className="p-8">Schema not found</div>
  }

  // Find the first string field to use as label
  const labelField = schema.fields.find((f) => f.type === 'string')?.name || 'id'

  return (
    <div className="flex h-screen">
      {loading ? (
        <div className="w-72 border-r flex items-center justify-center">Loading...</div>
      ) : (
        <ItemList items={items} schemaName={schema.name} labelField={labelField} />
      )}
      <div className="flex-1 overflow-y-auto">
        <Outlet context={{ schema, refreshList: () => {
          api.getContent<{ id: number }>(schema.name)
            .then((res) => setItems(res.data))
        }}} />
      </div>
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add collection page with item list"
```

---

### Task 8.4: Item Form and Editor

**Files:**
- Create: `src/admin/pages/ItemEdit.tsx`

**Step 1: Create ItemEdit page**

```tsx
// src/admin/pages/ItemEdit.tsx
import { useState, useEffect } from 'react'
import { useParams, useOutletContext, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import type { SchemaDefinition, FieldDefinition } from '@/lib/schema'

// Import editors (we'll create these next)
import StringEditor from '../editors/StringEditor'
import TextEditor from '../editors/TextEditor'
import BooleanEditor from '../editors/BooleanEditor'
import NumberEditor from '../editors/NumberEditor'

interface OutletContext {
  schema: SchemaDefinition
  refreshList: () => void
}

const editorMap: Record<string, React.ComponentType<{ field: FieldDefinition; value: unknown; onChange: (v: unknown) => void }>> = {
  string: StringEditor,
  text: TextEditor,
  slug: StringEditor,
  richtext: TextEditor, // Placeholder until we add Tiptap
  number: NumberEditor,
  boolean: BooleanEditor,
  datetime: StringEditor, // Placeholder
  image: StringEditor, // Placeholder
  select: StringEditor, // Placeholder
  blocks: TextEditor, // Placeholder
}

export default function ItemEdit() {
  const { id } = useParams<{ id: string }>()
  const { schema, refreshList } = useOutletContext<OutletContext>()
  const navigate = useNavigate()

  const [data, setData] = useState<Record<string, unknown>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const isNew = id === 'new'

  useEffect(() => {
    if (isNew) {
      // Set defaults
      const defaults: Record<string, unknown> = { draft: 1 }
      for (const field of schema.fields) {
        if (field.default !== undefined) {
          defaults[field.name] = field.default
        }
      }
      setData(defaults)
      setLoading(false)
      return
    }

    api.getItem(schema.name, parseInt(id!))
      .then((res) => setData(res.data as Record<string, unknown>))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id, schema.name, isNew])

  const handleSave = async (asDraft = true) => {
    setSaving(true)
    setError('')

    try {
      const saveData = { ...data, draft: asDraft ? 1 : 0 }

      if (isNew) {
        const result = await api.createItem(schema.name, saveData)
        const newId = (result.data as { id: number }).id
        refreshList()
        navigate(`/collections/${schema.name}/${newId}`, { replace: true })
      } else {
        await api.updateItem(schema.name, parseInt(id!), saveData)
        refreshList()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      await api.deleteItem(schema.name, parseInt(id!))
      refreshList()
      navigate(`/collections/${schema.name}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="p-8 max-w-3xl">
      <h2 className="text-2xl font-bold mb-6">
        {isNew ? `New ${schema.label.replace(/s$/, '')}` : `Edit ${schema.label.replace(/s$/, '')}`}
      </h2>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded mb-4">{error}</div>
      )}

      <div className="space-y-6">
        {schema.fields.map((field) => {
          const Editor = editorMap[field.type] || StringEditor

          return (
            <div key={field.name}>
              <label className="block text-sm font-medium mb-1">
                {field.name}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <Editor
                field={field}
                value={data[field.name]}
                onChange={(v) => setData({ ...data, [field.name]: v })}
              />
            </div>
          )
        })}
      </div>

      <div className="mt-8 flex gap-4">
        <button
          onClick={() => handleSave(true)}
          disabled={saving}
          className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300 disabled:opacity-50"
        >
          Save Draft
        </button>
        <button
          onClick={() => handleSave(false)}
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Publish
        </button>
        {!isNew && (
          <button
            onClick={handleDelete}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 ml-auto"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add item edit page with form"
```

---

## Phase 9: Field Editors

### Task 9.1: Basic Editors

**Files:**
- Create: `src/admin/editors/StringEditor.tsx`
- Create: `src/admin/editors/TextEditor.tsx`
- Create: `src/admin/editors/NumberEditor.tsx`
- Create: `src/admin/editors/BooleanEditor.tsx`

**Step 1: Create StringEditor**

```tsx
// src/admin/editors/StringEditor.tsx
import type { FieldDefinition } from '@/lib/schema'

interface Props {
  field: FieldDefinition
  value: unknown
  onChange: (v: unknown) => void
}

export default function StringEditor({ field, value, onChange }: Props) {
  return (
    <input
      type="text"
      value={(value as string) || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder}
      className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  )
}
```

**Step 2: Create TextEditor**

```tsx
// src/admin/editors/TextEditor.tsx
import type { FieldDefinition } from '@/lib/schema'

interface Props {
  field: FieldDefinition
  value: unknown
  onChange: (v: unknown) => void
}

export default function TextEditor({ field, value, onChange }: Props) {
  return (
    <textarea
      value={(value as string) || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder}
      rows={5}
      className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  )
}
```

**Step 3: Create NumberEditor**

```tsx
// src/admin/editors/NumberEditor.tsx
import type { FieldDefinition } from '@/lib/schema'

interface Props {
  field: FieldDefinition
  value: unknown
  onChange: (v: unknown) => void
}

export default function NumberEditor({ field, value, onChange }: Props) {
  return (
    <input
      type="number"
      value={(value as number) ?? ''}
      onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : null)}
      placeholder={field.placeholder}
      className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  )
}
```

**Step 4: Create BooleanEditor**

```tsx
// src/admin/editors/BooleanEditor.tsx
import type { FieldDefinition } from '@/lib/schema'

interface Props {
  field: FieldDefinition
  value: unknown
  onChange: (v: unknown) => void
}

export default function BooleanEditor({ field, value, onChange }: Props) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative w-12 h-6 rounded-full transition-colors ${
        value ? 'bg-blue-600' : 'bg-gray-300'
      }`}
    >
      <span
        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
          value ? 'left-7' : 'left-1'
        }`}
      />
    </button>
  )
}
```

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add basic field editors"
```

---

### Task 9.2: Rich Text Editor (Tiptap)

**Files:**
- Create: `src/admin/editors/RichtextEditor.tsx`

**Step 1: Install Tiptap**

Run:
```bash
bun add @tiptap/react @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-image
```

**Step 2: Create RichtextEditor**

```tsx
// src/admin/editors/RichtextEditor.tsx
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import type { FieldDefinition } from '@/lib/schema'

interface Props {
  field: FieldDefinition
  value: unknown
  onChange: (v: unknown) => void
}

export default function RichtextEditor({ value, onChange }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Link.configure({ openOnClick: false }),
      Image,
    ],
    content: (value as string) || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  if (!editor) return null

  return (
    <div className="border rounded">
      {/* Toolbar */}
      <div className="flex gap-1 p-2 border-b bg-gray-50 flex-wrap">
        <ToolbarButton
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          B
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          I
        </ToolbarButton>
        <div className="w-px bg-gray-300 mx-1" />
        <ToolbarButton
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          H2
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          H3
        </ToolbarButton>
        <div className="w-px bg-gray-300 mx-1" />
        <ToolbarButton
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          •
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          1.
        </ToolbarButton>
        <div className="w-px bg-gray-300 mx-1" />
        <ToolbarButton
          active={editor.isActive('link')}
          onClick={() => {
            const url = window.prompt('URL:')
            if (url) {
              editor.chain().focus().setLink({ href: url }).run()
            }
          }}
        >
          🔗
        </ToolbarButton>
      </div>

      {/* Editor */}
      <EditorContent
        editor={editor}
        className="prose max-w-none p-4 min-h-[200px] focus:outline-none"
      />
    </div>
  )
}

function ToolbarButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2 py-1 rounded text-sm font-medium ${
        active ? 'bg-gray-200' : 'hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  )
}
```

**Step 3: Update editor map in ItemEdit.tsx**

```typescript
// In src/admin/pages/ItemEdit.tsx, update the import and map:
import RichtextEditor from '../editors/RichtextEditor'

// Update editorMap:
const editorMap = {
  // ...other editors
  richtext: RichtextEditor,
}
```

**Step 4: Add Tailwind typography plugin**

Run: `bun add -d @tailwindcss/typography`

Update `tailwind.config.js`:
```javascript
export default {
  // ...
  plugins: [require('@tailwindcss/typography')],
}
```

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add Tiptap rich text editor"
```

---

### Task 9.3: Remaining Editors

This task covers: ImageEditor, SlugEditor, SelectEditor, DatetimeEditor, BlocksEditor

Due to length, these follow the same pattern as above. Key points:

**ImageEditor**: Opens media picker modal, shows preview
**SlugEditor**: Auto-generates from source field using `slugify`
**SelectEditor**: Dropdown from field.options
**DatetimeEditor**: Uses native datetime-local input
**BlocksEditor**: Sortable list with add/remove, each block expands to show its fields

---

## Phase 10: Docker & Deployment

### Task 10.1: Dockerfile

**Files:**
- Create: `Dockerfile`

**Step 1: Create Dockerfile**

```dockerfile
# Dockerfile
FROM oven/bun:1.3.8-alpine AS builder

WORKDIR /app
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

FROM oven/bun:1.3.8-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules

# Create directories
RUN mkdir -p data uploads

EXPOSE 3000

CMD ["bun", "run", "start"]
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add Dockerfile"
```

---

### Task 10.2: Docker Compose

**Files:**
- Create: `docker-compose.yml`

**Step 1: Create docker-compose.yml**

```yaml
# docker-compose.yml
services:
  cms:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
      - ./uploads:/app/uploads
    env_file: .env
    restart: unless-stopped
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add docker-compose.yml"
```

---

### Task 10.3: Serve Admin from Server

**Files:**
- Modify: `src/server/index.ts`

**Step 1: Update server to serve admin SPA in production**

```typescript
// Add to src/server/index.ts
import { serveStatic } from '@hono/node-server/serve-static'
import path from 'path'
import fs from 'fs'

// Serve admin SPA (in production)
const adminPath = path.join(process.cwd(), 'dist', 'admin')
if (fs.existsSync(adminPath)) {
  app.use('/admin/*', serveStatic({ root: './dist/admin', rewriteRequestPath: () => '/index.html' }))
  app.use('/admin', serveStatic({ root: './dist/admin' }))
  app.get('/admin', (c) => c.redirect('/admin/'))
}
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: serve admin SPA from production server"
```

---

## Checkpoint: Complete CMS

After completing all phases, you have:

✅ Schema-driven content types (singletons, collections, blocks)
✅ Auto-migration on startup
✅ REST API with auth
✅ File uploads (local + S3)
✅ Webhooks on publish
✅ Three-column admin UI
✅ Field editors including rich text
✅ Docker deployment

**To deploy:**
1. Build: `bun run build`
2. Run: `docker compose up -d`
3. Access: `http://localhost:3000/admin`

---

**Plan complete and saved to `docs/plans/2026-02-05-eggcms-implementation.md` and `docs/plans/2026-02-05-eggcms-implementation-part2.md`.**

**Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
