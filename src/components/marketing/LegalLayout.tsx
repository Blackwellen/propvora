import Link from "next/link"
import { ArrowLeft, Info } from "lucide-react"
import PublicNav from "./PublicNav"
import PublicFooter from "./PublicFooter"

interface LegalLayoutProps {
  title: string
  lastUpdated: string
  children: React.ReactNode
  /**
   * Shows a "review with legal counsel before publishing" notice above the
   * content. These documents are now published, so this defaults to false;
   * pass `reviewNotice` explicitly to re-flag a page that is being revised.
   */
  reviewNotice?: boolean
}

export default function LegalLayout({
  title,
  lastUpdated,
  children,
  reviewNotice = false,
}: LegalLayoutProps) {
  return (
    <div className="min-h-screen bg-white">
      <PublicNav />

      <main id="main-content" tabIndex={-1} className="focus:outline-none pt-24 pb-16">
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-200 py-12">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link
              href="/legal"
              className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Legal
            </Link>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">{title}</h1>
            <p className="text-slate-500 text-sm">Last updated: {lastUpdated}</p>
            <p className="text-slate-400 text-xs mt-1">
              Blackwellen Ltd (Company No. 16482166 · ICO Registration ZC160806) trading as Propvora
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {reviewNotice && (
            <div className="mb-10 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-900 leading-relaxed">
                <strong className="font-semibold">Draft for review.</strong> This document is
                provided for transparency and should be reviewed with qualified legal counsel before
                being relied upon or published as final.
              </p>
            </div>
          )}
          <div className="prose prose-slate max-w-none legal-prose">{children}</div>
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}
