// src/admin/components/ui/Input.tsx
import { type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Slugs, URLs and counts are set in mono at 16px. */
  mono?: boolean
}

export default function Input({ className = '', mono, ...props }: InputProps) {
  return (
    <input
      className={[
        'control w-full px-3 py-[11px] leading-tight placeholder:text-ink-2',
        mono ? 'font-mono text-[16px]' : 'text-[17px]',
        className,
      ].join(' ')}
      {...props}
    />
  )
}
