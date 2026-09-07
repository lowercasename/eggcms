// src/admin/components/NavLink.tsx
import { useCallback, type ReactNode, type MouseEvent, type AnchorHTMLAttributes } from 'react'
import { Link } from 'wouter'
import { useDirtyStateContext } from '../contexts/DirtyStateContext'

interface NavLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'onClick'> {
  href: string
  className?: string
  children: ReactNode
}

/**
 * Navigation link that confirms before navigating if there are unsaved changes.
 */
export default function NavLink({ href, className, children, ...rest }: NavLinkProps) {
  const { confirmNavigation } = useDirtyStateContext()

  const handleClick = useCallback((e: MouseEvent<HTMLAnchorElement>) => {
    if (!confirmNavigation()) {
      e.preventDefault()
    }
  }, [confirmNavigation])

  return (
    <Link href={href} className={className} onClick={handleClick} {...rest}>
      {children}
    </Link>
  )
}
