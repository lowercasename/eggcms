import { Hono } from 'hono'
import { setCookie, deleteCookie } from 'hono/cookie'
import { verifyPassword, createToken } from '../lib/auth'

const auth = new Hono()

// Rate limiting state (simple in-memory)
const loginAttempts = new Map<string, { count: number; resetAt: number }>()

auth.post('/login', async (c) => {
  const ip = c.req.header('x-forwarded-for') || 'unknown'

  // Rate limiting
  const now = Date.now()
  const attempts = loginAttempts.get(ip)
  if (attempts && attempts.count >= 5 && now < attempts.resetAt) {
    return c.json({ error: { code: 'RATE_LIMITED', message: 'Too many attempts' } }, 429)
  }

  const body = await c.req.json()
  const { email, password } = body

  const validEmail = process.env.ADMIN_EMAIL
  const validPassword = process.env.ADMIN_PASSWORD

  if (!validEmail || !validPassword) {
    return c.json({ error: { code: 'CONFIG_ERROR', message: 'Admin credentials not configured' } }, 500)
  }

  if (email !== validEmail || !verifyPassword(password, validPassword)) {
    // Track failed attempt
    const current = loginAttempts.get(ip) || { count: 0, resetAt: now + 60000 }
    loginAttempts.set(ip, { count: current.count + 1, resetAt: current.resetAt })

    return c.json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } }, 401)
  }

  // Clear attempts on success
  loginAttempts.delete(ip)

  const token = await createToken(email)

  setCookie(c, 'token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })

  return c.json({ data: { email } })
})

auth.post('/logout', (c) => {
  deleteCookie(c, 'token', { path: '/' })
  return c.json({ data: { success: true } })
})

export default auth
