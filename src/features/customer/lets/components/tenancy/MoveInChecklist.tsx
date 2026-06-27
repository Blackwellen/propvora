"use client"

import { useRef } from "react"
import { CheckCircle2, PenLine, Upload } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCustomerToast } from "../../../components/toast"
import { StatusPill, type PillTone } from "../../../components/StatusPill"

interface Item {
  id: string
  label: string
  category: string
  status: string
  tone: PillTone
  icon: React.ElementType
  done: boolean
}

interface Props {
  items: Item[]
  done: number
  pct: number
  onToggle: (id: string) => void
  tenancyId: string
}

const METER_TYPE: Record<string, string> = { electric: "electricity", gas: "gas", water: "water" }

export default function MoveInChecklist({ items, done, pct, onToggle, tenancyId }: Props) {
  const { toast } = useCustomerToast()
  const photoRef = useRef<HTMLInputElement>(null)

  async function addReading(itemId: string) {
    const meterType = METER_TYPE[itemId] ?? itemId
    const input = window.prompt(`Enter the ${meterType} meter reading:`)
    if (input == null) return
    const value = Number(String(input).replace(/[^\d.]/g, ""))
    if (!Number.isFinite(value)) { toast("Enter a numeric reading.", "error"); return }
    try {
      const res = await fetch("/api/customer/lets/meter-readings", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ tenancyId, meterType, value }),
      })
      if (!res.ok) { toast("Could not save the reading.", "error"); return }
      toast(`${meterType[0].toUpperCase()}${meterType.slice(1)} reading saved.`, "success")
      onToggle(itemId)
    } catch { toast("Something went wrong.", "error") }
  }

  async function onPhotoPicked(file: File | undefined) {
    if (photoRef.current) photoRef.current.value = ""
    if (!file) return
    if (!file.type.startsWith("image/")) { toast("Please choose an image.", "error"); return }
    try {
      const { createClient } = await import("@/lib/supabase/client")
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { toast("Please sign in again.", "error"); return }
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase()
      const path = `customers/${user.id}/tenancy/${tenancyId}/condition/${Date.now()}.${ext}`
      const up = await supabase.storage.from("customer-files").upload(path, file, { contentType: file.type, upsert: false })
      if (up.error) { toast("Upload failed.", "error"); return }
      const rec = await fetch("/api/customer/lets/condition-photos", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ tenancyId, r2Key: path, fileName: file.name }),
      })
      if (!rec.ok) { toast("Could not save the photo.", "error"); return }
      toast("Condition photo uploaded.", "success")
      onToggle("photos")
    } catch { toast("Something went wrong.", "error") }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[14px] font-bold text-slate-900">Move-in checklist</h3>
        <span className="text-[12px] font-semibold text-[var(--brand)]">
          {done}/{items.length} complete
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden mb-4">
        <div className="h-full bg-[var(--brand)] rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <input ref={photoRef} type="file" accept="image/*" hidden onChange={(e) => onPhotoPicked(e.target.files?.[0])} />
      <ul className="divide-y divide-slate-50">
        {items.map((i) => {
          const Icon = i.icon
          return (
            <li key={i.id} className="flex items-center gap-3 py-3">
              <button
                onClick={() => onToggle(i.id)}
                className={cn(
                  "w-6 h-6 rounded-md border flex items-center justify-center shrink-0",
                  i.done ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300"
                )}
              >
                {i.done && <CheckCircle2 className="w-4 h-4" />}
              </button>
              <span
                className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                  i.done ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400"
                )}
              >
                <Icon className="w-4 h-4" />
              </span>
              <div className="flex-1 min-w-0">
                <p className={cn("text-[13px] font-semibold", i.done ? "text-slate-500" : "text-slate-800")}>
                  {i.label}
                </p>
                <p className="text-[11px] text-slate-400">{i.category}</p>
              </div>
              <StatusPill tone={i.tone}>{i.status}</StatusPill>
              {i.id === "photos" ? (
                <button
                  onClick={() => photoRef.current?.click()}
                  className="text-[11.5px] font-semibold text-[var(--brand)] inline-flex items-center gap-1"
                >
                  <Upload className="w-3.5 h-3.5" /> Upload
                </button>
              ) : i.category === "Meters" && !i.done ? (
                <button
                  onClick={() => addReading(i.id)}
                  className="text-[11.5px] font-semibold text-[var(--brand)]"
                >
                  Add reading
                </button>
              ) : i.id === "inventory" ? (
                <button
                  onClick={() => toast("Signature requested", "info")}
                  className="text-[11.5px] font-semibold text-[var(--brand)] inline-flex items-center gap-1"
                >
                  <PenLine className="w-3.5 h-3.5" /> Sign
                </button>
              ) : null}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
