"use client"

import Link from "next/link"
import { Calendar, ExternalLink, MoreHorizontal, CheckCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { StatusPill } from "../../components/StatusPill"

type Role = "Host" | "Property Manager" | "Support" | "Long-let Manager"
interface Convo {
  id: string; name: string; role: Role; subject: string; preview: string; time: string; unread: number
}
const ROLE_TONE: Record<Role, "violet" | "blue" | "amber" | "emerald"> = {
  Host: "violet", "Property Manager": "blue", Support: "amber", "Long-let Manager": "emerald",
}

function Bubble({ side, text, file, time }: { side: "in" | "out"; text?: string; file?: string; time: string }) {
  const out = side === "out"
  return (
    <div className={cn("flex gap-2", out ? "flex-row-reverse" : "")}>
      <span className="w-7 h-7 rounded-full bg-slate-200 shrink-0" />
      <div className="max-w-[78%]">
        <div className={cn("rounded-2xl px-3 py-2 text-[12.5px]", out ? "bg-[var(--brand)] text-white rounded-tr-sm" : "bg-slate-100 text-slate-700 rounded-tl-sm")}>
          {file ? (
            <span className="flex items-center gap-2"><span className="w-8 h-8 rounded bg-white/20 flex items-center justify-center text-[9px] font-bold">PDF</span><span><span className="block font-semibold">{file}</span><span className="block text-[10px] opacity-80">2.4 MB · PDF</span></span></span>
          ) : text}
        </div>
        <p className={cn("text-[10px] text-slate-400 mt-0.5 flex items-center gap-1", out ? "justify-end" : "")}>{time}{out && <CheckCheck className="w-3 h-3 text-[var(--color-brand-400)]" />}</p>
      </div>
    </div>
  )
}

interface Props {
  selected: Convo
}

export default function MessageThreadView({ selected }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-[640px]">
      <div className="flex items-center justify-between p-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5"><span className="w-10 h-10 rounded-full bg-slate-200" /><div><p className="text-[13.5px] font-semibold text-slate-800 flex items-center gap-1.5">{selected.name} <StatusPill tone={ROLE_TONE[selected.role]}>{selected.role}</StatusPill></p><p className="text-[11.5px] text-slate-400">Your active booking</p></div></div>
        <div className="flex items-center gap-1.5"><button className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400"><MoreHorizontal className="w-4 h-4" /></button><button className="inline-flex items-center gap-1 text-[12px] font-semibold text-slate-600 border border-slate-200 rounded-lg px-2.5 py-1.5">Details</button></div>
      </div>
      <div className="px-4 py-2 bg-slate-50 flex items-center justify-between text-[11.5px]"><span className="text-slate-500 inline-flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Booking dates available in your booking details</span><Link href="/customer/bookings" className="font-semibold text-[var(--brand)] inline-flex items-center gap-1">View booking <ExternalLink className="w-3.5 h-3.5" /></Link></div>

      <div className="flex-1 p-4 flex items-center justify-center">
        <p className="text-[12.5px] text-slate-400">No messages yet. Start a conversation below.</p>
      </div>
    </div>
  )
}
