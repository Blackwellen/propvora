"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Search, BookOpen, ChevronDown, LifeBuoy } from "lucide-react"
import type { HelpArticle } from "./help-data"

export default function HelpCenterClient({
  articles,
  source,
}: {
  articles: HelpArticle[]
  source: "live" | "static"
}) {
  const [query, setQuery] = useState("")
  const [openId, setOpenId] = useState<string | null>(null)

  const categories = useMemo(() => {
    const seen: string[] = []
    for (const a of articles) if (!seen.includes(a.category)) seen.push(a.category)
    return seen
  }, [articles])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return articles
    return articles.filter((a) =>
      [a.title, a.summary, a.body, a.category]
        .join(" ")
        .toLowerCase()
        .includes(q)
    )
  }, [articles, query])

  const grouped = useMemo(() => {
    const map = new Map<string, HelpArticle[]>()
    for (const a of filtered) {
      const list = map.get(a.category) ?? []
      list.push(a)
      map.set(a.category, list)
    }
    return categories
      .map((c) => ({ category: c, items: map.get(c) ?? [] }))
      .filter((g) => g.items.length > 0)
  }, [filtered, categories])

  return (
    <div className="min-h-screen bg-white">
      {/* Hero with search */}
      <section className="pt-32 pb-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-200">
            <LifeBuoy className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
            Help Centre
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed mb-8">
            Guides for getting started and running your operations on Propvora.
          </p>

          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search help articles…"
              aria-label="Search help articles"
              className="w-full h-13 py-3.5 pl-12 pr-4 rounded-2xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
          {query.trim() && (
            <p className="mt-3 text-sm text-slate-500">
              {filtered.length} result{filtered.length === 1 ? "" : "s"} for &ldquo;{query.trim()}&rdquo;
            </p>
          )}
        </div>
      </section>

      {/* Articles */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {grouped.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen className="h-10 w-10 text-slate-300 mx-auto mb-4" />
              <h2 className="text-lg font-bold text-slate-900 mb-1">No articles found</h2>
              <p className="text-slate-500 mb-6">
                We couldn&apos;t find anything matching your search.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors"
              >
                Contact support
              </Link>
            </div>
          ) : (
            <div className="space-y-12">
              {grouped.map((group) => (
                <div key={group.category}>
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">
                    {group.category}
                  </h2>
                  <div className="space-y-3">
                    {group.items.map((a) => {
                      const open = openId === a.id
                      return (
                        <div
                          key={a.id}
                          className="rounded-2xl border border-slate-200 bg-white overflow-hidden"
                        >
                          <button
                            type="button"
                            onClick={() => setOpenId(open ? null : a.id)}
                            aria-expanded={open}
                            className="w-full flex items-start justify-between gap-4 px-5 py-4 text-left hover:bg-slate-50 transition-colors"
                          >
                            <span>
                              <span className="block font-bold text-slate-900">{a.title}</span>
                              <span className="block text-sm text-slate-500 mt-0.5">
                                {a.summary}
                              </span>
                            </span>
                            <ChevronDown
                              className={`h-5 w-5 text-slate-400 shrink-0 mt-1 transition-transform ${
                                open ? "rotate-180" : ""
                              }`}
                            />
                          </button>
                          {open && (
                            <div className="px-5 pb-5 -mt-1">
                              <p className="text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
                                {a.body}
                              </p>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="bg-slate-50 border-t border-slate-200 py-16">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Still need a hand?</h2>
          <p className="text-slate-600 mb-8">
            Browse our full FAQ or get in touch — we reply within one business day.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/faq"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-white/70 transition-colors"
            >
              Read the FAQ
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors"
            >
              Contact support
            </Link>
          </div>
          {source === "static" && (
            <p className="mt-6 text-xs text-slate-400">
              Showing our built-in getting-started guides.
            </p>
          )}
        </div>
      </section>
    </div>
  )
}
