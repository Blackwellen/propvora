"use client"

import { useState } from "react"
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

  function changeTab(id: string) {
    setTab(id)
    router.replace(id === "overview" ? "/customer/account-settings" : `/customer/account-settings?tab=${id}`, { scroll: false })
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
                  <span className="relative w-16 h-16 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center text-white text-[18px] font-bold">
                    <button onClick={() => toast("Upload avatar (upload-only) — coming soon", "info")} className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 shadow-sm"><Camera className="w-3.5 h-3.5" /></button>
                  </span>
                  <div><p className="text-[14px] font-semibold text-slate-800">Your Profile</p><p className="text-[12px] text-slate-400">Customer · Unverified</p></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Full name" defaultValue="" onChange={() => setDirty(true)} />
                  <Field label="Email address" defaultValue="" onChange={() => setDirty(true)} />
                  <Field label="Phone number" defaultValue="" onChange={() => setDirty(true)} />
                  <Field label="Date of birth" defaultValue="" onChange={() => setDirty(true)} />
                </div>
              </Panel>
              <Panel title="Saved addresses" action={<AddBtn label="Add address" onClick={() => setModal("address")} />}>
                <p className="text-[12.5px] text-slate-400 py-2">No saved addresses yet. Add your home or work address for faster checkout.</p>
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
              <PrefRow icon={Mail} title="Email notifications" sub="Booking updates, receipts and offers" defaultOn />
              <PrefRow icon={MessageSquare} title="SMS notifications" sub="Time-sensitive booking alerts" defaultOn />
              <PrefRow icon={Smartphone} title="Push notifications" sub="On your devices" />
              <PrefRow icon={Bell} title="Marketing &amp; offers" sub="Curated deals and credits" defaultOn />
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
              <SecRow icon={Download} title="Download your data" sub="Get a copy of your account data" cta="Request" onClick={() => toast("Data export requested", "success")} />
            </Panel>
          )}

          {(tab === "overview" || tab === "privacy") && (
            <Panel title="Privacy">
              <PrefRow icon={ShieldCheck} title="Profile visibility" sub="Show profile to hosts you book with" defaultOn />
              <PrefRow icon={Lock} title="Search personalisation" sub="Use my activity to improve results" defaultOn />
              <div className="pt-2 mt-2 border-t border-slate-100">
                <button onClick={() => toast("Account deletion — opens secure flow", "warning")} className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-rose-600"><Trash2 className="w-4 h-4" /> Delete / export account</button>
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
            <QA icon={Download} label="Download data" onClick={() => toast("Data export requested", "success")} />
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
              <button onClick={() => { setDirty(false); toast("Changes saved", "success") }} className="bg-[#2563EB] text-white rounded-xl px-4 py-2 text-[12.5px] font-semibold">Save changes</button>
            </div>
          </div>
        </div>
      )}

      {modal === "password" && <PasswordChangeModal onClose={() => setModal(null)} onDone={(m) => toast(m, "success")} />}
      {modal === "2fa" && <TwoFactorModal onClose={() => setModal(null)} onDone={(m) => toast(m, "success")} />}
      {modal === "address" && <AddressModal onClose={() => setModal(null)} onSaved={(m) => toast(m, "success")} />}
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
function Field({ label, defaultValue, onChange }: { label: string; defaultValue: string; onChange: () => void }) {
  return <div><label className="block text-[11.5px] font-medium text-slate-500 mb-1">{label}</label><input defaultValue={defaultValue} onChange={onChange} className={customerInputClass} /></div>
}
function AddBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return <button onClick={onClick} className="inline-flex items-center gap-1 text-[12px] font-semibold text-blue-600"><Plus className="w-3.5 h-3.5" /> {label}</button>
}
function AddrRow({ label, value, primary }: { label: string; value: string; primary?: boolean }) {
  return <div className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0"><span className="w-9 h-9 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center shrink-0"><MapPin className="w-4 h-4" /></span><div className="flex-1 min-w-0"><p className="text-[12.5px] font-semibold text-slate-800">{label} {primary && <StatusPill tone="blue">Primary</StatusPill>}</p><p className="text-[11.5px] text-slate-400 truncate">{value}</p></div></div>
}
function PrefRow({ icon: Icon, title, sub, defaultOn }: { icon: typeof Mail; title: string; sub: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(!!defaultOn)
  return <div className="flex items-center justify-between py-2"><div className="flex items-center gap-2.5"><span className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center"><Icon className="w-4 h-4" /></span><div><p className="text-[12.5px] font-semibold text-slate-800" dangerouslySetInnerHTML={{ __html: title }} /><p className="text-[11px] text-slate-400">{sub}</p></div></div><button onClick={() => setOn(!on)} className={cn("w-9 h-5 rounded-full p-0.5 transition", on ? "bg-emerald-500" : "bg-slate-200")}><span className={cn("block w-4 h-4 rounded-full bg-white transition-transform", on && "translate-x-4")} /></button></div>
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
