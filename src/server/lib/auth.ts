import { SignJWT, jwtVerify } from 'jose'
import { timingSafeEqual } from 'crypto'

const encoder = new TextEncoder()

export function verifyPassword(input: string, expected: string): boolean {
  const inputBuf = encoder.encode(input)
  const expectedBuf = encoder.encode(expected)

  if (inputBuf.length !== expectedBuf.length) {
    // Compare anyway to prevent timing attacks
    timingSafeEqual(inputBuf, inputBuf)
    return false
  }

  return timingSafeEqual(inputBuf, expectedBuf)
}

export async function createToken(email: string): Promise<string> {
  const secret = encoder.encode(process.env.JWT_SECRET || 'dev-secret')

  return new SignJWT({ email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret)
}

export async function verifyToken(token: string): Promise<{ email: string } | null> {
  try {
    const secret = encoder.encode(process.env.JWT_SECRET || 'dev-secret')
    const { payload } = await jwtVerify(token, secret)
    return payload as { email: string }
  } catch {
    return null
  }
}
