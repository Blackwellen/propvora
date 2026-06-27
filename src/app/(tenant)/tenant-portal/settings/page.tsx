"use client"

import React, { useEffect, useState } from "react"
import { ShieldCheck, Mail } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Skeleton } from "@/components/ui/Skeleton"
import { createClient } from "@/lib/supabase/client"
import { InlineEditField } from "@/components/editing"
import { resolveTenantContext, type TenantContext } from "../_lib/tenant-context"

interface TenantForm {
  displayName: string
  email: string
  phone: string
  company: string
  address: string
}

const NOTIF_KEY = "propvora.tenant.notifications"

interface NotifPrefs {
  notifyRent: boolean
  notifyMaintenance: boolean
  notifyDocuments: boolean
  notifyMessages: boolean
}

const DEFAULT_NOTIFS: NotifPrefs = {
  notifyRent: true,
  notifyMaintenance: true,
  notifyDocuments: true,
  notifyMessages: true,
}

export default function TenantSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ctx, setCtx] = useState<TenantContext | null>(null)

  const [form, setForm] = useState<TenantForm>({
    displayName: "", email: "", phone: "", company: "", address: "",
  })
  const [notifs, setNotifs] = useState<NotifPrefs>(DEFAULT_NOTIFS)

  function toggleNotif(key: keyof NotifPrefs) {
    setNotifs((prev) => {
      const next = { ...prev, [key]: !prev[key] }
      try { localStorage.setItem(NOTIF_KEY, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()
        const tenant = await resolveTenantContext()
        setCtx(tenant)

        if (tenant) {
          const { data: c } = await supabase
            .from("contacts")
            .select("display_name, email, phone, company, address_line1")
            .eq("id", tenant.contactId)
            .maybeSingle()
          const cr = (c ?? {}) as Record<string, unknown>
          setForm({
            displayName: (cr.display_name as string) || tenant.displayName || "",
            email: (cr.email as string) || tenant.email || "",
            phone: (cr.phone as string) || "",
            company: (cr.company as string) || "",
            address: (cr.address_line1 as string) || "",
          })
        }

        try {
          const raw = localStorage.getItem(NOTIF_KEY)
          if (raw) setNotifs({ ...DEFAULT_NOTIFS, ...JSON.parse(raw) })
        } catch { /* ignore */ }
      } catch (err) {
        console.error(err)
        setError("Could not load settings.")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Per-field inline save — maps a form key to its live `contacts` column and
  // persists just that value (RLS-scoped to the linked tenant contact).
  async function saveField(
    key: keyof TenantForm,
    column: "display_name" | "email" | "phone" | "company" | "address_line1",
    value: string
  ) {
    if (!ctx) throw new Error("Profile editing requires a linked tenant contact.")
    const supabase = createClient()
    const { error: updateErr } = await supabase
      .from("contacts")
      .update({ [column]: value.trim() || null, updated_at: new Date().toISOString() })
      .eq("id", ctx.contactId)
    if (updateErr) throw new Error("Failed to save changes.")
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div className="space-y-2"><Skeleton className="h-7 w-32" /><Skeleton className="h-4 w-56" /></div>
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500">Manage your tenant profile and preferences</p>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>
      )}
      {saved && (
        <div className="rounded-2xl bg-green-50 border border-green-200 p-4 text-sm text-green-700">
          Settings saved successfully.
        </div>
      )}

      {/* Profile details — visible-pen inline edit, per-field save (RLS-scoped). */}
      <Card className="rounded-2xl border-slate-200">
        <CardHeader><CardTitle>Your Details</CardTitle></CardHeader>
        <CardContent className="space-y-1">
          {([
            { key: "displayName" as const, column: "display_name" as const, label: "Full Name", type: "text" as const },
            { key: "company" as const, column: "company" as const, label: "Company (if applicable)", type: "text" as const },
            { key: "email" as const, column: "email" as const, label: "Email Address", type: "email" as const },
            { key: "phone" as const, column: "phone" as const, label: "Phone Number", type: "phone" as const },
            { key: "address" as const, column: "address_line1" as const, label: "Correspondence Address", type: "text" as const },
          ]).map((row) => (
            <div
              key={row.key}
              className="flex items-center justify-between gap-3 py-2.5 border-b border-slate-100 last:border-0"
            >
              <p className="text-[12.5px] font-semibold text-slate-600 shrink-0">{row.label}</p>
              <InlineEditField
                value={form[row.key]}
                type={row.type}
                label={row.label}
                placeholder="Not set"
                useSheetOnMobile
                permission={!!ctx}
                readOnlyReason={!ctx ? "Ask your managing agent to grant you portal access." : undefined}
                onSave={(v) => saveField(row.key, row.column, v)}
              />
            </div>
          ))}
          {!ctx && (
            <p className="text-xs text-slate-400 pt-2">
              Profile editing requires a linked tenant contact. Ask your managing agent to grant you portal access.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Notification preferences (stored locally — wire to a prefs table when available) */}
      <Card className="rounded-2xl border-slate-200">
        <CardHeader><CardTitle>Notification Preferences</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {[
            { key: "notifyRent" as const, label: "Rent reminders", sub: "When rent is due or a payment is recorded" },
            { key: "notifyMaintenance" as const, label: "Maintenance updates", sub: "When your request status changes" },
            { key: "notifyDocuments" as const, label: "New documents", sub: "When a document is shared with you" },
            { key: "notifyMessages" as const, label: "New messages", sub: "When your managing agent contacts you" },
          ].map((pref) => (
            <div key={pref.key} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
              <div>
                <p className="text-sm font-medium text-slate-800">{pref.label}</p>
                <p className="text-xs text-slate-400">{pref.sub}</p>
              </div>
              <button
                type="button"
                onClick={() => toggleNotif(pref.key)}
                aria-pressed={notifs[pref.key]}
                className={`w-10 h-5 rounded-full transition-colors relative ${notifs[pref.key] ? "bg-[var(--brand)]" : "bg-slate-200"}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${notifs[pref.key] ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>
          ))}
          <p className="text-[11px] text-slate-400 pt-1">
            Preferences are saved on this device. Email delivery is controlled by your managing agent&apos;s
            notification settings.
          </p>
        </CardContent>
      </Card>

      {/* Account / security */}
      <Card className="rounded-2xl border-slate-200">
        <CardHeader><CardTitle>Account &amp; Security</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl bg-[var(--brand-soft)] border border-[var(--color-brand-100)] p-3">
            <ShieldCheck className="w-4 h-4 text-[var(--brand)] mt-0.5 shrink-0" />
            <p className="text-xs text-[#1e40af]">
              You&apos;re signed in as <span className="font-semibold">{(ctx?.email ?? form.email) || "your account"}</span>.
              {ctx?.source === "email_match" && " Linked by matching email."}
            </p>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-800">Password</p>
              <p className="text-xs text-slate-400">Change your account password via a secure email link</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                if (!form.email) return
                try {
                  const supabase = createClient()
                  await supabase.auth.resetPasswordForEmail(form.email)
                  setSaved(true)
                  setTimeout(() => setSaved(false), 3000)
                } catch (err) { console.error(err) }
              }}
              disabled={!form.email}
            >
              <Mail className="w-4 h-4" /> Send Reset Link
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
