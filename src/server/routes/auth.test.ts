// src/server/routes/auth.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Hoist mock functions
const { mockVerifyPassword, mockCreateToken, mockVerifyToken } = vi.hoisted(() => ({
  mockVerifyPassword: vi.fn(),
  mockCreateToken: vi.fn(),
  mockVerifyToken: vi.fn(),
}))

vi.mock('../lib/auth', () => ({
  verifyPassword: mockVerifyPassword,
  createToken: mockCreateToken,
  verifyToken: mockVerifyToken,
}))

// Import after mocks
import auth from './auth'

describe('auth routes', () => {
  const originalEnv = {
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    NODE_ENV: process.env.NODE_ENV,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.ADMIN_EMAIL = 'admin@example.com'
    process.env.ADMIN_PASSWORD = 'secret123'
    process.env.NODE_ENV = 'test'
  })

  afterEach(() => {
    process.env.ADMIN_EMAIL = originalEnv.ADMIN_EMAIL
    process.env.ADMIN_PASSWORD = originalEnv.ADMIN_PASSWORD
    process.env.NODE_ENV = originalEnv.NODE_ENV
  })

  describe('POST /login', () => {
    it('returns 200 and sets cookie on valid credentials', async () => {
      mockVerifyPassword.mockReturnValue(true)
      mockCreateToken.mockResolvedValue('test-jwt-token')

      const res = await auth.request('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@example.com', password: 'secret123' }),
      })

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data.email).toBe('admin@example.com')

      // Check cookie is set
      const setCookie = res.headers.get('set-cookie')
      expect(setCookie).toContain('token=test-jwt-token')
      expect(setCookie).toContain('HttpOnly')
      expect(setCookie).toContain('SameSite=Strict')
    })

    it('returns 401 for invalid email', async () => {
      mockVerifyPassword.mockReturnValue(true)

      const res = await auth.request('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'wrong@example.com', password: 'secret123' }),
      })

      expect(res.status).toBe(401)
      const json = await res.json()
      expect(json.error.code).toBe('INVALID_CREDENTIALS')
    })

    it('returns 401 for invalid password', async () => {
      mockVerifyPassword.mockReturnValue(false)

      const res = await auth.request('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@example.com', password: 'wrongpassword' }),
      })

      expect(res.status).toBe(401)
      const json = await res.json()
      expect(json.error.code).toBe('INVALID_CREDENTIALS')
    })

    it('returns 500 when credentials not configured', async () => {
      delete process.env.ADMIN_EMAIL

      const res = await auth.request('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@test.com', password: 'test' }),
      })

      expect(res.status).toBe(500)
      const json = await res.json()
      expect(json.error.code).toBe('CONFIG_ERROR')
    })

    it('returns 429 after 5 failed attempts', async () => {
      mockVerifyPassword.mockReturnValue(false)

      // Make 5 failed attempts
      for (let i = 0; i < 5; i++) {
        await auth.request('/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-forwarded-for': '192.168.1.100',
          },
          body: JSON.stringify({ email: 'admin@example.com', password: 'wrong' }),
        })
      }

      // 6th attempt should be rate limited
      const res = await auth.request('/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.100',
        },
        body: JSON.stringify({ email: 'admin@example.com', password: 'wrong' }),
      })

      expect(res.status).toBe(429)
      const json = await res.json()
      expect(json.error.code).toBe('RATE_LIMITED')
    })

    it('clears rate limit on successful login', async () => {
      mockVerifyPassword.mockReturnValue(false)

      // Make some failed attempts
      for (let i = 0; i < 3; i++) {
        await auth.request('/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-forwarded-for': '192.168.1.200',
          },
          body: JSON.stringify({ email: 'admin@example.com', password: 'wrong' }),
        })
      }

      // Successful login
      mockVerifyPassword.mockReturnValue(true)
      mockCreateToken.mockResolvedValue('token')

      const successRes = await auth.request('/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.200',
        },
        body: JSON.stringify({ email: 'admin@example.com', password: 'secret123' }),
      })

      expect(successRes.status).toBe(200)

      // More attempts should work (rate limit cleared)
      mockVerifyPassword.mockReturnValue(false)

      const res = await auth.request('/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.200',
        },
        body: JSON.stringify({ email: 'admin@example.com', password: 'wrong' }),
      })

      expect(res.status).toBe(401) // Not 429
    })
  })

  describe('POST /logout', () => {
    it('returns success and deletes cookie', async () => {
      const res = await auth.request('/logout', {
        method: 'POST',
      })

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data.success).toBe(true)

      // Check cookie is deleted (set to expire)
      const setCookie = res.headers.get('set-cookie')
      expect(setCookie).toContain('token=')
    })
  })

  describe('GET /me', () => {
    it('returns user email when authenticated', async () => {
      mockVerifyToken.mockResolvedValue({ email: 'admin@example.com' })

      const res = await auth.request('/me', {
        headers: { Cookie: 'token=valid-jwt-token' },
      })

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data.email).toBe('admin@example.com')
    })

    it('returns 401 when no token', async () => {
      const res = await auth.request('/me')

      expect(res.status).toBe(401)
      const json = await res.json()
      expect(json.error.code).toBe('UNAUTHORIZED')
    })

    it('returns 401 when token is invalid', async () => {
      mockVerifyToken.mockResolvedValue(null)

      const res = await auth.request('/me', {
        headers: { Cookie: 'token=invalid-token' },
      })

      expect(res.status).toBe(401)
      const json = await res.json()
      expect(json.error.code).toBe('UNAUTHORIZED')
    })
  })
})
