"use client"

// ============================================================================
// useCheckoutBundle — reads a checkout session + its children from Supabase,
// falling back to the bundled seed when the tables are absent (42P01) or no
// row matches. Returns {data, loading, error, source, reload}.
//
// Public guest reads scope by session token (the route sets the request
// setting server-side via the anon key); authed reads scope by RLS membership.
// Either way the client just reads by id and lets RLS do the gating.
// ============================================================================

import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { seedBundle } from "./seed"
import type {
  CheckoutBundle,
  CheckoutType,
  DataSource,
  CheckoutLineItem,
  CheckoutPaymentMethod,
  CheckoutPriceBreakdown,
  CheckoutSession,
} from "./types"

function code(e: unknown): string | undefined {
  return (e as { code?: string } | null)?.code
}

interface State {
  data: CheckoutBundle | null
  loading: boolean
  error: string | null
  source: DataSource
}

export function useCheckoutBundle(
  type: CheckoutType,
  sessionId: string | undefined
) {
  const [state, setState] = useState<State>({
    data: null,
    loading: true,
    error: null,
    source: "seed",
  })

  const load = useCallback(async () => {
    if (!sessionId) {
      setState({ data: null, loading: false, error: "Missing checkout reference", source: "seed" })
      return
    }
    setState((s) => ({ ...s, loading: true, error: null }))

    const supabase = createClient()
    try {
      const { data: session, error: sErr } = await supabase
        .from("checkout_sessions")
        .select(
          "id, workspace_id, checkout_type, reference_type, reference_id, status, currency, total_due_now_pence, contact_email, expires_at, metadata_json, created_at, updated_at"
        )
        .eq("id", sessionId)
        .maybeSingle()

      // Table missing OR no matching row → honest seed fallback.
      if (sErr) {
        if (code(sErr) === "42P01") {
          setState({ data: seedBundle(type, sessionId), loading: false, error: null, source: "seed" })
          return
        }
        throw sErr
      }
      if (!session) {
        setState({ data: seedBundle(type, sessionId), loading: false, error: null, source: "seed" })
        return
      }

      // Parallel child reads — all best-effort.
      const [bd, li, pm] = await Promise.all([
        supabase
          .from("checkout_price_breakdowns")
          .select("*")
          .eq("checkout_session_id", sessionId)
          .maybeSingle(),
        supabase
          .from("checkout_line_items")
          .select("id, checkout_session_id, kind, label, quantity, unit_amount_pence, amount_pence, currency, selected")
          .eq("checkout_session_id", sessionId)
          .order("created_at", { ascending: true }),
        supabase
          .from("checkout_payment_methods")
          .select("id, checkout_session_id, method_type, brand, last4, exp_label, is_default")
          .eq("checkout_session_id", sessionId)
          .order("is_default", { ascending: false }),
      ])

      const fallback = seedBundle(type, sessionId)
      const bundle: CheckoutBundle = {
        ...fallback,
        session: session as unknown as CheckoutSession,
        breakdown: (bd.data as unknown as CheckoutPriceBreakdown) ?? fallback.breakdown,
        lineItems: (li.data as unknown as CheckoutLineItem[]) ?? fallback.lineItems,
        paymentMethods:
          (pm.data as unknown as CheckoutPaymentMethod[])?.length
            ? (pm.data as unknown as CheckoutPaymentMethod[])
            : fallback.paymentMethods,
      }
      setState({ data: bundle, loading: false, error: null, source: "supabase" })
    } catch (e) {
      // Any unexpected error → still render via seed but surface the message.
      setState({
        data: seedBundle(type, sessionId),
        loading: false,
        error: e instanceof Error ? e.message : "Failed to load checkout",
        source: "seed",
      })
    }
  }, [type, sessionId])

  useEffect(() => {
    void load()
  }, [load])

  return { ...state, reload: () => void load() }
}
