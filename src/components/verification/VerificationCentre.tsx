"use client"

import {
  ShieldCheck,
  Banknote,
  Store,
  Lock,
  FileCheck2,
  Info,
  Loader2,
  RefreshCw,
  Eye,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useVerification } from "./useVerification"
import {
  normalisePhase,
  phaseMeta,
  screeningSignalLabel,
  type VerificationDocument,
} from "./status"
import { VerificationStepper } from "./VerificationStepper"
import { TrustBadge } from "./TrustBadge"
import { ProviderHandoff } from "./ProviderHandoff"
import { DocumentUpload } from "./DocumentUpload"

/* ──────────────────────────────────────────────────────────────────────────
   VerificationCentre — the premium, status-driven verification hub shared by
   the operator (/app/verification) and supplier (/supplier/verification) pages.

   Honesty model:
   • Everything renders from the REAL status returned by /api/identity/status.
   • The verified trust badge + success banner appear ONLY when phase==="verified".
   • Screening signals (sanctions/PEP) are labelled "screening signal, pending
     review" — never as determinations or legal conclusions.
   • Copy frames this as identity verification to enable selling / payouts; it is
     explicitly not legal advice.
─────────────────────────────────────────────────────────────────────────── */

interface CentreCopy {
  /** Who this is for, used in the "why" explainer. */
  audience: "operator" | "supplier"
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bg-white border border-slate-200 rounded-2xl shadow-sm", className)}>
      {children}
    </div>
  )
}

export function VerificationCentre({ audience }: CentreCopy) {
  const { status, loading, notReady, refresh } = useVerification()

  const phase = normalisePhase(status?.status)
  const meta = phaseMeta(phase)
  const verified = phase === "verified"
  const documents: VerificationDocument[] = (status?.documents as VerificationDocument[]) ?? []
  const riskFlags = status?.riskFlags ?? []

  const whyPoints =
    audience === "supplier"
      ? [
          { icon: Store, text: "Publish your marketplace profile and receive jobs." },
          { icon: Banknote, text: "Receive payouts for completed work." },
          { icon: ShieldCheck, text: "Show clients a verified trust badge." },
        ]
      : [
          { icon: Banknote, text: "Enable selling and receiving payouts from your workspace." },
          { icon: Store, text: "List and transact on the Propvora marketplace." },
          { icon: ShieldCheck, text: "Display a verified badge to buyers and partners." },
        ]

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Card className="p-6">
        <div className="space-y-3" aria-busy="true" aria-live="polite">
          <div className="h-10 rounded-xl bg-slate-50 animate-pulse motion-reduce:animate-none" />
          <div className="h-24 rounded-xl bg-slate-50 animate-pulse motion-reduce:animate-none" />
          <div className="h-16 rounded-xl bg-slate-50 animate-pulse motion-reduce:animate-none" />
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      {/* ── Status hero ──────────────────────────────────────────────────── */}
      <Card className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3.5 min-w-0">
            <div
              className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                verified ? "bg-emerald-50" : phase === "requires_input" ? "bg-amber-50" : "bg-blue-50"
              )}
            >
              <ShieldCheck
                className={cn(
                  "w-6 h-6",
                  verified ? "text-emerald-600" : phase === "requires_input" ? "text-amber-600" : "text-[#2563EB]"
                )}
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-slate-900 leading-tight">Identity verification</h2>
                <TrustBadge phase={phase} />
              </div>
              <p className="mt-1 text-sm text-slate-500 text-pretty">{meta.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={refresh}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors min-h-[40px]"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>
        </div>

        {/* Stepper */}
        <div className="mt-5 pt-5 border-t border-slate-100">
          <VerificationStepper phase={phase} />
        </div>

        {/* Verified success or CTA */}
        <div className="mt-5">
          {verified ? (
            <div className="flex items-start gap-2.5 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3">
              <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <p className="text-[13px] font-medium text-emerald-800">
                Your identity is verified. Selling and payouts are unlocked for this workspace.
                {status?.verifiedAt ? "" : ""}
              </p>
            </div>
          ) : notReady ? (
            <div className="flex items-start gap-2.5 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
              <Loader2 className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <p className="text-[13px] text-slate-600">
                Verification is coming online for your workspace. You&apos;ll be able to start as soon as it&apos;s connected.
              </p>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <ProviderHandoff phase={phase} onChanged={refresh} fullWidth />
              {(phase === "processing" || phase === "pending") && (
                <p className="text-[12.5px] text-slate-500 flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin motion-reduce:animate-none" />
                  Checking status automatically…
                </p>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* ── Why verify ───────────────────────────────────────────────────── */}
      {!verified && (
        <Card className="p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-4 h-4 text-slate-500" />
            <h3 className="text-base font-semibold text-slate-900">Why we verify your identity</h3>
          </div>
          <p className="text-sm text-slate-500 mb-4 text-pretty">
            Identity verification confirms who you are so we can safely enable money movement on Propvora.
            It is required before you can sell or receive payouts. This is a security and compliance step —
            not legal advice.
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {whyPoints.map((p) => {
              const Icon = p.icon
              return (
                <li key={p.text} className="flex items-start gap-2.5 rounded-xl bg-slate-50/70 border border-slate-100 px-3.5 py-3">
                  <Icon className="w-4 h-4 text-[#2563EB] mt-0.5 shrink-0" />
                  <span className="text-[13px] text-slate-700">{p.text}</span>
                </li>
              )
            })}
          </ul>
        </Card>
      )}

      {/* ── Supporting documents ─────────────────────────────────────────── */}
      {!verified && (
        <Card className="p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-1">
            <FileCheck2 className="w-4 h-4 text-slate-500" />
            <h3 className="text-base font-semibold text-slate-900">Supporting documents</h3>
          </div>
          <p className="text-sm text-slate-500 mb-4 text-pretty">
            Most checks are completed inside the secure provider step above. If we ask for additional
            evidence — proof of address, insurance or a trade licence — you can add it here.
          </p>
          <DocumentUpload
            verificationId={status?.verificationId}
            documents={documents}
            onUploaded={refresh}
          />
        </Card>
      )}

      {/* ── Screening signals (NEVER determinations) ─────────────────────── */}
      {riskFlags.length > 0 && (
        <Card className="p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-4 h-4 text-amber-600" />
            <h3 className="text-base font-semibold text-slate-900">Screening signals</h3>
          </div>
          <p className="text-sm text-slate-500 mb-3 text-pretty">
            These are automated screening signals shown for transparency. They are <strong>pending review</strong> by
            our team and are <strong>not</strong> determinations or accusations.
          </p>
          <ul className="space-y-2">
            {riskFlags.map((f) => (
              <li
                key={f}
                className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-100 px-3.5 py-2.5 text-[13px] font-medium text-amber-800"
              >
                <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-600" />
                {screeningSignalLabel(f)}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* ── Security footnote ────────────────────────────────────────────── */}
      <div className="flex items-start gap-2 px-1">
        <Lock className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-400" />
        <p className="text-[12px] text-slate-500 text-pretty">
          Your information is handled securely and used only to verify your identity and meet our compliance
          obligations. Verification is provided by Stripe Identity. Propvora never displays your documents publicly.
        </p>
      </div>
    </div>
  )
}
