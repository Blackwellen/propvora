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
import { useTenancy, useUpdateTenancy } from "@/hooks/useTenancies"
import {
  ArrowLeft, ArrowRight, Users, PoundSterling, Calendar,
  FileText, CheckCircle2, Save,
} from "lucide-react"
import { cn } from "@/lib/utils"

/* ------------------------------------------------------------------ */
/* Schema                                                               */
/* ------------------------------------------------------------------ */
const schema = z.object({
  start_date: z.string().min(1, "Start date required"),
  end_date: z.string().optional(),
  rent_amount: z.coerce.number().min(0, "Rent must be ≥ 0"),
  rent_frequency: z.string().default("monthly"),
  deposit_amount: z.coerce.number().min(0).optional(),
  deposit_held_by: z.string().optional(),
  deposit_scheme: z.string().optional(),
  status: z.string().default("active"),
  notes: z.string().optional(),
})
type FormData = z.infer<typeof schema>

const STEPS = [
  { id: 1, label: "Dates",    icon: Calendar },
  { id: 2, label: "Finances", icon: PoundSterling },
  { id: 3, label: "Deposit",  icon: FileText },
  { id: 4, label: "Review",   icon: CheckCircle2 },
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
  return <input {...props} className={cn("w-full h-10 px-3 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] bg-white transition-all", className)} />
}

function SelectInput({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn("w-full h-10 px-3 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] bg-white cursor-pointer transition-all", className)} />
}

function TextArea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn("w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] bg-white transition-all resize-none", className)} />
}

export default function TenancyEditPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { workspace, isLoading: wsLoading } = useWorkspace()
  const { data: tenancy, isLoading: tenancyLoading } = useTenancy(workspace?.id, workspace?.id ? id : undefined)
  const updateTenancy = useUpdateTenancy()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: { rent_frequency: "monthly", status: "active" },
  })

  useEffect(() => {
    if (tenancy) {
      reset({
        start_date: tenancy.start_date,
        end_date: tenancy.end_date ?? "",
        rent_amount: tenancy.rent_amount,
        rent_frequency: tenancy.rent_frequency,
        deposit_amount: tenancy.deposit_amount ?? undefined,
        deposit_held_by: tenancy.deposit_held_by ?? undefined,
        deposit_scheme: tenancy.deposit_scheme ?? "",
        status: tenancy.status,
        notes: tenancy.notes ?? "",
      })
    }
  }, [tenancy, reset])

  const loading = wsLoading || tenancyLoading

  async function onSubmit(data: FormData) {
    if (step < STEPS.length) { setStep((s) => s + 1); return }
    setSaving(true)
    try {
      if (workspace?.id && tenancy) {
        await updateTenancy.mutateAsync({ workspaceId: workspace.id, id: tenancy.id, payload: data })
      }
      setSaved(true)
      setTimeout(() => router.push(`/app/portfolio/tenancies/${id}`), 1200)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <DashboardContainer><Skeleton className="h-96 rounded-2xl" /></DashboardContainer>

  const data = watch()

  const fmt = (n: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 0 }).format(n)

  return (
    <DashboardContainer>
      <nav className="flex items-center gap-1.5 text-sm text-slate-400 mb-6">
        <Link href="/app/portfolio" className="hover:text-slate-600">Portfolio</Link>
        <span>/</span>
        <Link href="/app/portfolio/tenancies" className="hover:text-slate-600">Tenancies</Link>
        <span>/</span>
        <Link href={`/app/portfolio/tenancies/${id}`} className="hover:text-slate-600">{tenancy?.reference ?? "Tenancy"}</Link>
        <span>/</span>
        <span className="text-slate-900 font-medium">Edit</span>
      </nav>

      <div className="max-w-lg mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Edit tenancy</h1>
          <p className="text-sm text-slate-500 mt-1">Update {tenancy?.reference ?? "this tenancy"}</p>
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
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Start date" error={errors.start_date?.message} required>
                    <TextInput {...register("start_date")} type="date" />
                  </Field>
                  <Field label="End date">
                    <TextInput {...register("end_date")} type="date" />
                  </Field>
                </div>
                <Field label="Tenancy status">
                  <SelectInput {...register("status")}>
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="ended">Ended</option>
                    <option value="disputed">Disputed</option>
                    <option value="surrendered">Surrendered</option>
                  </SelectInput>
                </Field>
                <Field label="Notes">
                  <TextArea {...register("notes")} rows={4} placeholder="Any notes about this tenancy…" />
                </Field>
              </div>
            )}

            {step === 2 && (
              <div className="flex flex-col gap-4">
                <Field label="Monthly rent (£)" error={errors.rent_amount?.message} required>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">£</span>
                    <TextInput {...register("rent_amount")} type="number" min={0} className="pl-7" placeholder="550" />
                  </div>
                </Field>
                <Field label="Rent frequency">
                  <SelectInput {...register("rent_frequency")}>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="annually">Annually</option>
                  </SelectInput>
                </Field>
              </div>
            )}

            {step === 3 && (
              <div className="flex flex-col gap-4">
                <Field label="Deposit amount (£)">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">£</span>
                    <TextInput {...register("deposit_amount")} type="number" min={0} className="pl-7" />
                  </div>
                </Field>
                <Field label="Deposit held by">
                  <SelectInput {...register("deposit_held_by")}>
                    <option value="">Select…</option>
                    <option value="scheme">Scheme</option>
                    <option value="landlord">Landlord</option>
                    <option value="agent">Agent</option>
                  </SelectInput>
                </Field>
                <Field label="Deposit scheme">
                  <TextInput {...register("deposit_scheme")} placeholder="DPS, TDS, MyDeposits…" />
                </Field>
              </div>
            )}

            {step === 4 && (
              <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                {[
                  ["Start date", data.start_date || "—"],
                  ["End date", data.end_date || "Periodic"],
                  ["Status", data.status],
                  ["Rent", data.rent_amount ? fmt(data.rent_amount) + `/${data.rent_frequency}` : "—"],
                  ["Deposit", data.deposit_amount ? fmt(data.deposit_amount) : "—"],
                  ["Deposit held by", data.deposit_held_by || "—"],
                  ["Scheme", data.deposit_scheme || "—"],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between px-4 py-3 border-b border-slate-200 last:border-0">
                    <span className="text-sm text-slate-500">{label}</span>
                    <span className="text-sm font-semibold text-slate-900 capitalize">{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Button type="button" variant="ghost" size="md" onClick={() => step > 1 ? setStep((s) => s - 1) : router.push(`/app/portfolio/tenancies/${id}`)}>
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
