"use client"

import { Calendar, CheckCircle2, MessageSquare, ShieldCheck, Upload } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCustomerToast } from "../../../components/toast"
import { StatusPill, type PillTone } from "../../../components/StatusPill"

interface Req {
  id: string
  title: string
  category: string
  reported: string
  status: string
  tone: PillTone
}

interface Props {
  req: Req
}

function TL({ title, sub, done }: { title: string; sub: string; done?: boolean }) {
  return (
    <li className="flex items-center gap-2">
      <CheckCircle2 className={cn("w-3.5 h-3.5 shrink-0", done ? "text-emerald-500" : "text-slate-300")} />
      <span className="text-[11.5px] text-slate-600 flex-1">{title}</span>
      <span className="text-[10.5px] text-slate-400">{sub}</span>
    </li>
  )
}

export default function MaintenanceDetailPanel({ req }: Props) {
  const { toast } = useCustomerToast()
  return (
    <aside className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sticky top-[84px]">
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-slate-400">{req.id}</p>
        <StatusPill tone={req.tone}>{req.status}</StatusPill>
      </div>
      <h3 className="text-[15px] font-bold text-slate-900 mt-1">{req.title}</h3>
      <p className="text-[12px] text-slate-500">
        {req.category} · reported {req.reported}
      </p>

      <div className="mt-3 pt-3 border-t border-slate-100">
        <p className="text-[12px] font-semibold text-slate-700 mb-1">Description</p>
        <p className="text-[12px] text-slate-500">
          Reported by tenant. Awaiting contractor assessment and a confirmed appointment slot.
        </p>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100">
        <p className="text-[12px] font-semibold text-slate-700 mb-1.5">Photos</p>
        <div className="grid grid-cols-4 gap-1.5">
          {["/property-types/sa.jpg", "/property-types/holiday.jpg", "/property-types/mixed.jpg"].map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={src} alt="" className="w-full h-12 rounded-md object-cover" />
          ))}
          <button
            onClick={() => toast("Add photo (upload-only) — coming soon", "info")}
            className="w-full h-12 rounded-md border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 hover:border-[var(--color-brand-300)]"
          >
            <Upload className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100">
        <p className="text-[12px] font-semibold text-slate-700 mb-1.5">Contractor appointment</p>
        <div className="bg-[var(--brand-soft)] rounded-lg p-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[var(--brand)]" />
            <div>
              <p className="text-[11.5px] font-semibold text-slate-700">26 May 2025, 10:00–12:00</p>
              <p className="text-[10.5px] text-slate-400">PlumbPro Ltd</p>
            </div>
          </div>
          <button
            onClick={() => toast("Appointment approved", "success")}
            className="text-[11px] font-semibold bg-white border border-[var(--color-brand-100)] rounded-lg px-2 py-1 text-[var(--brand)]"
          >
            Approve
          </button>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100">
        <p className="text-[12px] font-semibold text-slate-700 mb-1.5">Timeline</p>
        <ol className="space-y-1.5">
          <TL title="Reported by you" sub={req.reported} done />
          <TL title="Acknowledged by manager" sub="Same day" done />
          <TL title="Contractor assigned" sub="23 May 2025" done />
          <TL title="Repair scheduled" sub="26 May 2025" />
          <TL title="Resolved" sub="Pending" />
        </ol>
      </div>

      <div className="mt-3 space-y-2">
        <button
          onClick={() => toast("Messaging property manager…", "info")}
          className="w-full inline-flex items-center justify-center gap-1.5 bg-[var(--brand)] text-white rounded-xl py-2.5 text-[13px] font-semibold"
        >
          <MessageSquare className="w-4 h-4" /> Message property manager
        </button>
        <button
          onClick={() => toast("Marked resolved", "success")}
          className="w-full inline-flex items-center justify-center gap-1.5 border border-slate-200 rounded-xl py-2 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50"
        >
          <CheckCircle2 className="w-4 h-4" /> Mark resolved
        </button>
      </div>

      <div className="mt-3 bg-[var(--brand-soft)]/70 border border-[var(--color-brand-100)] rounded-xl p-3 flex items-start gap-2">
        <ShieldCheck className="w-4 h-4 text-[var(--brand)] shrink-0 mt-0.5" />
        <p className="text-[11px] text-slate-600">
          Emergencies (gas, flooding, no heating in winter) are prioritised within 24 hours. Call the emergency line for
          urgent issues.
        </p>
      </div>
    </aside>
  )
}
