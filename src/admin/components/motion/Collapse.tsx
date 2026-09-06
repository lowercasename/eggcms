// src/admin/components/motion/Collapse.tsx
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type TransitionEvent } from 'react'
import { prefersReducedMotion } from './useReducedMotion'

interface CollapseProps {
  open: boolean
  children: ReactNode
  /** Grow in from nothing on first mount (a block that was just inserted). */
  appear?: boolean
  /** Transition length in ms. */
  duration?: number
  /** Called once the closing transition has finished and the content is gone. */
  onClosed?: () => void
  className?: string
}

/**
 * Animates height with `grid-template-rows: 0fr → 1fr`, so nothing has to be
 * measured. Content is mounted only while open (or closing), and is hidden from
 * assistive tech the moment it starts to close. A timer backs up the
 * transitionend event so the close always completes.
 */
export default function Collapse({ open, children, appear = false, duration = 200, onClosed, className = '' }: CollapseProps) {
  const [rendered, setRendered] = useState(open)
  const [expanded, setExpanded] = useState(open && !appear)
  const closedRef = useRef(onClosed)
  closedRef.current = onClosed
  const timer = useRef<number | null>(null)

  const clearTimer = () => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current)
      timer.current = null
    }
  }

  // Opening: mount, then expand on the next frame so the transition runs.
  useLayoutEffect(() => {
    if (!open) return
    clearTimer()
    setRendered(true)
    if (prefersReducedMotion()) {
      setExpanded(true)
      return
    }
    const frame = requestAnimationFrame(() => setExpanded(true))
    return () => cancelAnimationFrame(frame)
  }, [open])

  // Closing: shrink, and make sure we finish even without a transitionend.
  useEffect(() => {
    if (open || !rendered) return
    setExpanded(false)
    const wait = prefersReducedMotion() ? 0 : duration + 50
    timer.current = window.setTimeout(finish, wait)
    return clearTimer
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const finish = () => {
    clearTimer()
    setRendered(false)
    closedRef.current?.()
  }

  const onTransitionEnd = (e: TransitionEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return
    if (!open) finish()
  }

  if (!rendered) return null

  return (
    <div
      data-testid="collapse"
      aria-hidden={!open || undefined}
      // @ts-expect-error React 19 accepts the boolean attribute; older typings do not.
      inert={!open ? '' : undefined}
      onTransitionEnd={onTransitionEnd}
      className={className}
      style={{
        display: 'grid',
        gridTemplateRows: expanded ? '1fr' : '0fr',
        transition: `grid-template-rows ${duration}ms var(--ease-move)`,
      }}
    >
      <div className="min-h-0 overflow-hidden" style={{ opacity: expanded ? 1 : 0, transition: 'opacity 100ms ease-out' }}>
        {children}
      </div>
    </div>
  )
}
