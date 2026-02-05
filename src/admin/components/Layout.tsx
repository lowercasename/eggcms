// src/admin/components/Layout.tsx
import { Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Sidebar from './Sidebar'
import type { Schema } from '../types'

interface LayoutProps {
  schemas: Schema[]
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
