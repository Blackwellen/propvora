"use client"

import React from "react"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Tooltip,
} from "recharts"
import {
  TrendingUp,
  Percent,
  BedDouble,
  Sparkles,
  Plus,
  Trash2,
  CalendarDays,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatPence } from "@/lib/marketplace/money"
import { useListingDraft } from "../data/useListingDraft"
import type { ChannelKey } from "../data/types"
import {
  Card,
  SectionTitle,
  FieldLabel,
  Toggle,
  ToggleChip,
  Pill,
  TextInput,
  Stepper,
} from "../components/primitives"
import { PenceInput } from "../components/PenceInput"

const CURRENCIES = ["GBP", "EUR", "USD"]

function KpiTile({
  label,
  value,
  sub,
  Icon,
  colour,
  chart,
}: {
  label: string
  value: string
  sub: string
  Icon: React.ElementType
  colour: string
  chart: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: `${colour}1a` }}>
          <Icon className="h-4 w-4" style={{ color: colour }} />
        </span>
      </div>
      <p className="mt-2 text-[17px] font-bold text-slate-900">{value}</p>
      <p className="text-[11px] font-medium text-slate-500">{label}</p>
      <p className="text-[10px] text-slate-400">{sub}</p>
      <div className="mt-1 h-10">{chart}</div>
    </div>
  )
}

