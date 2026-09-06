// src/admin/contexts/SectionContext.tsx
import { createContext, useContext } from 'react'

/** Where a field sits when it lives inside a block: "Book · section 3 of 12". */
export interface SectionContextValue {
  typeLabel: string
  /** zero-based */
  index: number
  total: number
}

const SectionContext = createContext<SectionContextValue | null>(null)

export const SectionProvider = SectionContext.Provider

export function useSection(): SectionContextValue | null {
  return useContext(SectionContext)
}

/** "Book · section 3 of 12", or null outside a block. */
export function describeSection(section: SectionContextValue | null): string | null {
  if (!section) return null
  return `${section.typeLabel} · section ${section.index + 1} of ${section.total}`
}
