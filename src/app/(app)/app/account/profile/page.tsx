"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

function InputField({
  label,
  value,
  onChange,
  helper,
  className,
  type = "text",
}: {
  label: string
  value: string
  onChange: (v: string) => void
  helper?: string
  className?: string
  type?: string
}) {
  return (
    <div className={className}>
      <label className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-800 bg-white focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/20 transition-all"
      />
      {helper && <p className="text-[11px] text-slate-400 mt-1">{helper}</p>}
    </div>
  )
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}) {
  return (
    <div>
      <label className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-800 bg-white focus:outline-none focus:border-[#2563EB] transition-all"
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export default function ProfilePage() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    displayName: "",
    email: "",
    phone: "",
    jobTitle: "",
    timezone: "Europe/London",
    locale: "en-GB",
    bio: "",
  })
  const [userId, setUserId] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Load the signed-in user's profile from Supabase.
  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        setUserId(user.id)
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("full_name, phone, email")
          .eq("id", user.id)
          .maybeSingle()
        // Tolerate a missing profiles table (42P01) — fall back to auth metadata.
        if (error && (error as { code?: string }).code !== "42P01") {
          // non-fatal; still hydrate from auth
        }
        const fullName = profile?.full_name ?? (user.user_metadata?.full_name as string | undefined) ?? ""
        const parts = fullName.trim().split(/\s+/)
        setForm(f => ({
          ...f,
          firstName: parts[0] ?? "",
          lastName: parts.slice(1).join(" "),
          displayName: fullName,
          email: profile?.email ?? user.email ?? "",
          phone: profile?.phone ?? "",
        }))
      } catch {
        /* ignore — keep empty form */
      }
    }
    load()
  }, [])

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm(f => ({ ...f, [key]: value }))
    setIsDirty(true)
    setSaveError(null)
  }

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    try {
      const supabase = createClient()
      const uid = userId ?? (await supabase.auth.getUser()).data.user?.id
      if (!uid) { setSaveError("Not signed in."); return }
      const fullName = form.displayName.trim() || `${form.firstName} ${form.lastName}`.trim()
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName || null, phone: form.phone.trim() || null })
        .eq("id", uid)
      if (error && (error as { code?: string }).code !== "42P01") {
        setSaveError("Failed to save profile.")
        return
      }
      setIsDirty(false)
    } catch {
      setSaveError("An unexpected error occurred.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[20px] font-bold text-slate-900">Profile</h1>
        <p className="text-[13px] text-slate-500 mt-0.5">
          Your personal information shown across Propvora
        </p>
      </div>

      {/* Avatar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-5">
        <h3 className="text-[14px] font-bold text-slate-900 mb-4">Profile Photo</h3>
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-[#2563EB] flex items-center justify-center text-white text-2xl font-black shadow-sm shrink-0">
            JT
          </div>
          <div>
            <button className="px-4 py-2 rounded-xl bg-[#2563EB] text-white text-[12.5px] font-semibold hover:bg-[#1d4ed8] transition-colors">
              Upload photo
            </button>
            <p className="text-[11px] text-slate-400 mt-2">JPG, PNG or GIF · Max 5MB</p>
          </div>
        </div>
      </div>

      {/* Personal details */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-5">
        <h3 className="text-[14px] font-bold text-slate-900 mb-5">Personal Details</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <InputField
            label="First name"
            value={form.firstName}
            onChange={v => update("firstName", v)}
          />
          <InputField
            label="Last name"
            value={form.lastName}
            onChange={v => update("lastName", v)}
          />
        </div>
        <InputField
          label="Display name"
          value={form.displayName}
          onChange={v => update("displayName", v)}
        />
        <InputField
          label="Email address"
          value={form.email}
          onChange={v => update("email", v)}
          helper="Email changes require verification"
          className="mt-4"
        />
        <InputField
          label="Phone number"
          value={form.phone}
          onChange={v => update("phone", v)}
          className="mt-4"
        />
        <InputField
          label="Job title"
          value={form.jobTitle}
          onChange={v => update("jobTitle", v)}
          className="mt-4"
        />
      </div>

      {/* Timezone & language */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-5">
        <h3 className="text-[14px] font-bold text-slate-900 mb-4">Timezone & Language</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SelectField
            label="Timezone"
            value={form.timezone}
            options={[
              { value: "Europe/London",       label: "Europe/London (GMT+0)" },
              { value: "Europe/Paris",         label: "Europe/Paris (GMT+1)" },
              { value: "America/New_York",     label: "America/New_York (GMT-5)" },
              { value: "America/Los_Angeles",  label: "America/Los_Angeles (GMT-8)" },
            ]}
            onChange={v => update("timezone", v)}
          />
          <SelectField
            label="Language"
            value={form.locale}
            options={[
              { value: "en-GB", label: "English (UK)" },
              { value: "en-US", label: "English (US)" },
              { value: "fr-FR", label: "French" },
              { value: "de-DE", label: "German" },
            ]}
            onChange={v => update("locale", v)}
          />
        </div>
      </div>

      {/* Bio */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-24">
        <h3 className="text-[14px] font-bold text-slate-900 mb-4">Bio</h3>
        <div>
          <label className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">
            Short bio
          </label>
          <textarea
            value={form.bio}
            onChange={e => { setForm(f => ({ ...f, bio: e.target.value })); setIsDirty(true) }}
            rows={3}
            placeholder="Tell your team a bit about yourself…"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-800 bg-white focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/20 transition-all resize-none"
          />
          <p className="text-[11px] text-slate-400 mt-1">Visible on your profile card to teammates.</p>
        </div>
      </div>

      {/* Sticky save bar */}
      {isDirty && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-8 py-4 flex items-center justify-between z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
          <div>
            <p className="text-[13px] text-slate-600">You have unsaved changes</p>
            {saveError && <p className="text-[12px] text-red-500 mt-0.5">{saveError}</p>}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDirty(false)}
              className="px-4 py-2 text-[13px] text-slate-600 hover:text-slate-900"
            >
              Discard
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-[#2563EB] text-white text-[13px] font-semibold hover:bg-[#1d4ed8] transition-colors disabled:opacity-60 flex items-center gap-2"
            >
              {saving && (
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              )}
              Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
