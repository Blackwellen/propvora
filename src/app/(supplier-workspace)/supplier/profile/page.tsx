"use client"

import { useState } from "react"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"
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
  Star,
  ShieldCheck,
  BadgeCheck,
  Award,
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
import { useSupplierApiUrl, useSupplierWorkspace } from "@/components/supplier-workspace/SupplierWorkspaceContext"
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
 *  editor surfaces an error toast and reverts. The sibling API owns the route.
 *  `workspaceId` is REQUIRED by the route (else 400). */
async function patchProfile(workspaceId: string | null, field: string, val: string) {
  if (!workspaceId) throw new Error("Workspace not ready — please retry in a moment.")
  const res = await fetch("/api/supplier/profile", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ workspaceId, [field]: val }),
  })
  if (!res.ok) throw new Error("Could not save — the profile service isn't available yet.")
}

export default function SupplierProfilePage() {
  const { workspaceId } = useSupplierWorkspace()
  const profile = useSupplierApi<SupplierProfile>(useSupplierApiUrl("/api/supplier/profile"), {
    select: (j) => (j as { profile?: SupplierProfile }).profile ?? (j as SupplierProfile),
  })
  const services = useSupplierApi<SupplierService[]>(useSupplierApiUrl("/api/supplier/services"), {
    select: (j) => (j as { items?: SupplierService[]; services?: SupplierService[] }).items ?? (j as { services?: SupplierService[] }).services ?? (Array.isArray(j) ? (j as SupplierService[]) : []),
  })
  const coverage = useSupplierApi<SupplierCoverageArea[]>(useSupplierApiUrl("/api/supplier/coverage"), {
    select: (j) => (j as { items?: SupplierCoverageArea[]; areas?: SupplierCoverageArea[] }).items ?? (j as { areas?: SupplierCoverageArea[] }).areas ?? (Array.isArray(j) ? (j as SupplierCoverageArea[]) : []),
  })
  const availability = useSupplierApi<SupplierAvailabilityDay[]>(useSupplierApiUrl("/api/supplier/availability"), {
    select: (j) => (j as { items?: SupplierAvailabilityDay[]; days?: SupplierAvailabilityDay[] }).items ?? (j as { days?: SupplierAvailabilityDay[] }).days ?? (Array.isArray(j) ? (j as SupplierAvailabilityDay[]) : []),
  })

  const [tab, setTab] = useState<"preview" | "details" | "services" | "coverage" | "availability">("preview")
  const p = profile.data

  const TABS = [
    { id: "preview" as const, label: "Public preview", icon: Eye },
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

      {profile.loading && (tab === "details" || tab === "preview") ? (
        <SupplierLoadingState rows={5} />
      ) : (
        <>
          {tab === "preview" && (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
              {/* Marketplace-style public card */}
              <SupplierCard className="overflow-hidden">
                <div className="h-28 bg-gradient-to-br from-[#0D1B2A] to-[#1E3A5F]" />
                <div className="px-5 pb-5 -mt-10">
                  <div className="w-20 h-20 rounded-2xl bg-white border-4 border-white shadow-md flex items-center justify-center">
                    <div className="w-full h-full rounded-xl bg-[#0EA5E9] flex items-center justify-center text-white text-xl font-bold">
                      {(p?.business_name ?? "SP").slice(0, 2).toUpperCase()}
                    </div>
                  </div>
                  <div className="mt-3 flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <h2 className="text-xl font-bold text-slate-900">{p?.business_name ?? "Your business name"}</h2>
                      <p className="text-sm text-slate-500">{p?.supplier_type ? humaniseStatus(p.supplier_type) : "Supplier"}{p?.years_experience ? ` · ${p.years_experience} yrs experience` : ""}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span className="text-sm font-semibold text-slate-800">{p?.average_rating?.toFixed(1) ?? "New"}</span>
                      {p?.reviews_count ? <span className="text-xs text-slate-400">({p.reviews_count})</span> : null}
                    </div>
                  </div>
                  {p?.description_short && <p className="mt-3 text-sm font-medium text-slate-700">{p.description_short}</p>}
                  {p?.description_long && <p className="mt-2 text-sm text-slate-500 leading-relaxed">{p.description_long}</p>}
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {(p?.service_categories ?? []).length === 0 ? (
                      <span className="text-sm text-slate-400 italic">Add service categories to appear in marketplace search</span>
                    ) : (
                      (p?.service_categories ?? []).map((c) => <SupplierStatusBadge key={c} tone="blue">{humaniseStatus(c)}</SupplierStatusBadge>)
                    )}
                  </div>
                </div>
              </SupplierCard>

              {/* Trust + stats rail */}
              <div className="space-y-4">
                <SupplierCard className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <h3 className="text-base font-semibold text-slate-900">Trust badges</h3>
                  </div>
                  <ul className="space-y-2">
                    <TrustRow icon={BadgeCheck} label="Identity verified" on={/verified|approved/.test((p?.id_verification_status ?? "").toLowerCase())} />
                    <TrustRow icon={ShieldCheck} label="Insurance on file" on={/valid|verified|active/.test((p?.insurance_status ?? "").toLowerCase())} />
                    <TrustRow icon={Award} label="Licensed trade" on={/valid|verified|active/.test((p?.licence_status ?? "").toLowerCase())} />
                    <TrustRow icon={Store} label="Published to marketplace" on={!!p?.marketplace_enabled} />
                  </ul>
                </SupplierCard>

                <SupplierCard className="p-5">
                  <h3 className="text-base font-semibold text-slate-900 mb-3">At a glance</h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between"><dt className="text-slate-500">Completed jobs</dt><dd className="font-semibold text-slate-800">{p?.completed_jobs_count ?? 0}</dd></div>
                    <div className="flex justify-between"><dt className="text-slate-500">Reviews</dt><dd className="font-semibold text-slate-800">{p?.reviews_count ?? 0}</dd></div>
                    <div className="flex justify-between"><dt className="text-slate-500">Visibility</dt><dd className="font-semibold text-slate-800">{humaniseStatus(p?.profile_visibility ?? "private")}</dd></div>
                  </dl>
                  <Link href="/supplier/marketplace" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:text-[#1d4ed8]">
                    <Store className="w-3.5 h-3.5" /> Manage marketplace listing →
                  </Link>
                </SupplierCard>
              </div>
            </div>
          )}

          {tab === "details" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <SupplierCard className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="w-4 h-4 text-slate-500" />
                  <h2 className="text-base font-semibold text-slate-900">Business details</h2>
                </div>
                <dl className="space-y-3.5">
                  <Row label="Business name">
                    <InlineEditField label="business name" value={p?.business_name ?? ""} onSave={(v) => patchProfile(workspaceId, "business_name", v)} useSheetOnMobile />
                  </Row>
                  <Row label="Trading name">
                    <InlineEditField label="trading name" value={p?.trading_name ?? ""} onSave={(v) => patchProfile(workspaceId, "trading_name", v)} useSheetOnMobile />
                  </Row>
                  <Row label="Supplier type">
                    <InlineEditField label="supplier type" type="select" options={SUPPLIER_TYPES} value={p?.supplier_type ?? ""} onSave={(v) => patchProfile(workspaceId, "supplier_type", v)} useSheetOnMobile />
                  </Row>
                  <Row label="Years experience">
                    <InlineEditField label="years experience" type="number" value={p?.years_experience ?? ""} onSave={(v) => patchProfile(workspaceId, "years_experience", v)} useSheetOnMobile />
                  </Row>
                  <Row label="Team size">
                    <InlineEditField label="team size" type="number" value={p?.team_size ?? ""} onSave={(v) => patchProfile(workspaceId, "team_size", v)} useSheetOnMobile />
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
                      <InlineEditField label="short description" value={p?.description_short ?? ""} onSave={(v) => patchProfile(workspaceId, "description_short", v)} useSheetOnMobile placeholder="One-line headline" />
                    </Row>
                    <Row label="Full description" stacked>
                      <InlineEditField label="full description" type="textarea" value={p?.description_long ?? ""} onSave={(v) => patchProfile(workspaceId, "description_long", v)} useSheetOnMobile placeholder="Tell property managers about your work…" />
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
                      <InlineEditField label="profile visibility" type="select" options={VISIBILITY} value={p?.profile_visibility ?? "private"} onSave={(v) => patchProfile(workspaceId, "profile_visibility", v)} useSheetOnMobile />
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

function TrustRow({ icon: Icon, label, on }: { icon: LucideIcon; label: string; on: boolean }) {
  return (
    <li className="flex items-center gap-2.5">
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${on ? "bg-emerald-50" : "bg-slate-100"}`}>
        <Icon className={`w-4 h-4 ${on ? "text-emerald-600" : "text-slate-300"}`} />
      </div>
      <span className={`text-sm ${on ? "font-medium text-slate-700" : "text-slate-400"}`}>{label}</span>
      {on && <span className="ml-auto text-[11px] font-semibold text-emerald-600">Verified</span>}
    </li>
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
