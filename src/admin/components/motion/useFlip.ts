// src/admin/components/motion/useFlip.ts
import { useLayoutEffect, useRef, type RefObject } from 'react'
import { prefersReducedMotion } from './useReducedMotion'

/**
 * FLIP for a reorderable list. Children carry `data-flip-key`; whenever `order`
 * changes, each child that moved is slid from its old position to its new one
 * over 200ms, so both rows visibly swap instead of jumping.
 */
export function useFlip(container: RefObject<HTMLElement | null>, order: string, duration = 200) {
  const previous = useRef<Map<string, number>>(new Map())

  useLayoutEffect(() => {
    const root = container.current
    if (!root) return
    const nodes = Array.from(root.querySelectorAll<HTMLElement>('[data-flip-key]'))
    const next = new Map<string, number>()
    for (const node of nodes) next.set(node.dataset.flipKey!, node.getBoundingClientRect().top)

    if (!prefersReducedMotion()) {
      for (const node of nodes) {
        const key = node.dataset.flipKey!
        const before = previous.current.get(key)
        const after = next.get(key)
        if (before === undefined || after === undefined) continue
        const dy = before - after
        if (!dy) continue
        node.style.transition = 'none'
        node.style.transform = `translateY(${dy}px)`
        requestAnimationFrame(() => {
          node.style.transition = `transform ${duration}ms var(--ease-move)`
          node.style.transform = ''
          window.setTimeout(() => {
            node.style.transition = ''
          }, duration + 20)
        })
      }
    }

    previous.current = next
  }, [container, order, duration])
}
