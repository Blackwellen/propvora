"use client"

import { Camera, Plus, MapPin, Fingerprint } from "lucide-react"
import { useCustomerToast } from "../../components/toast"
import { StatusPill } from "../../components/StatusPill"
import { customerInputClass } from "@/components/customer/ui"

interface Props {
  onDirty: () => void
}

function Panel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5"><div className="flex items-center justify-between mb-3"><h3 className="text-[14px] font-bold text-slate-900">{title}</h3>{action}</div><div className="space-y-2">{children}</div></div>
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

export default function ProfileSection({ onDirty }: Props) {
  const { toast } = useCustomerToast()
  return (
    <>
      <Panel title="Profile information">
        <div className="flex items-center gap-4 mb-4">
          <span className="relative w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-sky-400 flex items-center justify-center text-white text-[18px] font-bold">
            <button onClick={() => toast("Upload avatar (upload-only) — coming soon", "info")} className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 shadow-sm"><Camera className="w-3.5 h-3.5" /></button>
          </span>
          <div><p className="text-[14px] font-semibold text-slate-800">Your Profile</p><p className="text-[12px] text-slate-400">Customer · Verified</p></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Full name" defaultValue="" onChange={onDirty} />
          <Field label="Email address" defaultValue="" onChange={onDirty} />
          <Field label="Phone number" defaultValue="" onChange={onDirty} />
          <Field label="Date of birth" defaultValue="" onChange={onDirty} />
        </div>
      </Panel>
      <Panel title="Saved addresses" action={<AddBtn label="Add address" onClick={() => toast("Add address — coming soon", "info")} />}>
        <p className="text-[12.5px] text-slate-400 py-2">No saved addresses yet.</p>
      </Panel>
      <Panel title="Emergency contact" action={<AddBtn label="Add contact" onClick={() => toast("Add emergency contact — coming soon", "info")} />}>
        <p className="text-[12.5px] text-slate-400 py-2">No emergency contact added yet.</p>
      </Panel>
      <Panel title="Identity verification">
        <div className="flex items-center justify-between"><div className="flex items-center gap-2.5"><span className="w-9 h-9 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center"><Fingerprint className="w-4 h-4" /></span><div><p className="text-[12.5px] font-semibold text-slate-800">Identity not yet verified</p><p className="text-[11.5px] text-slate-400">Complete verification to unlock all features</p></div></div><StatusPill tone="slate">Unverified</StatusPill></div>
      </Panel>
    </>
  )
}