export function PricingAvailabilityStep() {
  const { draft, update } = useListingDraft()
  const cur = draft.currency

  // Derived KPIs from forecast + base rate.
  const annualRevenue = draft.forecast.reduce((s, p) => s + p.revenuePence, 0)
  const estMonthly = Math.round(annualRevenue / 12)
  const avgOcc = Math.round(draft.forecast.reduce((s, p) => s + p.occupancyPct, 0) / draft.forecast.length)
  const adr = draft.baseRatePence
  const revpar = Math.round(adr * (avgOcc / 100))

  const revData = draft.forecast.map((p) => ({ v: p.revenuePence }))
  const occData = draft.forecast.map((p) => ({ v: p.occupancyPct }))

  // Earnings breakdown on a single base-rate stay (min nights).
  const nights = Math.max(1, draft.minStayNights)
  const gross = draft.baseRatePence * nights + draft.cleaningFeePence
  const platformFee = Math.round(gross * 0.03)
  const processing = Math.round(gross * 0.014) + 20
  const vat = Math.round((gross - platformFee - processing) * (draft.vatPct / 100))
  const youReceive = gross - platformFee - processing - vat

  const toggleSync = (key: ChannelKey) =>
    update({ channelSync: { ...draft.channelSync, [key]: !draft.channelSync[key] } })

  const addCustomCharge = () =>
    update({
      customCharges: [
        ...draft.customCharges,
        { id: `cc-${Date.now()}`, label: "New charge", amountPence: 1000, basis: "per-stay" },
      ],
    })
  const removeCharge = (id: string) =>
    update({ customCharges: draft.customCharges.filter((c) => c.id !== id) })

  const addSeasonalRule = () =>
    update({
      seasonalRules: [
        ...draft.seasonalRules,
        { id: `s-${Date.now()}`, name: "New season", dateRange: "—", adjustmentPct: 0, colour: "#8B5CF6" },
      ],
    })

  const addBlackout = () =>
    update({
      blackoutDates: [
        ...draft.blackoutDates,
        { id: `b-${Date.now()}`, label: "Owner stay", from: "", to: "" },
      ],
    })

  // Availability calendar (simple month grid).
  const days = Array.from({ length: 35 }, (_, i) => i)
  const dayState = (i: number): "open" | "special" | "blocked" | "booked" => {
    if (i % 11 === 0) return "blocked"
    if (i % 7 === 3) return "booked"
    if (i % 5 === 0) return "special"
    return "open"
  }
  const dayColour: Record<string, string> = {
    open: "bg-white text-slate-600",
    special: "bg-violet-100 text-violet-700",
    blocked: "bg-slate-200 text-slate-400",
    booked: "bg-emerald-100 text-emerald-700",
  }

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiTile
          label="Est. monthly revenue"
          value={formatPence(estMonthly, cur)}
          sub="Next 12 months avg"
          Icon={TrendingUp}
          colour="#2563EB"
          chart={
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revData} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
                <Area type="monotone" dataKey="v" stroke="#2563EB" fill="#2563EB22" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          }
        />
        <KpiTile
          label="Occupancy forecast"
          value={`${avgOcc}%`}
          sub="Annual average"
          Icon={Percent}
          colour="#10B981"
          chart={
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={occData} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
                <Bar dataKey="v" fill="#10B981" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          }
        />
        <KpiTile
          label="ADR"
          value={formatPence(adr, cur)}
          sub="Average daily rate"
          Icon={BedDouble}
          colour="#F59E0B"
          chart={
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revData} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
                <Area type="monotone" dataKey="v" stroke="#F59E0B" fill="#F59E0B22" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          }
        />
        <KpiTile
          label="RevPAR"
          value={formatPence(revpar, cur)}
          sub="Revenue per available night"
          Icon={Zap}
          colour="#7C3AED"
          chart={
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={occData} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
                <Bar dataKey="v" fill="#7C3AED" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          }
        />
      </div>

      {/* Base rate + currency */}
      <Card>
        <SectionTitle title="Base pricing" action={<Toggle on={draft.smartPricing} onChange={(v) => update({ smartPricing: v })} label="Smart pricing" />} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <FieldLabel>Base nightly rate</FieldLabel>
            <PenceInput pence={draft.baseRatePence} onChange={(v) => update({ baseRatePence: v })} currency={cur} />
          </div>
          <div>
            <FieldLabel>Currency</FieldLabel>
            <select
              value={cur}
              onChange={(e) => update({ currency: e.target.value })}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-900 outline-none focus-visible:border-[var(--color-brand-400)] focus-visible:ring-2 focus-visible:ring-[var(--color-brand-100)]"
            >
              {CURRENCIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <FieldLabel>Weekday rate</FieldLabel>
            <PenceInput pence={draft.weekdayRatePence} onChange={(v) => update({ weekdayRatePence: v })} currency={cur} />
          </div>
          <div>
            <FieldLabel>Weekend rate</FieldLabel>
            <PenceInput pence={draft.weekendRatePence} onChange={(v) => update({ weekendRatePence: v })} currency={cur} />
          </div>
        </div>
      </Card>

      {/* Additional charges */}
      <Card>
        <SectionTitle title="Additional charges" action={
          <button type="button" onClick={addCustomCharge} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50">
            <Plus className="h-3 w-3" /> Add custom charge
          </button>
        } />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <FieldLabel>Cleaning fee (per stay)</FieldLabel>
            <PenceInput pence={draft.cleaningFeePence} onChange={(v) => update({ cleaningFeePence: v })} currency={cur} />
          </div>
          <div>
            <FieldLabel>Service fee (per stay)</FieldLabel>
            <PenceInput pence={draft.serviceFeePence} onChange={(v) => update({ serviceFeePence: v })} currency={cur} />
          </div>
          <div>
            <FieldLabel>Management fee (per stay)</FieldLabel>
            <PenceInput pence={draft.managementFeePence} onChange={(v) => update({ managementFeePence: v })} currency={cur} />
          </div>
        </div>
        {draft.customCharges.length > 0 && (
          <div className="mt-3 space-y-2">
            {draft.customCharges.map((c) => (
              <div key={c.id} className="flex items-center gap-2 rounded-xl border border-slate-200 p-2">
                <TextInput value={c.label} onChange={(v) => update({ customCharges: draft.customCharges.map((x) => x.id === c.id ? { ...x, label: v } : x) })} />
                <div className="w-32 shrink-0">
                  <PenceInput pence={c.amountPence} onChange={(v) => update({ customCharges: draft.customCharges.map((x) => x.id === c.id ? { ...x, amountPence: v } : x) })} currency={cur} />
                </div>
                <select
                  value={c.basis}
                  onChange={(e) => update({ customCharges: draft.customCharges.map((x) => x.id === c.id ? { ...x, basis: e.target.value as typeof c.basis } : x) })}
                  className="h-10 shrink-0 rounded-xl border border-slate-200 bg-white px-2 text-[12px] outline-none"
                >
                  <option value="per-stay">per stay</option>
                  <option value="per-night">per night</option>
                  <option value="per-guest">per guest</option>
                </select>
                <button type="button" aria-label="Remove" onClick={() => removeCharge(c.id)} className="rounded-lg p-2 text-red-400 hover:bg-red-50">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Stay requirements */}
      <Card>
        <SectionTitle title="Stay requirements" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <FieldLabel>Min stay (nights)</FieldLabel>
            <Stepper value={draft.minStayNights} onChange={(v) => update({ minStayNights: v })} min={1} />
          </div>
          <div>
            <FieldLabel>Max stay (nights)</FieldLabel>
            <Stepper value={draft.maxStayNights} onChange={(v) => update({ maxStayNights: v })} min={1} max={365} />
          </div>
          <div>
            <FieldLabel>Last-minute (hrs)</FieldLabel>
            <Stepper value={draft.lastMinuteHours} onChange={(v) => update({ lastMinuteHours: v })} max={72} />
          </div>
          <div>
            <FieldLabel>Advance notice (days)</FieldLabel>
            <Stepper value={draft.advanceNoticeDays} onChange={(v) => update({ advanceNoticeDays: v })} max={90} />
          </div>
        </div>
      </Card>

      {/* Tax + cancellation fee */}
      <Card>
        <SectionTitle title="Tax & fees" />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>VAT rate (%)</FieldLabel>
            <input type="number" value={draft.vatPct} onChange={(e) => update({ vatPct: Number(e.target.value) })} className="h-10 w-full rounded-xl border border-slate-200 px-3 text-[13px] outline-none focus-visible:border-[var(--color-brand-400)] focus-visible:ring-2 focus-visible:ring-[var(--color-brand-100)]" />
          </div>
          <div>
            <FieldLabel>Cancellation fee</FieldLabel>
            <PenceInput pence={draft.cancellationFeePence} onChange={(v) => update({ cancellationFeePence: v })} currency={cur} />
          </div>
        </div>
      </Card>

      {/* Availability calendar */}
      <Card>
        <SectionTitle title="Availability calendar" action={<CalendarDays className="h-4 w-4 text-slate-400" />} />
        <div className="mb-3 flex flex-wrap gap-3 text-[11px]">
          {[
            ["Open", "bg-white border border-slate-200"],
            ["Special", "bg-violet-100"],
            ["Blocked", "bg-slate-200"],
            ["Booked", "bg-emerald-100"],
          ].map(([label, cls]) => (
            <span key={label} className="flex items-center gap-1.5 text-slate-500">
              <span className={cn("h-3 w-3 rounded", cls)} /> {label}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {days.map((i) => {
            const st = dayState(i)
            return (
              <div key={i} className={cn("flex h-9 items-center justify-center rounded-lg text-[11px] font-semibold", dayColour[st])}>
                {i + 1}
              </div>
            )
          })}
        </div>
      </Card>

      {/* Discounts */}
      <Card>
        <SectionTitle title="Discounts & promotions" />
        <div className="grid grid-cols-3 gap-3">
          <div>
            <FieldLabel>Weekly (%)</FieldLabel>
            <input type="number" value={draft.weeklyDiscountPct} onChange={(e) => update({ weeklyDiscountPct: Number(e.target.value) })} className="h-10 w-full rounded-xl border border-slate-200 px-3 text-[13px] outline-none focus-visible:border-[var(--color-brand-400)]" />
          </div>
          <div>
            <FieldLabel>Monthly (%)</FieldLabel>
            <input type="number" value={draft.monthlyDiscountPct} onChange={(e) => update({ monthlyDiscountPct: Number(e.target.value) })} className="h-10 w-full rounded-xl border border-slate-200 px-3 text-[13px] outline-none focus-visible:border-[var(--color-brand-400)]" />
          </div>
          <div>
            <FieldLabel>Early-bird (%)</FieldLabel>
            <input type="number" value={draft.earlyBirdDiscountPct} onChange={(e) => update({ earlyBirdDiscountPct: Number(e.target.value) })} className="h-10 w-full rounded-xl border border-slate-200 px-3 text-[13px] outline-none focus-visible:border-[var(--color-brand-400)]" />
          </div>
        </div>
      </Card>

      {/* Seasonal rules */}
      <Card>
        <SectionTitle title="Seasonal pricing rules" action={
          <button type="button" onClick={addSeasonalRule} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50">
            <Plus className="h-3 w-3" /> Add rule
          </button>
        } />
        <div className="space-y-2">
          {draft.seasonalRules.map((s) => (
            <div key={s.id} className="flex items-center gap-2 rounded-xl border border-slate-200 p-2">
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: s.colour }} />
              <span className="flex-1 text-[13px] font-semibold text-slate-800">{s.name}</span>
              <span className="text-[12px] text-slate-500">{s.dateRange}</span>
              <Pill tone={s.adjustmentPct >= 0 ? "emerald" : "blue"}>
                {s.adjustmentPct >= 0 ? "+" : ""}{s.adjustmentPct}%
              </Pill>
              <button type="button" aria-label="Remove rule" onClick={() => update({ seasonalRules: draft.seasonalRules.filter((x) => x.id !== s.id) })} className="rounded-lg p-1.5 text-red-400 hover:bg-red-50">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* Blackout dates */}
      <Card>
        <SectionTitle title="Blackout dates" action={
          <button type="button" onClick={addBlackout} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50">
            <Plus className="h-3 w-3" /> Add blackout dates
          </button>
        } />
        {draft.blackoutDates.length === 0 ? (
          <p className="text-[12px] text-slate-400">No blackout dates set.</p>
        ) : (
          <div className="space-y-2">
            {draft.blackoutDates.map((b) => (
              <div key={b.id} className="flex items-center gap-2 rounded-xl border border-slate-200 p-2">
                <TextInput value={b.label} onChange={(v) => update({ blackoutDates: draft.blackoutDates.map((x) => x.id === b.id ? { ...x, label: v } : x) })} />
                <input type="date" value={b.from} onChange={(e) => update({ blackoutDates: draft.blackoutDates.map((x) => x.id === b.id ? { ...x, from: e.target.value } : x) })} className="h-10 rounded-xl border border-slate-200 px-2 text-[12px]" />
                <input type="date" value={b.to} onChange={(e) => update({ blackoutDates: draft.blackoutDates.map((x) => x.id === b.id ? { ...x, to: e.target.value } : x) })} className="h-10 rounded-xl border border-slate-200 px-2 text-[12px]" />
                <button type="button" aria-label="Remove" onClick={() => update({ blackoutDates: draft.blackoutDates.filter((x) => x.id !== b.id) })} className="rounded-lg p-2 text-red-400 hover:bg-red-50">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Instant book eligibility */}
      <Card>
        <SectionTitle title="Instant-book eligibility" action={<Toggle on={draft.instantBook} onChange={(v) => update({ instantBook: v })} label="Enable" />} />
        <ul className="space-y-1.5">
          {[
            ["Verified compliance documents", draft.compliance.filter((c) => c.status === "verified").length >= 3],
            ["Cover image set", draft.photos.some((p) => p.isCover)],
            ["Cancellation policy chosen", !!draft.cancellationPolicy],
            ["Minimum 5 photos", draft.photos.length >= 5],
          ].map(([label, ok], i) => (
            <li key={i} className="flex items-center gap-2 text-[12px]">
              <span className={cn("h-1.5 w-1.5 rounded-full", ok ? "bg-emerald-500" : "bg-slate-300")} />
              <span className={ok ? "text-slate-600" : "text-slate-400"}>{label as string}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Channel sync */}
      <Card>
        <SectionTitle title="Channel sync & booking sources" />
        <div className="flex flex-wrap gap-2">
          {(["airbnb", "booking", "vrbo"] as ChannelKey[]).map((k) => (
            <ToggleChip key={k} on={draft.channelSync[k]} onClick={() => toggleSync(k)}>
              {k === "airbnb" ? "Airbnb" : k === "booking" ? "Booking.com" : "Vrbo"}
            </ToggleChip>
          ))}
        </div>
        <button type="button" className="mt-3 text-[12px] font-semibold text-[var(--brand)] hover:underline">
          Manage channel mapping →
        </button>
      </Card>

      {/* AI pricing suggestion */}
      <Card className="border-violet-200 bg-violet-50/40">
        <SectionTitle title="AI pricing suggestion" action={<Sparkles className="h-4 w-4 text-violet-500" />} />
        <p className="text-[12px] text-slate-600">
          Based on local demand we recommend a base rate of{" "}
          <span className="font-bold text-slate-900">{formatPence(Math.round(adr * 1.08), cur)}</span> (+8%) to lift RevPAR.
        </p>
        <button
          type="button"
          onClick={() => update({ baseRatePence: Math.round(draft.baseRatePence * 1.08) })}
          className="mt-2 rounded-lg bg-violet-600 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-violet-700"
        >
          Apply pricing suggestion
        </button>
      </Card>

      {/* Earnings breakdown */}
      <Card>
        <SectionTitle title="Price preview & earnings breakdown" hint={`Based on a ${nights}-night stay`} />
        <dl className="space-y-1.5 text-[13px]">
          {[
            ["Gross booking value", gross, "text-slate-900 font-semibold"],
            ["Platform fee (3%)", -platformFee, "text-slate-500"],
            ["Payment processing", -processing, "text-slate-500"],
            [`VAT (${draft.vatPct}%)`, -vat, "text-slate-500"],
          ].map(([label, val, cls]) => (
            <div key={label as string} className="flex items-center justify-between">
              <dt className={cls as string}>{label as string}</dt>
              <dd className={cn("tabular-nums", cls as string)}>
                {(val as number) < 0 ? "−" : ""}{formatPence(Math.abs(val as number), cur)}
              </dd>
            </div>
          ))}
          <div className="mt-1 flex items-center justify-between border-t border-slate-200 pt-2">
            <dt className="text-[14px] font-bold text-slate-900">You&apos;ll receive</dt>
            <dd className="text-[16px] font-bold text-emerald-600 tabular-nums">{formatPence(youReceive, cur)}</dd>
          </div>
        </dl>
      </Card>
    </div>
  )
}
