"use client"

import { useCallback, useMemo, useState } from "react"
import Link from "next/link"
import { Check, Loader2, ShieldCheck } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import {
  recordPolicyAcceptance,
  requiredPoliciesFor,
  type AcceptanceContext,
  type MarketplaceRole,
} from "@/lib/legal/marketplace"
import { getPolicy, type PolicySlug } from "@/lib/legal/policies"

/**
 * AcceptanceGate — a checkbox the marketplace checkout / seller-onboarding /
 * booking flows mount to capture (and record) policy acceptance for the current
 * user. On confirm it writes a row per required policy to
 * marketplace_policy_acceptance via recordPolicyAcceptance, then calls onAccepted.
 *
 * Either pass an explicit list of `slugs`, or a `role` to derive the required
 * set from requiredPoliciesFor(). Fully responsive: links stack on mobile.
 * No Tailwind `dark:` classes.
 */
export interface AcceptanceGateProps {
  userId: string
  workspaceId?: string | null
  context: AcceptanceContext
  /** Explicit policy slugs to require. Takes precedence over `role`. */
  slugs?: PolicySlug[]
  /** Derive required policies from a marketplace role. */
  role?: MarketplaceRole
  /** Called after all acceptances are recorded successfully. */
  onAccepted?: () => void
  className?: string
}

export default function AcceptanceGate({
  userId,
  workspaceId,
  context,
  slugs,
  role,
  onAccepted,
  className,
}: AcceptanceGateProps) {
  const required = useMemo<PolicySlug[]>(() => {
    if (slugs && slugs.length) return slugs
    if (role) return requiredPoliciesFor(role)
    return ["marketplace-terms"]
  }, [slugs, role])

  const [checked, setChecked] = useState(false)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const confirm = useCallback(async () => {
    if (!checked || saving || done) return
    setSaving(true)
    setError(null)
    const supabase = createClient()
    try {
      for (const slug of required) {
        const res = await recordPolicyAcceptance(supabase, {
          userId,
          workspaceId: workspaceId ?? null,
          slug,
          context,
        })
        if (!res.ok && res.error !== "schema_missing") {
          throw new Error(res.error ?? "Could not record acceptance")
        }
      }
      setDone(true)
      onAccepted?.()
    } catch (e) {
      setError((e as Error)?.message ?? "Something went wrong. Please try again.")
    } finally {
      setSaving(false)
    }
  }, [checked, saving, done, required, userId, workspaceId, context, onAccepted])

  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 ${className ?? ""}`}
    >
      <label className="flex items-start gap-3 cursor-pointer select-none">
        <span
          className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border transition-colors ${
            checked
              ? "border-[var(--brand)] bg-[var(--brand)] text-white"
              : "border-slate-300 bg-white"
          }`}
        >
          {checked && <Check className="h-3.5 w-3.5" />}
        </span>
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          disabled={saving || done}
          onChange={(e) => setChecked(e.target.checked)}
        />
        <span className="text-sm leading-relaxed text-slate-700">
          I have read and agree to the following Propvora marketplace policies:
          <span className="mt-2 flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:gap-x-2">
            {required.map((slug, i) => {
              const p = getPolicy(slug)
              if (!p) return null
              return (
                <span key={slug} className="inline-flex items-center">
                  <Link
                    href={p.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-[var(--brand)] hover:text-[var(--brand)]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {p.title}
                  </Link>
                  {i < required.length - 1 && (
                    <span className="ml-2 hidden text-slate-400 sm:inline">
                      &middot;
                    </span>
                  )}
                </span>
              )
            })}
          </span>
        </span>
      </label>

      {error && (
        <p className="mt-3 text-xs text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="mt-4">
        {done ? (
          <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
            <ShieldCheck className="h-4 w-4" />
            Acceptance recorded
          </span>
        ) : (
          <button
            type="button"
            onClick={confirm}
            disabled={!checked || saving}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-strong)] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Saving…" : "Agree and continue"}
          </button>
        )}
      </div>
    </div>
  )
}
