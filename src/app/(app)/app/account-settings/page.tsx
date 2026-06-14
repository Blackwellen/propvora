"use client"

import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  User, Shield, Bell, Settings, Camera, Check, Eye, EyeOff,
  Monitor, Smartphone, LogOut, Lock, Palette, LayoutTemplate,
  PanelLeftClose, PanelLeftOpen, ChevronRight, RotateCcw,
} from "lucide-react"
import { useEffect } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { createClient } from "@/lib/supabase/client"
import { useShellStyle } from "@/contexts/ShellStyleContext"
import { SHELL_STYLE_META, type ShellStyle, type ShellLayout } from "@/lib/shell"
import { useGuidedHelp } from "@/guided-help/GuidedHelpProvider"

/* ------------------------------------------------------------------ */
/* Schemas                                                             */
/* ------------------------------------------------------------------ */
const profileSchema = z.object({
  full_name: z.string().min(2, "Name required"),
  phone:     z.string().optional(),
})

const passwordSchema = z.object({
  current:  z.string().min(1, "Current password required"),
  password: z.string().min(8, "Minimum 8 characters"),
  confirm:  z.string(),
}).refine(d => d.password === d.confirm, { message: "Passwords don't match", path: ["confirm"] })

type ProfileData  = z.infer<typeof profileSchema>
type PasswordData = z.infer<typeof passwordSchema>

/* ------------------------------------------------------------------ */
/* Sessions mock                                                        */
/* ------------------------------------------------------------------ */
const SESSIONS = [
  { id: "s1", device: "Chrome on macOS",      location: "Birmingham, UK",  last: "Active now",      current: true },
  { id: "s2", device: "Safari on iPhone 14",  location: "Birmingham, UK",  last: "2 hours ago",     current: false },
  { id: "s3", device: "Chrome on Windows 11", location: "London, UK",      last: "Yesterday 14:22", current: false },
]

/* ------------------------------------------------------------------ */
/* Notification toggles                                                 */
/* ------------------------------------------------------------------ */
const NOTIFICATIONS = [
  { id: "email_notif",     label: "Email notifications",  desc: "Important alerts via email" },
  { id: "in_app_notif",    label: "In-app notifications", desc: "Alerts inside Propvora" },
  { id: "weekly_digest",   label: "Weekly digest",        desc: "Sunday summary email" },
  { id: "payment_alerts",  label: "Payment reminders",    desc: "Rent and invoice alerts" },
  { id: "task_alerts",     label: "Task reminders",       desc: "Due task notifications" },
  { id: "tenancy_alerts",  label: "Tenancy alerts",       desc: "Start/end date reminders" },
  { id: "planning_alerts", label: "Planning updates",     desc: "Planning application changes" },
]

/* ------------------------------------------------------------------ */
/* Tabs                                                                 */
/* ------------------------------------------------------------------ */
const TABS = [
  { id: "profile",       label: "Profile",       icon: User },
  { id: "security",      label: "Security",      icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "appearance",    label: "Appearance",    icon: Palette },
  { id: "preferences",   label: "Preferences",   icon: Settings },
]

/* ------------------------------------------------------------------ */
/* Toggle helper                                                        */
/* ------------------------------------------------------------------ */
function Toggle({
  checked, onChange,
}: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        "w-11 h-6 rounded-full transition-all relative shrink-0",
        checked ? "bg-blue-600" : "bg-slate-200"
      )}
      role="switch"
      aria-checked={checked}
    >
      <span className={cn(
        "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all",
        checked ? "left-5" : "left-0.5"
      )} />
    </button>
  )
}

