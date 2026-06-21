const store = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(
  identifier: string,
  action: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: Date } {
  const key = `${action}:${identifier}`
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1, resetAt: new Date(now + windowMs) }
  }

  entry.count++
  store.set(key, entry)

  return {
    allowed: entry.count <= limit,
    remaining: Math.max(0, limit - entry.count),
    resetAt: new Date(entry.resetAt),
  }
}
