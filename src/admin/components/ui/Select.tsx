// src/admin/components/ui/Select.tsx
import { type SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: Array<{ value: string; label: string }>
  placeholder?: string
}

/** A native select with a visible chevron, so it reads as a choice. */
export default function Select({ options, placeholder, className = '', ...props }: SelectProps) {
  return (
    <div className="relative w-full">
      <select
        className={`control w-full px-3 py-[11px] pr-11 text-[17px] leading-tight appearance-none cursor-pointer ${className}`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-ink-nav pointer-events-none" aria-hidden />
    </div>
  )
}
