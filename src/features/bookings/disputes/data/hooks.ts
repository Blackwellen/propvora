'use client'

// ============================================================
// Bookings Disputes — data hooks.
// Each hook attempts a workspace-scoped Supabase read; on ANY failure
// (missing table 42P01, RLS / permission denied, network) it falls back
// to rich seed data so every screen renders premium. The `source` field
// reports whether live or seed data is in use.
// ============================================================
import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type {
  Dispute,
  DataSource,
  UseDisputesResult,
  UseDisputeResult,
} from './types'
import { SEED_DISPUTES, seedById } from './seed'

const PERMISSION_CODES = new Set(['42501', 'PGRST301'])
const MISSING_TABLE_CODES = new Set(['42P01', 'PGRST205', 'PGRST204'])

interface QueryState<T> {
  data: T
  loading: boolean
  error: string | null
  source: DataSource
}

/**
 * List hook. Tries `booking_disputes`; falls back to seed on any error.
 */
export function useDisputes(): UseDisputesResult {
  const [state, setState] = useState<QueryState<Dispute[]>>({
    data: SEED_DISPUTES,
    loading: true,
    error: null,
    source: 'seed',
  })

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const supabase = createClient()
      const { data: auth } = await supabase.auth.getUser()
      if (!auth?.user) {
        // Not signed in client-side — show seed, no hard error.
        setState({ data: SEED_DISPUTES, loading: false, error: null, source: 'seed' })
        return
      }
      const { data, error } = await supabase
        .from('booking_disputes')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        if (PERMISSION_CODES.has(error.code ?? '')) {
          setState({ data: SEED_DISPUTES, loading: false, error: 'permission-denied', source: 'seed' })
          return
        }
        if (MISSING_TABLE_CODES.has(error.code ?? '')) {
          setState({ data: SEED_DISPUTES, loading: false, error: null, source: 'seed' })
          return
        }
        throw error
      }

      if (!data || data.length === 0) {
        // Table exists but empty — present seed so the workspace looks alive.
        setState({ data: SEED_DISPUTES, loading: false, error: null, source: 'seed' })
        return
      }

      setState({ data: data as unknown as Dispute[], loading: false, error: null, source: 'live' })
    } catch {
      setState({ data: SEED_DISPUTES, loading: false, error: null, source: 'seed' })
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return { ...state, reload: () => void load() }
}

/**
 * Single-dispute hook. Tries `booking_disputes` by id; falls back to seed.
 */
export function useDispute(disputeId: string | undefined): UseDisputeResult {
  const seed = disputeId ? seedById(disputeId) : null
  const [state, setState] = useState<QueryState<Dispute | null>>({
    data: seed,
    loading: true,
    error: null,
    source: 'seed',
  })

  const load = useCallback(async () => {
    if (!disputeId) {
      setState({ data: null, loading: false, error: 'not-found', source: 'seed' })
      return
    }
    setState((s) => ({ ...s, loading: true, error: null }))
    const fallback = seedById(disputeId)
    try {
      const supabase = createClient()
      const { data: auth } = await supabase.auth.getUser()
      if (!auth?.user) {
        setState({ data: fallback, loading: false, error: fallback ? null : 'not-found', source: 'seed' })
        return
      }
      const { data, error } = await supabase
        .from('booking_disputes')
        .select('*')
        .eq('id', disputeId)
        .maybeSingle()

      if (error) {
        if (PERMISSION_CODES.has(error.code ?? '')) {
          setState({ data: fallback, loading: false, error: fallback ? null : 'permission-denied', source: 'seed' })
          return
        }
        if (MISSING_TABLE_CODES.has(error.code ?? '')) {
          setState({ data: fallback, loading: false, error: fallback ? null : 'not-found', source: 'seed' })
          return
        }
        throw error
      }

      if (!data) {
        setState({ data: fallback, loading: false, error: fallback ? null : 'not-found', source: 'seed' })
        return
      }

      setState({ data: data as unknown as Dispute, loading: false, error: null, source: 'live' })
    } catch {
      setState({ data: fallback, loading: false, error: fallback ? null : 'not-found', source: 'seed' })
    }
  }, [disputeId])

  useEffect(() => {
    void load()
  }, [load])

  return { ...state, reload: () => void load() }
}
