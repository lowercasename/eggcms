// src/admin/components/ui/FormField.tsx
import { type ReactNode } from 'react'
import Label from './Label'

interface FormFieldProps {
  label: string
  required?: boolean
  hint?: string
  children: ReactNode
  className?: string
}

export default function FormField({ label, required, hint, children, className = '' }: FormFieldProps) {
  return (
    <div className={className}>
      <Label required={required}>{label}</Label>
      {children}
      {hint && (
        <p className="mt-1.5 text-xs text-[#9C9C91]">{hint}</p>
      )}
    </div>
  )
}
