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
    <div className="flex min-h-screen bg-[#FAFAF8]">
      <Sidebar schemas={schemas} />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
