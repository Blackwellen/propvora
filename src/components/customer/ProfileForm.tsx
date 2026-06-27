"use client"

import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"
import { UserCircle, Mail, Phone, Bell, Check, AlertCircle, Pencil, X } from "lucide-react"
import { CustomerCard } from "./ui"
import type { CustomerProfile } from "@/lib/customer/types"
import {
  saveCustomerProfileAction,
  type ProfileFormResult,
} from "@/app/(customer)/customer/profile/actions"

const PREFERENCES: { key: string; label: string; hint: string }[] = [
  { key: "pref_email_updates", label: "Email updates", hint: "Booking confirmations and changes" },
  { key: "pref_booking_reminders", label: "Booking reminders", hint: "Before check-in and check-out" },
  { key: "pref_sms_updates", label: "SMS updates", hint: "Time-sensitive alerts to your phone" },
  { key: "pref_marketing", label: "Offers & news", hint: "Occasional product updates (optional)" },
]

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-1.5 bg-[var(--brand)] hover:bg-[var(--brand-strong)] text-white rounded-xl px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60"
    >
      {pending ? "Saving…" : "Save changes"}
    </button>
  )
}

function Field({
  icon: Icon,
  label,
  name,
  defaultValue,
  type = "text",
  placeholder,
  editing,
}: {
  icon: React.ElementType
  label: string
  name: string
  defaultValue?: string
  type?: string
  placeholder?: string
  editing: boolean
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}
      </label>
      {editing ? (
        <div className="relative">
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            id={name}
            name={name}
            type={type}
            defaultValue={defaultValue}
            placeholder={placeholder}
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/40 focus:border-[var(--brand)] transition-colors"
          />
        </div>
      ) : (
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100">
          <Icon className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-sm text-slate-700">{defaultValue || <span className="text-slate-400">Not set</span>}</span>
          {/* Keep value submittable even when collapsed. */}
          <input type="hidden" name={name} value={defaultValue ?? ""} />
        </div>
      )}
    </div>
  )
}

export default function ProfileForm({ profile }: { profile: CustomerProfile | null }) {
  const initial: ProfileFormResult = { ok: false }
  const [state, formAction] = useActionState(saveCustomerProfileAction, initial)
  const [editing, setEditing] = useState(false)
  const prefs = (profile?.preferences ?? {}) as Record<string, unknown>

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CustomerCard className="p-5">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <UserCircle className="w-4 h-4 text-slate-500" />
              <h2 className="text-base font-semibold text-slate-900">Your details</h2>
            </div>
            <button
              type="button"
              onClick={() => setEditing((e) => !e)}
              className="inline-flex items-center gap-1 text-[13px] font-semibold text-[var(--brand)] hover:underline"
            >
              {editing ? <><X className="w-3.5 h-3.5" /> Cancel</> : <><Pencil className="w-3.5 h-3.5" /> Edit</>}
            </button>
          </div>
          <div className="space-y-4">
            <Field editing={editing} icon={UserCircle} label="Display name" name="display_name" defaultValue={profile?.display_name ?? ""} placeholder="How should we address you?" />
            <Field editing={editing} icon={Mail} label="Contact email" name="email" type="email" defaultValue={profile?.email ?? ""} placeholder="you@example.com" />
            <Field editing={editing} icon={Phone} label="Phone" name="phone" type="tel" defaultValue={profile?.phone ?? ""} placeholder="Optional" />
          </div>
        </CustomerCard>

        <CustomerCard className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-4 h-4 text-slate-500" />
            <h2 className="text-base font-semibold text-slate-900">Communication preferences</h2>
          </div>
          <div className="space-y-3">
            {PREFERENCES.map((p) => (
              <label key={p.key} className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name={p.key}
                  defaultChecked={Boolean(prefs[p.key.replace("pref_", "")])}
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[var(--brand)] focus:ring-[var(--brand)]/40"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-slate-700">{p.label}</span>
                  <span className="block text-xs text-slate-500">{p.hint}</span>
                </span>
              </label>
            ))}
          </div>
          <p className="mt-4 text-[11px] text-slate-400">
            You control how Propvora and your hosts contact you. We never share your details with third parties.
          </p>
        </CustomerCard>
      </div>

      <div className="flex items-center justify-between gap-3">
        {state.ok ? (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
            <Check className="w-4 h-4" /> Saved
          </span>
        ) : state.error ? (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600">
            <AlertCircle className="w-4 h-4" /> {state.error}
          </span>
        ) : (
          <span />
        )}
        <SubmitButton />
      </div>
    </form>
  )
}
