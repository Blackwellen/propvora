"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Wrench, MapPin, ClipboardList, KeyRound, Images, CheckCircle2, ChevronLeft, ChevronRight,
  Save, AlertTriangle, Home, Upload,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { PortalCard, PortalSectionCard, StatusChip } from "@/components/portals/portal-ui"
import { reportRepairAction } from "@/lib/portal/tenant-actions"

const STEPS = [
  { key: "issue", label: "Issue type", icon: Wrench },
  { key: "location", label: "Location", icon: MapPin },
  { key: "details", label: "Details", icon: ClipboardList },
  { key: "access", label: "Access & contact", icon: KeyRound },
  { key: "photos", label: "Photos", icon: Images },
  { key: "review", label: "Review & submit", icon: CheckCircle2 },
] as const

type Urgency = "low" | "medium" | "high" | "urgent"
const CATEGORIES = ["Plumbing", "Heating / Boiler", "Electrical", "Appliance", "Damp / Mould", "Structural", "Other"]
const FREQUENCY = ["Constant", "Intermittent", "Only sometimes", "First time"]
const SYMPTOMS = ["Leaking", "No power", "No heating", "Strange noise", "Bad smell", "Won't turn on"]
const URGENCY: { v: Urgency; label: string; tone: "slate" | "blue" | "amber" | "red" }[] = [
  { v: "low", label: "Low", tone: "slate" }, { v: "medium", label: "Medium", tone: "blue" },
  { v: "high", label: "High", tone: "amber" }, { v: "urgent", label: "Urgent", tone: "red" },
]

interface Draft {
  category: string; specificIssue: string; urgency: Urgency; safetyRisk: boolean
  location: string; description: string; startedAt: string; frequency: string; symptoms: string[]
  access: string; contact: string
}
const EMPTY: Draft = { category: "", specificIssue: "", urgency: "medium", safetyRisk: false, location: "", description: "", startedAt: "", frequency: "", symptoms: [], access: "", contact: "" }

