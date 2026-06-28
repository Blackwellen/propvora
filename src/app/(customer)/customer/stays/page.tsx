import type { Metadata } from 'next'
import PublicSearchBar from '@/components/public-marketplace/PublicSearchBar'
import MarketplaceTrustStrip from '@/components/public-marketplace/MarketplaceTrustStrip'
import { getPublicStays } from '@/lib/public-marketplace/queries'
import SaveSearchButton from './SaveSearchButton'
import CustomerStaysFilterClient from './CustomerStaysFilterClient'

export const metadata: Metadata = {
  title: 'Find a Stay · Propvora',
  description: 'Browse verified short-lets, serviced apartments and holiday lets across the UK.',
}

export default async function CustomerStaysPage() {
  const stays = await getPublicStays()

  return (
    <div className="space-y-5">
      {/* Hero — full shell width, rounded like the dashboard hero */}
      <section className="rounded-3xl bg-gradient-to-b from-[var(--brand-soft)] to-white px-5 py-8 sm:px-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-2">Find a Stay</h1>
        <p className="text-[15px] text-slate-500 mb-6 max-w-2xl">
          Verified short-lets, serviced apartments and long-stay rentals across the UK.
        </p>
        <PublicSearchBar variant="stays" />
      </section>

      {/* Wired filtering — price/type/bedrooms/baths + pets/instant/verified/short/long, sort + infinite scroll */}
      <CustomerStaysFilterClient stays={stays} saveSearch={<SaveSearchButton basePath="/user/stays" />} />

      <MarketplaceTrustStrip />
    </div>
  )
}
