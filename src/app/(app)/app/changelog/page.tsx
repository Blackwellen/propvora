import { Sparkles, ExternalLink } from "lucide-react"
import Link from "next/link"
import DOMPurify from "isomorphic-dompurify"
import { listPublishedChangelog } from "@/lib/comms/data"
import type { ChangelogEntry } from "@/lib/comms/types"

export const dynamic = "force-dynamic"

const CATEGORY_STYLES: Record<string, string> = {
  Feature: "bg-[var(--brand-soft)] text-[var(--brand)]",
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

export default async function AppChangelogPage() {
  const entries: ChangelogEntry[] = await listPublishedChangelog(100)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[var(--brand)]" />
            What&apos;s new
          </h1>
          <p className="text-sm text-slate-500">Latest features, improvements and fixes.</p>
        </div>
        <Link
          href="/changelog"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--brand)] hover:text-[var(--brand-strong)]"
        >
          Public page <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {entries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm text-center py-16">
          <div className="w-12 h-12 rounded-2xl bg-[var(--brand-soft)] flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-6 h-6 text-[var(--brand)]" />
          </div>
          <p className="text-slate-900 font-semibold">No updates yet</p>
          <p className="text-sm text-slate-500 mt-1">We&apos;ll post product updates here as they ship.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <article key={entry.id} className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {entry.category && (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${categoryClass(entry.category)}`}>
                    {entry.category}
                  </span>
                )}
                {entry.version && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-slate-100 text-slate-600">
                    {entry.version}
                  </span>
                )}
                <span className="text-xs text-slate-400 ml-auto">{formatDate(entry.publishedAt ?? entry.createdAt)}</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900">{entry.title}</h2>
              {entry.bodyHtml && (
                <div
                  className="prose prose-slate prose-sm max-w-none mt-2 text-slate-600"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(entry.bodyHtml) }}
                />
              )}
              {entry.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {entry.tags.map((t) => (
                    <span key={t} className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-50 text-slate-500 border border-slate-100">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
