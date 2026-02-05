// src/admin/components/ui/Alert.tsx
import { type ReactNode } from 'react'
import { AlertCircle, CheckCircle, AlertTriangle, Info, type LucideIcon } from 'lucide-react'

type Variant = 'error' | 'success' | 'warning' | 'info'

interface AlertProps {
  variant?: Variant
  children: ReactNode
  className?: string
}

const variants: Record<Variant, { bg: string; text: string; Icon: LucideIcon }> = {
  error: {
    bg: 'bg-[#FEF2F1]',
    text: 'text-[#DC4E42]',
    Icon: AlertCircle,
  },
  success: {
    bg: 'bg-[#F0F9F3]',
    text: 'text-[#3D9A5D]',
    Icon: CheckCircle,
  },
  warning: {
    bg: 'bg-[#FEF8EC]',
    text: 'text-[#B8862B]',
    Icon: AlertTriangle,
  },
  info: {
    bg: 'bg-[#F0F4FE]',
    text: 'text-[#4B6BFB]',
    Icon: Info,
  },
}

export default function Alert({ variant = 'info', children, className = '' }: AlertProps) {
  const style = variants[variant]
  const { Icon } = style

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 px-4 py-3 rounded-lg ${style.bg} ${className}`}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${style.text}`} strokeWidth={1.5} />
      <div className={`text-sm font-medium ${style.text}`}>
        {children}
      </div>
    </div>
  )
}
