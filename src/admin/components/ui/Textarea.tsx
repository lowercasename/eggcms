// src/admin/components/ui/Textarea.tsx
import { type TextareaHTMLAttributes } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

export default function Textarea({ className = '', rows = 5, ...props }: TextareaProps) {
  return (
    <textarea
      rows={rows}
      className={`
        w-full px-3 py-2.5 text-sm
        bg-white border border-[#E8E8E3] rounded-lg
        text-[#1A1A18] placeholder:text-[#9C9C91]
        transition-all duration-200
        hover:border-[#DDDDD8]
        focus:outline-none focus:border-[#E5644E] focus:ring-2 focus:ring-[#E5644E]/10
        disabled:bg-[#F5F5F3] disabled:text-[#9C9C91] disabled:cursor-not-allowed
        resize-y min-h-[100px]
        ${className}
      `}
      {...props}
    />
  )
}