/* ================================================================== */
/* Shell Style Preview card — soft-card only                           */
/* ================================================================== */
function ShellStyleMiniPreview({ style: _style }: { style: ShellStyle }) {
  return (
    <div className="w-full h-[88px] rounded-xl overflow-hidden relative"
      style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
      {/* Sidebar strip */}
      <div className="absolute left-0 top-0 bottom-0 w-[30px] flex flex-col"
        style={{ background: "#FFFFFF", borderRight: "1px solid #E2E8F0" }}>
        <div className="w-3 h-1.5 rounded mx-auto mt-2 mb-2" style={{ background: "#2563EB" }} />
        {[true, false, false, false].map((active, i) => (
          <div key={i} className="mx-1.5 mb-1 h-2 rounded-sm"
            style={{
              background: active ? "#EFF6FF" : "transparent",
              border: active ? "none" : "1px solid #E2E8F0",
            }}
          />
        ))}
      </div>
      {/* Top bar */}
      <div className="absolute left-[30px] right-0 top-0 h-[18px] flex items-center px-2 gap-1.5"
        style={{ background: "#FFFFFF", borderBottom: "1px solid #E2E8F0" }}>
        <div className="flex-1 h-1.5 rounded-full" style={{ background: "#E2E8F0" }} />
        <div className="w-5 h-3.5 rounded-md" style={{ background: "#2563EB" }} />
        <div className="w-3 h-3 rounded-full" style={{ background: "#E2E8F0" }} />
      </div>
      {/* Content area */}
      <div className="absolute left-[30px] right-0 top-[18px] bottom-0 p-2 flex flex-col gap-1.5">
        <div className="flex gap-1.5">
          {[70, 50, 40].map((w, i) => (
            <div key={i} className="h-3.5 rounded-md"
              style={{ width: `${w}%`, background: "rgba(0,0,0,0.05)" }} />
          ))}
        </div>
        <div className="flex gap-1.5">
          {[40, 60].map((w, i) => (
            <div key={i} className="h-3.5 rounded-md"
              style={{ width: `${w}%`, background: "rgba(0,0,0,0.04)" }} />
          ))}
        </div>
      </div>
    </div>
  )
}

/* ================================================================== */
/* Layout Mode Preview card                                             */
/* ================================================================== */
function LayoutModeCard({
  mode, selected, onClick,
}: {
  mode: ShellLayout
  selected: boolean
  onClick: () => void
}) {
  const isSideTop = mode === "side-and-top"

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex flex-col gap-3 p-4 rounded-2xl border-2 transition-all duration-150 text-left w-full",
        selected
          ? "border-blue-600 bg-blue-50"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
      )}
    >
      {selected && (
        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
          <Check className="w-3 h-3 text-white" />
        </div>
      )}

      {/* Mini mockup */}
      <div className="w-full h-14 rounded-lg overflow-hidden bg-slate-100 relative">
        {isSideTop ? (
          <>
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-[#0D1B2A]" />
            <div className="absolute left-8 right-0 top-0 h-4 bg-white border-b border-slate-200" />
            <div className="absolute left-8 right-0 top-4 bottom-0 bg-[#F8FAFC]" />
          </>
        ) : (
          <>
            <div className="absolute left-0 right-0 top-0 h-5 bg-[#0D1B2A]" />
            <div className="absolute left-0 right-0 top-5 bottom-0 bg-[#F8FAFC]" />
          </>
        )}
      </div>

      <div className="flex items-start gap-2">
        {isSideTop
          ? <PanelLeftOpen className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
          : <LayoutTemplate className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
        }
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {isSideTop ? "Side nav + Top nav" : "Top nav only"}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
            {isSideTop
              ? "Sidebar with full nav depth + matching top bar."
              : "Full-width top bar with inline nav links and compact widgets."}
          </p>
        </div>
      </div>
    </button>
  )
}

