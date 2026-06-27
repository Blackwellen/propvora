"use client"

import Link from "next/link"
import {
  Phone, Search, MessagesSquare, Flag, CheckCircle2, BookOpen, Calendar, CreditCard, Home,
  Eye, FileText, Building2, Scale, Shield, User, Clock, Mail,
  AlertTriangle, ArrowRight,
} from "lucide-react"

const KPIS = [
  { id: "guides", label: "Help articles", value: "40+", sub: "Across 11 categories", icon: BookOpen, bg: "bg-violet-50 text-violet-600" },
  { id: "resolved", label: "Typical reply time", value: "24h", sub: "Via support@propvora.com", icon: CheckCircle2, bg: "bg-emerald-50 text-emerald-600" },
  { id: "safety", label: "Emergency contact", value: "Always here", sub: "support@propvora.com", icon: Mail, bg: "bg-rose-50 text-rose-600" },
]

const CATEGORIES: { label: string; icon: typeof Calendar; href: string }[] = [
  { label: "Bookings", icon: Calendar, href: "/help#marketplace--bookings" },
  { label: "Payments", icon: CreditCard, href: "/help#money--billing" },
  { label: "Lets", icon: Home, href: "/help#getting-started" },
  { label: "Viewings", icon: Eye, href: "/help#getting-started" },
  { label: "Applications", icon: FileText, href: "/help#getting-started" },
  { label: "Tenancy", icon: Building2, href: "/help#portfolio--properties" },
  { label: "Disputes", icon: Scale, href: "/contact" },
  { label: "Safety", icon: Shield, href: "/contact" },
  { label: "Account", icon: User, href: "/help#account--security" },
]

const TOP_ARTICLES = [
  { title: "How payments and refunds work", href: "/help#money--billing", meta: "5 min read" },
  { title: "How to manage your bookings", href: "/help#marketplace--bookings", meta: "4 min read" },
  { title: "Security deposits: what you need to know", href: "/help#marketplace--bookings", meta: "6 min read" },
  { title: "Getting started on Propvora", href: "/help#getting-started", meta: "3 min read" },
]

