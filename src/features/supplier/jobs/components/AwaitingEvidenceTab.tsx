"use client"

import React, { useMemo, useState } from "react"
import {
  CameraOff, Table2, LayoutGrid, Image as ImageIcon, UploadCloud, ShieldCheck,
  FileWarning, CheckCircle2, Send, StickyNote, MessageSquare, FileImage,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatPence } from "@/lib/marketplace/money"
import {
  SupplierCard, SupplierEmptyState, SupplierStatusBadge, SupplierButton, SupplierBanner, type SupplierKpi,
} from "@/components/supplier-workspace/ui"
import { SupplierViewSwitcher } from "@/components/supplier-workspace/views"
import { timeAgo } from "@/components/supplier-workspace/format"
import type { SupplierJob } from "../data/types"
import { evidenceComplete, evidencePct } from "../data/types"
import {
  ProgressRing, ChecklistItem, PanelSection, EvidenceDropzone, useToast, ToastHost,
} from "./primitives"

type ViewId = "cards" | "table" | "gallery" | "queue"

export function AwaitingEvidenceTab({ jobs }: { jobs: SupplierJob[] }) {
  const [view, setView] = useState<ViewId>("cards")
  const [selectedId, setSelectedId] = useState<string | null>(jobs[0]?.id ?? null)
  const { toasts, push } = useToast()

  const selected = useMemo(() => jobs.find((j) => j.id === selectedId) ?? jobs[0] ?? null, [jobs, selectedId])

  const kpis: SupplierKpi[] = useMemo(() => {
    const blocked = jobs.filter((j) => !evidenceComplete(j)).reduce((a, j) => a + j.escrowPence, 0)
    const missingPhotos = jobs.filter((j) => j.evidence.some((e) => (e.key === "before_photos" || e.key === "after_photos") && !e.received)).length
    const missingSignoff = jobs.filter((j) => j.evidence.some((e) => e.key === "customer_signoff" && !e.received)).length
    const ready = jobs.filter((j) => evidenceComplete(j)).length
    return [
      { label: "Awaiting evidence", value: jobs.length, icon: CameraOff },
      { label: "Payout blocked", value: formatPence(blocked), icon: ShieldCheck },
      { label: "Missing photos", value: missingPhotos, icon: ImageIcon },
      { label: "Missing sign-off", value: missingSignoff, icon: FileWarning },
      { label: "Ready to submit", value: ready, icon: CheckCircle2 },
    ]
  }, [jobs])

  function qualityScore(job: SupplierJob): number {
    // Heuristic evidence-quality score from received items + file count.
    const beforeOk = job.evidenceFiles.some((f) => f.kind === "before")
    const afterOk = job.evidenceFiles.some((f) => f.kind === "after")
    const notesOk = job.evidence.find((e) => e.key === "completion_notes")?.received ?? false
    const namedOk = job.evidenceFiles.length > 0 && job.evidenceFiles.every((f) => /\.(jpg|png|pdf)$/i.test(f.name))
    return Math.round(([beforeOk, afterOk, notesOk, namedOk].filter(Boolean).length / 4) * 100)
  }

  if (jobs.length === 0) {
    return (
      <SupplierCard className="p-2">
        <SupplierEmptyState icon={CameraOff} title="No jobs awaiting evidence" description="Finished jobs needing photos, notes or sign-off to release payment appear here." />
      </SupplierCard>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {kpis.map((k) => (
          <SupplierCard key={k.label} className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">{k.label}</span>
              {k.icon && <k.icon className="w-4 h-4 text-slate-400" />}
            </div>
            <p className="text-xl font-bold text-slate-900 mt-1">{k.value}</p>
          </SupplierCard>
        ))}
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-700">Evidence to release payouts</p>
        <SupplierViewSwitcher<ViewId>
          value={view}
          onChange={setView}
          options={[
            { key: "cards", label: "Checklist", icon: LayoutGrid },
            { key: "table", label: "Table", icon: Table2 },
            { key: "gallery", label: "Gallery", icon: ImageIcon },
            { key: "queue", label: "Upload queue", icon: UploadCloud },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
        <div className="min-w-0">
          {view === "gallery" ? (
            <SupplierCard className="p-4">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {jobs.flatMap((j) => j.evidenceFiles).length === 0 ? (
                  <p className="col-span-full text-sm text-slate-400 py-8 text-center">No uploads yet.</p>
                ) : jobs.flatMap((j) => j.evidenceFiles).map((f) => (
                  <div key={f.id} className="aspect-square rounded-xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-slate-400 p-2">
                    <FileImage className="w-6 h-6" />
                    <span className="text-[10px] text-center mt-1 truncate w-full">{f.name}</span>
                  </div>
                ))}
              </div>
            </SupplierCard>
          ) : view === "queue" ? (
            <SupplierCard className="p-4 space-y-3">
              <EvidenceDropzone onFiles={(f) => push("emerald", `${f.length} file(s) queued. (TODO: upload)`)} />
              <p className="text-xs text-slate-400">Upload-only: files are sent to evidence storage and cannot be edited here once submitted.</p>
            </SupplierCard>
          ) : view === "table" ? (
            <SupplierCard className="overflow-x-auto">
              <table className="w-full text-sm min-w-[680px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/60 text-left">
                    <Th>Job</Th><Th>Escrow held</Th><Th>Evidence</Th><Th>Sign-off</Th><Th>Escrow status</Th><Th>Ready</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {jobs.map((j) => {
                    const done = evidenceComplete(j)
                    return (
                      <tr key={j.id} onClick={() => setSelectedId(j.id)} className={cn("cursor-pointer hover:bg-slate-50/60", selected?.id === j.id ? "bg-[var(--brand-soft)]/40" : "")}>
                        <Td><p className="font-semibold text-slate-800">{j.title}</p><p className="text-xs text-slate-400">{j.ref} · {j.customerName}</p></Td>
                        <Td className="font-medium text-slate-700">{formatPence(j.escrowPence)}</Td>
                        <Td><div className="flex items-center gap-2"><ProgressRing value={evidencePct(j)} size={28} stroke={3} tone={done ? "emerald" : "amber"} label="" /><span className="text-xs text-slate-600">{evidencePct(j)}%</span></div></Td>
                        <Td><SupplierStatusBadge tone={j.signoffStatus === "signed" ? "emerald" : j.signoffStatus === "requested" ? "amber" : "slate"}>{j.signoffStatus === "none" ? "Not requested" : j.signoffStatus[0].toUpperCase() + j.signoffStatus.slice(1)}</SupplierStatusBadge></Td>
                        <Td><SupplierStatusBadge tone="amber">Held</SupplierStatusBadge></Td>
                        <Td><SupplierStatusBadge tone={done ? "emerald" : "slate"}>{done ? "Ready" : "Incomplete"}</SupplierStatusBadge></Td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </SupplierCard>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {jobs.map((j) => {
                const done = evidenceComplete(j)
                return (
                  <button key={j.id} onClick={() => setSelectedId(j.id)} className="text-left">
                    <SupplierCard className={cn("p-4 h-full transition-all hover:shadow-md", selected?.id === j.id ? "ring-2 ring-[var(--brand)]/40" : "")}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{j.title}</p>
                          <p className="text-xs text-slate-500">{j.customerName}</p>
                        </div>
                        <ProgressRing value={evidencePct(j)} tone={done ? "emerald" : "amber"} />
                      </div>
                      <div className="mt-3 rounded-xl border border-slate-100 px-3 py-1">
                        {j.evidence.map((e) => <ChecklistItem key={e.key} label={e.label} done={e.received} />)}
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <SupplierStatusBadge tone="amber">Escrow held · {formatPence(j.escrowPence)}</SupplierStatusBadge>
                        {done ? <span className="text-[11px] font-semibold text-emerald-600">Ready to submit</span> : <span className="text-[11px] font-semibold text-amber-600">Payout blocked</span>}
                      </div>
                    </SupplierCard>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Right panel */}
        {selected && (
          <SupplierCard className="p-4 lg:sticky lg:top-4 self-start space-y-4 h-max">
            <div>
              <p className="text-sm font-bold text-slate-900">{selected.title}</p>
              <p className="text-xs text-slate-400">{selected.ref} · {selected.customerName}</p>
            </div>

            {!evidenceComplete(selected) && (
              <SupplierBanner tone="amber">Payout is blocked until required evidence is submitted.</SupplierBanner>
            )}

            <PanelSection title="Upload evidence">
              <EvidenceDropzone onFiles={(f) => push("emerald", `${f.length} file(s) added to ${selected.ref}. (TODO: upload)`)} />
            </PanelSection>

            {selected.evidenceFiles.length > 0 && (
              <PanelSection title="Recent uploads">
                <div className="grid grid-cols-4 gap-2">
                  {selected.evidenceFiles.map((f) => (
                    <div key={f.id} className="aspect-square rounded-lg bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-slate-400 p-1">
                      <FileImage className="w-5 h-5" />
                      <span className="text-[9px] truncate w-full text-center mt-0.5">{f.name.slice(0, 10)}</span>
                    </div>
                  ))}
                </div>
              </PanelSection>
            )}

            <PanelSection title="Evidence quality score">
              <div className="flex items-center gap-3 rounded-xl bg-slate-50 border border-slate-100 p-3">
                <ProgressRing value={qualityScore(selected)} size={48} stroke={5} tone={qualityScore(selected) >= 75 ? "emerald" : "amber"} />
                <div className="text-xs text-slate-600 space-y-0.5">
                  <p>Photos clear · all angles</p>
                  <p>Notes detailed · files named</p>
                </div>
              </div>
            </PanelSection>

            <PanelSection title="What's still missing">
              <div className="rounded-xl border border-slate-100 px-3 py-1">
                {selected.evidence.filter((e) => !e.received).length === 0 ? (
                  <p className="text-xs text-emerald-600 py-2">Nothing missing — ready to submit.</p>
                ) : selected.evidence.filter((e) => !e.received).map((e) => <ChecklistItem key={e.key} label={e.label} done={false} />)}
              </div>
            </PanelSection>

            <PanelSection title="What's ready">
              <div className="rounded-xl border border-slate-100 px-3 py-1">
                {selected.evidence.filter((e) => e.received).map((e) => <ChecklistItem key={e.key} label={e.label} done />)}
              </div>
            </PanelSection>

            <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
              Escrow {formatPence(selected.escrowPence)} held until evidence complete.
            </div>

            <div className="grid grid-cols-2 gap-2">
              <SupplierButton size="sm" onClick={() => push("emerald", "Evidence uploader opened. (TODO)")}><UploadCloud className="w-3.5 h-3.5" /> Upload</SupplierButton>
              <SupplierButton size="sm" variant="outline" onClick={() => push("emerald", "Completion note added. (TODO)")}><StickyNote className="w-3.5 h-3.5" /> Add note</SupplierButton>
              <SupplierButton size="sm" variant="outline" onClick={() => push("emerald", "Sign-off requested. (TODO)")}><CheckCircle2 className="w-3.5 h-3.5" /> Request sign-off</SupplierButton>
              <SupplierButton size="sm" variant="outline" onClick={() => push("blue", "Message thread opened. (TODO)")}><MessageSquare className="w-3.5 h-3.5" /> Message</SupplierButton>
              <SupplierButton
                size="sm"
                className="col-span-2"
                disabled={!evidenceComplete(selected)}
                onClick={() => push("emerald", "Evidence submitted — payout queued. (TODO)")}
              >
                <Send className="w-3.5 h-3.5" /> {evidenceComplete(selected) ? "Submit evidence" : "Complete evidence to submit"}
              </SupplierButton>
            </div>
          </SupplierCard>
        )}
      </div>

      <ToastHost toasts={toasts} />
    </div>
  )
}

function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th className={cn("px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400", className)}>{children}</th>
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("px-3 py-2.5 align-middle", className)}>{children}</td>
}
