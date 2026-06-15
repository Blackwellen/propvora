"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { UserCircle, Mail, Phone, Bell, Check, AlertCircle } from "lucide-react"
import { CustomerCard } from "./ui"
import type { CustomerProfile } from "@/lib/customer/types"
import {
  saveCustomerProfileAction,
  type ProfileFormResult,
} from "@/app/(customer)/customer/profile/actions"

const PREFERENCES: { key: string; label: string; hint: string }[] = [
  { key: "pref_email_updates", label: "Email updates", hint: "Booking confirmations and changes" },
  { key: "pref_booking_reminders", label: "Booking reminders", hint: "Before check-in and check-out" },
  { key: "pref_marketing", label: "Offers & news", hint: "Occasional product updates (optional)" },
]

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-1.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-xl px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60"
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
}: {
  icon: React.ElementType
  label: string
  name: string
  defaultValue?: string
  type?: string
  placeholder?: string
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          id={name}
          name={name}
          type={type}
          defaultValue={defaultValue}
          placeholder={placeholder}
          className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40 focus:border-[#2563EB] transition-colors"
        />
      </div>
    </div>
  )
}

export default function ProfileForm({ profile }: { profile: CustomerProfile | null }) {
  const initial: ProfileFormResult = { ok: false }
  const [state, formAction] = useActionState(saveCustomerProfileAction, initial)
  const prefs = (profile?.preferences ?? {}) as Record<string, unknown>

  return (
    <form action={formAction} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <CustomerCard className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <UserCircle className="w-4 h-4 text-slate-500" />
          <h2 className="text-base font-semibold text-slate-900">Your details</h2>
        </div>
        <div className="space-y-4">
          <Field icon={UserCircle} label="Display name" name="display_name" defaultValue={profile?.display_name ?? ""} placeholder="How should we address you?" />
          <Field icon={Mail} label="Contact email" name="email" type="email" defaultValue={profile?.email ?? ""} placeholder="you@example.com" />
          <Field icon={Phone} label="Phone" name="phone" type="tel" defaultValue={profile?.phone ?? ""} placeholder="Optional" />
        </div>
      </CustomerCard>

      <div className="space-y-4">
        <CustomerCard className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-4 h-4 text-slate-500" />
            <h2 className="text-base font-semibold text-slate-900">Notification preferences</h2>
          </div>
          <div className="space-y-3">
            {PREFERENCES.map((p) => (
              <label key={p.key} className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name={p.key}
                  defaultChecked={Boolean(prefs[p.key.replace("pref_", "")])}
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]/40"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-slate-700">{p.label}</span>
                  <span className="block text-xs text-slate-500">{p.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </CustomerCard>

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
      </div>
    </form>
  )
}
