import type { Metadata } from "next"
import Image from "next/image"
import { Wrench } from "lucide-react"
import { COMPANY } from "@/lib/legal/company"

export const metadata: Metadata = {
  title: "We'll be right back | Propvora",
  description: "Propvora is undergoing scheduled maintenance and will be back shortly.",
  robots: { index: false, follow: false },
}

export default function MaintenancePage() {
  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg text-center">
        <div className="flex justify-center mb-10">
          <Image
            src="/propvora-logo-dark.png"
            alt="Propvora"
            width={150}
            height={36}
            priority
            className="h-9 w-auto"
          />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 shadow-sm p-8 sm:p-12">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center mb-6">
            <Wrench className="h-8 w-8 text-blue-600" />
          </div>

          <h1 className="text-3xl font-bold text-slate-900 mb-3">
            We&apos;ll be right back
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            Propvora is undergoing scheduled maintenance to make things better.
            We expect to be back online shortly — thank you for your patience.
          </p>

          <div className="mt-8 pt-8 border-t border-slate-200">
            <p className="text-sm text-slate-500">
              Need help in the meantime? Email{" "}
              <a
                href={`mailto:${COMPANY.emails.support}`}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                {COMPANY.emails.support}
              </a>
            </p>
          </div>
        </div>

        <p className="mt-8 text-xs text-slate-400">
          {COMPANY.brand} is a trading name of {COMPANY.legalName}.
        </p>
      </div>
    </main>
  )
}
