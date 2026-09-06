// src/admin/components/ui/Label.tsx
import { type LabelHTMLAttributes } from 'react'

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean
}

/** 15px sentence-case label; required fields get a terracotta asterisk. */
export default function Label({ required, children, className = '', ...props }: LabelProps) {
  return (
    <label className={`block text-[15px] font-semibold text-ink leading-snug ${className}`} {...props}>
      {children}
      {required && (
        <span className="text-action ml-1" aria-hidden>
          *
        </span>
      )}
    </label>
  )
}
