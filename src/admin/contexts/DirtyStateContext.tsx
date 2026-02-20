// src/admin/contexts/DirtyStateContext.tsx
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface DirtyStateContextValue {
  isDirty: boolean
  setDirty: (dirty: boolean) => void
  confirmNavigation: () => boolean
  dirtyItems: Set<string>
  setItemDirty: (itemId: string, dirty: boolean) => void
}

const DirtyStateContext = createContext<DirtyStateContextValue | null>(null)

const EMPTY_SET = new Set<string>()

export function DirtyStateProvider({ children }: { children: ReactNode }) {
  const [isDirty, setIsDirty] = useState(false)
  const [dirtyItems, setDirtyItems] = useState<Set<string>>(new Set())

  const confirmNavigation = useCallback(() => {
    if (isDirty) {
      return window.confirm('You have unsaved changes. Are you sure you want to leave?')
    }
    return true
  }, [isDirty])

  const setDirty = useCallback((dirty: boolean) => {
    setIsDirty(dirty)
  }, [])

  const setItemDirty = useCallback((itemId: string, dirty: boolean) => {
    setDirtyItems(prev => {
      const next = new Set(prev)
      if (dirty) {
        next.add(itemId)
      } else {
        next.delete(itemId)
      }
      return next
    })
  }, [])

  return (
    <DirtyStateContext.Provider value={{ isDirty, setDirty, confirmNavigation, dirtyItems, setItemDirty }}>
      {children}
    </DirtyStateContext.Provider>
  )
}

export function useDirtyStateContext() {
  const context = useContext(DirtyStateContext)
  if (!context) {
    throw new Error('useDirtyStateContext must be used within a DirtyStateProvider')
  }
  return context
}

/** Safe hook that returns dirtyItems or an empty set if no provider is present */
export function useDirtyItems(): { dirtyItems: Set<string> } {
  const context = useContext(DirtyStateContext)
  return { dirtyItems: context?.dirtyItems ?? EMPTY_SET }
}
