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
import { useUnit, useUpdateUnit } from "@/hooks/useUnits"
import {
  ArrowLeft, ArrowRight, Home, PoundSterling, CheckCircle2, Save,
} from "lucide-react"
import { cn } from "@/lib/utils"
import MobileTopBar from "@/components/mobile/MobileTopBar"

/* ------------------------------------------------------------------ */
/* Schema                                                               */
/* ------------------------------------------------------------------ */
const schema = z.object({
  unit_name: z.string().min(1, "Unit name is required"),
  unit_type: z.string().default("room"),
  floor: z.coerce.number().optional(),
  bedrooms: z.coerce.number().min(0).default(1),
  bathrooms: z.coerce.number().min(0).default(1),
  floor_area_sqm: z.coerce.number().optional(),
  target_rent: z.coerce.number().min(0).default(0),
  status: z.string().default("vacant"),
})
type FormData = z.infer<typeof schema>

const STEPS = [
  { id: 1, label: "Details", icon: Home },
  { id: 2, label: "Rent", icon: PoundSterling },
  { id: 3, label: "Review", icon: CheckCircle2 },
]

const UNIT_TYPES = ["room", "flat", "studio", "suite", "office", "other"]
const STATUSES = [
  { value: "occupied", label: "Occupied" },
  { value: "vacant", label: "Vacant" },
  { value: "under_works", label: "Under Works" },
  { value: "reserved", label: "Reserved" },
]

