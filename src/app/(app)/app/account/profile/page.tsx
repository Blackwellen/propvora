"use client"

import { useState, useEffect, useId, useRef } from "react"
import { Loader2 } from "lucide-react"
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
  const id = useId()
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-800 bg-white focus:outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]/20 transition-all"
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
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">{label}</label>
      <select
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-800 bg-white focus:outline-none focus:border-[var(--brand)] transition-all"
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

/** Two-letter initials from a name, falling back to the email local-part. */
function initialsFrom(name: string, email: string): string {
  const source = name.trim() || email.split("@")[0] || ""
  const parts = source.split(/[\s._-]+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const MAX_AVATAR_BYTES = 5 * 1024 * 1024

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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [prefs, setPrefs] = useState<Record<string, unknown>>({})
  const [isDirty, setIsDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  // Avatar upload
  const fileRef = useRef<HTMLInputElement>(null)
  const [avatarBusy, setAvatarBusy] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)

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
          .select("first_name, last_name, display_name, phone, bio, timezone, locale, avatar_url, preferences")
          .eq("id", user.id)
          .maybeSingle()
        // Tolerate a missing profiles table (42P01) — fall back to auth metadata.
        if (error && (error as { code?: string }).code !== "42P01") {
          // non-fatal; still hydrate from auth
        }
        const meta = user.user_metadata ?? {}
        const display = profile?.display_name ?? (meta.full_name as string | undefined) ?? ""
        const first = profile?.first_name ?? ""
        const last = profile?.last_name ?? ""
        // If first/last are empty, split the display name as a sensible default.
        const nameParts = display.trim().split(/\s+/).filter(Boolean)
        const prefObj = (profile?.preferences && typeof profile.preferences === "object"
          ? profile.preferences
          : {}) as Record<string, unknown>
        setPrefs(prefObj)
        setAvatarUrl(profile?.avatar_url ?? (meta.avatar_url as string | undefined) ?? null)
        setForm(f => ({
          ...f,
          firstName: first || nameParts[0] || "",
          lastName: last || nameParts.slice(1).join(" "),
          displayName: display,
          email: user.email ?? "",
          phone: profile?.phone ?? "",
          jobTitle: (prefObj.job_title as string | undefined) ?? "",
          timezone: profile?.timezone ?? "Europe/London",
          locale: profile?.locale ?? "en-GB",
          bio: profile?.bio ?? "",
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
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    try {
      const supabase = createClient()
      const uid = userId ?? (await supabase.auth.getUser()).data.user?.id
      if (!uid) { setSaveError("Not signed in."); return }
      const display = form.displayName.trim() || `${form.firstName} ${form.lastName}`.trim()
      const nextPrefs = { ...prefs, job_title: form.jobTitle.trim() || null }
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: form.firstName.trim() || null,
          last_name: form.lastName.trim() || null,
          display_name: display || null,
          phone: form.phone.trim() || null,
          bio: form.bio.trim() || null,
          timezone: form.timezone || null,
          locale: form.locale || null,
          preferences: nextPrefs,
          updated_at: new Date().toISOString(),
        })
        .eq("id", uid)
      if (error && (error as { code?: string }).code !== "42P01") {
        setSaveError("Failed to save profile. Please try again.")
        return
      }
      setPrefs(nextPrefs)
      setIsDirty(false)
      setSaved(true)
    } catch {
      setSaveError("An unexpected error occurred.")
    } finally {
      setSaving(false)
    }
  }

  async function handleAvatarFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = "" // allow re-selecting the same file
    if (!file) return
    setAvatarError(null)
    if (!file.type.startsWith("image/")) {
      setAvatarError("Please choose an image file (JPG, PNG or GIF).")
      return
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError("Image must be 5MB or smaller.")
      return
    }
    setAvatarBusy(true)
    try {
      const supabase = createClient()
      const uid = userId ?? (await supabase.auth.getUser()).data.user?.id
      if (!uid) { setAvatarError("Not signed in."); return }
      const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "") || "png"
      // RLS requires the first path segment to equal auth.uid().
      const path = `${uid}/avatar-${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type, cacheControl: "3600" })
      if (upErr) { setAvatarError("Upload failed. Please try again."); return }
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path)
      const publicUrl = pub.publicUrl
      const { error: dbErr } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl, avatar_path: path, updated_at: new Date().toISOString() })
        .eq("id", uid)
      if (dbErr && (dbErr as { code?: string }).code !== "42P01") {
        setAvatarError("Photo uploaded but could not be saved to your profile.")
        return
      }
      setAvatarUrl(publicUrl)
    } catch {
      setAvatarError("Upload failed. Please try again.")
    } finally {
      setAvatarBusy(false)
    }
  }

  const initials = initialsFrom(form.displayName || `${form.firstName} ${form.lastName}`, form.email)

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
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt="Your profile photo"
              className="w-20 h-20 rounded-2xl object-cover shadow-sm shrink-0 border border-slate-200"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-[var(--brand)] flex items-center justify-center text-white text-2xl font-black shadow-sm shrink-0">
              {initials}
            </div>
          )}
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              className="hidden"
              onChange={handleAvatarFile}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={avatarBusy}
              className="px-4 py-2 rounded-xl bg-[var(--brand)] text-white text-[12.5px] font-semibold hover:bg-[var(--brand-strong)] transition-colors disabled:opacity-60 flex items-center gap-2"
            >
              {avatarBusy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {avatarBusy ? "Uploading…" : avatarUrl ? "Change photo" : "Upload photo"}
            </button>
            {avatarError
              ? <p className="text-[11px] text-red-500 mt-2">{avatarError}</p>
              : <p className="text-[11px] text-slate-400 mt-2">JPG, PNG, GIF or WebP · Max 5MB</p>}
          </div>
        </div>
      </div>

      {/* Personal details */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-5">
        <h3 className="text-[14px] font-bold text-slate-900 mb-5">Personal Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
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
        <div className="mt-4">
          <label htmlFor="profile-email" className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">Email address</label>
          <input
            id="profile-email"
            type="email"
            value={form.email}
            readOnly
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-500 bg-slate-50 cursor-not-allowed focus:outline-none"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Changing your email requires verification. Update it on the{" "}
            <a href="/property-manager/account/security" className="text-[var(--brand)] font-medium hover:underline">Security</a> page.
          </p>
        </div>
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
          <label htmlFor="profile-bio" className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">
            Short bio
          </label>
          <textarea
            id="profile-bio"
            value={form.bio}
            onChange={e => { setForm(f => ({ ...f, bio: e.target.value })); setIsDirty(true); setSaved(false) }}
            rows={3}
            placeholder="Tell your team a bit about yourself…"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-800 bg-white focus:outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]/20 transition-all resize-none"
          />
          <p className="text-[11px] text-slate-400 mt-1">Visible on your profile card to teammates.</p>
        </div>
      </div>

      {/* Saved confirmation (transient) */}
      {saved && !isDirty && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-[13px] font-medium shadow-lg">
          Profile saved
        </div>
      )}

      {/* Sticky save bar */}
      {isDirty && (
        <div className="app-save-bar fixed left-0 right-0 bg-white border-t border-slate-200 px-4 sm:px-8 py-3 sm:py-4 flex items-center justify-between gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
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
              className="px-5 py-2 rounded-xl bg-[var(--brand)] text-white text-[13px] font-semibold hover:bg-[var(--brand-strong)] transition-colors disabled:opacity-60 flex items-center gap-2"
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
