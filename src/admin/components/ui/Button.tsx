// src/admin/components/ui/Button.tsx
import { type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

export type ButtonVariant =
  | 'primary'          // terracotta fill – the one thing to do next
  | 'secondary'        // white, 1.5px ink-3 border
  | 'destructive'      // white, red text and border ("Delete 2 files", "Remove section")
  | 'destructive-solid' // red fill – the confirming half of a destructive pair
  | 'dark'             // ink fill ("Done writing")
  | 'structure'        // white, slate border – only for adding structure
  | 'ghost'            // borderless, for overflow menus and toolbars
  | 'icon'             // square, bordered, needs aria-label

export type ButtonSize = 'md' | 'sm'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  /** Leading icon, sized by the button. */
  icon?: ReactNode
  fullWidth?: boolean
}

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-action text-white border-action font-bold hover:bg-action-text',
  secondary: 'bg-panel text-ink-nav border-ink-3 font-semibold hover:bg-page',
  destructive: 'bg-panel text-danger-text border-danger font-bold hover:bg-action-tint',
  'destructive-solid': 'bg-danger text-white border-danger font-bold hover:brightness-95',
  dark: 'bg-selected text-white border-selected font-bold hover:brightness-125',
  structure: 'bg-panel text-structure border-structure font-bold hover:bg-structure-tint',
  ghost: 'bg-transparent text-ink-nav border-transparent font-semibold hover:bg-page',
  icon: 'bg-panel text-ink-nav border-line-input hover:bg-page',
}

const sizes: Record<ButtonSize, string> = {
  md: 'text-[15px] px-4 py-[10px] rounded-button gap-2 [&_svg]:w-[17px] [&_svg]:h-[17px]',
  sm: 'text-[14px] px-3 py-2 rounded-control gap-1.5 [&_svg]:w-[15px] [&_svg]:h-[15px]',
}

const iconSizes: Record<ButtonSize, string> = {
  md: 'w-[38px] h-[38px] rounded-control [&_svg]:w-[18px] [&_svg]:h-[18px]',
  sm: 'w-[34px] h-[34px] rounded-control [&_svg]:w-4 [&_svg]:h-4',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  icon,
  fullWidth,
  children,
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  const isIcon = variant === 'icon'
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={[
        'inline-flex items-center justify-center border-[1.5px] leading-none whitespace-nowrap',
        'transition-[background-color,color,border-color,opacity] duration-150',
        'disabled:bg-disabled disabled:text-line-input disabled:border-line-strong',
        isIcon ? iconSizes[size] : sizes[size],
        variants[variant],
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
      {...props}
    >
      {loading ? <Loader2 className="animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  )
}
