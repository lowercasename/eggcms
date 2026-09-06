// src/admin/components/ui/Alert.tsx
import { type ReactNode } from 'react'
import NoticeBar, { type NoticeVariant } from './NoticeBar'

type Variant = 'error' | 'success' | 'warning' | 'info'

interface AlertProps {
  variant?: Variant
  children: ReactNode
  className?: string
}

const map: Record<Variant, NoticeVariant> = {
  error: 'error',
  success: 'published',
  warning: 'unsaved',
  info: 'info',
}

/** An inline notice with rounded corners, for errors inside a form or dialog. */
export default function Alert({ variant = 'info', children, className = '' }: AlertProps) {
  return (
    <NoticeBar variant={map[variant]} className={`rounded-control border-b-0 border-[1.5px] px-4 ${className}`}>
      {children}
    </NoticeBar>
  )
}
