import { SignJWT, jwtVerify } from 'jose'
import { timingSafeEqual } from 'crypto'

const encoder = new TextEncoder()

export const JWT_SECRET_MIN_LENGTH = 32

/** Values that ship in this repo's examples and must never sign a real session. */
const PLACEHOLDER_SECRETS = [
  'dev-secret',
  'generate-a-random-32-char-string',
  'your-random-32-char-secret-key',
]

const HOW_TO_GENERATE = 'Generate one with: openssl rand -base64 32'

/**
 * The JWT signing secret as bytes, or an error saying what is wrong with it.
 *
 * There is deliberately no fallback. A missing secret must stop the server,
 * not quietly sign every session with a string that is in the public repo,
 * which would let anyone forge an admin cookie. `src/server/index.ts` calls
 * this at startup so a bad deploy fails loudly and at once.
 */
export function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error(`JWT_SECRET is not set. ${HOW_TO_GENERATE}`)
  }
  if (secret.length < JWT_SECRET_MIN_LENGTH) {
    throw new Error(
      `JWT_SECRET must be at least ${JWT_SECRET_MIN_LENGTH} characters (it is ${secret.length}). ${HOW_TO_GENERATE}`
    )
  }
  if (PLACEHOLDER_SECRETS.includes(secret)) {
    throw new Error(`JWT_SECRET is a placeholder value from the examples. ${HOW_TO_GENERATE}`)
  }
  return encoder.encode(secret)
}

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
  const secret = getJwtSecret()

  return new SignJWT({ email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret)
}

export async function verifyToken(token: string): Promise<{ email: string } | null> {
  // Outside the try: a misconfigured secret is a server fault, not a bad token.
  const secret = getJwtSecret()
  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] })
    return payload as { email: string }
  } catch {
    return null
  }
}
