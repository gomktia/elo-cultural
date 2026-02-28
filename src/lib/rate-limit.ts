/**
 * Simple in-memory rate limiter for serverless.
 * Each Vercel instance has its own Map, so this provides
 * per-instance protection (good enough for most attacks).
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key)
    }
  }
}, 60_000)

interface RateLimitOptions {
  /** Max requests allowed in the window */
  limit: number
  /** Window size in seconds */
  windowSeconds: number
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

export function checkRateLimit(
  key: string,
  options: RateLimitOptions
): RateLimitResult {
  const now = Date.now()
  const windowMs = options.windowSeconds * 1000
  const existing = store.get(key)

  if (!existing || now > existing.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: options.limit - 1, resetAt: now + windowMs }
  }

  existing.count++
  if (existing.count > options.limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt }
  }

  return { allowed: true, remaining: options.limit - existing.count, resetAt: existing.resetAt }
}

/** Get client IP from request headers */
export function getClientIp(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    'unknown'
  )
}
