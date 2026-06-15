"use client"

import { useState } from "react"
import {
  UserCircle,
  Wrench,
  MapPin,
  Clock,
  Plus,
  Tag,
  Building2,
  Store,
  Eye,
} from "lucide-react"
import { MobileTopBar } from "@/components/mobile"
import { InlineEditField } from "@/components/editing"
import {
  SupplierPageHeader,
  SupplierCard,
  SupplierEmptyState,
  SupplierLoadingState,
  SupplierStatusBadge,
  humaniseStatus,
} from "@/components/supplier-workspace/ui"
import { useSupplierApi } from "@/components/supplier-workspace/useSupplierApi"
import { money } from "@/components/supplier-workspace/format"
import type {
  SupplierProfile,
  SupplierService,
  SupplierCoverageArea,
  SupplierAvailabilityDay,
} from "@/components/supplier-workspace/types"

const SUPPLIER_TYPES = [
  "solo_contractor", "supplier_company", "agency", "emergency_supplier",
  "compliance_assessor", "professional_service", "utility_partner", "logistics_partner",
].map((v) => ({ value: v, label: humaniseStatus(v) }))

const VISIBILITY = ["private", "workspace", "public"].map((v) => ({ value: v, label: humaniseStatus(v) }))

/** Tolerant PATCH helper — resolves on 2xx, rejects otherwise so the inline
 *  editor surfaces an error toast and reverts. The sibling API owns the route. */
async function patchProfile(field: string, val: string) {
  const res = await fetch("/api/supplier/profile", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ [field]: val }),
  })
  if (!res.ok) throw new Error("Could not save — the profile service isn't available yet.")
}

