import { describe, it, expect } from 'vitest'
import { verifyPassword } from './auth'

describe('verifyPassword', () => {
  it('returns true for matching password', () => {
    expect(verifyPassword('secret', 'secret')).toBe(true)
  })

  it('returns false for non-matching password', () => {
    expect(verifyPassword('secret', 'wrong')).toBe(false)
  })
})
