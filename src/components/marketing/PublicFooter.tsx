import Link from "next/link"
import Image from "next/image"
import { Mail, MapPin } from "lucide-react"
import CookiePreferencesLink from "@/components/consent/CookiePreferencesLink"
import NewsletterSignup from "@/components/marketing/NewsletterSignup"
import { getServerLocale, t } from "@/lib/i18n"
import FooterProductLinks from "@/components/marketing/FooterProductLinks"

const footerLinks = {
  product: [
    { label: "Stays", href: "/stays", mk: true },
    { label: "Suppliers & Services", href: "/services", mk: true },
    { label: "Features", href: "/features" },
    { label: "Pricing", href: "/pricing" },
    { label: "Partner Programme", href: "/affiliate-programme" },
    { label: "Affiliate Login", href: "/affiliate-login" },
    { label: "Help Centre", href: "/help" },
  ] as { label: string; href: string; mk?: boolean }[],
  company: [
    { label: "About", href: "/about" },
    { label: "Roadmap", href: "/roadmap" },
    { label: "Contact", href: "/contact" },
    { label: "Blackwellen", href: "https://blackwellen.com", external: true },
  ] as { label: string; href: string; external?: boolean }[],
  legal: [
    { label: "Terms of Service", href: "/legal/terms" },
    { label: "Privacy Policy", href: "/legal/privacy" },
    { label: "Acceptable Use", href: "/legal/acceptable-use" },
    { label: "All policies", href: "/legal" },
  ],
}

export default async function PublicFooter() {
  const locale = await getServerLocale()
  const tr = (k: string) => t(locale, `marketing.${k}`)
  return (
    <footer className="bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        {/* Newsletter signup — explicit consent + double opt-in */}
        <div className="mb-12 rounded-2xl border border-slate-200 bg-slate-50/60 p-6 sm:p-8">
          <NewsletterSignup className="max-w-2xl" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block mb-4">
              <Image
                src="/propvora-logo-dark.png"
                alt="Propvora"
                width={480}
                height={120}
                className="h-10 w-auto"
              />
            </Link>
            <p className="text-slate-500 text-sm leading-relaxed max-w-xs mb-6">
              {tr("footerTagline")}
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <MapPin className="h-4 w-4 text-sky-500 flex-shrink-0" />
                <span>{tr("footerLocation")}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <Mail className="h-4 w-4 text-sky-500 flex-shrink-0" />
                <a href="mailto:info@propvora.com" className="hover:text-slate-900 transition-colors">
                  info@propvora.com
                </a>
              </div>
            </div>
          </div>

          {/* Product links */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">{tr("footerProduct")}</h3>
            <FooterProductLinks links={footerLinks.product} />
          </div>

          {/* Company links */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">{tr("footerCompany")}</h3>
            <ul className="space-y-2.5">
              {footerLinks.company.map((link) =>
                link.external ? (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ) : (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </div>

          {/* Legal links */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">{tr("footerLegalCol")}</h3>
            <ul className="space-y-2.5">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <CookiePreferencesLink />
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-400 text-sm">
            © 2026{" "}
            <a
              href="https://blackwellen.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-700 transition-colors"
            >
              Blackwellen Ltd
            </a>
            , trading as Propvora. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <span className="text-slate-400 text-xs">Reg. England &amp; Wales No. 16482166</span>
            <span className="text-slate-300">·</span>
            <span className="text-slate-400 text-xs">ICO ZC160806</span>
            <span className="text-slate-300">·</span>
            <span className="text-slate-400 text-xs">{tr("footerGdpr")}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
