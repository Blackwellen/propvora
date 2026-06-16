"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  ListChecks,
  FileText,
  CheckCircle2,
  Wrench,
  Wifi,
  Sparkles,
  ShieldAlert,
  KeyRound,
  HelpCircle,
  Camera,
  X,
  type LucideIcon,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { CustomerWizardShell, type WizardStepDef } from "./CustomerWizardShell"
import { customerInputClass, customerTextareaClass } from "./ui"

const STEPS: WizardStepDef[] = [
  { num: 1, label: "Type", subtitle: "What's wrong", icon: ListChecks },
  { num: 2, label: "Details", subtitle: "Describe it", icon: FileText },
  { num: 3, label: "Urgency", subtitle: "How urgent", icon: AlertTriangle },
  { num: 4, label: "Review", subtitle: "Confirm & send", icon: CheckCircle2 },
]

const CATEGORIES: { key: string; label: string; icon: LucideIcon }[] = [
  { key: "plumbing", label: "Plumbing / water", icon: Wrench },
  { key: "heating", label: "Heating / hot water", icon: Wrench },
  { key: "electrical", label: "Electrical", icon: Wifi },
  { key: "structural", label: "Structural / damp", icon: ShieldAlert },
  { key: "security", label: "Locks / security", icon: KeyRound },
  { key: "cleanliness", label: "Cleanliness / pests", icon: Sparkles },
  { key: "appliances", label: "Appliances", icon: Wrench },
  { key: "other", label: "Something else", icon: HelpCircle },
]

const SEVERITIES: { key: string; label: string; hint: string }[] = [
  { key: "low", label: "Low", hint: "Minor — can wait a few days" },
  { key: "normal", label: "Normal", hint: "Should be looked at within a week" },
  { key: "high", label: "High", hint: "Affecting daily living" },
  { key: "urgent", label: "Urgent / emergency", hint: "Needs immediate attention (gas leak, flood, no heating in winter)" },
]

const MAX_PHOTOS = 4

