// src/admin/components/ui/Textarea.tsx
import { type TextareaHTMLAttributes } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

export default function Textarea({ className = '', rows = 5, ...props }: TextareaProps) {
  return (
    <textarea
      rows={rows}
      className={`control w-full px-3 py-[11px] text-[17px] leading-relaxed placeholder:text-ink-3 placeholder:italic resize-y min-h-[120px] ${className}`}
      {...props}
    />
  )
}
