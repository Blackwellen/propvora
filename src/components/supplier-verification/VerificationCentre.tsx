"use client"

import React from "react"
import {
  Mail,
  Phone,
  CreditCard,
  IdCard,
  ShieldCheck,
  ScrollText,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Info,
} from "lucide-react"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import VerificationBadges from "./VerificationBadges"
import LevelLadder from "./LevelLadder"
import type { SupplierVerificationStatusSummary } from "@/lib/supplier-verification"

/**
 * Supplier-facing verification centre. Lets a supplier-workspace member advance
 * their verification: confirm email/phone, sync payout (Stripe Connect), and
 * submit ID/insurance/licence evidence for review.
 *
 * HONESTY: this UI never claims a supplier is "fully vetted" or "government
 * verified". Badges and the level label reflect evidence reviewed only. Identity
 * is never auto-approved — submitting moves the record to "pending review".
 *
 * Designed to be embedded by the supplier-workspace pages (another wave) — it
 * takes the supplierWorkspaceId + an initial summary and self-refreshes.
 */
export default function VerificationCentre({
  supplierWorkspaceId,
  initialSummary,
}: {
  supplierWorkspaceId: string
  initialSummary: SupplierVerificationStatusSummary
}) {
  const [summary, setSummary] = React.useState(initialSummary)
  const [busy, setBusy] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  const level = summary.level

  async function act(action: string, extra?: Record<string, unknown>) {
    setBusy(action)
    setError(null)
    try {
      const res = await fetch("/api/supplier-verification/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: supplierWorkspaceId, action, ...extra }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error ?? `Failed (${res.status})`)
      if (json.summary) setSummary(json.summary as SupplierVerificationStatusSummary)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed")
    } finally {
      setBusy(null)
    }
  }

  const inReview = summary.status === "pending_review"
  const verified = summary.status === "verified"

  return (
    <div className="space-y-5">
      {/* Header / summary */}
      <Card>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Verification</h2>
            <p className="text-[12px] text-slate-500 mt-0.5">
              Current level:{" "}
              <span className="font-semibold text-slate-700">
                L{level} · {summary.levelLabel}
              </span>
            </p>
          </div>
          {inReview && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-soft)] px-3 py-1 text-[12px] font-medium text-[var(--brand)]">
              <Loader2 className="w-3.5 h-3.5" /> In review
            </span>
          )}
          {verified && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ECFDF5] px-3 py-1 text-[12px] font-medium text-[#059669]">
              <CheckCircle2 className="w-3.5 h-3.5" /> Verified
            </span>
          )}
        </div>

        <div className="mt-4">
          <VerificationBadges badges={summary.badges} />
        </div>

        {/* Honesty note */}
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-[#E2E8F0] bg-slate-50 px-3 py-2.5">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <p className="text-[11.5px] leading-relaxed text-slate-500">
            Badges show <span className="font-semibold text-slate-700">evidence we have reviewed</span> —
            they are not a guarantee, a background check, or a government verification. Your ID,
            insurance and licence evidence is reviewed by our team and is never auto-approved.
          </p>
        </div>

        {(summary.insuranceExpiringSoon || summary.licenceExpiringSoon) && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-[#FDE68A] bg-[#FFFBEB] px-3 py-2.5">
            <AlertTriangle className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
            <p className="text-[11.5px] text-[#92400E]">
              {summary.insuranceExpiringSoon && "Your insurance evidence expires within 30 days. "}
              {summary.licenceExpiringSoon && "Your licence evidence expires within 30 days. "}
              Renew it to keep accepting higher-risk jobs.
            </p>
          </div>
        )}

        {error && (
          <p className="mt-3 flex items-center gap-1.5 text-[12px] text-[#EF4444]">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            {error}
          </p>
        )}
      </Card>

      <div className="grid gap-5 md:grid-cols-2">
        {/* Ladder */}
        <Card>
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Verification levels</h3>
          <LevelLadder level={level} />
        </Card>

        {/* Steps */}
        <Card>
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Next steps</h3>
          <div className="space-y-2.5">
            <StepRow
              icon={Mail}
              label="Confirm email"
              done={level >= 1}
              busy={busy === "confirm_email"}
              onClick={() => act("confirm_email")}
            />
            <StepRow
              icon={Phone}
              label="Confirm phone"
              done={level >= 2}
              disabled={level < 1}
              busy={busy === "confirm_phone"}
              onClick={() => act("confirm_phone")}
            />
            <StepRow
              icon={CreditCard}
              label="Verify payout (Stripe)"
              done={level >= 3}
              disabled={level < 2}
              busy={busy === "sync_payout"}
              actionLabel="Sync"
              onClick={() => act("sync_payout")}
            />
            <StepRow
              icon={IdCard}
              label="Submit ID evidence for review"
              done={level >= 4}
              hint={summary.manualReviewStatus === "pending" ? "Awaiting review" : undefined}
              disabled={level < 3 || inReview}
              busy={busy === "submit_for_review"}
              actionLabel="Submit"
              onClick={() => act("submit_for_review")}
            />
            <StepRow
              icon={ShieldCheck}
              label="Insurance evidence reviewed"
              done={summary.hasValidInsurance}
              hint={summary.hasValidInsurance ? undefined : "Upload via your insurance panel"}
              disabledHard
            />
            <StepRow
              icon={ScrollText}
              label="Licence evidence reviewed"
              done={summary.hasValidLicence}
              hint={summary.hasValidLicence ? undefined : "Upload via your licence panel"}
              disabledHard
            />
          </div>
        </Card>
      </div>
    </div>
  )
}

function StepRow({
  icon: Icon,
  label,
  done,
  disabled,
  disabledHard,
  busy,
  hint,
  actionLabel = "Confirm",
  onClick,
}: {
  icon: typeof Mail
  label: string
  done: boolean
  disabled?: boolean
  disabledHard?: boolean
  busy?: boolean
  hint?: string
  actionLabel?: string
  onClick?: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-[#E2E8F0] px-3 py-2.5">
      <div className="flex items-center gap-2.5 min-w-0">
        <span
          className={
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg " +
            (done ? "bg-[#ECFDF5] text-[#059669]" : "bg-slate-100 text-slate-400")
          }
        >
          {done ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
        </span>
        <div className="min-w-0">
          <p className="text-[12.5px] font-medium text-slate-700 truncate">{label}</p>
          {hint && <p className="text-[11px] text-slate-400">{hint}</p>}
        </div>
      </div>
      {done ? (
        <span className="text-[11px] font-medium text-[#059669] shrink-0">Done</span>
      ) : disabledHard || !onClick ? (
        <span className="text-[11px] text-slate-300 shrink-0">—</span>
      ) : (
        <Button variant="outline" size="sm" onClick={onClick} disabled={disabled || busy}>
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
