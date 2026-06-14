import Link from "next/link"
import { MailX } from "lucide-react"

export const metadata = { title: "Unsubscribed | Propvora", robots: { index: false } }

export default function NewsletterUnsubscribedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50">
      <div className="w-full max-w-md text-center bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 border border-slate-200 mb-5">
          <MailX className="h-7 w-7 text-slate-500" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">You&apos;ve been unsubscribed</h1>
        <p className="mt-2 text-sm text-slate-500">
          You won&apos;t receive any more marketing emails from Propvora. Essential service emails (e.g.
          billing or security) may still be sent where required. Changed your mind? You can re-subscribe
          from our site footer.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center justify-center h-10 px-5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-semibold transition-colors"
        >
          Back to Propvora
        </Link>
      </div>
    </div>
  )
}