function Field({ label, error, children, required }: { label: string; error?: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-slate-700">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

function TextInput({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input {...props} className={cn("w-full h-10 px-3 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] bg-white transition-all", className)} />
  )
}

function SelectInput({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={cn("w-full h-10 px-3 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] bg-white cursor-pointer transition-all", className)} />
  )
}

export default function UnitEditPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { workspace, isLoading: wsLoading } = useWorkspace()
  const { data: unit, isLoading: unitLoading } = useUnit(workspace?.id, workspace?.id ? id : undefined)
  const updateUnit = useUpdateUnit()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: { unit_type: "room", bedrooms: 1, bathrooms: 1, target_rent: 0, status: "vacant" },
  })

  useEffect(() => {
    if (unit) {
      reset({
        unit_name: unit.unit_name,
        unit_type: unit.unit_type ?? "room",
        floor: unit.floor ?? undefined,
        bedrooms: unit.bedrooms ?? 1,
        bathrooms: unit.bathrooms ?? 1,
        floor_area_sqm: unit.floor_area_sqm ?? undefined,
        target_rent: unit.target_rent ?? 0,
        status: unit.status,
      })
    }
  }, [unit, reset])

  const loading = wsLoading || unitLoading

  async function onSubmit(data: FormData) {
    if (step < STEPS.length) { setStep((s) => s + 1); return }
    setSaving(true)
    try {
      if (workspace?.id && unit) {
        await updateUnit.mutateAsync({ workspaceId: workspace.id, id: unit.id, payload: data })
      }
      setSaved(true)
      setTimeout(() => router.push(`/property-manager/portfolio/units/${id}`), 1200)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <DashboardContainer><Skeleton className="h-96 rounded-2xl" /></DashboardContainer>

  const data = watch()

  return (
    <DashboardContainer>
      {/* Mobile top bar */}
      <MobileTopBar
        title="Edit unit"
        subtitle={unit?.unit_name ?? "this unit"}
        showBack
        backHref={`/property-manager/portfolio/units/${id}`}
      />

      <nav className="hidden md:flex items-center gap-1.5 text-sm text-slate-500 mb-6">
        <Link href="/property-manager/portfolio" className="hover:text-slate-600">Portfolio</Link>
        <span>/</span>
        <Link href={`/property-manager/portfolio/units/${id}`} className="hover:text-slate-600">{unit?.unit_name ?? "Unit"}</Link>
        <span>/</span>
        <span className="text-slate-900 font-medium">Edit</span>
      </nav>

      <div className="max-w-lg mx-auto">
        <div className="hidden md:block mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Edit unit</h1>
          <p className="text-sm text-slate-500 mt-1">Update {unit?.unit_name ?? "this unit"}</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-0 mb-8">
          {STEPS.map((s, i) => {
            const Icon = s.icon
            const done = step > s.id
            const active = step === s.id
            return (
              <React.Fragment key={s.id}>
                <button type="button" onClick={() => done && setStep(s.id)} className={cn("flex flex-col items-center gap-1 px-3 min-w-[60px]", done && "cursor-pointer")}>
                  <div className={cn("w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all", active ? "border-[#2563EB] bg-[#2563EB] text-white" : done ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-200 bg-white text-slate-400")}>
                    {done ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className={cn("text-[10px] font-medium", active ? "text-[#2563EB]" : done ? "text-emerald-600" : "text-slate-400")}>{s.label}</span>
                </button>
                {i < STEPS.length - 1 && <div className={cn("flex-1 h-0.5 mt-[-14px] mx-0.5", done ? "bg-emerald-400" : "bg-slate-200")} />}
              </React.Fragment>
            )
          })}
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
            <h2 className="text-base font-bold text-slate-900 mb-5">{STEPS[step - 1].label}</h2>

            {step === 1 && (
              <div className="flex flex-col gap-4">
                <Field label="Unit name" error={errors.unit_name?.message} required>
                  <TextInput {...register("unit_name")} placeholder="e.g. Room 1, Studio A" />
                </Field>
                <Field label="Unit type">
                  <SelectInput {...register("unit_type")}>
                    {UNIT_TYPES.map((t) => <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </SelectInput>
                </Field>
                <Field label="Status">
                  <SelectInput {...register("status")}>
                    {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </SelectInput>
                </Field>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Floor">
                    <TextInput {...register("floor")} type="number" min={0} placeholder="1" />
                  </Field>
                  <Field label="Bedrooms">
                    <TextInput {...register("bedrooms")} type="number" min={0} />
                  </Field>
                  <Field label="Bathrooms">
                    <TextInput {...register("bathrooms")} type="number" min={0} />
                  </Field>
                </div>
                <Field label="Floor area (m²)">
                  <TextInput {...register("floor_area_sqm")} type="number" min={0} placeholder="16" />
                </Field>
              </div>
            )}

            {step === 2 && (
              <div className="flex flex-col gap-4">
                <Field label="Target monthly rent (£)">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium">£</span>
                    <TextInput {...register("target_rent")} type="number" min={0} className="pl-7" placeholder="550" />
                  </div>
                </Field>
              </div>
            )}

            {step === 3 && (
              <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                {[
                  ["Unit name", data.unit_name],
                  ["Type", data.unit_type],
                  ["Status", data.status],
                  ["Floor", data.floor != null ? `Floor ${data.floor}` : "—"],
                  ["Bedrooms", String(data.bedrooms)],
                  ["Floor area", data.floor_area_sqm ? `${data.floor_area_sqm} m²` : "—"],
                  ["Target rent", data.target_rent > 0 ? `£${data.target_rent}/mo` : "—"],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between px-4 py-3 border-b border-slate-200 last:border-0">
                    <span className="text-sm text-slate-500">{label}</span>
                    <span className="text-sm font-semibold text-slate-900 capitalize">{value ?? "—"}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Button type="button" variant="ghost" size="md" onClick={() => step > 1 ? setStep((s) => s - 1) : router.push(`/property-manager/portfolio/units/${id}`)}>
              <ArrowLeft className="w-4 h-4" />{step === 1 ? "Cancel" : "Back"}
            </Button>
            <Button type="submit" variant="primary" size="md" disabled={saving || saved}>
              {saved ? <><CheckCircle2 className="w-4 h-4" />Saved!</> : saving ? "Saving…" : step < STEPS.length ? <><ArrowRight className="w-4 h-4" />Continue</> : <><Save className="w-4 h-4" />Save changes</>}
            </Button>
          </div>
        </form>
      </div>
    </DashboardContainer>
  )
}
