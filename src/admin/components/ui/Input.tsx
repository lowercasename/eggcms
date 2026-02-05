// src/admin/components/ui/Input.tsx
import { type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export default function Input({ className = '', ...props }: InputProps) {
  return (
    <input
      className={`
        w-full px-3 py-2.5 text-sm
        bg-white border border-[#E8E8E3] rounded-lg
        text-[#1A1A18] placeholder:text-[#9C9C91]
        transition-all duration-200
        hover:border-[#DDDDD8]
        focus:outline-none focus:border-[#E5644E] focus:ring-2 focus:ring-[#E5644E]/10
        disabled:bg-[#F5F5F3] disabled:text-[#9C9C91] disabled:cursor-not-allowed
        ${className}
      `}
      {...props}
    />
  )
}
