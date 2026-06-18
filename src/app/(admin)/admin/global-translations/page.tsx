import React from "react"
import Link from "next/link"
import {
  Languages,
  Globe2,
  CheckCircle2,
  Clock,
  BookOpen,
  Bot,
  Upload,
  FileText,
  Layers,
} from "lucide-react"
import {
  AdminPageHeader,
  AdminKpiStrip,
  AdminCard,
  AdminSectionCard,
  AdminTable,
  AdminStatusChip,
  AdminEmptyState,
  AdminNotConfigured,
  AdminRightRail,
  AdminButtonLink,
  AdminTabs,
  AdminSearchInput,
  type AdminKpi,
} from "@/components/admin/ui"
import { getTranslationOverview } from "@/lib/admin/pages/batch5"

export const dynamic = "force-dynamic"

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "keys", label: "Keys" },
  { key: "locales", label: "Locales" },
  { key: "review", label: "Review" },
  { key: "glossary", label: "Glossary" },
  { key: "imports", label: "Imports" },
]

function statusTone(status: string) {
  switch (status) {
    case "approved": return "emerald" as const
    case "pending_review": return "amber" as const
    case "machine": return "violet" as const
    case "missing": return "red" as const
    default: return "slate" as const
  }
}

function statusLabel(status: string) {
  switch (status) {
    case "approved": return "Approved"
    case "pending_review": return "In review"
    case "machine": return "Machine"
    case "missing": return "Missing"
    default: return status
  }
}

function fmtDate(d: string | null) {
  return d ? new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"
}

function relAge(d: string | null) {
  if (!d) return "never"
  const mins = Math.max(0, Math.round((Date.now() - new Date(d).getTime()) / 60000))
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 48) return `${hrs} hr ago`
  return `${Math.round(hrs / 24)} d ago`
}