export default function ReportRepairWizard({ sessionId, base, propertyLabel }: { sessionId: string; base: string; propertyLabel: string }) {
  const router = useRouter()
  const storageKey = `repair-draft-${sessionId}`
  const [step, setStep] = useState(0)
  const [d, setD] = useState<Draft>(EMPTY)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<string | null>(null)

  // Load draft
  useEffect(() => {
    try { const raw = localStorage.getItem(storageKey); if (raw) setD({ ...EMPTY, ...JSON.parse(raw) }) } catch { /* ignore */ }
  }, [storageKey])
  // Autosave draft
  useEffect(() => {
    const t = setTimeout(() => { try { localStorage.setItem(storageKey, JSON.stringify(d)) } catch { /* ignore */ } }, 400)
    return () => clearTimeout(t)
  }, [d, storageKey])

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => ({ ...p, [k]: v }))
  const toggleSymptom = (s: string) => setD((p) => ({ ...p, symptoms: p.symptoms.includes(s) ? p.symptoms.filter((x) => x !== s) : [...p.symptoms, s] }))

  const valid = useMemo(() => {
    if (step === 0) return !!d.category && !!d.specificIssue
    if (step === 2) return d.description.trim().length > 5
    return true
  }, [step, d])

  function saveDraft() { try { localStorage.setItem(storageKey, JSON.stringify(d)); setSavedAt(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })) } catch { /* ignore */ } }

  async function submit() {
    setSubmitting(true); setError(null)
    const title = [d.category, d.specificIssue].filter(Boolean).join(" — ") || "Maintenance request"
    const description = [d.description, d.location && `Location: ${d.location}`, d.startedAt && `Started: ${d.startedAt}`, d.frequency && `Frequency: ${d.frequency}`, d.symptoms.length && `Symptoms: ${d.symptoms.join(", ")}`, d.access && `Access: ${d.access}`].filter(Boolean).join("\n")
    const res = await reportRepairAction(sessionId, { title, description, priority: d.urgency })
    if (res.ok) { try { localStorage.removeItem(storageKey) } catch { /* ignore */ }; router.push(`${base}/maintenance/${res.id}`) }
    else { setError(res.error); setSubmitting(false) }
  }

  const Icon = STEPS[step].icon
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 items-start">
      <div className="space-y-4 min-w-0">
        {/* Stepper */}
        <PortalCard className="p-4 overflow-x-auto">
          <div className="flex items-center gap-1 min-w-[560px]">
            {STEPS.map((s, i) => {
              const done = i < step, active = i === step
              return (
                <div key={s.key} className="flex items-center gap-1 flex-1">
                  <button onClick={() => done && setStep(i)} disabled={!done && !active} className="flex flex-col items-center gap-1 shrink-0">
                    <span className={cn("w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold", active ? "bg-[#2563EB] text-white ring-4 ring-blue-100" : done ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400")}>{done ? <CheckCircle2 className="w-4 h-4" /> : <s.icon className="w-3.5 h-3.5" />}</span>
                    <span className={cn("text-[10px] font-semibold whitespace-nowrap", active ? "text-[#071B4D]" : "text-slate-400")}>{s.label}</span>
                  </button>
                  {i < STEPS.length - 1 && <span className={cn("flex-1 h-0.5", done ? "bg-emerald-500" : "bg-slate-200")} />}
                </div>
              )
            })}
          </div>
        </PortalCard>

        <PortalCard className="p-5 space-y-5">
          <div className="flex items-center gap-2"><span className="w-9 h-9 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center"><Icon className="w-5 h-5" /></span><h2 className="text-lg font-bold text-[#071B4D]">{step === 2 ? "Tell us more about the issue" : STEPS[step].label}</h2></div>

          {error && <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-700"><AlertTriangle className="w-4 h-4" />{error}</div>}

          {step === 0 && (
            <div className="space-y-4">
              <Field label="Category" required><select value={d.category} onChange={(e) => set("category", e.target.value)} className={INPUT}><option value="">Select a category…</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></Field>
              <Field label="Specific issue" required><input value={d.specificIssue} onChange={(e) => set("specificIssue", e.target.value)} placeholder="e.g. Leaking kitchen tap" className={INPUT} /></Field>
              <Field label="Urgency level"><div className="flex gap-2 flex-wrap">{URGENCY.map((u) => <button key={u.v} onClick={() => set("urgency", u.v)} className={cn("h-9 px-3 rounded-xl text-sm font-semibold border", d.urgency === u.v ? "border-[#2563EB] bg-blue-50 text-[#2563EB]" : "border-[#E2EAF6] text-slate-600")}>{u.label}</button>)}</div></Field>
              <label className="flex items-center justify-between rounded-xl border border-[#E2EAF6] px-4 py-3"><span className="text-sm font-medium text-slate-700">Is this a safety risk? <span className="block text-xs text-slate-400">Gas, electrical or flooding</span></span><input type="checkbox" checked={d.safetyRisk} onChange={(e) => set("safetyRisk", e.target.checked)} className="w-5 h-5 accent-[#2563EB]" /></label>
            </div>
          )}
          {step === 1 && <Field label="Where is the issue?"><input value={d.location} onChange={(e) => set("location", e.target.value)} placeholder="e.g. Kitchen, en-suite bathroom" className={INPUT} /></Field>}
          {step === 2 && (
            <div className="space-y-4">
              <Field label="Issue description" required><textarea value={d.description} onChange={(e) => set("description", e.target.value)} rows={5} placeholder="Describe what's happening, when it started, and anything you've tried…" className={cn(INPUT, "resize-none")} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="When did this start?"><input type="date" value={d.startedAt} onChange={(e) => set("startedAt", e.target.value)} className={INPUT} /></Field>
                <Field label="How often?"><select value={d.frequency} onChange={(e) => set("frequency", e.target.value)} className={INPUT}><option value="">Select…</option>{FREQUENCY.map((f) => <option key={f}>{f}</option>)}</select></Field>
              </div>
              <Field label="Symptoms"><div className="flex gap-2 flex-wrap">{SYMPTOMS.map((s) => <button key={s} onClick={() => toggleSymptom(s)} className={cn("h-8 px-3 rounded-lg text-xs font-semibold border", d.symptoms.includes(s) ? "border-[#2563EB] bg-blue-50 text-[#2563EB]" : "border-[#E2EAF6] text-slate-600")}>{s}</button>)}</div></Field>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-4">
              <Field label="Access preference"><input value={d.access} onChange={(e) => set("access", e.target.value)} placeholder="e.g. Weekday mornings, key with neighbour" className={INPUT} /></Field>
              <Field label="Contact preference"><input value={d.contact} onChange={(e) => set("contact", e.target.value)} placeholder="Phone or message" className={INPUT} /></Field>
            </div>
          )}
          {step === 4 && (
            <button className="w-full rounded-2xl border-2 border-dashed border-slate-300 hover:border-[#2563EB] hover:bg-blue-50/30 py-12 flex flex-col items-center gap-2"><div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center"><Upload className="w-6 h-6" /></div><p className="text-sm font-semibold text-slate-700">Add photos (optional)</p><p className="text-xs text-slate-400">Helps your manager assess the issue faster</p></button>
          )}
          {step === 5 && (
            <div className="rounded-2xl border border-[#E2EAF6] divide-y divide-[#EEF3FB]">
              {[["Category", d.category], ["Specific issue", d.specificIssue], ["Urgency", d.urgency], ["Location", d.location || "—"], ["Description", d.description || "—"], ["Started", d.startedAt || "—"], ["Frequency", d.frequency || "—"], ["Symptoms", d.symptoms.join(", ") || "—"], ["Access", d.access || "—"]].map(([k, v]) => (
                <div key={k} className="flex items-start justify-between gap-3 px-4 py-2.5"><span className="text-sm text-slate-500">{k}</span><span className="text-sm font-semibold text-[#071B4D] text-right max-w-[60%]">{v}</span></div>
              ))}
            </div>
          )}
        </PortalCard>

        {/* Nav */}
        <div className="flex items-center justify-between gap-2">
          <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /> Back</button>
          <div className="flex items-center gap-2">
            <button onClick={saveDraft} className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl text-sm font-semibold border border-[#E2EAF6] bg-white text-slate-600 hover:bg-slate-50"><Save className="w-4 h-4" /> {savedAt ? `Saved ${savedAt}` : "Save draft"}</button>
            {step < STEPS.length - 1 ? (
              <button onClick={() => setStep((s) => s + 1)} disabled={!valid} className="inline-flex items-center gap-1.5 h-10 px-5 rounded-xl text-sm font-semibold bg-[#2563EB] text-white hover:bg-[#1d4ed8] disabled:opacity-50">Continue <ChevronRight className="w-4 h-4" /></button>
            ) : (
              <button onClick={submit} disabled={submitting} className="inline-flex items-center gap-1.5 h-10 px-5 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50">{submitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}<CheckCircle2 className="w-4 h-4" /> Submit request</button>
            )}
          </div>
        </div>
      </div>

      {/* Side cards */}
      <div className="space-y-4">
        <PortalSectionCard title="Your property" icon={Home}><p className="text-sm font-semibold text-[#071B4D]">{propertyLabel}</p></PortalSectionCard>
        <PortalSectionCard title="Request summary" icon={ClipboardList}>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Category</dt><dd className="font-semibold text-[#071B4D]">{d.category || "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Urgency</dt><dd><StatusChip tone={URGENCY.find((u) => u.v === d.urgency)?.tone ?? "blue"}>{d.urgency}</StatusChip></dd></div>
          </dl>
        </PortalSectionCard>
        <PortalCard className="p-4"><div className="flex items-start gap-2.5"><span className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0"><AlertTriangle className="w-4 h-4" /></span><div><p className="text-sm font-semibold text-[#071B4D]">Emergency?</p><p className="text-xs text-slate-400 mt-0.5">Gas, flood or fire — call <a href="tel:0800000000" className="font-semibold text-red-600">0800 000 000</a> now, don&apos;t wait.</p></div></div></PortalCard>
      </div>
    </div>
  )
}

const INPUT = "w-full rounded-xl border border-[#E2EAF6] bg-white px-3 py-2.5 text-sm text-[#071B4D] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100"
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return <label className="block"><span className="text-sm font-medium text-slate-700">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</span><div className="mt-1.5">{children}</div></label>
}
