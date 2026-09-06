// src/admin/contexts/EntryContext.tsx
import { createContext, useContext } from 'react'

export interface EntryContextValue {
  /** The record has never been saved; some fields behave differently (a slug writes itself). */
  isNew: boolean
}

const EntryContext = createContext<EntryContextValue>({ isNew: false })

export const EntryProvider = EntryContext.Provider

export function useEntry(): EntryContextValue {
  return useContext(EntryContext)
}
