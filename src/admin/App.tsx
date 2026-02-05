// src/admin/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Collection from './pages/Collection'
import ItemEdit from './pages/ItemEdit'
import Singleton from './pages/Singleton'
import Media from './pages/Media'

// Import schemas - in a real app, these would come from the server
// For now, we'll define them here as a placeholder
import type { Schema } from './types'

const schemas: Schema[] = [
  {
    name: 'settings',
    label: 'Settings',
    type: 'singleton',
    fields: [
      { name: 'siteTitle', type: 'string', required: true },
      { name: 'tagline', type: 'string' },
      { name: 'logo', type: 'image' },
      { name: 'footerText', type: 'string' },
    ],
  },
  {
    name: 'post',
    label: 'Posts',
    type: 'collection',
    fields: [
      { name: 'title', type: 'string', required: true },
      { name: 'slug', type: 'slug', from: 'title' },
      { name: 'content', type: 'richtext' },
      { name: 'featuredImage', type: 'image' },
      { name: 'publishedAt', type: 'datetime' },
    ],
  },
]

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<Layout schemas={schemas} />}>
          <Route index element={<Navigate to={`/collections/${schemas.find(s => s.type === 'collection')?.name || 'post'}`} replace />} />
          <Route path="/collections/:schema" element={<Collection schemas={schemas} />}>
            <Route index element={<div className="p-8 text-gray-500">Select an item or create a new one</div>} />
            <Route path=":id" element={<ItemEdit />} />
          </Route>
          <Route path="/singletons/:schema" element={<Singleton schemas={schemas} />} />
          <Route path="/media" element={<Media />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
