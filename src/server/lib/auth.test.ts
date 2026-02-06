import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { verifyPassword, createToken, verifyToken } from './auth'

// Mock jose for testing (jsdom environment has Uint8Array issues with jose)
const mockSign = vi.fn()
const mockJwtVerify = vi.fn()

vi.mock('jose', () => ({
  SignJWT: vi.fn().mockImplementation((payload) => ({
    setProtectedHeader: vi.fn().mockReturnThis(),
    setIssuedAt: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    sign: () => {
      mockSign(payload)
      return Promise.resolve(`mock-token-${JSON.stringify(payload)}`)
    },
  })),
  jwtVerify: (token: string) => mockJwtVerify(token),
}))

describe('verifyPassword', () => {
  it('returns true for matching password', () => {
    expect(verifyPassword('secret', 'secret')).toBe(true)
  })

  it('returns false for non-matching password', () => {
    expect(verifyPassword('secret', 'wrong')).toBe(false)
  })

  it('returns false for different length passwords', () => {
    expect(verifyPassword('short', 'muchlongerpassword')).toBe(false)
  })

  it('handles empty strings', () => {
    expect(verifyPassword('', '')).toBe(true)
    expect(verifyPassword('', 'notempty')).toBe(false)
  })
})

describe('createToken', () => {
  const originalEnv = process.env.JWT_SECRET

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.JWT_SECRET = 'test-secret-key'
  })

  afterEach(() => {
    if (originalEnv) {
      process.env.JWT_SECRET = originalEnv
    } else {
      delete process.env.JWT_SECRET
    }
  })

  it('creates a token string', async () => {
    const token = await createToken('user@example.com')

    expect(token).toBeTruthy()
    expect(typeof token).toBe('string')
  })

  it('passes email to SignJWT', async () => {
    await createToken('user@example.com')

    expect(mockSign).toHaveBeenCalledWith({ email: 'user@example.com' })
  })

  it('creates unique tokens per email', async () => {
    const token1 = await createToken('user1@example.com')
    const token2 = await createToken('user2@example.com')

    expect(token1).not.toBe(token2)
  })
})

describe('verifyToken', () => {
  const originalEnv = process.env.JWT_SECRET

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.JWT_SECRET = 'test-secret-key'
  })

  afterEach(() => {
    if (originalEnv) {
      process.env.JWT_SECRET = originalEnv
    } else {
      delete process.env.JWT_SECRET
    }
  })

  it('returns payload for valid token', async () => {
    mockJwtVerify.mockResolvedValue({ payload: { email: 'valid@example.com' } })

    const result = await verifyToken('valid-token')

    expect(result).toEqual({ email: 'valid@example.com' })
    expect(mockJwtVerify).toHaveBeenCalled()
    expect(mockJwtVerify.mock.calls[0][0]).toBe('valid-token')
  })

  it('returns null when jwtVerify throws', async () => {
    mockJwtVerify.mockRejectedValue(new Error('Invalid token'))

    const result = await verifyToken('invalid-token')

    expect(result).toBeNull()
  })

  it('returns null for any verification error', async () => {
    mockJwtVerify.mockRejectedValue(new Error('Signature mismatch'))

    const result = await verifyToken('bad-signature-token')

    expect(result).toBeNull()
  })

  it('passes token to jwtVerify', async () => {
    mockJwtVerify.mockResolvedValue({ payload: { email: 'test@test.com' } })

    await verifyToken('my-token-123')

    expect(mockJwtVerify).toHaveBeenCalled()
    expect(mockJwtVerify.mock.calls[0][0]).toBe('my-token-123')
  })
})
