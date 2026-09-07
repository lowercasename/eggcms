// src/admin/components/ui/dialogStack.ts
// Escape should close only the top-most open dialog. Every dialog registers
// its close handler here while open; one document listener calls the last one.
const stack: Array<() => void> = []
let listening = false

function onKeyDown(e: KeyboardEvent) {
  if (e.key !== 'Escape' || stack.length === 0) return
  e.stopPropagation()
  stack[stack.length - 1]()
}

/** Register `close` as the current top dialog; returns the function that removes it. */
export function pushDialog(close: () => void): () => void {
  stack.push(close)
  if (!listening) {
    document.addEventListener('keydown', onKeyDown)
    listening = true
  }
  return () => {
    const i = stack.lastIndexOf(close)
    if (i !== -1) stack.splice(i, 1)
    if (stack.length === 0 && listening) {
      document.removeEventListener('keydown', onKeyDown)
      listening = false
    }
  }
}
