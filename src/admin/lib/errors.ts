// src/admin/lib/errors.ts

/** What went wrong, in words: an Error's message, or `fallback` for anything else a promise may reject with. */
export function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback
}