export default async function AdminGlobalTranslationsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string }>
}) {
  const sp = await searchParams
  const tab = sp.tab && TABS.some((t) => t.key === sp.tab) ? sp.tab : "overview"
  const q = (sp.q ?? "").trim().toLowerCase()

  const data = await getTranslationOverview()
  const { totals, locales, strings, glossary, namespaces } = data

  const reviewableLocales = locales.filter((l) => !l.isSource)
  const avgCompleteness = reviewableLocales.length
    ? Math.round(reviewableLocales.reduce((s, l) => s + l.completeness, 0) / reviewableLocales.length)
    : 0

  const kpis: AdminKpi[] = [
    { label: "Supported locales", value: totals.locales, icon: Globe2, tone: "blue" },
    { label: "Source keys", value: totals.sourceKeys.toLocaleString("en-GB"), icon: Layers, tone: "sky" },
    { label: "Translated values", value: totals.translatedValues.toLocaleString("en-GB"), icon: Languages, tone: "violet" },
    { label: "Avg completeness", value: `${avgCompleteness}%`, icon: CheckCircle2, tone: "emerald" },
    { label: "In review queue", value: totals.pendingReview, icon: Clock, tone: totals.pendingReview > 0 ? "amber" : "emerald" },
    { label: "Last import", value: relAge(totals.lastImportAt), icon: Upload, tone: "slate" },
  ]

  const filteredStrings = strings.filter((s) => {
    if (q && !(`${s.namespace} ${s.key} ${s.sourceText} ${s.translatedText ?? ""}`.toLowerCase().includes(q))) return false
    if (tab === "review") return s.status === "pending_review" || s.status === "machine"
    return true
  })

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Global translations"
        subtitle="en-GB is the source catalogue. Every other locale is machine-seeded and must be reviewed before it is shown to users."
        icon={Languages}
        actions={
          <>
            <AdminButtonLink href="?tab=imports" icon={Upload} variant="secondary">Import / export</AdminButtonLink>
            <AdminButtonLink href="?tab=review" icon={Bot} variant="primary">Review queue</AdminButtonLink>
          </>
        }
      />

      <AdminKpiStrip kpis={kpis} cols={6} />

      <AdminTabs
        tabs={TABS.map((t) => ({
          ...t,
          href: `?tab=${t.key}`,
          count: t.key === "review" ? totals.pendingReview : t.key === "glossary" ? glossary.length : undefined,
        }))}
        activeKey={tab}
      />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5">
        <div className="space-y-5 min-w-0">
          {/* Strings table (Overview / Keys / Review tabs) */}
          {(tab === "overview" || tab === "keys" || tab === "review") && (
            <AdminSectionCard
              title={tab === "review" ? "Strings awaiting review" : "Translation strings"}
              icon={FileText}
              actions={<div className="w-56"><AdminSearchInput placeholder="Search keys or text…" /></div>}
            >
              {!data.available ? (
                <AdminNotConfigured
                  title="Translation store not provisioned"
                  description="The intl_translation_strings table is not present yet. Locale coverage below is listed from the supported-locale config; once the store is migrated and seeded, per-key values appear here."
                />
              ) : filteredStrings.length === 0 ? (
                <AdminEmptyState
                  icon={Languages}
                  title={q ? "No matching strings" : tab === "review" ? "Review queue is clear" : "No strings yet"}
                  description={q ? "Try a different namespace, key or text fragment." : tab === "review" ? "Every machine-translated value has been reviewed and approved." : "Seed the catalogue to populate translation keys."}
                />
              ) : (
                <AdminTable
                  minWidth={760}
                  head={[
                    { label: "Key" },
                    { label: "Source (en-GB)" },
                    { label: "Locale" },
                    { label: "Translation" },
                    { label: "Status" },
                    { label: "Updated", align: "right" },
                  ]}
                >
                  {filteredStrings.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-2.5">
                        <p className="font-mono text-[11px] text-slate-500">{s.namespace}</p>
                        <p className="font-mono text-[12px] font-medium text-[#0B1B3F] truncate max-w-[180px]">{s.key}</p>
                      </td>
                      <td className="px-4 py-2.5 text-slate-600 max-w-[220px] truncate">{s.sourceText}</td>
                      <td className="px-4 py-2.5"><AdminStatusChip tone="slate">{s.locale}</AdminStatusChip></td>
                      <td className="px-4 py-2.5 text-slate-700 max-w-[220px] truncate">{s.translatedText ?? <span className="text-slate-300">—</span>}</td>
                      <td className="px-4 py-2.5"><AdminStatusChip tone={statusTone(s.status)} dot>{statusLabel(s.status)}</AdminStatusChip></td>
                      <td className="px-4 py-2.5 text-right text-[11px] text-slate-400 whitespace-nowrap">{fmtDate(s.updatedAt)}</td>
                    </tr>
                  ))}
                </AdminTable>
              )}
            </AdminSectionCard>
          )}

          {/* Locales tab */}
          {tab === "locales" && (
            <AdminSectionCard title="Locale coverage" icon={Globe2}>
              <AdminTable
                minWidth={680}
                head={[
                  { label: "Locale" },
                  { label: "Approved", align: "right" },
                  { label: "In review", align: "right" },
                  { label: "Completeness", align: "right" },
                  { label: "State" },
                ]}
              >
                {locales.map((l) => (
                  <tr key={l.locale} className="hover:bg-slate-50/70">
                    <td className="px-4 py-2.5">
                      <p className="text-[13px] font-medium text-[#0B1B3F]">{l.label}</p>
                      <p className="font-mono text-[11px] text-slate-400">{l.locale}</p>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">{l.approvedKeys.toLocaleString("en-GB")}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-500">{l.pendingReviewKeys.toLocaleString("en-GB")}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-24 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full rounded-full bg-[#2563EB]" style={{ width: `${l.completeness}%` }} />
                        </div>
                        <span className="tabular-nums text-[12px] font-semibold text-[#0B1B3F] w-9 text-right">{l.completeness}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      {l.isSource ? <AdminStatusChip tone="blue">Source</AdminStatusChip>
                        : l.completeness >= 100 ? <AdminStatusChip tone="emerald" dot>Live</AdminStatusChip>
                        : l.completeness > 0 ? <AdminStatusChip tone="amber" dot>Partial</AdminStatusChip>
                        : <AdminStatusChip tone="slate" dot>Seeded</AdminStatusChip>}
                    </td>
                  </tr>
                ))}
              </AdminTable>
            </AdminSectionCard>
          )}

          {/* Glossary tab */}
          {tab === "glossary" && (
            <AdminSectionCard title="Glossary & do-not-translate terms" icon={BookOpen}>
              {glossary.length === 0 ? (
                <AdminEmptyState
                  icon={BookOpen}
                  title="No glossary terms"
                  description="Brand names and protected terms added to the glossary are preserved across machine translation and shown to reviewers."
                />
              ) : (
                <ul className="divide-y divide-[#F1F5FB]">
                  {glossary.map((g) => (
                    <li key={g.id} className="flex items-start justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-[#0B1B3F]">{g.term}</p>
                        {g.definition && <p className="text-[12px] text-slate-500 mt-0.5">{g.definition}</p>}
                      </div>
                      {g.doNotTranslate && <AdminStatusChip tone="violet">Do not translate</AdminStatusChip>}
                    </li>
                  ))}
                </ul>
              )}
            </AdminSectionCard>
          )}

          {/* Imports tab */}
          {tab === "imports" && (
            <AdminSectionCard title="Imports & exports" icon={Upload}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-[#E2EAF6] p-4">
                  <p className="text-[13px] font-semibold text-[#0B1B3F]">Export catalogue</p>
                  <p className="text-[12px] text-slate-500 mt-1">Download the source catalogue and per-locale values as JSON for offline translation.</p>
                  <div className="mt-3 flex gap-2">
                    <AdminButtonLink href="/admin/global" icon={FileText} variant="secondary">Global control plane</AdminButtonLink>
                  </div>
                </div>
                <div className="rounded-xl border border-dashed border-[#CBD9EE] bg-[#F8FBFF] p-4">
                  <p className="text-[13px] font-semibold text-[#0B1B3F]">Last import</p>
                  <p className="text-[12px] text-slate-500 mt-1">{totals.lastImportAt ? `Most recent update ${fmtDate(totals.lastImportAt)}.` : "No imports recorded yet."}</p>
                </div>
              </div>
              <p className="mt-3 text-[11px] text-slate-400">Imports are processed through the international control plane and audited. Machine-translated values land in the review queue, never live, until approved.</p>
            </AdminSectionCard>
          )}

          {/* Namespaces (overview footer) */}
          {tab === "overview" && (
            <AdminSectionCard title="Namespaces" icon={Layers}>
              {namespaces.length === 0 ? (
                <p className="text-[13px] text-slate-400 py-2">No translation namespaces provisioned.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {namespaces.map((n) => (
                    <span key={n.id} className="inline-flex items-center gap-1.5 rounded-full border border-[#E2EAF6] bg-[#FAFCFF] px-2.5 py-1 text-[12px] text-slate-600">
                      <span className="font-mono text-[11px] text-slate-400">{n.id}</span>
                      {n.description && <span className="text-slate-500">· {n.description}</span>}
                    </span>
                  ))}
                </div>
              )}
            </AdminSectionCard>
          )}
        </div>

        {/* Right rail — completeness + MT queue + glossary preview */}
        <AdminRightRail>
          <AdminCard>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[14px] font-semibold text-[#0B1B3F]">Completeness</h3>
              <Link href="?tab=locales" className="text-[12px] font-semibold text-[#2563EB] hover:text-[#1d4ed8]">View all</Link>
            </div>
            <ul className="space-y-2.5">
              {locales.filter((l) => !l.isSource).slice(0, 10).map((l) => (
                <li key={l.locale}>
                  <div className="flex items-center justify-between text-[12px] mb-1">
                    <span className="text-slate-600 truncate">{l.label}</span>
                    <span className="tabular-nums font-semibold text-[#0B1B3F]">{l.completeness}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-[#2563EB]" style={{ width: `${l.completeness}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </AdminCard>

          <AdminSectionCard title="Machine translation queue" icon={Bot} actions={<AdminStatusChip tone={totals.pendingReview > 0 ? "amber" : "emerald"}>{totals.pendingReview}</AdminStatusChip>}>
            {totals.pendingReview === 0 ? (
              <p className="text-[13px] text-slate-400 py-1">No machine translations awaiting review.</p>
            ) : (
              <p className="text-[13px] text-slate-600">{totals.pendingReview.toLocaleString("en-GB")} machine-translated value{totals.pendingReview === 1 ? "" : "s"} pending human review before going live.</p>
            )}
            <div className="mt-3"><AdminButtonLink href="?tab=review" variant="secondary">Open review queue</AdminButtonLink></div>
          </AdminSectionCard>

          <AdminSectionCard title="Glossary" icon={BookOpen} actions={<Link href="?tab=glossary" className="text-[12px] font-semibold text-[#2563EB] hover:text-[#1d4ed8]">View all</Link>}>
            {glossary.length === 0 ? (
              <p className="text-[13px] text-slate-400 py-1">No protected terms yet.</p>
            ) : (
              <ul className="space-y-2">
                {glossary.slice(0, 5).map((g) => (
                  <li key={g.id} className="flex items-center justify-between gap-2">
                    <span className="text-[13px] text-slate-700 truncate">{g.term}</span>
                    {g.doNotTranslate && <AdminStatusChip tone="violet">DNT</AdminStatusChip>}
                  </li>
                ))}
              </ul>
            )}
          </AdminSectionCard>
        </AdminRightRail>
      </div>
    </div>
  )
}
