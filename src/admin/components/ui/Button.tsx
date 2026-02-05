// src/admin/components/ui/Button.tsx
import { type ButtonHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  loading?: boolean
}

export default function Button({
  variant = 'primary',
  loading,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const base = `
    inline-flex items-center justify-center gap-2
    px-4 py-2 text-sm font-medium rounded-lg
    transition-all duration-200 ease-out
    disabled:opacity-50 disabled:cursor-not-allowed
    focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
    active:scale-[0.98]
  `

  const variants: Record<Variant, string> = {
    primary: `
      bg-[#E5644E] text-white shadow-sm
      hover:bg-[#D45A45] hover:shadow-md
      focus-visible:ring-[#E5644E]
    `,
    secondary: `
      bg-white text-[#1A1A18] border border-[#E8E8E3]
      hover:bg-[#F5F5F3] hover:border-[#DDDDD8]
      focus-visible:ring-[#9C9C91]
    `,
    ghost: `
      bg-transparent text-[#6B6B63]
      hover:bg-[#F5F5F3] hover:text-[#1A1A18]
      focus-visible:ring-[#9C9C91]
    `,
    danger: `
      bg-[#DC4E42] text-white
      hover:bg-[#c44339]
      focus-visible:ring-[#DC4E42]
    `,
  }

  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  )
}
