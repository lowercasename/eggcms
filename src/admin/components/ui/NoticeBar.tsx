// src/admin/components/ui/NoticeBar.tsx
import { type ReactNode } from 'react'
import { CircleDot, Info, CheckSquare, Check, AlertCircle } from 'lucide-react'

export type NoticeVariant = 'unsaved' | 'info' | 'selection' | 'published' | 'error'

interface NoticeBarProps {
  variant: NoticeVariant
  children: ReactNode
  actions?: ReactNode
  icon?: ReactNode
  /** Pin to the top of the scroll container. */
  sticky?: boolean
  /** Play the slide-down entrance. */
  animate?: boolean
  className?: string
}

const styles: Record<NoticeVariant, { classes: string; Icon: typeof Info; iconColor: string }> = {
  unsaved: {
    classes: 'bg-draft-tint border-b-2 border-draft-2 text-draft',
    Icon: CircleDot,
    iconColor: 'text-draft-2',
  },
  selection: {
    classes: 'bg-draft-tint border-b-2 border-draft-2 text-draft',
    Icon: CheckSquare,
    iconColor: 'text-draft-2',
  },
  info: {
    classes: 'bg-page border-b border-line-strong text-ink-nav',
    Icon: Info,
    iconColor: 'text-ink-nav',
  },
  published: {
    classes: 'bg-published-tint border-b-2 border-published-border text-published',
    Icon: Check,
    iconColor: 'text-published-icon',
  },
  error: {
    classes: 'bg-action-tint border-b-2 border-danger text-danger-text',
    Icon: AlertCircle,
    iconColor: 'text-danger',
  },
}

/**
 * A full-width strip that says what is going on and offers the way out:
 * "3 unsaved changes" + Publish, "2 files selected" + Delete, and so on.
 */
export default function NoticeBar({ variant, children, actions, icon, sticky, animate, className = '' }: NoticeBarProps) {
  const { classes, Icon, iconColor } = styles[variant]
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={[
        'flex items-center gap-3.5 px-6 py-3 text-[15px]',
        classes,
        sticky ? 'sticky top-0 z-20 shadow-bar' : '',
        animate ? 'animate-slide-down' : '',
        className,
      ].join(' ')}
    >
      <span className={`shrink-0 ${iconColor} [&_svg]:w-[19px] [&_svg]:h-[19px]`}>{icon ?? <Icon aria-hidden />}</span>
      <div className="flex-1 min-w-0 [&_b]:font-bold">{children}</div>
      {actions && <div className="flex items-center gap-2.5 shrink-0">{actions}</div>}
    </div>
  )
}