/* ================================================================== */
/* ShellAppearanceTab                                                   */
/* ================================================================== */
function ShellAppearanceTab() {
  const {
    prefs, setStyle, setLayout, setCollapsed, setTopNavCompact,
    savePrefs, resetPrefs, isSaving, isSaved,
  } = useShellStyle()

  const ALL_STYLES = Object.entries(SHELL_STYLE_META)
    .sort(([, a], [, b]) => a.number - b.number) as [ShellStyle, typeof SHELL_STYLE_META[ShellStyle]][]

  return (
    <div className="space-y-8">
      {/* ── Shell Style ─────────────────────────────────────────────── */}
      <div>
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-slate-900">Shell Style</h3>
          <p className="text-xs text-slate-500 mt-0.5">Choose the visual style for your navigation and shell.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {ALL_STYLES.map(([key, meta]) => (
            <button
              key={key}
              onClick={() => setStyle(key)}
              className={cn(
                "relative flex flex-col gap-3 p-4 rounded-2xl border-2 transition-all duration-150 text-left",
                prefs.shell_style === key
                  ? "border-blue-600 bg-blue-50"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
              )}
            >
              {/* Selected checkmark */}
              {prefs.shell_style === key && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}

              {/* Number + default badge */}
              <div className="flex items-center gap-2">
                <span className={cn(
                  "w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center",
                  prefs.shell_style === key
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600"
                )}>
                  {meta.number}
                </span>
                <span className="text-sm font-semibold text-slate-900 leading-tight">{meta.label}</span>
                {meta.isDefault && (
                  <span className="ml-auto text-[10px] font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                    Default
                  </span>
                )}
              </div>

              {/* Mini preview */}
              <ShellStyleMiniPreview style={key} />

              {/* Description */}
              <p className="text-[11.5px] text-slate-500 leading-snug">{meta.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* ── Layout Mode ─────────────────────────────────────────────── */}
      <div className="border-t border-slate-200 pt-6">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-slate-900">Shell Layout</h3>
          <p className="text-xs text-slate-500 mt-0.5">Choose how navigation is structured across the interface.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <LayoutModeCard
            mode="side-and-top"
            selected={prefs.shell_layout === "side-and-top"}
            onClick={() => setLayout("side-and-top")}
          />
          <LayoutModeCard
            mode="top-only"
            selected={prefs.shell_layout === "top-only"}
            onClick={() => setLayout("top-only")}
          />
        </div>
      </div>

      {/* ── Additional options ──────────────────────────────────────── */}
      <div className="border-t border-slate-200 pt-6 space-y-3">
        <h3 className="text-sm font-semibold text-slate-900">Additional Options</h3>

        {[
          {
            id: "collapse",
            label: "Collapse side nav by default",
            desc: "Start with the sidebar in icon-only mode.",
            value: prefs.side_nav_collapsed,
            onChange: setCollapsed,
            disabled: prefs.shell_layout === "top-only",
          },
          {
            id: "compact",
            label: "Compact top nav on scroll",
            desc: "Top bar shrinks to compact mode when you scroll down.",
            value: prefs.top_nav_compact,
            onChange: setTopNavCompact,
            disabled: false,
          },
        ].map(opt => (
          <div
            key={opt.id}
            className={cn(
              "flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white transition-opacity",
              opt.disabled && "opacity-40 pointer-events-none"
            )}
          >
            <div>
              <p className="text-sm font-medium text-slate-900">{opt.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{opt.desc}</p>
            </div>
            <Toggle checked={opt.value} onChange={opt.onChange} />
          </div>
        ))}
      </div>

      {/* ── Actions ─────────────────────────────────────────────────── */}
      <div className="border-t border-slate-200 pt-6 flex flex-wrap items-center gap-3">
        <Button
          variant="primary"
          onClick={savePrefs}
          loading={isSaving}
          leftIcon={isSaved ? <Check className="w-4 h-4" /> : undefined}
        >
          {isSaved ? "Saved!" : "Save Appearance"}
        </Button>

        <Button
          variant="outline"
          onClick={resetPrefs}
          leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
        >
          Reset to defaults
        </Button>

        <p className="text-xs text-slate-400 ml-auto">
          These settings are saved to your account — each team member can have their own shell.
        </p>
      </div>
    </div>
  )
}

/* ================================================================== */
/* Profile tab                                                          */
/* ================================================================== */
function ProfileTab() {
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [email,  setEmail]  = useState("")
  const [userId, setUserId] = useState<string | null>(null)
  const [error,  setError]  = useState<string | null>(null)
  const form = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: "", phone: "" },
  })

  // Hydrate from Supabase profiles.
  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        setUserId(user.id)
        setEmail(user.email ?? "")
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("full_name:display_name, phone")
          .eq("id", user.id)
          .maybeSingle()
        if (error && (error as { code?: string }).code !== "42P01") { /* non-fatal */ }
        form.reset({
          full_name: profile?.full_name ?? (user.user_metadata?.full_name as string | undefined) ?? "",
          phone: profile?.phone ?? "",
        })
      } catch { /* keep empty */ }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function onSubmit(data: ProfileData) {
    setSaving(true); setError(null)
    try {
      const supabase = createClient()
      const uid = userId ?? (await supabase.auth.getUser()).data.user?.id
      if (!uid) { setError("Not signed in."); return }
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: data.full_name.trim() || null, phone: data.phone?.trim() || null })
        .eq("id", uid)
      if (error && (error as { code?: string }).code !== "42P01") { setError("Failed to save."); return }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setError("An unexpected error occurred.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center gap-5">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-xl font-bold">JT</div>
          <button type="button" className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center hover:bg-slate-50 transition-colors">
            <Camera className="w-3 h-3 text-slate-600" />
          </button>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-900">Profile Photo</p>
          <p className="text-xs text-slate-400 mt-0.5">JPG or PNG, max 2MB</p>
          <Button type="button" variant="outline" size="xs" className="mt-2">Upload Photo</Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Full Name</label>
          <input {...form.register("full_name")} className="w-full h-10 px-3 rounded-lg text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
          {form.formState.errors.full_name && <p className="text-xs text-red-600">{form.formState.errors.full_name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Email</label>
          <input value={email} disabled className="w-full h-10 px-3 rounded-lg text-sm border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed" />
          <p className="text-xs text-slate-400">Contact support to change email</p>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Phone</label>
          <input {...form.register("phone")} placeholder="07700 900000" className="w-full h-10 px-3 rounded-lg text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
        </div>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}
      <Button type="submit" variant="primary" loading={saving} leftIcon={saved ? <Check className="w-4 h-4" /> : undefined}>
        {saved ? "Saved!" : "Save Changes"}
      </Button>
    </form>
  )
}

/* ================================================================== */
/* Security tab                                                         */
/* ================================================================== */
function SecurityTab() {
  const [showPwd, setShowPwd]       = useState({ current: false, new: false, confirm: false })
  const [mfaEnabled, setMfaEnabled] = useState(false)
  const [saving, setSaving]         = useState(false)
  const [saved,  setSaved]          = useState(false)
  const [sessions, setSessions]     = useState(SESSIONS)
  const form = useForm<PasswordData>({ resolver: zodResolver(passwordSchema) })

  async function onSubmit(_: PasswordData) {
    setSaving(true); await new Promise(r => setTimeout(r, 1000)); setSaving(false); setSaved(true); form.reset()
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2"><Lock className="w-4 h-4 text-slate-400" />Change Password</h3>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-md">
          {([ ["current","Current Password","current"], ["password","New Password","new"], ["confirm","Confirm New Password","confirm"] ] as [keyof PasswordData, string, keyof typeof showPwd][]).map(([field, label, k]) => (
            <div key={field} className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">{label}</label>
              <div className="relative">
                <input
                  {...form.register(field)}
                  type={showPwd[k] ? "text" : "password"}
                  className="w-full h-10 pl-3 pr-10 rounded-lg text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  onClick={() => setShowPwd(p => ({ ...p, [k]: !p[k] }))}>
                  {showPwd[k] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.formState.errors[field] && <p className="text-xs text-red-600">{form.formState.errors[field]?.message}</p>}
            </div>
          ))}
          <Button type="submit" variant="primary" loading={saving} leftIcon={saved ? <Check className="w-4 h-4" /> : undefined}>
            {saved ? "Password Updated!" : "Update Password"}
          </Button>
        </form>
      </div>

      <div className="border-t border-slate-200 pt-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2"><Shield className="w-4 h-4 text-slate-400" />Two-Factor Authentication</h3>
            <p className="text-xs text-slate-500 mt-1">Add an extra layer of security to your account.</p>
          </div>
          <Toggle checked={mfaEnabled} onChange={setMfaEnabled} />
        </div>
        {mfaEnabled && <p className="text-xs text-emerald-600 font-medium mt-2 flex items-center gap-1"><Check className="w-3 h-3" />2FA is enabled</p>}
      </div>

      <div className="border-t border-slate-200 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-900">Active Sessions</h3>
          <Button variant="destructive-soft" size="sm">Sign out all devices</Button>
        </div>
        <div className="space-y-3">
          {sessions.map(s => (
            <div key={s.id} className="flex items-center gap-4 p-3 rounded-xl border border-slate-200 bg-white">
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                {s.device.includes("iPhone") ? <Smartphone className="w-4 h-4 text-slate-500" /> : <Monitor className="w-4 h-4 text-slate-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-slate-900 truncate">{s.device}</p>
                  {s.current && <Badge variant="success" size="sm">Current</Badge>}
                </div>
                <p className="text-xs text-slate-400">{s.location} · {s.last}</p>
              </div>
              {!s.current && (
                <Button variant="outline" size="xs" leftIcon={<LogOut className="w-3 h-3" />}
                  onClick={() => setSessions(p => p.filter(x => x.id !== s.id))}>
                  Revoke
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ================================================================== */
/* Notifications tab                                                    */
/* ================================================================== */
function NotificationsTab() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>(
    Object.fromEntries(NOTIFICATIONS.map(n => [n.id, true]))
  )
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)

  async function handleSave() {
    setSaving(true); await new Promise(r => setTimeout(r, 800)); setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {NOTIFICATIONS.map(n => (
          <div key={n.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white">
            <div>
              <p className="text-sm font-medium text-slate-900">{n.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{n.desc}</p>
            </div>
            <Toggle checked={prefs[n.id]} onChange={v => setPrefs(p => ({ ...p, [n.id]: v }))} />
          </div>
        ))}
      </div>
      <Button variant="primary" loading={saving} onClick={handleSave}
        leftIcon={saved ? <Check className="w-4 h-4" /> : undefined}>
        {saved ? "Preferences Saved!" : "Save Preferences"}
      </Button>
    </div>
  )
}

/* ================================================================== */
/* Preferences tab                                                      */
/* ================================================================== */
function PreferencesTab() {
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)

  // Guided product tour / tips toggle — persisted by the guided-help provider
  // (localStorage "propvora.help.enabled" + best-effort guided_help_state).
  const { enabled: tourEnabled, setEnabled: setTourEnabled } = useGuidedHelp()

  async function handleSave() {
    setSaving(true); await new Promise(r => setTimeout(r, 800)); setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-5 max-w-md">
      {/* Product tour & tips */}
      <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white">
        <div>
          <p className="text-sm font-medium text-slate-900">Product tour &amp; tips</p>
          <p className="text-xs text-slate-400 mt-0.5">Show guided walkthroughs and first-use tips as you explore Propvora.</p>
        </div>
        <Toggle checked={tourEnabled} onChange={setTourEnabled} />
      </div>

      {[
        { label: "Language",    options: ["English (GB)", "English (US)", "Welsh"],           default: "English (GB)" },
        { label: "Date Format", options: ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"],          default: "DD/MM/YYYY" },
        { label: "Currency",    options: ["GBP (£)", "EUR (€)", "USD ($)"],                    default: "GBP (£)" },
        { label: "Timezone",    options: ["Europe/London (GMT+1)", "UTC", "America/New_York"], default: "Europe/London (GMT+1)" },
      ].map(pref => (
        <div key={pref.label} className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">{pref.label}</label>
          <select defaultValue={pref.default}
            className="w-full h-10 pl-3 pr-8 rounded-lg text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 appearance-none">
            {pref.options.map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
      ))}
      <Button variant="primary" loading={saving} onClick={handleSave} className="mt-2"
        leftIcon={saved ? <Check className="w-4 h-4" /> : undefined}>
        {saved ? "Saved!" : "Save Preferences"}
      </Button>
    </div>
  )
}

/* ================================================================== */
/* Page                                                                 */
/* ================================================================== */
export default function AccountSettingsPage() {
  const [activeTab, setActiveTab] = useState("profile")

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Account Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your profile, security, shell appearance and preferences.</p>
      </div>

      {/* Tab nav */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto">
        {TABS.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-all",
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        {activeTab === "profile"       && <ProfileTab />}
        {activeTab === "security"      && <SecurityTab />}
        {activeTab === "notifications" && <NotificationsTab />}
        {activeTab === "appearance"    && <ShellAppearanceTab />}
        {activeTab === "preferences"   && <PreferencesTab />}
      </div>
    </div>
  )
}
