"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  BadgeCheck, UserCheck, CreditCard, RefreshCw, ShieldCheck, Camera, Plus, MapPin,
  Fingerprint, Bell, Lock, KeyRound, Download, Trash2, Mail, MessageSquare,
  Smartphone, ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useCustomerToast } from "../components/toast"
import { StatusPill } from "../components/StatusPill"
import { customerInputClass } from "@/components/customer/ui"
import { PasswordChangeModal, TwoFactorModal } from "./SecurityModals"
import { AddressModal } from "./AddressModal"

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "profile", label: "Profile settings" },
  { id: "finance", label: "Finance settings" },
  { id: "security", label: "Security" },
  { id: "notifications", label: "Notifications" },
  { id: "privacy", label: "Privacy" },
]

export default function AccountSettingsClient({ initialTab = "overview" }: { initialTab?: string }) {
  const router = useRouter()
  const { toast } = useCustomerToast()
  const [tab, setTab] = useState(initialTab)
  const [dirty, setDirty] = useState(false)
  const [modal, setModal] = useState<null | "password" | "2fa" | "address">(null)
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [dob, setDob] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [addresses, setAddresses] = useState<{ id: string; label: string | null; line1: string | null; city: string | null; postcode: string | null; is_default: boolean }[]>([])

  async function loadAddresses() {
    try {
      const res = await fetch("/api/customer/addresses", { headers: { accept: "application/json" } })
      if (!res.ok) return
      const data = (await res.json()) as { items?: typeof addresses }
      setAddresses(data.items ?? [])
    } catch { /* ignore */ }
  }
  useEffect(() => { void loadAddresses() }, [])

  // Load the customer's profile from their auth account.
  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const { createClient } = await import("@/lib/supabase/client")
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!active || !user) return
        const m = (user.user_metadata ?? {}) as Record<string, unknown>
        setFullName(typeof m.full_name === "string" ? m.full_name : "")
        setPhone(typeof m.phone === "string" ? m.phone : "")
        setDob(typeof m.date_of_birth === "string" ? m.date_of_birth : "")
        setAvatarUrl(typeof m.avatar_url === "string" ? m.avatar_url : "")
        setEmail(user.email ?? "")
      } catch { /* keep blanks */ }
    })()
    return () => { active = false }
  }, [])

  async function onAvatarPicked(file: File | undefined) {
    if (avatarInputRef.current) avatarInputRef.current.value = ""
    if (!file) return
    if (!file.type.startsWith("image/")) { toast("Please choose an image file.", "error"); return }
    setUploadingAvatar(true)
    try {
      const { createClient } = await import("@/lib/supabase/client")
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { toast("Please sign in again.", "error"); setUploadingAvatar(false); return }
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase()
      const path = `customers/${user.id}/avatars/avatar.${ext}`
      const up = await supabase.storage.from("customer-files").upload(path, file, { upsert: true, contentType: file.type })
      if (up.error) { toast("Upload failed. Please try again.", "error"); setUploadingAvatar(false); return }
      const signed = await supabase.storage.from("customer-files").createSignedUrl(path, 60 * 60 * 24 * 365)
      const url = signed.data?.signedUrl ?? ""
      if (url) {
        await supabase.auth.updateUser({ data: { avatar_url: url } })
        setAvatarUrl(url)
        toast("Photo updated.", "success")
      }
    } catch {
      toast("Could not upload photo. Please try again.", "error")
    } finally {
      setUploadingAvatar(false)
    }
  }

  async function saveProfile() {
    setSavingProfile(true)
    try {
      const { createClient } = await import("@/lib/supabase/client")
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName.trim(), phone: phone.trim(), date_of_birth: dob.trim() },
      })
      if (error) { toast(error.message, "error"); setSavingProfile(false); return }
      toast("Profile saved.", "success")
      setDirty(false)
    } catch {
      toast("Could not save profile. Please try again.", "error")
    } finally {
      setSavingProfile(false)
    }
  }

  function changeTab(id: string) {
    setTab(id)
    router.replace(id === "overview" ? "/customer/account-settings" : `/customer/account-settings?tab=${id}`, { scroll: false })
  }

  async function submitTicket(subject: string, category: string, doneMsg: string) {
    try {
      const res = await fetch("/api/customer/help-tickets", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ subject, category }),
      })
      toast(res.ok ? doneMsg : "Could not submit your request. Please try again.", res.ok ? "success" : "error")
    } catch {
      toast("Something went wrong. Please try again.", "error")
    }
  }

  return (
    <div className="space-y-5 pb-16">
      <div>
        <h1 className="text-[26px] font-bold text-slate-900">Account settings</h1>
        <p className="text-[13.5px] text-slate-500 mt-1">Manage your profile, payments, privacy and security in one place.</p>
      </div>

      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto">
        {TABS.map((t) => <button key={t.id} onClick={() => changeTab(t.id)} className={cn("px-3.5 py-2.5 text-[13.5px] font-semibold border-b-2 -mb-px whitespace-nowrap", t.id === tab ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800")}>{t.label}</button>)}
      </div>

      {/* Status strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Stat icon={UserCheck} bg="bg-slate-100 text-slate-400" label="Verification status" value="Unverified" cta="Verify identity" onClick={() => changeTab("security")} />
        <Stat icon={BadgeCheck} bg="bg-blue-50 text-blue-600" label="Profile completeness" value="—" cta="Complete profile" onClick={() => changeTab("profile")} />
        <Stat icon={CreditCard} bg="bg-violet-50 text-violet-600" label="Saved payment methods" value="—" cta="Add card" onClick={() => changeTab("finance")} />
        <Stat icon={RefreshCw} bg="bg-slate-100 text-slate-400" label="Autopay status" value="Not set" cta="Set up autopay" onClick={() => changeTab("finance")} />
        <Stat icon={ShieldCheck} bg="bg-slate-100 text-slate-400" label="Security health" value="—" cta="Review" onClick={() => changeTab("security")} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5 items-start">
        <div className="space-y-5">
          {(tab === "overview" || tab === "profile") && (
            <>
              <Panel title="Profile information">
                <div className="flex items-center gap-4 mb-4">
                  <span className="relative w-16 h-16 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center text-white text-[18px] font-bold overflow-hidden">
                    {avatarUrl
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={avatarUrl} alt="Your photo" className="w-full h-full object-cover" />
                      : (fullName.trim()[0]?.toUpperCase() ?? "")}
                    <input ref={avatarInputRef} type="file" accept="image/*" hidden onChange={(e) => onAvatarPicked(e.target.files?.[0])} />
                    <button onClick={() => avatarInputRef.current?.click()} disabled={uploadingAvatar} aria-label="Upload profile photo" className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 shadow-sm disabled:opacity-60">{uploadingAvatar ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}</button>
                  </span>
                  <div><p className="text-[14px] font-semibold text-slate-800">{fullName.trim() || "Your Profile"}</p><p className="text-[12px] text-slate-400">Customer · Unverified</p></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Full name" value={fullName} onValueChange={(v) => { setFullName(v); setDirty(true) }} placeholder="Your name" />
                  <Field label="Email address" value={email} readOnly placeholder="—" />
                  <Field label="Phone number" value={phone} onValueChange={(v) => { setPhone(v); setDirty(true) }} placeholder="+44 …" />
                  <Field label="Date of birth" value={dob} onValueChange={(v) => { setDob(v); setDirty(true) }} placeholder="YYYY-MM-DD" />
                </div>
              </Panel>
              <Panel title="Saved addresses" action={<AddBtn label="Add address" onClick={() => setModal("address")} />}>
                {addresses.length === 0 ? (
                  <p className="text-[12.5px] text-slate-400 py-2">No saved addresses yet. Add your home or work address for faster checkout.</p>
                ) : (
                  addresses.map((a) => (
                    <AddrRow key={a.id} label={a.label || "Address"} value={[a.line1, a.city, a.postcode].filter(Boolean).join(", ")} primary={a.is_default} />
                  ))
                )}
              </Panel>
              <Panel title="Emergency contact" action={<AddBtn label="Add contact" onClick={() => toast("Add emergency contact — coming soon", "info")} />}>
                <p className="text-[12.5px] text-slate-400 py-2">No emergency contact added yet.</p>
              </Panel>
              <Panel title="Identity verification">
                <div className="flex items-center justify-between"><div className="flex items-center gap-2.5"><span className="w-9 h-9 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center"><Fingerprint className="w-4 h-4" /></span><div><p className="text-[12.5px] font-semibold text-slate-800">Identity not yet verified</p><p className="text-[11.5px] text-slate-400">Complete verification to unlock all features</p></div></div><StatusPill tone="slate">Unverified</StatusPill></div>
              </Panel>
            </>
          )}

          {(tab === "overview" || tab === "notifications") && (
            <Panel title="Communication preferences">
              <PrefRow icon={Mail} title="Email notifications" sub="Booking updates, receipts and offers" defaultOn channel="email" category="all" />
              <PrefRow icon={MessageSquare} title="SMS notifications" sub="Time-sensitive booking alerts" defaultOn channel="sms" category="all" />
              <PrefRow icon={Smartphone} title="Push notifications" sub="On your devices" channel="push" category="all" />
              <PrefRow icon={Bell} title="Marketing &amp; offers" sub="Curated deals and credits" defaultOn channel="email" category="marketing" />
            </Panel>
          )}

          {(tab === "overview" || tab === "finance") && (
            <Panel title="Finance &amp; payment settings" action={<Link href="/customer/payments" className="text-[12px] font-semibold text-blue-600">Open payments →</Link>}>
              <FinRow label="Default payment method" value="Not set" />
              <FinRow label="Autopay" value="Configure in payments" />
              <FinRow label="Refund destination" value="Original payment method" />
              <FinRow label="Billing currency" value="GBP (£)" />
            </Panel>
          )}

          {(tab === "overview" || tab === "security") && (
            <Panel title="Security">
              <SecRow icon={KeyRound} title="Password" sub="Update your login password" cta="Change password" onClick={() => setModal("password")} />
              <SecRow icon={Smartphone} title="Two-factor authentication" sub="Not yet enabled" cta="Enable 2FA" onClick={() => setModal("2fa")} />
              <SecRow icon={Download} title="Download your data" sub="Get a copy of your account data" cta="Request" onClick={() => submitTicket("Data export request", "data_export", "Data export requested — we'll email you a copy.")} />
            </Panel>
          )}

          {(tab === "overview" || tab === "privacy") && (
            <Panel title="Privacy">
              <PrefRow icon={ShieldCheck} title="Profile visibility" sub="Show profile to hosts you book with" defaultOn />
              <PrefRow icon={Lock} title="Search personalisation" sub="Use my activity to improve results" defaultOn />
              <div className="pt-2 mt-2 border-t border-slate-100">
                <button onClick={() => submitTicket("Account deletion request", "account_deletion", "Account deletion requested — our team will be in touch to confirm.")} className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-rose-600"><Trash2 className="w-4 h-4" /> Delete / export account</button>
              </div>
            </Panel>
          )}
        </div>

        {/* Right rail */}
        <aside className="space-y-5">
          <Panel title="Account status">
            <Row l="Member since" r="—" />
            <Row l="Account type" r="Customer" />
            <Row l="Status" r="Active" />
            <div className="flex items-center justify-between"><span className="text-[12px] text-slate-500">Verification</span><StatusPill tone="slate">Unverified</StatusPill></div>
          </Panel>
          <Panel title="Quick actions">
            <QA icon={KeyRound} label="Change password" onClick={() => setModal("password")} />
            <QA icon={Fingerprint} label="Verify identity" onClick={() => toast("Identity verification — coming soon", "info")} />
            <QA icon={CreditCard} label="Manage cards" onClick={() => router.push("/customer/payments")} />
            <QA icon={Download} label="Download data" onClick={() => submitTicket("Data export request", "data_export", "Data export requested — we'll email you a copy.")} />
          </Panel>
          <Panel title="Payment summary">
            <Row l="Saved cards" r="—" />
            <Row l="Bank accounts" r="—" />
            <Row l="Autopay" r="Not set" />
            <Link href="/customer/payments" className="mt-1 inline-block text-[12px] font-semibold text-blue-600">Manage payment methods →</Link>
          </Panel>
          <Panel title="Trust &amp; safety">
            <p className="text-[12.5px] text-slate-400">Complete your profile to build trust with hosts and landlords.</p>
          </Panel>
        </aside>
      </div>

      {/* Save bar */}
      {dirty && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 px-4 py-3 md:pl-[calc(50%-740px+2rem)]">
          <div className="mx-auto max-w-[1480px] flex items-center justify-between">
            <p className="text-[12.5px] text-slate-500">You have unsaved changes</p>
            <div className="flex items-center gap-2">
              <button onClick={() => { setDirty(false); toast("Changes discarded", "info") }} className="border border-slate-200 rounded-xl px-4 py-2 text-[12.5px] font-semibold text-slate-700">Discard</button>
              <button onClick={saveProfile} disabled={savingProfile} className="bg-[#2563EB] text-white rounded-xl px-4 py-2 text-[12.5px] font-semibold disabled:opacity-60">{savingProfile ? "Saving…" : "Save changes"}</button>
            </div>
          </div>
        </div>
      )}

      {modal === "password" && <PasswordChangeModal onClose={() => setModal(null)} onDone={(m) => toast(m, "success")} />}
      {modal === "2fa" && <TwoFactorModal onClose={() => setModal(null)} onDone={(m) => toast(m, "success")} />}
      {modal === "address" && <AddressModal onClose={() => setModal(null)} onSaved={(m) => { toast(m, "success"); void loadAddresses() }} />}
    </div>
  )
}

/* helpers */
function Stat({ icon: Icon, bg, label, value, cta, onClick, pill }: { icon: typeof UserCheck; bg: string; label: string; value: string; cta: string; onClick: () => void; pill?: boolean }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
      <span className={cn("w-9 h-9 rounded-xl flex items-center justify-center", bg)}><Icon className="w-[18px] h-[18px]" /></span>
      <p className="text-[11.5px] text-slate-500 mt-2.5">{label}</p>
      {pill ? <StatusPill tone="emerald" className="mt-1">{value}</StatusPill> : <p className="text-[16px] font-bold text-slate-900">{value}</p>}
      <button onClick={onClick} className="mt-1.5 text-[11.5px] font-semibold text-blue-600">{cta}</button>
    </div>
  )
}
function Panel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5"><div className="flex items-center justify-between mb-3"><h3 className="text-[14px] font-bold text-slate-900" dangerouslySetInnerHTML={{ __html: title }} />{action}</div><div className="space-y-2">{children}</div></div>
}
function Field({ label, value, onValueChange, readOnly, placeholder }: { label: string; value: string; onValueChange?: (v: string) => void; readOnly?: boolean; placeholder?: string }) {
  return <div><label className="block text-[11.5px] font-medium text-slate-500 mb-1">{label}</label><input value={value} onChange={(e) => onValueChange?.(e.target.value)} readOnly={readOnly} placeholder={placeholder} className={cn(customerInputClass, readOnly && "bg-slate-50 text-slate-500")} /></div>
}
function AddBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return <button onClick={onClick} className="inline-flex items-center gap-1 text-[12px] font-semibold text-blue-600"><Plus className="w-3.5 h-3.5" /> {label}</button>
}
function AddrRow({ label, value, primary }: { label: string; value: string; primary?: boolean }) {
  return <div className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0"><span className="w-9 h-9 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center shrink-0"><MapPin className="w-4 h-4" /></span><div className="flex-1 min-w-0"><p className="text-[12.5px] font-semibold text-slate-800">{label} {primary && <StatusPill tone="blue">Primary</StatusPill>}</p><p className="text-[11.5px] text-slate-400 truncate">{value}</p></div></div>
}
function PrefRow({ icon: Icon, title, sub, defaultOn, channel, category }: { icon: typeof Mail; title: string; sub: string; defaultOn?: boolean; channel?: string; category?: string }) {
  const [on, setOn] = useState(!!defaultOn)
  const [loaded, setLoaded] = useState(false)

  // When a channel is provided, this row persists to the notification-preferences
  // backend and reflects the stored value on load.
  useEffect(() => {
    if (!channel) return
    let active = true
    void (async () => {
      try {
        const res = await fetch("/api/customer/notification-preferences", { headers: { accept: "application/json" } })
        if (!res.ok || !active) return
        const data = (await res.json()) as { items?: { channel: string; category: string; enabled: boolean }[] }
        const match = (data.items ?? []).find((i) => i.channel === channel && i.category === (category ?? "all"))
        if (active && match) setOn(match.enabled)
      } catch { /* keep default */ } finally { if (active) setLoaded(true) }
    })()
    return () => { active = false }
  }, [channel, category])

  async function toggle() {
    const next = !on
    setOn(next)
    if (!channel) return // privacy/local rows persist nothing
    try {
      const res = await fetch("/api/customer/notification-preferences", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ channel, category: category ?? "all", enabled: next }),
      })
      if (!res.ok) setOn(!next) // roll back
    } catch { setOn(!next) }
  }

  return <div className="flex items-center justify-between py-2"><div className="flex items-center gap-2.5"><span className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center"><Icon className="w-4 h-4" /></span><div><p className="text-[12.5px] font-semibold text-slate-800" dangerouslySetInnerHTML={{ __html: title }} /><p className="text-[11px] text-slate-400">{sub}</p></div></div><button onClick={toggle} disabled={!!channel && !loaded} className={cn("w-9 h-5 rounded-full p-0.5 transition disabled:opacity-50", on ? "bg-emerald-500" : "bg-slate-200")}><span className={cn("block w-4 h-4 rounded-full bg-white transition-transform", on && "translate-x-4")} /></button></div>
}
function FinRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between py-1.5"><span className="text-[12px] text-slate-500">{label}</span><span className="text-[12px] font-semibold text-slate-800">{value}</span></div>
}
function SecRow({ icon: Icon, title, sub, cta, onClick }: { icon: typeof KeyRound; title: string; sub: string; cta: string; onClick: () => void }) {
  return <div className="flex items-center justify-between py-2"><div className="flex items-center gap-2.5"><span className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center"><Icon className="w-4 h-4" /></span><div><p className="text-[12.5px] font-semibold text-slate-800">{title}</p><p className="text-[11px] text-slate-400">{sub}</p></div></div><button onClick={onClick} className="text-[11.5px] font-semibold text-blue-600">{cta}</button></div>
}
function QA({ icon: Icon, label, onClick }: { icon: typeof KeyRound; label: string; onClick: () => void }) {
  return <button onClick={onClick} className="w-full flex items-center gap-2.5 py-2 group"><span className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 shrink-0"><Icon className="w-4 h-4" /></span><span className="flex-1 text-left text-[12.5px] font-medium text-slate-700">{label}</span><ChevronRight className="w-4 h-4 text-slate-300" /></button>
}
function Row({ l, r }: { l: string; r: string }) {
  return <div className="flex items-center justify-between"><span className="text-[12px] text-slate-500">{l}</span><span className="text-[12px] font-semibold text-slate-800">{r}</span></div>
}
