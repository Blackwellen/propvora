import Link from "next/link"
import Image from "next/image"
import { Mail, MapPin } from "lucide-react"

const footerLinks = {
  product: [
    { label: "Features", href: "/features" },
    { label: "Pricing", href: "/pricing" },
    { label: "Product walkthrough", href: "/walkthrough" },
    { label: "Partner Programme", href: "/affiliate-programme" },
    { label: "Help Centre", href: "/help" },
    { label: "FAQ", href: "/faq" },
  ],
  company: [
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Help Centre", href: "/help" },
    { label: "Legal", href: "/legal" },
  ],
  legal: [
    { label: "Terms of Service", href: "/legal/terms" },
    { label: "Privacy Policy", href: "/legal/privacy" },
    { label: "Cookie Policy", href: "/legal/cookies" },
    { label: "Acceptable Use", href: "/legal/acceptable-use" },
    { label: "Data Processing", href: "/legal/data-processing" },
    { label: "Affiliate Terms", href: "/affiliate-programme/terms" },
    { label: "AI Disclaimer", href: "/legal/ai-disclaimer" },
  ],
}

export default function PublicFooter() {
  return (
    <footer className="bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
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
              The command centre for serious property operators. Portfolio, work, planning, contacts and money — all in one premium platform.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <MapPin className="h-4 w-4 text-sky-500 flex-shrink-0" />
                <span>Built for UK property operators</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <Mail className="h-4 w-4 text-sky-500 flex-shrink-0" />
                <a href="mailto:hello@propvora.com" className="hover:text-slate-900 transition-colors">
                  hello@propvora.com
                </a>
              </div>
            </div>
          </div>

          {/* Product links */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Product</h3>
            <ul className="space-y-2.5">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Company</h3>
            <ul className="space-y-2.5">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal links */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Legal</h3>
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
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-400 text-sm">
            © 2026 Propvora Ltd. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-slate-400 text-xs">Registered in England & Wales</span>
            <span className="text-slate-300">·</span>
            <span className="text-slate-400 text-xs">ICO Registered</span>
            <span className="text-slate-300">·</span>
            <span className="text-slate-400 text-xs">GDPR Compliant</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
