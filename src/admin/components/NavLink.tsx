// src/admin/components/NavLink.tsx
import { useCallback, type ReactNode, type MouseEvent } from 'react'
import { Link, useLocation } from 'wouter'
import { useDirtyStateContext } from '../contexts/DirtyStateContext'

interface NavLinkProps {
  href: string
  className?: string
  children: ReactNode
}

/**
 * Navigation link that confirms before navigating if there are unsaved changes.
 */
export default function NavLink({ href, className, children }: NavLinkProps) {
  const { confirmNavigation } = useDirtyStateContext()
  const [, navigate] = useLocation()

  const handleClick = useCallback((e: MouseEvent<HTMLAnchorElement>) => {
    if (!confirmNavigation()) {
      e.preventDefault()
    }
  }, [confirmNavigation])

  return (
    <Link href={href} className={className} onClick={handleClick}>
      {children}
    </Link>
  )
}
