// src/admin/contexts/DirtyStateContext.tsx
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface DirtyStateContextValue {
  isDirty: boolean
  setDirty: (dirty: boolean) => void
  confirmNavigation: () => boolean
}

const DirtyStateContext = createContext<DirtyStateContextValue | null>(null)

export function DirtyStateProvider({ children }: { children: ReactNode }) {
  const [isDirty, setIsDirty] = useState(false)

  const confirmNavigation = useCallback(() => {
    if (isDirty) {
      return window.confirm('You have unsaved changes. Are you sure you want to leave?')
    }
    return true
  }, [isDirty])

  const setDirty = useCallback((dirty: boolean) => {
    setIsDirty(dirty)
  }, [])

  return (
    <DirtyStateContext.Provider value={{ isDirty, setDirty, confirmNavigation }}>
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
