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
  { key: "maintenance", label: "Maintenance / repair", icon: Wrench },
  { key: "connectivity", label: "Wi-Fi / connectivity", icon: Wifi },
  { key: "cleanliness", label: "Cleanliness", icon: Sparkles },
  { key: "safety", label: "Safety concern", icon: ShieldAlert },
  { key: "access", label: "Access / check-in", icon: KeyRound },
  { key: "other", label: "Something else", icon: HelpCircle },
]

const SEVERITIES: { key: string; label: string; hint: string }[] = [
  { key: "low", label: "Low", hint: "Minor — can wait" },
  { key: "normal", label: "Normal", hint: "Should be looked at" },
  { key: "high", label: "High", hint: "Affecting my stay" },
  { key: "urgent", label: "Urgent", hint: "Needs attention now" },
]

const MAX_PHOTOS = 4

export default function ReportIssueWizard({
  bookingId,
  bookingTitle,
}: {
  bookingId: string
  bookingTitle: string
}) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState(1)
  const [category, setCategory] = useState("")
  const [subject, setSubject] = useState("")
  const [detail, setDetail] = useState("")
  const [severity, setSeverity] = useState("normal")
  const [photos, setPhotos] = useState<File[]>([])
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const canContinue =
    step === 1 ? !!category
    : step === 2 ? subject.trim().length > 2 && detail.trim().length > 4
    : step === 3 ? !!severity
    : true

  function addPhotos(files: FileList | null) {
    if (!files) return
    const remaining = MAX_PHOTOS - photos.length
    const incoming = Array.from(files).slice(0, remaining)
    const newFiles = [...photos, ...incoming]
    const newPreviews = incoming.map((f) => URL.createObjectURL(f))
    setPhotos(newFiles)
    setPhotoPreviewUrls((prev) => [...prev, ...newPreviews])
  }

  function removePhoto(i: number) {
    URL.revokeObjectURL(photoPreviewUrls[i])
    setPhotos((prev) => prev.filter((_, j) => j !== i))
    setPhotoPreviewUrls((prev) => prev.filter((_, j) => j !== i))
  }

  async function uploadPhotos(): Promise<string[]> {
    if (photos.length === 0) return []
    const supabase = createClient()
    const urls: string[] = []
    for (let i = 0; i < photos.length; i++) {
      const file = photos[i]
      setUploadProgress(`Uploading photo ${i + 1} of ${photos.length}…`)
      const ext = file.name.split(".").pop() ?? "jpg"
      const path = `issues/${bookingId}/${Date.now()}-${i}.${ext}`
      const { error: upErr } = await supabase.storage
        .from("customer-maintenance")
        .upload(path, file, { cacheControl: "3600", upsert: false })
      if (upErr) {
        console.warn("[ReportIssueWizard] photo upload failed:", upErr.message)
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
      const photoUrls = await uploadPhotos()
      const res = await fetch("/api/customer/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, category, severity, subject, detail, photoUrls }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error((j as { error?: string }).error || "Could not report issue")
      }
      setDone(true)
      router.refresh()
      setTimeout(() => router.push(`/user/bookings/${bookingId}`), 1400)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not report issue")
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
        closeHref={`/user/bookings/${bookingId}`}
        title="Report an issue"
        subtitle={bookingTitle}
        isLastStep
        canContinue={false}
      >
        <div className="flex flex-col items-center justify-center text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Issue reported</h2>
          <p className="mt-2 text-sm text-slate-500 max-w-sm">
            Your host and property manager have been notified. You can track its status on your trip page.
          </p>
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
      closeHref={`/user/bookings/${bookingId}`}
      title="Report an issue"
      subtitle={bookingTitle}
      isLastStep={step === STEPS.length}
      canContinue={canContinue}
      submitLabel={uploadProgress || (submitting ? "Sending…" : "Submit report")}
      submitting={submitting}
    >
      {step === 1 && (
        <div>
          <h2 className="text-lg font-bold text-slate-900">What&apos;s the issue about?</h2>
          <p className="mt-1 text-sm text-slate-500">Pick the closest match so we route it to the right person.</p>
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
                    active ? "border-[var(--brand)] bg-[var(--brand-soft)] ring-2 ring-[var(--brand)]/20" : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${active ? "bg-[var(--brand)] text-white" : "bg-slate-100 text-slate-500"}`}>
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
          <h2 className="text-lg font-bold text-slate-900">Tell us what happened</h2>
          <p className="mt-1 text-sm text-slate-500">A short title, description and photos help us fix it faster.</p>
          <div className="mt-5 space-y-4">
            <div>
              <label htmlFor="subject" className="block text-[13px] font-semibold text-slate-700 mb-1">Title</label>
              <input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Heating not working in the bedroom" className={customerInputClass} />
            </div>
            <div>
              <label htmlFor="detail" className="block text-[13px] font-semibold text-slate-700 mb-1">Description</label>
              <textarea id="detail" value={detail} onChange={(e) => setDetail(e.target.value)} rows={4} placeholder="Describe the problem, when it started and anything you've tried." className={customerTextareaClass} />
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
                    className="flex items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600 hover:border-[var(--brand)] hover:text-[var(--brand)] transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                    {photos.length === 0 ? "Add photos" : "Add more"}
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
          <p className="mt-1 text-sm text-slate-500">This sets the priority for your host and property manager.</p>
          <div className="mt-5 space-y-2.5">
            {SEVERITIES.map((s) => {
              const active = severity === s.key
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setSeverity(s.key)}
                  className={`w-full flex items-center justify-between gap-3 p-4 rounded-2xl border text-left transition-all ${
                    active ? "border-[var(--brand)] bg-[var(--brand-soft)] ring-2 ring-[var(--brand)]/20" : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <span>
                    <span className="block text-[14px] font-semibold text-slate-800">{s.label}</span>
                    <span className="block text-[12px] text-slate-500">{s.hint}</span>
                  </span>
                  <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${active ? "border-[var(--brand)] bg-[var(--brand)]" : "border-slate-300"}`}>
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
          <h2 className="text-lg font-bold text-slate-900">Review your report</h2>
          <p className="mt-1 text-sm text-slate-500">Send this to your host and property manager.</p>
          <dl className="mt-5 space-y-3 rounded-2xl border border-slate-200 p-4">
            <div className="flex justify-between gap-3"><dt className="text-sm text-slate-500">Stay</dt><dd className="text-sm font-medium text-slate-800 text-right">{bookingTitle}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-sm text-slate-500">Category</dt><dd className="text-sm font-medium text-slate-800 text-right capitalize">{category}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-sm text-slate-500">Urgency</dt><dd className="text-sm font-medium text-slate-800 text-right capitalize">{severity}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-sm text-slate-500">Title</dt><dd className="text-sm font-medium text-slate-800 text-right">{subject}</dd></div>
            <div><dt className="text-sm text-slate-500 mb-1">Description</dt><dd className="text-sm text-slate-700 whitespace-pre-line">{detail}</dd></div>
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
