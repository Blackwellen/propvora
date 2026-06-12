/**
 * Environment variable validation for Propvora.
 * Call validateEnv() at app startup (e.g. in layout.tsx or instrumentation.ts)
 * to catch missing configuration early.
 */

export function validateEnv(): void {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ]

  const missing = required.filter((key) => !process.env[key])

  if (missing.length > 0 && process.env.NODE_ENV === 'production') {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
      'Check your deployment configuration.'
    )
  }

  if (missing.length > 0 && process.env.NODE_ENV !== 'production') {
    console.warn(
      `[propvora] Missing environment variables: ${missing.join(', ')}. ` +
      'Supabase features will not work until these are set in .env.local'
    )
  }
}

/**
 * Returns the Supabase URL, throwing in production if missing.
 */
export function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url && process.env.NODE_ENV === 'production') {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is required')
  }
  return url ?? ''
}

/**
 * Returns the Supabase anon key, throwing in production if missing.
 */
export function getSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!key && process.env.NODE_ENV === 'production') {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required')
  }
  return key ?? ''
}
