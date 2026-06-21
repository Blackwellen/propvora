"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { Save, AlertTriangle } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Skeleton } from "@/components/ui/Skeleton"
import { useAffiliate } from "@/components/affiliate/useAffiliate"
import { updateAffiliateProfile } from "@/lib/actions/affiliate"

const NOTIF_KEY = "propvora.affiliate.notifications"

export function AffiliateSettings({ basePath }: { basePath: string }) {
  const { loading: affLoading, affiliate, workspaceId, reload } = useAffiliate()
  const [handle, setHandle] = useState("")
  const [payoutEmail, setPayoutEmail] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notifs, setNotifs] = useState({ newReferral: true, commissionCleared: true, payout: true })

  useEffect(() => {
    if (affiliate) {
      setHandle(affiliate.public_handle ?? "")
      setPayoutEmail(affiliate.payout_email ?? "")
    }
    try {
      const raw = localStorage.getItem(NOTIF_KEY)
      if (raw) setNotifs((p) => ({ ...p, ...JSON.parse(raw) }))
    } catch { /* ignore */ }
  }, [affiliate])

  function toggle(key: keyof typeof notifs) {
    setNotifs((prev) => {
      const next = { ...prev, [key]: !prev[key] }
      try { localStorage.setItem(NOTIF_KEY, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }

  async function handleSave() {
    if (!workspaceId) return
    setSaving(true); setSaved(false); setError(null)
    try {
      const res = await updateAffiliateProfile(workspaceId, {
        publicHandle: handle.trim() || null,
        payoutEmail: payoutEmail.trim() || null,
      })
      if (!res.ok) throw new Error(res.error ?? "Could not save changes.")
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      await reload()
    } catch (e) {
      console.error(e)
      setError(e instanceof Error ? e.message : "Could not save changes.")
    } finally {
      setSaving(false)
    }
  }

  if (affLoading) {
    return <div className="space-y-4 max-w-2xl"><Skeleton className="h-10 w-48" /><Skeleton className="h-56 rounded-xl" /></div>
  }

  if (!affiliate?.enrolled) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-slate-500">You haven&apos;t enrolled yet. <Link href={basePath} className="text-[#2563EB] hover:underline">Join the programme</Link>.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Affiliate Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage your public handle, payout details and preferences.</p>
      </div>

      {error && <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700">{error}</div>}
      {saved && <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-700">Settings saved.</div>}

      <Card>
        <CardHeader><CardTitle>Profile &amp; payout</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input label="Public display handle" placeholder="e.g. propertypete" value={handle} onChange={(e) => setHandle(e.target.value)} />
          <Input label="Payout email" type="email" placeholder="where to send payout notifications" value={payoutEmail} onChange={(e) => setPayoutEmail(e.target.value)} />
          <p className="text-xs text-slate-400">
            We store only non-sensitive payout preferences. Bank details are collected securely at payout time, not here.
          </p>
          <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save changes"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Notifications</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {[
            { key: "newReferral" as const, label: "New referral", sub: "When someone signs up via your link" },
            { key: "commissionCleared" as const, label: "Commission cleared", sub: "When pending commission becomes payable" },
            { key: "payout" as const, label: "Payout scheduled / paid", sub: "Updates on your payouts" },
          ].map((p) => (
            <div key={p.key} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
              <div>
                <p className="text-sm font-medium text-slate-800">{p.label}</p>
                <p className="text-xs text-slate-400">{p.sub}</p>
              </div>
              <button type="button" onClick={() => toggle(p.key)} aria-pressed={notifs[p.key]}
                className={`w-10 h-5 rounded-full transition-colors relative ${notifs[p.key] ? "bg-[#2563EB]" : "bg-slate-200"}`}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${notifs[p.key] ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>
          ))}
          <p className="text-[11px] text-slate-400 pt-1">Preferences are saved on this device.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Programme</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-600">
            Review the{" "}
            <Link href="/affiliate-programme/terms" className="text-[#2563EB] hover:underline">Affiliate Terms</Link>.
            You can leave the programme at any time — contact{" "}
            <a href="mailto:partners@propvora.com" className="text-[#2563EB] hover:underline">partners@propvora.com</a>.
          </p>
          <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-100 p-3 text-xs text-amber-700">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            Leaving the programme stops future commission. Any cleared balance already earned remains payable.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
