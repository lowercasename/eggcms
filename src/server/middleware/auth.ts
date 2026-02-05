// src/server/middleware/auth.ts
import type { Context, Next } from 'hono'
import { getCookie } from 'hono/cookie'
import { verifyToken } from '../lib/auth'

export async function requireAuth(c: Context, next: Next) {
  const token = getCookie(c, 'token')

  if (!token) {
    return c.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, 401)
  }

  const payload = await verifyToken(token)

  if (!payload) {
    return c.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' } }, 401)
  }

  c.set('user', payload)
  await next()
}

export async function optionalAuth(c: Context, next: Next) {
  const token = getCookie(c, 'token')

  if (token) {
    const payload = await verifyToken(token)
    if (payload) {
      c.set('user', payload)
    }
  }

  await next()
}
