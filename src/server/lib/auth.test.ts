import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { verifyPassword, createToken, verifyToken, getJwtSecret, JWT_SECRET_MIN_LENGTH } from './auth'

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
  jwtVerify: (token: string, key: Uint8Array, options?: unknown) => mockJwtVerify(token, key, options),
}))

const GOOD_SECRET = 'a-perfectly-adequate-secret-of-forty-chars'

function withSecret(value: string | undefined) {
  const original = process.env.JWT_SECRET
  beforeEach(() => {
    vi.clearAllMocks()
    if (value === undefined) delete process.env.JWT_SECRET
    else process.env.JWT_SECRET = value
  })
  afterEach(() => {
    if (original) process.env.JWT_SECRET = original
    else delete process.env.JWT_SECRET
  })
}

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

describe('getJwtSecret', () => {
  const original = process.env.JWT_SECRET
  afterEach(() => {
    if (original) process.env.JWT_SECRET = original
    else delete process.env.JWT_SECRET
  })

  it('returns the secret as bytes when it is long enough', () => {
    process.env.JWT_SECRET = GOOD_SECRET
    expect(getJwtSecret()).toEqual(new TextEncoder().encode(GOOD_SECRET))
  })

  it('throws when JWT_SECRET is not set', () => {
    delete process.env.JWT_SECRET
    expect(() => getJwtSecret()).toThrow(/JWT_SECRET is not set/)
  })

  it('throws when JWT_SECRET is empty', () => {
    process.env.JWT_SECRET = ''
    expect(() => getJwtSecret()).toThrow(/JWT_SECRET is not set/)
  })

  it(`throws when JWT_SECRET is shorter than ${JWT_SECRET_MIN_LENGTH} characters`, () => {
    process.env.JWT_SECRET = 'x'.repeat(JWT_SECRET_MIN_LENGTH - 1)
    expect(() => getJwtSecret()).toThrow(/at least 32 characters/)
  })

  it('accepts a secret of exactly the minimum length', () => {
    process.env.JWT_SECRET = 'x'.repeat(JWT_SECRET_MIN_LENGTH)
    expect(() => getJwtSecret()).not.toThrow()
  })

  it('rejects the placeholder values that ship in the examples', () => {
    for (const placeholder of ['dev-secret', 'generate-a-random-32-char-string', 'your-random-32-char-secret-key']) {
      process.env.JWT_SECRET = placeholder
      expect(() => getJwtSecret(), placeholder).toThrow(/placeholder|at least/)
    }
  })
})

describe('createToken', () => {
  withSecret(GOOD_SECRET)

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

describe('createToken without a secret', () => {
  withSecret(undefined)

  it('throws instead of falling back to a built-in secret', async () => {
    await expect(createToken('user@example.com')).rejects.toThrow(/JWT_SECRET/)
    expect(mockSign).not.toHaveBeenCalled()
  })
})

describe('verifyToken', () => {
  withSecret(GOOD_SECRET)

  it('returns payload for valid token', async () => {
    mockJwtVerify.mockResolvedValue({ payload: { email: 'valid@example.com' } })

    const result = await verifyToken('valid-token')

    expect(result).toEqual({ email: 'valid@example.com' })
    expect(mockJwtVerify).toHaveBeenCalled()
    expect(mockJwtVerify.mock.calls[0][0]).toBe('valid-token')
  })

  it('verifies with the configured secret and only accepts HS256', async () => {
    mockJwtVerify.mockResolvedValue({ payload: { email: 'valid@example.com' } })

    await verifyToken('valid-token')

    const [, key, options] = mockJwtVerify.mock.calls[0]
    expect(key).toEqual(new TextEncoder().encode(GOOD_SECRET))
    expect(options).toEqual({ algorithms: ['HS256'] })
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

describe('verifyToken without a secret', () => {
  withSecret(undefined)

  it('throws rather than quietly treating every token as invalid', async () => {
    await expect(verifyToken('any-token')).rejects.toThrow(/JWT_SECRET/)
    expect(mockJwtVerify).not.toHaveBeenCalled()
  })
})
