// src/admin/components/ui/Heading.tsx
import { type ReactNode } from 'react'

type Level = 1 | 2 | 3 | 4

interface HeadingProps {
  level?: Level
  children: ReactNode
  className?: string
}

const styles: Record<Level, string> = {
  1: 'text-[24px] font-bold tracking-tight',
  2: 'text-[19px] font-bold',
  3: 'text-[16px] font-bold',
  4: 'text-[15px] font-bold',
}

export default function Heading({ level = 2, children, className = '' }: HeadingProps) {
  const Tag = `h${level}` as const
  return <Tag className={`${styles[level]} text-ink m-0 leading-tight ${className}`}>{children}</Tag>
}
