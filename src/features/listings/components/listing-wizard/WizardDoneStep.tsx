import Link from "next/link"
import { CheckCircle2, ArrowRight } from "lucide-react"

interface WizardDoneStepProps {
  createdId: string
  listingTitle: string
}

export function WizardDoneStep({ createdId, listingTitle }: WizardDoneStepProps) {
  return (
    <div className="flex flex-col items-center text-center py-6">
      <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
      </div>
      <h3 className="text-base font-bold text-slate-900 mb-1">
        {listingTitle || "Your listing"} is ready
      </h3>
      <p className="text-sm text-slate-500 max-w-sm">
        Go to the listing to add photos, open availability, configure check-in and publish.
      </p>
      <div className="flex gap-2 mt-6">
        <Link
          href={`/property-manager/bookings/listings/${createdId}`}
          className="inline-flex items-center gap-2 h-11 px-5 rounded-xl text-sm font-semibold bg-[#2563EB] text-white hover:bg-blue-700 transition-colors"
        >
          Set up listing
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          href="/property-manager/bookings/listings"
          className="inline-flex items-center gap-2 h-11 px-4 rounded-xl text-sm font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          Back to listings
        </Link>
      </div>
    </div>
  )
}
