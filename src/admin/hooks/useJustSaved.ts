// src/admin/hooks/useJustSaved.ts
import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * A short-lived "Published just now" message: set it, and it clears itself
 * after `ms`. Returns the current message (or null) and the setter.
 */
export function useJustSaved(ms = 2000): [string | null, (message: string) => void] {
  const [message, setMessage] = useState<string | null>(null)
  const timer = useRef<number | null>(null)

  const show = useCallback(
    (text: string) => {
      if (timer.current !== null) window.clearTimeout(timer.current)
      setMessage(text)
      timer.current = window.setTimeout(() => setMessage(null), ms)
    },
    [ms]
  )

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current)
    },
    []
  )

  return [message, show]
}
