// src/admin/components/Layout.tsx
import type { ReactNode } from 'react'
import Sidebar from './Sidebar'
import type { Schema } from '../types'

interface LayoutProps {
  schemas: Schema[]
  children: ReactNode
}

export default function Layout({ schemas, children }: LayoutProps) {
  return (
    <div className="flex h-screen bg-page overflow-hidden">
      <Sidebar schemas={schemas} />
      <main className="flex-1 min-w-0 flex">{children}</main>
    </div>
  )
}
