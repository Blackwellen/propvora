"use client"

import { useState } from "react"
import Link from "next/link"
import { Check, ChevronRight, Copy } from "lucide-react"
import { submitAffiliateApplication } from "@/lib/actions/affiliate"
import { AUDIENCE_TYPES } from "@/lib/affiliate/levels"

export default function ApplyClient() {
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [code, setCode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    company: "",
    website: "",
    audienceType: AUDIENCE_TYPES[0] as string,
    estimatedAudience: "",
    country: "",
    promotionPlan: "",
    existingCustomer: false,
    acceptedTerms: false,
  })

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((p) => ({ ...p, [k]: v }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const res = await submitAffiliateApplication(form)
      if (res.ok) {
        setDone(true)
        setCode(res.referralCode ?? null)
      } else {
        setError(res.error ?? "Something went wrong. Please try again.")
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="max-w-lg mx-auto mt-10 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
          <Check className="w-8 h-8 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold text-[#0D1B2A]">Application received</h2>
        <p className="text-sm text-slate-600">
          Thanks for applying to the Propvora Partner Programme. We review every application and will email
          you once a decision is made. Commission is earned only on valid, approved, paying customers.
        </p>
        {code && (
          <div className="rounded-2xl bg-white border border-slate-200 p-4 text-left">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Your provisional referral code</p>
            <div className="mt-2 flex items-center justify-between gap-2">
              <code className="text-sm font-mono text-[#2563EB]">{code}</code>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(code).then(() => {
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  })
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:border-slate-300"
              >
                <Copy className="w-3.5 h-3.5" /> {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              This activates once your application is approved.
            </p>
          </div>
        )}
        <Link
          href="/affiliate-programme"
          className="inline-block text-sm font-semibold text-[#2563EB] hover:underline"
        >
          Back to the programme
        </Link>
      </div>
    )
  }

  const inputCls =
    "w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
  const labelCls = "text-sm font-medium text-slate-700 mb-1.5 block"

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-5">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-[#0D1B2A]">Apply to become a partner</h1>
        <p className="mt-2 text-sm text-slate-600">
          Earn 10% recurring commission for 6 months on every paying customer you refer.
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700">{error}</div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Full name <span className="text-rose-500">*</span></label>
          <input className={inputCls} value={form.fullName} onChange={(e) => set("fullName", e.target.value)} required />
        </div>
        <div>
          <label className={labelCls}>Email <span className="text-rose-500">*</span></label>
          <input type="email" className={inputCls} value={form.email} onChange={(e) => set("email", e.target.value)} required />
        </div>
        <div>
          <label className={labelCls}>Company / brand</label>
          <input className={inputCls} value={form.company} onChange={(e) => set("company", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Website / social</label>
          <input className={inputCls} placeholder="https://" value={form.website} onChange={(e) => set("website", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Audience type</label>
          <select className={inputCls} value={form.audienceType} onChange={(e) => set("audienceType", e.target.value)}>
            {AUDIENCE_TYPES.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Estimated audience size</label>
          <input className={inputCls} placeholder="e.g. 5,000 newsletter subscribers" value={form.estimatedAudience} onChange={(e) => set("estimatedAudience", e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Country</label>
          <input className={inputCls} value={form.country} onChange={(e) => set("country", e.target.value)} />
        </div>
      </div>

      <div>
        <label className={labelCls}>How will you promote Propvora? <span className="text-rose-500">*</span></label>
        <textarea
          className={`${inputCls} h-28 resize-none`}
          placeholder="e.g. Property investor blog, YouTube channel, LinkedIn network, letting-agent client base..."
          value={form.promotionPlan}
          onChange={(e) => set("promotionPlan", e.target.value)}
          required
        />
      </div>

      <label className="flex items-center gap-2.5 text-sm text-slate-600">
        <input type="checkbox" checked={form.existingCustomer} onChange={(e) => set("existingCustomer", e.target.checked)} className="w-4 h-4 rounded border-slate-300" />
        I'm already a Propvora customer
      </label>

      <label className="flex items-start gap-2.5 text-sm text-slate-600">
        <input type="checkbox" checked={form.acceptedTerms} onChange={(e) => set("acceptedTerms", e.target.checked)} className="mt-0.5 w-4 h-4 rounded border-slate-300" required />
        <span>
          I agree to the{" "}
          <Link href="/affiliate-programme/terms" target="_blank" className="text-[#2563EB] hover:underline">
            Affiliate Terms
          </Link>{" "}
          and{" "}
          <Link href="/legal/privacy" target="_blank" className="text-[#2563EB] hover:underline">
            Privacy Policy
          </Link>
          .
        </span>
      </label>

      <button
        type="submit"
        disabled={submitting || !form.fullName || !form.email || !form.promotionPlan || !form.acceptedTerms}
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? "Submitting…" : <>Submit application <ChevronRight className="w-4 h-4" /></>}
      </button>
      <p className="text-xs text-slate-400 text-center">
        We review every application. No fake or guaranteed-earnings claims are made.
      </p>
    </form>
  )
}
