// src/admin/components/ui/Label.tsx
import { type LabelHTMLAttributes } from 'react'

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean
}

export default function Label({ required, children, className = '', ...props }: LabelProps) {
  return (
    <label
      className={`block text-sm font-medium text-[#1A1A18] mb-2 ${className}`}
      {...props}
    >
      {children}
      {required && <span className="text-[#E5644E] ml-1">*</span>}
    </label>
  )
}
