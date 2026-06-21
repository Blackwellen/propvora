// Strip null bytes, control characters, and normalise whitespace
export function sanitiseString(input: unknown): string {
  if (typeof input !== 'string') return ''
  return input.replace(/\0/g, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim()
}

export function sanitiseObject<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [
      k,
      typeof v === 'string' ? sanitiseString(v) : v,
    ])
  ) as T
}
