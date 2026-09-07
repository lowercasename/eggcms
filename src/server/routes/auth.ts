import { Hono } from 'hono'
import { setCookie, deleteCookie, getCookie } from 'hono/cookie'
import { verifyPassword, createToken, verifyToken } from '../lib/auth'

const auth = new Hono()

// There is deliberately no rate limiting here. Anything the app could key on
// (x-forwarded-for, say) is a header the client chooses, so a limiter built
// on it is bypassed by rotating the header. The reverse proxy in front of the
// CMS sees the real TCP peer and limits on that; see "Serving with Caddy" in
// the README.

auth.post('/login', async (c) => {
  const body = await c.req.json()
  const { email, password } = body

  const validEmail = process.env.ADMIN_EMAIL
  const validPassword = process.env.ADMIN_PASSWORD

  if (!validEmail || !validPassword) {
    return c.json({ error: { code: 'CONFIG_ERROR', message: 'Admin credentials not configured' } }, 500)
  }

  if (email !== validEmail || !verifyPassword(password, validPassword)) {
    return c.json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } }, 401)
  }

  const token = await createToken(email)

  setCookie(c, 'token', token, {
    httpOnly: true,
    // Always Secure, whatever NODE_ENV says: the admin is only served over
    // HTTPS, and browsers treat http://localhost as a secure context.
    secure: true,
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

// Check current session - requires valid token
auth.get('/me', async (c) => {
  const token = getCookie(c, 'token')
  if (!token) {
    return c.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, 401)
  }

  const payload = await verifyToken(token)
  if (!payload) {
    return c.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }, 401)
  }

  return c.json({ data: { email: payload.email } })
})

export default auth
