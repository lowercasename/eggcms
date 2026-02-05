// src/admin/components/ui/Select.tsx
import { type SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: Array<{ value: string; label: string }>
  placeholder?: string
}

export default function Select({ options, placeholder, className = '', ...props }: SelectProps) {
  return (
    <select
      className={`
        w-full px-3 py-2.5 text-sm
        bg-white border border-[#E8E8E3] rounded-lg
        text-[#1A1A18]
        transition-all duration-200
        hover:border-[#DDDDD8]
        focus:outline-none focus:border-[#E5644E] focus:ring-2 focus:ring-[#E5644E]/10
        disabled:bg-[#F5F5F3] disabled:text-[#9C9C91] disabled:cursor-not-allowed
        cursor-pointer appearance-none
        bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239C9C91%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')]
        bg-[length:16px] bg-[right_12px_center] bg-no-repeat
        pr-10
        ${className}
      `}
      {...props}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}
