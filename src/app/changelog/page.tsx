import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, Sparkles } from "lucide-react"
import PublicNav from "@/components/marketing/PublicNav"
import PublicFooter from "@/components/marketing/PublicFooter"
import { listPublishedChangelog } from "@/lib/comms/data"
import type { ChangelogEntry } from "@/lib/comms/types"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Changelog | Propvora",
  description:
    "Product updates, new features, improvements and fixes shipped to the Propvora property operations platform.",
  alternates: { canonical: "/changelog" },
  openGraph: {
    title: "Changelog | Propvora",
    description:
      "Product updates, new features, improvements and fixes shipped to the Propvora property operations platform.",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Changelog | Propvora",
    description: "Product updates shipped to the Propvora property operations platform.",
  },
}

const CATEGORY_STYLES: Record<string, string> = {
  Feature: "bg-[#EFF6FF] text-[#2563EB]",
  Improvement: "bg-[#F5F3FF] text-[#6d28d9]",
  Fix: "bg-[#ECFDF5] text-[#059669]",
  Security: "bg-[#FEF2F2] text-[#dc2626]",
  Deprecation: "bg-[#FFFBEB] text-[#d97706]",
}

function categoryClass(c: string | null): string {
  if (!c) return "bg-slate-100 text-slate-700"
  return CATEGORY_STYLES[c] ?? "bg-slate-100 text-slate-700"
}

function formatDate(iso: string | null): string {
  if (!iso) return ""
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
}

/** Group entries by the date they were published (YYYY-MM-DD). */
function groupByDate(entries: ChangelogEntry[]): Array<{ key: string; label: string; items: ChangelogEntry[] }> {
  const groups: Record<string, ChangelogEntry[]> = {}
  for (const e of entries) {
    const stamp = e.publishedAt ?? e.createdAt ?? ""
    const key = stamp.slice(0, 10) || "unknown"
    ;(groups[key] ??= []).push(e)
  }
  return Object.entries(groups)
    .sort((a, b) => (a[0] < b[0] ? 1 : a[0] > b[0] ? -1 : 0))
    .map(([key, items]) => ({
      key,
      label: key === "unknown" ? "Recent" : formatDate(items[0].publishedAt ?? items[0].createdAt),
      items,
    }))
}

export default async function ChangelogPage() {
  const entries = await listPublishedChangelog(200)
  const groups = groupByDate(entries)

  return (
    <div className="min-h-screen bg-white">
      <PublicNav />

      {/* Hero */}
      <section className="pt-32 pb-12 bg-gradient-to-b from-[#EFF6FF] to-white border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#BFDBFE] text-[#2563EB] text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Product updates
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight">Changelog</h1>
          <p className="mt-4 text-lg text-slate-600">
            Everything new in Propvora — features, improvements and fixes, newest first.
          </p>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {groups.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 text-[#2563EB]" />
              </div>
              <p className="text-slate-900 font-semibold">No updates published yet</p>
              <p className="text-sm text-slate-500 mt-1">Check back soon — we ship often.</p>
            </div>
          ) : (
            <div className="space-y-12">
              {groups.map((group) => (
                <div key={group.key} className="relative">
                  <div className="sm:sticky sm:top-24 sm:float-left sm:-ml-44 sm:w-40 sm:text-right mb-3 sm:mb-0">
                    <p className="text-sm font-semibold text-slate-900">{group.label}</p>
                  </div>
                  <div className="space-y-6 sm:border-l sm:border-slate-100 sm:pl-8">
                    {group.items.map((entry) => (
                      <article
                        key={entry.id}
                        className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm"
                      >
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          {entry.category && (
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${categoryClass(entry.category)}`}
                            >
                              {entry.category}
                            </span>
                          )}
                          {entry.version && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-slate-100 text-slate-600">
                              {entry.version}
                            </span>
                          )}
                          {entry.tags.map((t) => (
                            <span
                              key={t}
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-50 text-slate-500 border border-slate-100"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">{entry.title}</h2>
                        {entry.bodyHtml && (
                          <div
                            className="prose prose-slate prose-sm max-w-none mt-3 text-slate-600"
                            // body_html is sanitised server-side on write via sanitizeHtml().
                            dangerouslySetInnerHTML={{ __html: entry.bodyHtml }}
                          />
                        )}
                      </article>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-16 pt-8 border-t border-slate-100">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#2563EB] hover:text-[#1d4ed8]"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to home
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