export default function SupplierProfilePage() {
  const profile = useSupplierApi<SupplierProfile>("/api/supplier/profile", {
    select: (j) => (j as { profile?: SupplierProfile }).profile ?? (j as SupplierProfile),
  })
  const services = useSupplierApi<SupplierService[]>("/api/supplier/services", {
    select: (j) => (j as { services?: SupplierService[] }).services ?? (Array.isArray(j) ? (j as SupplierService[]) : []),
  })
  const coverage = useSupplierApi<SupplierCoverageArea[]>("/api/supplier/coverage", {
    select: (j) => (j as { areas?: SupplierCoverageArea[] }).areas ?? (Array.isArray(j) ? (j as SupplierCoverageArea[]) : []),
  })
  const availability = useSupplierApi<SupplierAvailabilityDay[]>("/api/supplier/availability", {
    select: (j) => (j as { days?: SupplierAvailabilityDay[] }).days ?? (Array.isArray(j) ? (j as SupplierAvailabilityDay[]) : []),
  })

  const [tab, setTab] = useState<"details" | "services" | "coverage" | "availability">("details")
  const p = profile.data

  const TABS = [
    { id: "details" as const, label: "Details", icon: UserCircle },
    { id: "services" as const, label: "Services", icon: Wrench },
    { id: "coverage" as const, label: "Coverage", icon: MapPin },
    { id: "availability" as const, label: "Availability", icon: Clock },
  ]

  const tabRail = (
    <div className="flex gap-1 overflow-x-auto -mx-1 px-1 border-b border-slate-200">
      {TABS.map((t) => {
        const Icon = t.icon
        const active = tab === t.id
        return (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors ${
              active ? "border-[#2563EB] text-[#2563EB]" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Icon className="w-4 h-4" /> {t.label}
          </button>
        )
      })}
    </div>
  )

  return (
    <div className="space-y-5">
      <MobileTopBar title="Profile" subtitle={p?.business_name ?? "Supplier profile"} />

      <SupplierPageHeader
        title="Profile"
        subtitle="Your public-facing supplier profile, services, coverage and availability"
        actions={
          p?.profile_visibility && (
            <SupplierStatusBadge tone={p.profile_visibility === "public" ? "emerald" : "slate"}>
              {humaniseStatus(p.profile_visibility)} visibility
            </SupplierStatusBadge>
          )
        }
        tabs={tabRail}
      />
      <div className="md:hidden">{tabRail}</div>

      {profile.loading && tab === "details" ? (
        <SupplierLoadingState rows={5} />
      ) : (
        <>
          {tab === "details" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <SupplierCard className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="w-4 h-4 text-slate-500" />
                  <h2 className="text-base font-semibold text-slate-900">Business details</h2>
                </div>
                <dl className="space-y-3.5">
                  <Row label="Business name">
                    <InlineEditField label="business name" value={p?.business_name ?? ""} onSave={(v) => patchProfile("business_name", v)} useSheetOnMobile />
                  </Row>
                  <Row label="Trading name">
                    <InlineEditField label="trading name" value={p?.trading_name ?? ""} onSave={(v) => patchProfile("trading_name", v)} useSheetOnMobile />
                  </Row>
                  <Row label="Supplier type">
                    <InlineEditField label="supplier type" type="select" options={SUPPLIER_TYPES} value={p?.supplier_type ?? ""} onSave={(v) => patchProfile("supplier_type", v)} useSheetOnMobile />
                  </Row>
                  <Row label="Years experience">
                    <InlineEditField label="years experience" type="number" value={p?.years_experience ?? ""} onSave={(v) => patchProfile("years_experience", v)} useSheetOnMobile />
                  </Row>
                  <Row label="Team size">
                    <InlineEditField label="team size" type="number" value={p?.team_size ?? ""} onSave={(v) => patchProfile("team_size", v)} useSheetOnMobile />
                  </Row>
                </dl>
              </SupplierCard>

              <div className="space-y-4">
                <SupplierCard className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Tag className="w-4 h-4 text-slate-500" />
                    <h2 className="text-base font-semibold text-slate-900">About & headline</h2>
                  </div>
                  <dl className="space-y-3.5">
                    <Row label="Short description">
                      <InlineEditField label="short description" value={p?.description_short ?? ""} onSave={(v) => patchProfile("description_short", v)} useSheetOnMobile placeholder="One-line headline" />
                    </Row>
                    <Row label="Full description" stacked>
                      <InlineEditField label="full description" type="textarea" value={p?.description_long ?? ""} onSave={(v) => patchProfile("description_long", v)} useSheetOnMobile placeholder="Tell property managers about your work…" />
                    </Row>
                  </dl>
                </SupplierCard>

                <SupplierCard className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Store className="w-4 h-4 text-slate-500" />
                    <h2 className="text-base font-semibold text-slate-900">Visibility</h2>
                  </div>
                  <dl className="space-y-3.5">
                    <Row label="Profile visibility">
                      <InlineEditField label="profile visibility" type="select" options={VISIBILITY} value={p?.profile_visibility ?? "private"} onSave={(v) => patchProfile("profile_visibility", v)} useSheetOnMobile />
                    </Row>
                    <Row label="Service categories">
                      <span className="flex flex-wrap gap-1.5 justify-end">
                        {(p?.service_categories ?? []).length === 0 ? (
                          <span className="text-sm text-slate-400 italic">None yet</span>
                        ) : (
                          (p?.service_categories ?? []).map((c) => (
                            <SupplierStatusBadge key={c} tone="blue">{humaniseStatus(c)}</SupplierStatusBadge>
                          ))
                        )}
                      </span>
                    </Row>
                  </dl>
                  <p className="mt-3 text-xs text-slate-400 flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" /> Public profiles appear in the marketplace once verification is complete.
                  </p>
                </SupplierCard>
              </div>
            </div>
          )}

          {tab === "services" && (
            <SupplierCard className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-slate-900">Services & packages</h2>
                <button className="inline-flex items-center gap-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl px-3 py-1.5 text-sm font-semibold transition-colors">
                  <Plus className="w-4 h-4" /> Add service
                </button>
              </div>
              {services.loading ? (
                <SupplierLoadingState rows={3} />
              ) : (services.data ?? []).length === 0 ? (
                <SupplierEmptyState
                  icon={Wrench}
                  title="No services yet"
                  description="Add the services and packages you offer — hourly rates, fixed-price packages, callouts or compliance certificates. These power your quotes and marketplace listings."
                />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {(services.data ?? []).map((s, i) => (
                    <li key={s.id ?? i} className="py-3 first:pt-0 last:pb-0 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                        <Wrench className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{s.title ?? "Service"}</p>
                        <p className="text-xs text-slate-500 truncate">
                          {s.category ? humaniseStatus(s.category) : "—"}
                          {s.price_type ? ` · ${humaniseStatus(s.price_type)}` : ""}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-slate-800">{money(s.fixed_price ?? s.starting_price, s.currency)}</p>
                        {s.status && <SupplierStatusBadge tone={s.status === "active" ? "emerald" : "slate"}>{humaniseStatus(s.status)}</SupplierStatusBadge>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </SupplierCard>
          )}

          {tab === "coverage" && (
            <SupplierCard className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-slate-900">Service coverage areas</h2>
                <button className="inline-flex items-center gap-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl px-3 py-1.5 text-sm font-semibold transition-colors">
                  <Plus className="w-4 h-4" /> Add area
                </button>
              </div>
              {coverage.loading ? (
                <SupplierLoadingState rows={3} />
              ) : (coverage.data ?? []).length === 0 ? (
                <SupplierEmptyState
                  icon={MapPin}
                  title="No coverage areas"
                  description="Define the postcodes, cities or regions you serve, plus your travel radius and emergency coverage, so the right requests reach you."
                />
              ) : (
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(coverage.data ?? []).map((a, i) => (
                    <li key={a.id ?? i} className="flex items-start gap-3 p-3 rounded-xl border border-slate-100">
                      <MapPin className="w-4 h-4 text-[#2563EB] mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{a.label ?? a.city ?? a.postcode ?? a.region ?? "Area"}</p>
                        <p className="text-xs text-slate-500">
                          {a.radius_miles ? `${a.radius_miles} mile radius` : "Full coverage"}
                          {a.emergency ? " · Emergency" : ""}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </SupplierCard>
          )}

          {tab === "availability" && (
            <SupplierCard className="p-5">
              <h2 className="text-base font-semibold text-slate-900 mb-4">Weekly availability</h2>
              {availability.loading ? (
                <SupplierLoadingState rows={4} />
              ) : (availability.data ?? []).length === 0 ? (
                <SupplierEmptyState
                  icon={Clock}
                  title="No availability set"
                  description="Set your working days and hours, emergency cover and same-day capacity so property managers know when you can attend."
                />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {(availability.data ?? []).map((d, i) => (
                    <li key={d.day ?? i} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">{humaniseStatus(d.day ?? "Day")}</span>
                      {d.enabled ? (
                        <span className="text-sm text-slate-600">{d.start ?? "09:00"} – {d.end ?? "17:00"}</span>
                      ) : (
                        <SupplierStatusBadge tone="slate">Closed</SupplierStatusBadge>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </SupplierCard>
          )}
        </>
      )}
    </div>
  )
}

function Row({ label, children, stacked }: { label: string; children: React.ReactNode; stacked?: boolean }) {
  return (
    <div className={stacked ? "flex flex-col gap-1.5" : "flex items-start justify-between gap-3"}>
      <dt className="text-sm text-slate-500 shrink-0">{label}</dt>
      <dd className={stacked ? "" : "text-right min-w-0"}>{children}</dd>
    </div>
  )
}
