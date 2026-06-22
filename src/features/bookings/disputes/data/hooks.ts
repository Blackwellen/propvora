'use client'

// ============================================================
// Bookings Disputes — data hooks (LIVE data only).
// Reads the real `marketplace_disputes` backend via /api/disputes,
// which maps marketplace_disputes + dispute_actions (+ booking
// context) into the rich `Dispute` shape. No seed/mock fallback —
// when there are no disputes the screens render their empty state.
// ============================================================
import { useCallback, useEffect, useState } from 'react'
import type {
  Dispute,
  DataSource,
  UseDisputesResult,
  UseDisputeResult,
} from './types'

interface QueryState<T> {
  data: T
  loading: boolean
  error: string | null
  source: DataSource
}

/** List hook — every dispute the caller is party to (admins see all). */
export function useDisputes(): UseDisputesResult {
  const [state, setState] = useState<QueryState<Dispute[]>>({
    data: [],
    loading: true,
    error: null,
    source: 'live',
  })

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const res = await fetch('/api/disputes', { cache: 'no-store' })
      if (res.status === 401) {
        setState({ data: [], loading: false, error: null, source: 'live' })
        return
      }
      const json = (await res.json()) as { items?: Dispute[] }
      setState({ data: json.items ?? [], loading: false, error: null, source: 'live' })
    } catch {
      setState({ data: [], loading: false, error: 'load-failed', source: 'live' })
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return { ...state, reload: () => void load() }
}

/** Single-dispute hook — by id, authorised server-side. */
export function useDispute(disputeId: string | undefined): UseDisputeResult {
  const [state, setState] = useState<QueryState<Dispute | null>>({
    data: null,
    loading: true,
    error: null,
    source: 'live',
  })

  const load = useCallback(async () => {
    if (!disputeId) {
      setState({ data: null, loading: false, error: 'not-found', source: 'live' })
      return
    }
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const res = await fetch(`/api/disputes/${disputeId}`, { cache: 'no-store' })
      if (!res.ok) {
        setState({ data: null, loading: false, error: 'not-found', source: 'live' })
        return
      }
      const json = (await res.json()) as { dispute?: Dispute | null }
      setState({
        data: json.dispute ?? null,
        loading: false,
        error: json.dispute ? null : 'not-found',
        source: 'live',
      })
    } catch {
      setState({ data: null, loading: false, error: 'not-found', source: 'live' })
    }
  }, [disputeId])

  useEffect(() => {
    void load()
  }, [load])

  return { ...state, reload: () => void load() }
}