export default function HelpClient() {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-bold text-slate-900">Help centre</h1>
          <p className="text-[13.5px] text-slate-500 mt-1">Find answers, browse guides and get support — we&apos;re here to help.</p>
        </div>
        <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-3 flex items-center gap-3">
          <span className="w-9 h-9 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
            <Phone className="w-4 h-4" />
          </span>
          <div>
            <p className="text-[12.5px] font-semibold text-rose-600">Emergency assistance</p>
            <p className="text-[11px] text-slate-500">For urgent issues that need immediate help.</p>
            <p className="text-[12px] text-slate-700 mt-0.5">
              <Clock className="w-3 h-3 inline" />{" "}
              <a href="mailto:support@propvora.com" className="font-bold text-rose-600 hover:underline">support@propvora.com</a>
              <span className="text-[10px] bg-rose-50 text-rose-500 rounded px-1 ml-1">Reply within 24h</span>
            </p>
          </div>
        </div>
      </div>

      {/* Search — links to public help centre */}
      <Link
        href="/help"
        className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-3 text-[13px] text-slate-400 hover:border-[var(--color-brand-300)] hover:text-slate-500 transition-colors shadow-sm"
        aria-label="Browse help articles"
      >
        <Search className="w-4 h-4 shrink-0" />
        <span>Search help topics, articles and guides…</span>
        <ArrowRight className="w-4 h-4 ml-auto text-[var(--brand)] shrink-0" />
      </Link>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {KPIS.map((k) => {
          const Icon = k.icon
          return (
            <div key={k.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${k.bg}`}>
                <Icon className="w-[18px] h-[18px]" />
              </span>
              <p className="text-[20px] font-bold text-slate-900 mt-3 leading-none">{k.value}</p>
              <p className="text-[12px] font-medium text-slate-500 mt-1">{k.label}</p>
              <p className="text-[11px] mt-0.5 font-semibold text-slate-400">{k.sub}</p>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5 items-start">
        <div className="space-y-5">
          {/* Categories */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[15px] font-bold text-slate-900">Browse help by category</h3>
              <Link href="/help" className="text-[12px] font-semibold text-[var(--brand)] hover:underline">
                See all articles →
              </Link>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-3">
              {CATEGORIES.map((c) => {
                const Icon = c.icon
                return (
                  <Link
                    key={c.label}
                    href={c.href}
                    className="flex flex-col items-center gap-2 group"
                    aria-label={`${c.label} help articles`}
                  >
                    <span className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-500 group-hover:bg-[var(--brand-soft)] group-hover:text-[var(--brand)] transition-colors">
                      <Icon className="w-5 h-5" />
                    </span>
                    <span className="text-[11px] font-medium text-slate-600">{c.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Bottom info cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Top articles */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[13px] font-bold text-slate-900">Top help articles</p>
                <Link href="/help" className="text-[11px] font-semibold text-[var(--brand)] hover:underline">
                  View all →
                </Link>
              </div>
              {TOP_ARTICLES.map(({ title, href, meta }) => (
                <Link key={title} href={href} className="flex gap-2 py-1.5 group">
                  <FileText className="w-4 h-4 text-[var(--brand)] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[12px] font-medium text-slate-700 group-hover:text-[var(--brand)]">{title}</p>
                    <p className="text-[10.5px] text-slate-400">{meta}</p>
                  </div>
                </Link>
              ))}
            </div>

            {/* Dispute resolution */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <Scale className="w-5 h-5 text-violet-500" />
              <p className="text-[13px] font-bold text-slate-900 mt-1.5">Dispute resolution</p>
              <p className="text-[11px] text-slate-500 mb-2">We help resolve issues fairly and transparently.</p>
              {[
                { t: "Report a dispute", s: "Contact our support team", href: "/contact" },
                { t: "Resolution process", s: "How our process works", href: "/help" },
              ].map(({ t, s, href }) => (
                <Link key={t} href={href} className="flex gap-2 py-1.5 group">
                  <Flag className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[12px] font-medium text-slate-700 group-hover:text-[var(--brand)]">{t}</p>
                    <p className="text-[10.5px] text-slate-400">{s}</p>
                  </div>
                </Link>
              ))}
              <Link
                href="/contact"
                className="mt-2 w-full inline-flex items-center justify-center border border-slate-200 rounded-xl py-1.5 text-[12px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Contact support →
              </Link>
            </div>

            {/* Emergency & safety */}
            <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-4">
              <Shield className="w-5 h-5 text-rose-500" />
              <p className="text-[13px] font-bold text-slate-900 mt-1.5">Emergency &amp; safety</p>
              <p className="text-[11px] text-slate-500 mb-2">For urgent matters and safety concerns.</p>
              {[
                { t: "Email support", s: "Reply within 24 hours" },
                { t: "Report safety issue", s: "Contact us immediately" },
              ].map(({ t, s }) => (
                <div key={t} className="flex gap-2 py-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[12px] font-medium text-slate-700">{t}</p>
                    <p className="text-[10.5px] text-slate-400">{s}</p>
                  </div>
                </div>
              ))}
              <a
                href="mailto:support@propvora.com"
                className="mt-2 w-full inline-flex items-center justify-center gap-1.5 border border-rose-200 text-rose-600 rounded-xl py-1.5 text-[12px] font-semibold hover:bg-rose-50 transition-colors"
              >
                <Mail className="w-3.5 h-3.5" /> Email emergency line
              </a>
            </div>
          </div>

          {/* Still need help */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
            <div className="flex items-center gap-2">
              <span className="w-9 h-9 rounded-lg bg-[var(--brand-soft)] text-[var(--brand)] flex items-center justify-center shrink-0">
                <MessagesSquare className="w-4 h-4" />
              </span>
              <div>
                <p className="text-[12.5px] font-bold text-slate-800">Still need help?</p>
                <p className="text-[10.5px] text-slate-400">Our team is ready to help.</p>
                <Link
                  href="/contact"
                  className="mt-1 inline-flex items-center gap-1 bg-[#0D1B2A] text-white rounded-lg px-2.5 py-1 text-[11px] font-semibold hover:opacity-90 transition-opacity"
                >
                  Contact us
                </Link>
              </div>
            </div>
            <ContactCard icon={Mail} title="Email support" lines={["support@propvora.com", "Reply within 24h"]} />
            <ContactCard icon={Mail} title="Email support" lines={["support@propvora.com", "Response within 24h"]} />
          </div>
        </div>

        {/* Right rail */}
        <aside className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sticky top-[84px]">
          <h3 className="text-[14px] font-bold text-slate-900 mb-3">Quick links</h3>
          <div className="space-y-2">
            <Link
              href="/help"
              className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
            >
              <BookOpen className="w-4 h-4 text-[var(--brand)] shrink-0" />
              <span className="text-[12.5px] font-medium text-slate-700 group-hover:text-[var(--brand)]">Browse all help articles</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 ml-auto" />
            </Link>
            <Link
              href="/contact"
              className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
            >
              <Mail className="w-4 h-4 text-[var(--brand)] shrink-0" />
              <span className="text-[12.5px] font-medium text-slate-700 group-hover:text-[var(--brand)]">Contact support team</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 ml-auto" />
            </Link>
            <Link
              href="/legal"
              className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
            >
              <Scale className="w-4 h-4 text-[var(--brand)] shrink-0" />
              <span className="text-[12.5px] font-medium text-slate-700 group-hover:text-[var(--brand)]">Policies &amp; legal</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 ml-auto" />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  )
}

function ContactCard({ icon: Icon, title, lines }: { icon: typeof Phone; title: string; lines: string[] }) {
  return (
    <div className="flex items-start gap-2">
      <span className="w-8 h-8 rounded-lg bg-slate-50 text-slate-500 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4" />
      </span>
      <div>
        <p className="text-[12px] font-semibold text-slate-800">{title}</p>
        {lines.map((l) => (
          <p key={l} className="text-[10.5px] text-slate-400">{l}</p>
        ))}
      </div>
    </div>
  )
}
