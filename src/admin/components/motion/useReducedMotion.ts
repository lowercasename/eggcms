// src/admin/components/motion/useReducedMotion.ts

/** True when the person has asked the OS for less motion. Safe outside a browser. */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}
