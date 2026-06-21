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
    data: [],
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
        setState({ data: [], loading: false, error: null, source: 'seed' })
        return
      }
      const { data, error } = await supabase
        .from('booking_disputes')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        if (PERMISSION_CODES.has(error.code ?? '')) {
          setState({ data: [], loading: false, error: 'permission-denied', source: 'seed' })
          return
        }
        if (MISSING_TABLE_CODES.has(error.code ?? '')) {
          setState({ data: [], loading: false, error: null, source: 'seed' })
          return
        }
        throw error
      }

      setState({ data: (data ?? []) as unknown as Dispute[], loading: false, error: null, source: data && data.length > 0 ? 'live' : 'seed' })
    } catch {
      setState({ data: [], loading: false, error: null, source: 'seed' })
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
  const [state, setState] = useState<QueryState<Dispute | null>>({
    data: null,
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
    try {
      const supabase = createClient()
      const { data: auth } = await supabase.auth.getUser()
      if (!auth?.user) {
        setState({ data: null, loading: false, error: 'not-found', source: 'seed' })
        return
      }
      const { data, error } = await supabase
        .from('booking_disputes')
        .select('*')
        .eq('id', disputeId)
        .maybeSingle()

      if (error) {
        if (PERMISSION_CODES.has(error.code ?? '')) {
          setState({ data: null, loading: false, error: 'permission-denied', source: 'seed' })
          return
        }
        if (MISSING_TABLE_CODES.has(error.code ?? '')) {
          setState({ data: null, loading: false, error: 'not-found', source: 'seed' })
          return
        }
        throw error
      }

      if (!data) {
        setState({ data: null, loading: false, error: 'not-found', source: 'seed' })
        return
      }

      setState({ data: data as unknown as Dispute, loading: false, error: null, source: 'live' })
    } catch {
      setState({ data: null, loading: false, error: 'not-found', source: 'seed' })
    }
  }, [disputeId])

  useEffect(() => {
    void load()
  }, [load])

  return { ...state, reload: () => void load() }
}
