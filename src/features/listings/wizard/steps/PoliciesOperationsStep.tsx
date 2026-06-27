"use client"

import React from "react"
import {
  ShieldCheck,
  KeyRound,
  FileCheck2,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Plus,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatPence } from "@/lib/marketplace/money"
import { useListingDraft } from "../data/useListingDraft"
import { CHECK_IN_METHODS, CANCELLATION_POLICIES } from "../data/seed"
import {
  Card,
  SectionTitle,
  FieldLabel,
  Toggle,
  ToggleChip,
  TextInput,
  TextArea,
  Select,
  Stepper,
  ScoreRing,
  Pill,
} from "../components/primitives"
import { PenceInput } from "../components/PenceInput"

export function PoliciesOperationsStep() {
  const { draft, update } = useListingDraft()

  const toggleRule = (id: string, list: "houseRules" | "identityVerification") =>
    update({
      [list]: draft[list].map((r) => (r.id === id ? { ...r, on: !r.on } : r)),
    } as Partial<typeof draft>)

  // Policy strength ring.
  const policyScore = Math.min(
    100,
    (draft.houseRules.filter((r) => r.on).length * 8) +
      (draft.cancellationPolicy ? 20 : 0) +
      (draft.damageDepositPence > 0 ? 18 : 0) +
      (draft.checkInMethod ? 14 : 0) +
      (draft.identityVerification.filter((r) => r.on).length * 10),
  )
  const verified = draft.compliance.filter((c) => c.status === "verified").length
  const complianceScore = Math.round((verified / draft.compliance.length) * 100)
  const bookingReady =
    !!draft.cancellationPolicy && !!draft.checkInMethod && verified >= 3 && !!draft.emergencyContact

  const generateCode = () =>
    update({
      accessCodes: [
        ...draft.accessCodes,
        {
          id: `ac-${Date.now()}`,
          label: "Generated code",
          code: String(Math.floor(1000 + Math.random() * 9000)),
          createdAt: new Date().toISOString(),
        },
      ],
    })

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_240px]">
      <div className="space-y-5">
        {/* Check-in */}
        <Card>
          <SectionTitle title="Check-in" />
          <div className="space-y-3">
            <div>
              <FieldLabel>Check-in method</FieldLabel>
              <Select value={draft.checkInMethod} onChange={(v) => update({ checkInMethod: v })} options={CHECK_IN_METHODS} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Check-in time</FieldLabel>
                <input type="time" value={draft.checkInTime} onChange={(e) => update({ checkInTime: e.target.value })} className="h-10 w-full rounded-xl border border-slate-200 px-3 text-[13px] outline-none focus-visible:border-[var(--color-brand-400)]" />
              </div>
              <div>
                <FieldLabel>Check-out time</FieldLabel>
                <input type="time" value={draft.checkOutTime} onChange={(e) => update({ checkOutTime: e.target.value })} className="h-10 w-full rounded-xl border border-slate-200 px-3 text-[13px] outline-none focus-visible:border-[var(--color-brand-400)]" />
              </div>
            </div>
          </div>
        </Card>

        {/* Identity & verification */}
        <Card>
          <SectionTitle title="Guest identity & verification" />
          <div className="space-y-2">
            {draft.identityVerification.map((r) => (
              <label key={r.id} className="flex cursor-pointer items-center gap-2.5">
                <input type="checkbox" checked={r.on} onChange={() => toggleRule(r.id, "identityVerification")} className="h-4 w-4 rounded border-slate-300 text-[var(--brand)] focus:ring-[var(--color-brand-400)]" />
                <span className="text-[13px] text-slate-700">{r.label}</span>
              </label>
            ))}
          </div>
        </Card>

        {/* House rules */}
        <Card>
          <SectionTitle title="House rules" action={<button type="button" className="text-[11px] font-semibold text-[var(--brand)] hover:underline">Edit rules</button>} />
          <div className="space-y-2">
            {draft.houseRules.map((r) => (
              <label key={r.id} className="flex cursor-pointer items-center gap-2.5">
                <input type="checkbox" checked={r.on} onChange={() => toggleRule(r.id, "houseRules")} className="h-4 w-4 rounded border-slate-300 text-[var(--brand)] focus:ring-[var(--color-brand-400)]" />
                <span className="text-[13px] text-slate-700">{r.label}</span>
              </label>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <ToggleChip on={draft.smokingAllowed} onClick={() => update({ smokingAllowed: !draft.smokingAllowed })}>Smoking</ToggleChip>
            <ToggleChip on={draft.petsAllowed} onClick={() => update({ petsAllowed: !draft.petsAllowed })}>Pets</ToggleChip>
            <ToggleChip on={draft.partiesAllowed} onClick={() => update({ partiesAllowed: !draft.partiesAllowed })}>Parties</ToggleChip>
          </div>
        </Card>

        {/* Cancellation + deposit */}
        <Card>
          <SectionTitle title="Cancellation & deposit" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Cancellation policy</FieldLabel>
              <Select value={draft.cancellationPolicy} onChange={(v) => update({ cancellationPolicy: v })} options={CANCELLATION_POLICIES} />
            </div>
            <div>
              <FieldLabel>Damage deposit</FieldLabel>
              <PenceInput pence={draft.damageDepositPence} onChange={(v) => update({ damageDepositPence: v })} currency={draft.currency} />
            </div>
          </div>
        </Card>

        {/* Licence & permits */}
        <Card>
          <SectionTitle
            title="Licence & permits"
            action={
              draft.licenceVerified ? (
                <Pill tone="emerald"><CheckCircle2 className="mr-1 h-3 w-3" />Verified</Pill>
              ) : (
                <Pill tone="amber">Unverified</Pill>
              )
            }
          />
          <div className="space-y-3">
            <div>
              <FieldLabel>Licence number</FieldLabel>
              <TextInput value={draft.licenceNumber} onChange={(v) => update({ licenceNumber: v })} placeholder="e.g. MAN-STL-2026-00471" />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => update({ licenceVerified: true })} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[12px] font-semibold text-slate-700 hover:bg-slate-50">
                <FileCheck2 className="h-3.5 w-3.5" /> Upload / update licence
              </button>
              <button type="button" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[12px] font-semibold text-slate-700 hover:bg-slate-50">
                Manage documents
              </button>
            </div>
          </div>
        </Card>

        {/* Safety & compliance */}
        <Card>
          <SectionTitle title="Safety & compliance" action={<ShieldCheck className="h-4 w-4 text-emerald-500" />} />
          <ul className="space-y-2">
            {draft.compliance.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 px-3 py-2">
                <div className="flex items-center gap-2">
                  {c.status === "verified" ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                  )}
                  <span className="text-[13px] text-slate-700">{c.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {c.reference && <span className="text-[11px] text-slate-400">{c.reference}</span>}
                  {c.status !== "verified" && (
                    <button
                      type="button"
                      onClick={() =>
                        update({
                          compliance: draft.compliance.map((x) =>
                            x.id === c.id ? { ...x, status: "verified", reference: x.reference || "PEND-OK" } : x,
                          ),
                        })
                      }
                      className="rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700 hover:bg-emerald-100"
                    >
                      Verify
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Card>

        {/* Self check-in instructions */}
        <Card>
          <SectionTitle title="Self check-in instructions" action={<button type="button" className="text-[11px] font-semibold text-[var(--brand)] hover:underline">Edit instructions</button>} />
          <TextArea value={draft.selfCheckInInstructions} onChange={(v) => update({ selfCheckInInstructions: v })} rows={3} />
        </Card>

        {/* Operations */}
        <Card>
          <SectionTitle title="Operations" action={<button type="button" className="text-[11px] font-semibold text-[var(--brand)] hover:underline">Manage suppliers</button>} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Cleaning turnaround (hrs)</FieldLabel>
              <Stepper value={draft.cleaningTurnaroundHours} onChange={(v) => update({ cleaningTurnaroundHours: v })} max={48} />
            </div>
            <div>
              <FieldLabel>Assigned housekeeper / supplier</FieldLabel>
              <TextInput value={draft.assignedHousekeeper} onChange={(v) => update({ assignedHousekeeper: v })} />
            </div>
            <div className="col-span-2">
              <FieldLabel>Emergency contact</FieldLabel>
              <TextInput value={draft.emergencyContact} onChange={(v) => update({ emergencyContact: v })} placeholder="+44 …" />
            </div>
          </div>
        </Card>

        {/* Message automation */}
        <Card>
          <SectionTitle title="Booking message automation" action={<button type="button" className="text-[11px] font-semibold text-[var(--brand)] hover:underline">Manage templates</button>} />
          <div className="space-y-2">
            <Toggle on={draft.msgPreEnabled} onChange={(v) => update({ msgPreEnabled: v })} label="Pre-arrival message" />
            <Toggle on={draft.msgDuringEnabled} onChange={(v) => update({ msgDuringEnabled: v })} label="During-stay message" />
            <Toggle on={draft.msgPostEnabled} onChange={(v) => update({ msgPostEnabled: v })} label="Post-stay message" />
          </div>
        </Card>

        {/* Access codes */}
        <Card>
          <SectionTitle
            title="Access codes"
            action={
              <button type="button" onClick={generateCode} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50">
                <Plus className="h-3 w-3" /> Generate new code
              </button>
            }
          />
          <div className="space-y-2">
            {draft.accessCodes.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2">
                <span className="flex items-center gap-2 text-[13px] text-slate-700">
                  <KeyRound className="h-3.5 w-3.5 text-slate-400" /> {c.label}
                </span>
                <span className="font-mono text-[14px] font-bold tracking-widest text-slate-900">{c.code}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Operational notes */}
        <Card>
          <SectionTitle title="Operational notes" />
          <TextArea value={draft.operationalNotes} onChange={(v) => update({ operationalNotes: v })} rows={3} />
        </Card>
      </div>

      {/* Right rail (within step body for lg) */}
      <div className="space-y-4">
        <Card className="flex flex-col items-center">
          <SectionTitle title="Policy strength" />
          <ScoreRing value={policyScore} size={84} colour={policyScore >= 70 ? "#10B981" : "#F59E0B"} />
        </Card>
        <Card>
          <SectionTitle title="Compliance status" />
          <div className="flex items-center gap-3">
            <ScoreRing value={complianceScore} size={56} colour="#2563EB" />
            <p className="text-[12px] text-slate-600">
              {verified}/{draft.compliance.length} verified
            </p>
          </div>
        </Card>
        <Card>
          <SectionTitle title="Booking readiness" />
          <div className={cn("flex items-center gap-2 rounded-xl px-3 py-2", bookingReady ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>
            {bookingReady ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
            <span className="text-[12px] font-semibold">{bookingReady ? "Ready to take bookings" : "A few items remaining"}</span>
          </div>
        </Card>
        <Card className="border-violet-200 bg-violet-50/40">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-500" />
            <p className="text-[12px] font-semibold text-violet-800">Tip</p>
          </div>
          <p className="mt-1 text-[11px] text-violet-700">Verified compliance unlocks instant-book and higher search ranking.</p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-[12px] text-slate-500">
            <Users className="h-4 w-4" /> {draft.assignedHousekeeper || "No supplier assigned"}
          </div>
        </Card>
      </div>
    </div>
  )
}
