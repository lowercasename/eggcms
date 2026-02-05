// src/admin/components/ui/Heading.tsx
import { type ReactNode } from 'react'

type Level = 1 | 2 | 3 | 4

interface HeadingProps {
  level?: Level
  children: ReactNode
  className?: string
}

const styles: Record<Level, string> = {
  1: 'text-2xl font-bold tracking-tight',
  2: 'text-xl font-semibold tracking-tight',
  3: 'text-lg font-semibold',
  4: 'text-base font-medium',
}

export default function Heading({ level = 2, children, className = '' }: HeadingProps) {
  const Tag = `h${level}` as const

  return (
    <Tag className={`${styles[level]} text-[#1A1A18] ${className}`}>
      {children}
    </Tag>
  )
}
