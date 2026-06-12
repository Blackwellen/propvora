import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import PublicNav from "./PublicNav"
import PublicFooter from "./PublicFooter"

interface LegalLayoutProps {
  title: string
  lastUpdated: string
  children: React.ReactNode
}

export default function LegalLayout({ title, lastUpdated, children }: LegalLayoutProps) {
  return (
    <div className="min-h-screen bg-white">
      <PublicNav />

      <div className="pt-24 pb-16">
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
          </div>
        </div>

        {/* Content */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="prose prose-slate max-w-none legal-prose">
            {children}
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  )
}
