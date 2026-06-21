'use client'

import ProviderCard from './ProviderCard'
import type { PublicProvider } from '@/lib/public-marketplace/types'

/**
 * ProviderFeaturedCard — same design as ProviderCard with featured=true.
 * Adds amber border and "Featured" badge on the hero image.
 */
export default function ProviderFeaturedCard({
  provider,
  basePath = '/property-manager/marketplace/suppliers-hub',
}: {
  provider: PublicProvider
  basePath?: string
}) {
  return <ProviderCard provider={provider} basePath={basePath} featured />
}
