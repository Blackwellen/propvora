import Link from "next/link"
import { CheckCircle2 } from "lucide-react"

export const metadata = { title: "Subscription confirmed | Propvora", robots: { index: false } }

export default function NewsletterConfirmedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50">
      <div className="w-full max-w-md text-center bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 border border-emerald-100 mb-5">
          <CheckCircle2 className="h-7 w-7 text-emerald-500" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">You&apos;re subscribed</h1>
        <p className="mt-2 text-sm text-slate-500">
          Thanks for confirming — you&apos;ll now receive Propvora product updates. You can unsubscribe at
          any time using the link in any email.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center justify-center h-10 px-5 rounded-xl bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-sm font-semibold transition-colors"
        >
          Back to Propvora
        </Link>
      </div>
    </div>
  )
}
