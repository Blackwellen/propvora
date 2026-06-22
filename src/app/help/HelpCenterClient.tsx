"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  Search, BookOpen, ChevronDown, LifeBuoy, Mail, Clock, PlayCircle, ArrowRight,
} from "lucide-react"
import { type HelpArticle, articleText } from "./help-data"

export default function HelpCenterClient({
  articles,
  source,
}: {
  articles: HelpArticle[]
  source: "live" | "static"
}) {
  const [query, setQuery] = useState("")
  const [openId, setOpenId] = useState<string | null>(null)
  const [activeCat, setActiveCat] = useState<string | null>(null)
  // Public feature flags — flagged articles (automations / marketplace / i18n)
  // are hidden only when their flag is EXPLICITLY disabled.
  const [flags, setFlags] = useState<Record<string, boolean> | null>(null)

  useEffect(() => {
    let on = true
    fetch("/api/flags/public")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (on && d) setFlags(d as Record<string, boolean>) })
      .catch(() => {})
    return () => { on = false }
  }, [])

  // Drop flagged articles when the flag is explicitly false.
  const visibleArticles = useMemo(
    () => articles.filter((a) => !a.flag || flags?.[a.flag] !== false),
    [articles, flags]
  )

  const categories = useMemo(() => {
    const seen: string[] = []
    for (const a of visibleArticles) if (!seen.includes(a.category)) seen.push(a.category)
    return seen
  }, [visibleArticles])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = visibleArticles
    if (activeCat) list = list.filter((a) => a.category === activeCat)
    if (q) list = list.filter((a) => articleText(a).includes(q))
    return list
  }, [visibleArticles, query, activeCat])

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
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-white focus:outline-none">
      {/* Hero with search */}
      <section className="border-b border-slate-200 bg-gradient-to-b from-slate-50 to-white pt-32 pb-14">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#0EA5E9] shadow-lg shadow-blue-200">
            <LifeBuoy className="h-8 w-8 text-white" />
          </div>
          <h1 className="mb-3 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            How can we help?
          </h1>
          <p className="mb-8 text-lg text-slate-500">
            Step-by-step guides for getting started and running everything on Propvora.
          </p>

          <div className="relative mx-auto max-w-xl">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search guides…"
              aria-label="Search help articles"
              className="h-13 w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-slate-900 shadow-sm transition-all placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          {query.trim() && (
            <p className="mt-3 text-sm text-slate-500">
              {filtered.length} result{filtered.length === 1 ? "" : "s"} for &ldquo;{query.trim()}&rdquo;
            </p>
          )}
        </div>
      </section>

      {/* Category filter chips */}
      <section className="sticky top-16 z-30 border-b border-slate-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-2 overflow-x-auto px-4 py-3 sm:px-6 lg:px-8 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          <button
            onClick={() => setActiveCat(null)}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors ${activeCat === null ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCat(c === activeCat ? null : c)}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] font-medium whitespace-nowrap transition-colors ${activeCat === c ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
            >
              {c}
            </button>
          ))}
        </div>
      </section>

      {/* Articles */}
      <section className="py-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {grouped.length === 0 ? (
            <div className="py-16 text-center">
              <BookOpen className="mx-auto mb-4 h-10 w-10 text-slate-300" />
              <h2 className="mb-1 text-lg font-bold text-slate-900">No guides found</h2>
              <p className="mb-6 text-slate-500">We couldn&apos;t find anything matching your search.</p>
              <a
                href="mailto:support@propvora.com"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                <Mail className="h-4 w-4" /> Email support
              </a>
            </div>
          ) : (
            <div className="space-y-12">
              {grouped.map((group) => (
                <div key={group.category}>
                  <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-400">{group.category}</h2>
                  <div className="grid grid-cols-1 gap-3">
                    {group.items.map((a) => {
                      const open = openId === a.id
                      return (
                        <div key={a.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition-shadow hover:shadow-[0_8px_24px_-16px_rgba(15,23,42,0.18)]">
                          <button
                            type="button"
                            onClick={() => setOpenId(open ? null : a.id)}
                            aria-expanded={open}
                            className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50"
                          >
                            <span className="min-w-0">
                              <span className="block font-bold text-slate-900">{a.title}</span>
                              <span className="mt-0.5 block text-sm text-slate-500">{a.summary}</span>
                              {a.readMins && (
                                <span className="mt-1.5 inline-flex items-center gap-1 text-[11.5px] font-medium text-slate-400">
                                  <Clock className="h-3 w-3" /> {a.readMins} min read
                                </span>
                              )}
                            </span>
                            <ChevronDown className={`mt-1 h-5 w-5 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
                          </button>
                          {open && (
                            <div className="space-y-4 border-t border-slate-100 px-5 pb-6 pt-4">
                              {a.sections.map((s, i) => (
                                <div key={i}>
                                  <h3 className="mb-1 text-[14px] font-bold text-slate-900">{s.heading}</h3>
                                  <p className="text-[14px] leading-relaxed text-slate-600">{s.body}</p>
                                </div>
                              ))}
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

      {/* Walkthroughs */}
      <section className="border-t border-slate-100 bg-slate-50/60 py-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mb-5 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50">
              <PlayCircle className="h-[18px] w-[18px] text-violet-600" />
            </div>
            <h2 className="text-[18px] font-bold text-slate-900">Guided walkthroughs</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { t: "Set up your workspace", d: "From sign-up to your first property in minutes.", href: "/help#getting-started" },
              { t: "Run your first booking", d: "List a stay and take a secure payment end-to-end.", href: "/help#marketplace--bookings" },
              { t: "Stay compliant", d: "Track certificates and never miss a renewal.", href: "/help#compliance" },
            ].map((w) => (
              <Link key={w.t} href={w.href} className="group rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-[#CFE0F7] hover:shadow-[0_10px_28px_-14px_rgba(37,99,235,0.3)]">
                <PlayCircle className="mb-3 h-6 w-6 text-[#2563EB]" />
                <p className="font-semibold text-slate-900">{w.t}</p>
                <p className="mt-1 text-[13px] text-slate-500">{w.d}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-[#2563EB]">
                  Start <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="border-t border-slate-200 bg-white py-16">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h2 className="mb-3 text-2xl font-bold text-slate-900">Still need a hand?</h2>
          <p className="mb-8 text-slate-500">
            Can&apos;t find what you&apos;re looking for? Email our team and we&apos;ll reply within one business day.
          </p>
          <a
            href="mailto:support@propvora.com"
            className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1d4ed8]"
          >
            <Mail className="h-4 w-4" /> support@propvora.com
          </a>
          {source === "static" && (
            <p className="mt-6 text-xs text-slate-400">Showing our built-in guides.</p>
          )}
        </div>
      </section>
    </main>
  )
}
