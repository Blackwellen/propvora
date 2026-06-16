import Link from "next/link"
import { publicSearch } from "@/components/marketplace-public/data"
import { PublicSearchClient } from "@/components/marketplace-public/PublicSearchClient"
import { intentByKey } from "@/components/marketplace-public/intent"

export const dynamic = "force-dynamic"

export default async function SuppliersPage() {
  const intent = intentByKey("suppliers")
  const seed = await publicSearch({ page: 1, pageSize: 24, category: intent.category ?? undefined, transactionType: intent.transactionType ?? undefined })
  return (
    <div>
      {/* Supplier join banner */}
      <div className="border-b border-amber-100 bg-amber-50 px-4 sm:px-6 py-3">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[13px] text-amber-800 font-medium text-center sm:text-left">
            Are you a tradesperson or service provider?{" "}
            <span className="hidden sm:inline text-amber-600">Join the Propvora marketplace and start receiving job requests.</span>
          </p>
          <Link
            href="/register?intent=supplier"
            className="shrink-0 inline-flex items-center justify-center rounded-lg bg-amber-600 text-white text-[13px] font-semibold px-4 py-2 hover:bg-amber-700 transition-colors whitespace-nowrap"
          >
            Join as a supplier
          </Link>
        </div>
      </div>

      <PublicSearchClient
        intent="suppliers"
        lockIntent
        initialListings={seed.items}
        initialTotal={seed.total}
        heading="Suppliers & trades"
        subheading="Vetted cleaning, gas, electrical and maintenance suppliers. Request a quote in seconds."
      />
    </div>
  )
}
