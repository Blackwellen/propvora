"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { DashboardContainer } from "@/components/layout/PageContainer"
import { Button } from "@/components/ui/Button"
import { Skeleton } from "@/components/ui/Skeleton"
import { useWorkspace } from "@/providers/AuthProvider"
import { useProperty, useUpdateProperty } from "@/hooks/useProperties"
import { Building2, MapPin, Home, PoundSterling, FileText, CheckCircle2, ArrowRight, ArrowLeft, Save,
} from "lucide-react"
import { cn } from "@/lib/utils"
import MobileTopBar from "@/components/mobile/MobileTopBar"

/* ------------------------------------------------------------------ */
/* Schema                                                               */
/* ------------------------------------------------------------------ */
const schema = z.object({
  name: z.string().min(1, "Property name is required"),
  address_line1: z.string().min(1, "Address is required"),
  address_line2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  postcode: z.string().min(1, "Postcode is required"),
  country: z.string().default("United Kingdom"),
  property_type: z.string().min(1),
  operation_profile: z.string().min(1),
  status: z.string().min(1),
  bedrooms: z.coerce.number().min(0).default(0),
  bathrooms: z.coerce.number().min(0).default(0),
  target_rent: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
})
type FormData = z.infer<typeof schema>

/* ------------------------------------------------------------------ */
/* Config                                                               */
/* ------------------------------------------------------------------ */
const STEPS = [
  { id: 1, label: "Basics",         icon: Building2 },
  { id: 2, label: "Location",       icon: MapPin },
  { id: 3, label: "Type & Profile", icon: Home },
  { id: 4, label: "Financials",     icon: PoundSterling },
  { id: 5, label: "Notes",          icon: FileText },
  { id: 6, label: "Review",         icon: CheckCircle2 },
]

const OPERATION_PROFILES = [
  "Long-Term Let", "Rent-to-Rent", "HMO", "Student Let",
  "Serviced Accommodation", "Holiday Let", "Build-to-Rent",
  "Social Housing", "Commercial", "Mixed Use", "Dev / Flip",
  "Co-Living", "Unassigned",
]

const PROPERTY_TYPES = [
  { value: "house",      label: "House" },
  { value: "flat",       label: "Flat / Apartment" },
  { value: "hmo",        label: "HMO" },
  { value: "commercial", label: "Commercial" },
  { value: "mixed_use",  label: "Mixed Use" },
  { value: "land",       label: "Land" },
  { value: "other",      label: "Other" },
]

// Values map to the live `properties.status` enum (active|void|off_market|archived)
// via the useProperties adapter.
const STATUSES = [
  { value: "active",      label: "Active" },
  { value: "vacant",      label: "Void" },
  { value: "under_works", label: "Off Market" },
  { value: "archived",    label: "Archived" },
]

/* ------------------------------------------------------------------ */
/* Field components                                                     */
/* ------------------------------------------------------------------ */
function Field({ label, error, children, required }: { label: string; error?: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-slate-700">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

function TextInput({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full h-10 px-3 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400",
        "focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] bg-white transition-all",
        className
      )}
    />
  )
}

function SelectInput({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "w-full h-10 px-3 rounded-xl border border-slate-200 text-sm text-slate-900",
        "focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] bg-white cursor-pointer transition-all",
        className
      )}
    />
  )
}

function TextArea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400",
        "focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] bg-white transition-all resize-none",
        className
      )}
    />
  )
}

