// src/admin/components/motion/pin.ts
import { prefersReducedMotion } from './useReducedMotion'

/** The nearest ancestor that scrolls vertically, or the window. */
function scrollParent(el: HTMLElement): HTMLElement | Window {
  let node: HTMLElement | null = el.parentElement
  while (node) {
    const { overflowY } = getComputedStyle(node)
    if (/(auto|scroll)/.test(overflowY) && node.scrollHeight > node.clientHeight) return node
    node = node.parentElement
  }
  return window
}

/**
 * Keeps `el` at the same place on screen for `duration` ms while things above
 * it change height (an accordion closing a block higher up). Each frame, any
 * drift of the element's top edge is cancelled by scrolling the same amount.
 */
export function pinElement(el: HTMLElement, duration = 260) {
  if (typeof requestAnimationFrame !== 'function') return
  const target = scrollParent(el)
  const startTop = el.getBoundingClientRect().top
  const started = performance.now()
  const budget = prefersReducedMotion() ? 0 : duration

  // The moment the person scrolls themselves, stop steering.
  let cancelled = false
  const cancel = () => {
    cancelled = true
  }
  const opts = { passive: true, once: true } as const
  window.addEventListener('wheel', cancel, opts)
  window.addEventListener('touchmove', cancel, opts)

  const step = () => {
    if (cancelled || !el.isConnected) return
    const drift = el.getBoundingClientRect().top - startTop
    if (drift) {
      if (target === window) window.scrollBy(0, drift)
      else (target as HTMLElement).scrollTop += drift
    }
    if (performance.now() - started < budget) requestAnimationFrame(step)
    else {
      window.removeEventListener('wheel', cancel)
      window.removeEventListener('touchmove', cancel)
    }
  }
  requestAnimationFrame(step)
}