export default function MaintenanceWizard() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState(1)
  const [category, setCategory] = useState("")
  const [room, setRoom] = useState("")
  const [subject, setSubject] = useState("")
  const [detail, setDetail] = useState("")
  const [severity, setSeverity] = useState("normal")
  const [photos, setPhotos] = useState<File[]>([])
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [requestId, setRequestId] = useState<string | null>(null)

  const canContinue =
    step === 1 ? !!category
    : step === 2 ? subject.trim().length > 2 && detail.trim().length > 4
    : step === 3 ? !!severity
    : true

  function addPhotos(files: FileList | null) {
    if (!files) return
    const remaining = MAX_PHOTOS - photos.length
    const incoming = Array.from(files).slice(0, remaining)
    setPhotos((prev) => [...prev, ...incoming])
    setPhotoPreviewUrls((prev) => [...prev, ...incoming.map((f) => URL.createObjectURL(f))])
  }

  function removePhoto(i: number) {
    URL.revokeObjectURL(photoPreviewUrls[i])
    setPhotos((prev) => prev.filter((_, j) => j !== i))
    setPhotoPreviewUrls((prev) => prev.filter((_, j) => j !== i))
  }

  async function uploadPhotos(reqId: string): Promise<string[]> {
    if (photos.length === 0) return []
    const supabase = createClient()
    const urls: string[] = []
    for (let i = 0; i < photos.length; i++) {
      const file = photos[i]
      setUploadProgress(`Uploading photo ${i + 1} of ${photos.length}…`)
      const ext = file.name.split(".").pop() ?? "jpg"
      const path = `maintenance/${reqId}/${Date.now()}-${i}.${ext}`
      const { error: upErr } = await supabase.storage
        .from("customer-maintenance")
        .upload(path, file, { cacheControl: "3600", upsert: false })
      if (upErr) {
        console.warn("[MaintenanceWizard] photo upload failed:", upErr.message)
        continue
      }
      const { data: pub } = supabase.storage.from("customer-maintenance").getPublicUrl(path)
      if (pub?.publicUrl) urls.push(pub.publicUrl)
    }
    setUploadProgress("")
    return urls
  }

  async function submit() {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch("/api/customer/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, severity, subject, detail, room }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({})) as { error?: string; requestId?: string }
        throw new Error(j.error || "Could not submit request")
      }
      const body = await res.json() as { requestId?: string }
      const newId = body.requestId ?? "unknown"
      setRequestId(newId)

      // Upload photos now we have a request ID.
      if (photos.length > 0) {
        const photoUrls = await uploadPhotos(newId)
        if (photoUrls.length > 0) {
          await fetch("/api/customer/maintenance", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ requestId: newId, photoUrls }),
          })
        }
      }

      setDone(true)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not submit request")
      setSubmitting(false)
    }
  }

  function next() {
    if (step < STEPS.length) setStep((s) => s + 1)
    else submit()
  }

  if (done) {
    return (
      <CustomerWizardShell
        steps={STEPS}
        current={4}
        onStep={setStep}
        onPrev={() => {}}
        onNext={() => {}}
        closeHref="/user/maintenance"
        title="Report a repair"
        subtitle="Tenant maintenance"
        isLastStep
        canContinue={false}
      >
        <div className="flex flex-col items-center justify-center text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Request submitted</h2>
          <p className="mt-2 text-sm text-slate-500 max-w-sm">
            Your property manager has been notified and will be in touch. Reference: <strong>{requestId}</strong>
          </p>
          <button
            type="button"
            onClick={() => router.push("/user/maintenance")}
            className="mt-6 rounded-xl bg-[#2563EB] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#1d4ed8] transition-colors"
          >
            View all requests
          </button>
        </div>
      </CustomerWizardShell>
    )
  }

  return (
    <CustomerWizardShell
      steps={STEPS}
      current={step}
      onStep={setStep}
      onPrev={() => setStep((s) => Math.max(1, s - 1))}
      onNext={next}
      closeHref="/user/maintenance"
      title="Report a repair"
      subtitle="Tenant maintenance"
      isLastStep={step === STEPS.length}
      canContinue={canContinue}
      submitLabel={uploadProgress || (submitting ? "Sending…" : "Submit request")}
      submitting={submitting}
    >
      {step === 1 && (
        <div>
          <h2 className="text-lg font-bold text-slate-900">What needs attention?</h2>
          <p className="mt-1 text-sm text-slate-500">Pick the category that best fits the problem.</p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {CATEGORIES.map((c) => {
              const Icon = c.icon
              const active = category === c.key
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setCategory(c.key)}
                  className={`flex flex-col items-start gap-2 p-4 rounded-2xl border text-left transition-all ${
                    active ? "border-[#2563EB] bg-blue-50 ring-2 ring-[#2563EB]/20" : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${active ? "bg-[#2563EB] text-white" : "bg-slate-100 text-slate-500"}`}>
                    <Icon className="w-4.5 h-4.5" />
                  </span>
                  <span className="text-[13px] font-semibold text-slate-800">{c.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2 className="text-lg font-bold text-slate-900">Describe the problem</h2>
          <p className="mt-1 text-sm text-slate-500">Good photos and detail help get this fixed faster.</p>
          <div className="mt-5 space-y-4">
            <div>
              <label htmlFor="room" className="block text-[13px] font-semibold text-slate-700 mb-1">
                Room / location <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                id="room"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="e.g. Master bedroom, kitchen, bathroom"
                className={customerInputClass}
              />
            </div>
            <div>
              <label htmlFor="subject" className="block text-[13px] font-semibold text-slate-700 mb-1">Summary</label>
              <input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Boiler not producing hot water"
                className={customerInputClass}
              />
            </div>
            <div>
              <label htmlFor="detail" className="block text-[13px] font-semibold text-slate-700 mb-1">Details</label>
              <textarea
                id="detail"
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                rows={4}
                placeholder="When did it start? What have you tried? Any safety concerns?"
                className={customerTextareaClass}
              />
            </div>

            {/* Photo capture */}
            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1">
                Photos <span className="text-slate-400 font-normal">(optional, up to {MAX_PHOTOS})</span>
              </label>
              {photoPreviewUrls.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {photoPreviewUrls.map((url, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-slate-900/70 flex items-center justify-center"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {photos.length < MAX_PHOTOS && (
                <>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    multiple
                    capture="environment"
                    className="sr-only"
                    onChange={(e) => addPhotos(e.target.files)}
                  />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600 hover:border-[#2563EB] hover:text-[#2563EB] transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                    {photos.length === 0 ? "Take or attach photos" : "Add more"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h2 className="text-lg font-bold text-slate-900">How urgent is it?</h2>
          <p className="mt-1 text-sm text-slate-500">For emergencies (gas leaks, flooding, no electricity) call the emergency line directly.</p>
          <div className="mt-5 space-y-2.5">
            {SEVERITIES.map((s) => {
              const active = severity === s.key
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setSeverity(s.key)}
                  className={`w-full flex items-center justify-between gap-3 p-4 rounded-2xl border text-left transition-all ${
                    active ? "border-[#2563EB] bg-blue-50 ring-2 ring-[#2563EB]/20" : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <span>
                    <span className="block text-[14px] font-semibold text-slate-800">{s.label}</span>
                    <span className="block text-[12px] text-slate-500">{s.hint}</span>
                  </span>
                  <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${active ? "border-[#2563EB] bg-[#2563EB]" : "border-slate-300"}`}>
                    {active && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {step === 4 && (
        <div>
          <h2 className="text-lg font-bold text-slate-900">Review your request</h2>
          <p className="mt-1 text-sm text-slate-500">We&apos;ll notify your property manager immediately.</p>
          <dl className="mt-5 space-y-3 rounded-2xl border border-slate-200 p-4">
            <div className="flex justify-between gap-3">
              <dt className="text-sm text-slate-500">Category</dt>
              <dd className="text-sm font-medium text-slate-800 capitalize">{category.replace(/_/g, " ")}</dd>
            </div>
            {room && (
              <div className="flex justify-between gap-3">
                <dt className="text-sm text-slate-500">Location</dt>
                <dd className="text-sm font-medium text-slate-800">{room}</dd>
              </div>
            )}
            <div className="flex justify-between gap-3">
              <dt className="text-sm text-slate-500">Urgency</dt>
              <dd className="text-sm font-medium text-slate-800 capitalize">{severity.replace(/_/g, " ")}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-sm text-slate-500">Summary</dt>
              <dd className="text-sm font-medium text-slate-800 text-right">{subject}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500 mb-1">Details</dt>
              <dd className="text-sm text-slate-700 whitespace-pre-line">{detail}</dd>
            </div>
            {photoPreviewUrls.length > 0 && (
              <div>
                <dt className="text-sm text-slate-500 mb-2">Photos ({photoPreviewUrls.length})</dt>
                <dd className="flex flex-wrap gap-2">
                  {photoPreviewUrls.map((url, i) => (
                    <div key={i} className="w-16 h-16 rounded-lg overflow-hidden border border-slate-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </dd>
              </div>
            )}
          </dl>
          {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}
        </div>
      )}
    </CustomerWizardShell>
  )
}