/* ------------------------------------------------------------------ */
/* Step content                                                         */
/* ------------------------------------------------------------------ */
function StepBasics({ register, errors }: { register: ReturnType<typeof useForm<FormData>>["register"]; errors: Record<string, { message?: string }> }) {
  return (
    <div className="flex flex-col gap-5">
      <Field label="Property name" error={errors.name?.message} required>
        <TextInput {...register("name")} placeholder="e.g. Brunswick Road HMO" />
      </Field>
      <Field label="Status" error={errors.status?.message} required>
        <SelectInput {...register("status")}>
          {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </SelectInput>
      </Field>
    </div>
  )
}

function StepLocation({ register, errors }: { register: ReturnType<typeof useForm<FormData>>["register"]; errors: Record<string, { message?: string }> }) {
  return (
    <div className="flex flex-col gap-5">
      <Field label="Address line 1" error={errors.address_line1?.message} required>
        <TextInput {...register("address_line1")} placeholder="12 Brunswick Road" />
      </Field>
      <Field label="Address line 2" error={errors.address_line2?.message}>
        <TextInput {...register("address_line2")} placeholder="(optional)" />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="City" error={errors.city?.message} required>
          <TextInput {...register("city")} placeholder="Nottingham" />
        </Field>
        <Field label="Postcode" error={errors.postcode?.message} required>
          <TextInput {...register("postcode")} placeholder="NG1 4EX" />
        </Field>
      </div>
      <Field label="Country" error={errors.country?.message}>
        <TextInput {...register("country")} />
      </Field>
    </div>
  )
}

function StepTypeProfile({ register, errors, watch, setValue }: {
  register: ReturnType<typeof useForm<FormData>>["register"]
  errors: Record<string, { message?: string }>
  watch: ReturnType<typeof useForm<FormData>>["watch"]
  setValue: ReturnType<typeof useForm<FormData>>["setValue"]
}) {
  const profile = watch("operation_profile")
  return (
    <div className="flex flex-col gap-5">
      <Field label="Property type" error={errors.property_type?.message} required>
        <SelectInput {...register("property_type")}>
          {PROPERTY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </SelectInput>
      </Field>

      <Field label="Operation profile" error={errors.operation_profile?.message} required>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {OPERATION_PROFILES.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setValue("operation_profile", p)}
              className={cn(
                "px-3 py-2.5 rounded-xl text-xs font-medium border transition-all text-left",
                profile === p
                  ? "border-[#2563EB] bg-blue-50 text-[#2563EB] shadow-sm ring-1 ring-[#2563EB]/20"
                  : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Bedrooms">
          <TextInput {...register("bedrooms")} type="number" min={0} />
        </Field>
        <Field label="Bathrooms">
          <TextInput {...register("bathrooms")} type="number" min={0} />
        </Field>
      </div>
    </div>
  )
}

function StepFinancials({ register, errors }: { register: ReturnType<typeof useForm<FormData>>["register"]; errors: Record<string, { message?: string }> }) {
  return (
    <div className="flex flex-col gap-5">
      <Field label="Target monthly rent (£)" error={errors.target_rent?.message}>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium">£</span>
          <TextInput {...register("target_rent")} type="number" min={0} className="pl-7" placeholder="2850" />
        </div>
      </Field>
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm font-semibold text-blue-800 mb-1">Tip: Operation profile affects metrics</p>
        <p className="text-xs text-blue-600">Rent-to-Rent properties will show landlord cost vs achievable rent. HMOs show per-room rent. Set your target here for the gross rent roll.</p>
      </div>
    </div>
  )
}

function StepNotes({ register }: { register: ReturnType<typeof useForm<FormData>>["register"] }) {
  return (
    <div className="flex flex-col gap-5">
      <Field label="Notes and context">
        <TextArea {...register("notes")} rows={6} placeholder="Management notes, purchase history, key contacts, access details…" />
      </Field>
    </div>
  )
}

function StepReview({ watch }: { watch: ReturnType<typeof useForm<FormData>>["watch"] }) {
  const data = watch()
  const rows = [
    ["Property name",     data.name],
    ["Status",            data.status],
    ["Address",           [data.address_line1, data.address_line2, data.city, data.postcode].filter(Boolean).join(", ")],
    ["Property type",     data.property_type],
    ["Operation profile", data.operation_profile],
    ["Bedrooms",          String(data.bedrooms)],
    ["Bathrooms",         String(data.bathrooms)],
    ["Target rent",       data.target_rent > 0 ? `£${data.target_rent}/mo` : "—"],
  ]
  return (
    <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200 bg-white">
        <p className="text-sm font-semibold text-slate-900">Property summary</p>
        <p className="text-xs text-slate-500 mt-0.5">Review before saving</p>
      </div>
      <div className="divide-y divide-slate-200">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between px-5 py-3">
            <span className="text-sm text-slate-500">{label}</span>
            <span className="text-sm font-semibold text-slate-900 text-right max-w-[200px] truncate">{value || "—"}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */
export default function PropertyEditPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { workspace, isLoading: wsLoading } = useWorkspace()
  const { data: property, isLoading: propLoading } = useProperty(workspace?.id, id)
  const updateProperty = useUpdateProperty()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: {
      status: "active",
      property_type: "house",
      operation_profile: "Long-Term Let",
      bedrooms: 0,
      bathrooms: 0,
      target_rent: 0,
      country: "United Kingdom",
    },
  })

  // Pre-fill form when property loads
  useEffect(() => {
    if (property) {
      reset({
        name: property.name,
        address_line1: property.address_line1 ?? "",
        address_line2: property.address_line2 ?? "",
        city: property.city ?? "",
        postcode: property.postcode ?? "",
        country: property.country ?? "United Kingdom",
        property_type: property.property_type ?? "house",
        operation_profile: property.operation_profile ?? "Long-Term Let",
        status: property.status ?? "active",
        bedrooms: property.bedrooms ?? 0,
        bathrooms: property.bathrooms ?? 0,
        target_rent: property.target_rent ?? 0,
        notes: property.notes ?? "",
      })
    }
  }, [property, reset])

  const loading = wsLoading || propLoading

  async function onSubmit(data: FormData) {
    if (step < STEPS.length) { setStep((s) => s + 1); return }
    setSaving(true)
    try {
      if (workspace?.id && property) {
        await updateProperty.mutateAsync({ workspaceId: workspace.id, id: property.id, payload: data as import("@/types/database").InsertProperty })
      }
      setSaved(true)
      setTimeout(() => router.push(`/app/portfolio/properties/${id}`), 1200)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <DashboardContainer>
        <Skeleton className="h-6 w-48 mb-6" />
        <Skeleton className="h-96 rounded-2xl" />
      </DashboardContainer>
    )
  }

  return (
    <DashboardContainer>
      {/* Mobile top bar */}
      <MobileTopBar
        title="Edit property"
        subtitle={property?.name ?? "this property"}
        showBack
        backHref={`/app/portfolio/properties/${id}`}
      />

      {/* Breadcrumb — hidden on phones */}
      <nav className="hidden md:flex items-center gap-1.5 text-sm text-slate-500 mb-6">
        <Link href="/app/portfolio" className="hover:text-slate-600 transition-colors">Portfolio</Link>
        <span>/</span>
        <Link href={`/app/portfolio/properties/${id}`} className="hover:text-slate-600 transition-colors truncate max-w-[140px]">
          {property?.name ?? "Property"}
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-medium">Edit</span>
      </nav>

      <div className="max-w-2xl mx-auto">
        {/* Header — hidden on phones */}
        <div className="hidden md:block mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Edit property</h1>
          <p className="text-sm text-slate-500 mt-1">Update details for {property?.name ?? "this property"}</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-0 mb-8 overflow-x-auto">
          {STEPS.map((s, i) => {
            const Icon = s.icon
            const done = step > s.id
            const active = step === s.id
            return (
              <React.Fragment key={s.id}>
                <button
                  type="button"
                  onClick={() => step > s.id && setStep(s.id)}
                  className={cn(
                    "flex flex-col items-center gap-1 px-2 min-w-[56px] transition-all",
                    done && "cursor-pointer"
                  )}
                >
                  <div className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all",
                    active ? "border-[#2563EB] bg-[#2563EB] text-white shadow-md shadow-blue-200" :
                    done ? "border-emerald-500 bg-emerald-500 text-white" :
                    "border-slate-200 bg-white text-slate-400"
                  )}>
                    {done ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className={cn("text-[10px] font-medium whitespace-nowrap", active ? "text-[#2563EB]" : done ? "text-emerald-600" : "text-slate-400")}>
                    {s.label}
                  </span>
                </button>
                {i < STEPS.length - 1 && (
                  <div className={cn("flex-1 h-0.5 mt-[-14px] mx-0.5 min-w-[12px]", done ? "bg-emerald-400" : "bg-slate-200")} />
                )}
              </React.Fragment>
            )
          })}
        </div>

        {/* Form card */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
            <h2 className="text-base font-bold text-slate-900 mb-5">{STEPS[step - 1].label}</h2>

            {step === 1 && <StepBasics register={register} errors={errors as Record<string, { message?: string }>} />}
            {step === 2 && <StepLocation register={register} errors={errors as Record<string, { message?: string }>} />}
            {step === 3 && <StepTypeProfile register={register} errors={errors as Record<string, { message?: string }>} watch={watch} setValue={setValue} />}
            {step === 4 && <StepFinancials register={register} errors={errors as Record<string, { message?: string }>} />}
            {step === 5 && <StepNotes register={register} />}
            {step === 6 && <StepReview watch={watch} />}
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => step > 1 ? setStep((s) => s - 1) : router.push(`/app/portfolio/properties/${id}`)}
            >
              <ArrowLeft className="w-4 h-4" />
              {step === 1 ? "Cancel" : "Back"}
            </Button>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Step {step} of {STEPS.length}</span>
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={saving || saved}
              >
                {saved ? (
                  <><CheckCircle2 className="w-4 h-4" />Saved!</>
                ) : saving ? (
                  "Saving…"
                ) : step < STEPS.length ? (
                  <><ArrowRight className="w-4 h-4" />Continue</>
                ) : (
                  <><Save className="w-4 h-4" />Save changes</>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </DashboardContainer>
  )
}
