"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Check, Percent, Clock, Wallet, Users } from "lucide-react"
import { Card, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { createClient } from "@/lib/supabase/client"
import { enrolWorkspaceAffiliate } from "@/lib/actions/affiliate"

const BENEFITS = [
  { icon: Percent, title: "10% recurring", sub: "On eligible subscription revenue, for 6 months per referral." },
  { icon: Clock, title: "60-day cookie", sub: "Last-click attribution within a 60-day window." },
  { icon: Wallet, title: "£50 payout threshold", sub: "Withdraw once cleared commission reaches £50." },
  { icon: Users, title: "Live dashboard", sub: "Track links, referrals, earnings and payouts." },
]

export default function AffiliateSignupPage() {
  const router = useRouter()
  const [enrolling, setEnrolling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleEnrol() {
    setEnrolling(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/login"); return }

      // Resolve current workspace
      const { data: profile } = await supabase
        .from("profiles").select("current_workspace_id").eq("id", user.id).maybeSingle()
      let wsId = (profile?.current_workspace_id as string | null) ?? null
      if (!wsId) {
        const { data: mem } = await supabase
          .from("workspace_members").select("workspace_id").eq("user_id", user.id).limit(1).maybeSingle()
        wsId = (mem?.workspace_id as string | null) ?? null
      }
      if (!wsId) { setError("No workspace found for your account."); return }

      const res = await enrolWorkspaceAffiliate(wsId)
      if (res.ok) router.push("/affiliate")
      else setError(res.error ?? "Could not enrol. Please try again.")
    } finally {
      setEnrolling(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center py-6">
        <h1 className="text-2xl font-bold text-slate-900">Join the Propvora Affiliate Programme</h1>
        <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
          Earn <strong className="text-[#2563EB]">10% recurring commission</strong> for 6 months on every
          paying customer you refer. As an existing customer you can enrol in one click — same commission as
          our external partners.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {BENEFITS.map((b) => {
          const Icon = b.icon
          return (
            <div key={b.title} className="flex items-start gap-3 p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-violet-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{b.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{b.sub}</p>
              </div>
            </div>
          )
        })}
      </div>

      <Card>
        <CardContent className="pt-5 space-y-4">
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <div className="flex items-start gap-2.5">
            <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
            <p className="text-sm text-slate-600">
              By enrolling you agree to the{" "}
              <Link href="/affiliate-programme/terms" className="text-[#2563EB] hover:underline" target="_blank">
                Affiliate Terms
              </Link>
              . Self-referrals and referrals of existing customers are not eligible for commission.
            </p>
          </div>
          <Button variant="primary" className="w-full" onClick={handleEnrol} disabled={enrolling}>
            {enrolling ? "Enrolling…" : "Enrol my workspace"}
          </Button>
          <p className="text-xs text-slate-400 text-center">
            Not a customer yet? Apply via the{" "}
            <Link href="/affiliate-programme/apply" className="text-[#2563EB] hover:underline">
              public partner programme
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
