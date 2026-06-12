"use client"

import React, { useEffect, useState } from "react"
import { Save, ShieldCheck, Mail } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Skeleton } from "@/components/ui/Skeleton"
import { createClient } from "@/lib/supabase/client"
import { resolveSupplierContext, type SupplierContext } from "../_lib/supplier-context"

interface SupplierForm {
  displayName: string
  email: string
  phone: string
  company: string
  address: string
}

const NOTIF_KEY = "propvora.supplier.notifications"

interface NotifPrefs {
  notifyNewJobs: boolean
  notifyMessages: boolean
  notifyInvoice: boolean
  notifyPayment: boolean
}

const DEFAULT_NOTIFS: NotifPrefs = {
  notifyNewJobs: true,
  notifyMessages: true,
  notifyInvoice: true,
  notifyPayment: true,
}

export default function SupplierSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ctx, setCtx] = useState<SupplierContext | null>(null)

  const [form, setForm] = useState<SupplierForm>({
    displayName: "", email: "", phone: "", company: "", address: "",
  })
  const [notifs, setNotifs] = useState<NotifPrefs>(DEFAULT_NOTIFS)

  function handleChange(key: keyof SupplierForm, val: string) {
    setForm((prev) => ({ ...prev, [key]: val }))
  }

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
        const supplier = await resolveSupplierContext()
        setCtx(supplier)

        if (supplier) {
          const { data: c } = await supabase
            .from("contacts")
            .select("display_name, email, phone, company, address_line1")
            .eq("id", supplier.contactId)
            .maybeSingle()
          const cr = (c ?? {}) as Record<string, unknown>
          setForm({
            displayName: (cr.display_name as string) || supplier.displayName || "",
            email: (cr.email as string) || supplier.email || "",
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

  async function handleSaveProfile() {
    if (!ctx) return
    setSaving(true)
    setSaved(false)
    setError(null)
    try {
      const supabase = createClient()
      // Write to LIVE contacts columns (display_name / company)
      const { error: updateErr } = await supabase
        .from("contacts")
        .update({
          display_name: form.displayName || null,
          email: form.email || null,
          phone: form.phone || null,
          company: form.company || null,
          address_line1: form.address || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", ctx.contactId)

      if (updateErr) throw updateErr
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error(err)
      setError("Failed to save changes.")
    } finally {
      setSaving(false)
    }
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
        <p className="text-sm text-slate-500">Manage your supplier profile and preferences</p>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>
      )}
      {saved && (
        <div className="rounded-2xl bg-green-50 border border-green-200 p-4 text-sm text-green-700">
          Settings saved successfully.
        </div>
      )}

      {/* Company details */}
      <Card className="rounded-2xl border-slate-200">
        <CardHeader><CardTitle>Company Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input label="Full Name" value={form.displayName} onChange={(e) => handleChange("displayName", e.target.value)} />
          <Input label="Company Name" value={form.company} onChange={(e) => handleChange("company", e.target.value)} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Email Address" type="email" value={form.email} onChange={(e) => handleChange("email", e.target.value)} />
            <Input label="Phone Number" value={form.phone} onChange={(e) => handleChange("phone", e.target.value)} />
          </div>
          <Input label="Business Address" value={form.address} onChange={(e) => handleChange("address", e.target.value)} />
          <Button variant="primary" size="sm" onClick={handleSaveProfile} disabled={saving || !ctx}>
            <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Changes"}
          </Button>
          {!ctx && (
            <p className="text-xs text-slate-400">
              Profile editing requires a linked supplier contact. Ask your operator to grant you portal access.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Notification preferences (stored locally — wire to a prefs table when available) */}
      <Card className="rounded-2xl border-slate-200">
        <CardHeader><CardTitle>Notification Preferences</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {[
            { key: "notifyNewJobs" as const, label: "New job assignments", sub: "When an operator assigns a job to you" },
            { key: "notifyMessages" as const, label: "New messages", sub: "When an operator contacts you" },
            { key: "notifyInvoice" as const, label: "Invoice status updates", sub: "When your invoice is approved or rejected" },
            { key: "notifyPayment" as const, label: "Payment confirmations", sub: "When a payment is processed" },
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
                className={`w-10 h-5 rounded-full transition-colors relative ${notifs[pref.key] ? "bg-[#2563EB]" : "bg-slate-200"}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${notifs[pref.key] ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>
          ))}
          <p className="text-[11px] text-slate-400 pt-1">
            Preferences are saved on this device. Email delivery is controlled by your operator&apos;s
            notification settings.
          </p>
        </CardContent>
      </Card>

      {/* Account / security */}
      <Card className="rounded-2xl border-slate-200">
        <CardHeader><CardTitle>Account &amp; Security</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl bg-[#EFF6FF] border border-blue-100 p-3">
            <ShieldCheck className="w-4 h-4 text-[#2563EB] mt-0.5 shrink-0" />
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
