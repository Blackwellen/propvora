import type { CSSProperties } from 'react'
import PublicNav from '@/components/marketing/PublicNav'
import PublicFooter from '@/components/marketing/PublicFooter'
import PublicMarketplaceNav from '@/components/public-marketplace/PublicMarketplaceNav'

interface PublicPageShellProps {
  children: React.ReactNode
  className?: string
  style?: CSSProperties
  /** Pass true on map pages to suppress the footer and use full remaining height */
  mapMode?: boolean
  /** Pass true on listing/search pages to remove the footer (kept only on detail/profile pages) */
  hideFooter?: boolean
  /** Use the marketplace-specific nav shown on discovery/map pages. */
  marketplaceNav?: boolean
}

export default function PublicPageShell({ children, className, style, mapMode, hideFooter, marketplaceNav }: PublicPageShellProps) {
  // The marketing PublicNav is a fixed-position 5rem (h-20) header, so content
  // needs top padding to clear it. Map pages use the full viewport minus the nav.
  if (marketplaceNav) {
    return (
      <div className={mapMode ? 'h-dvh bg-white flex flex-col overflow-hidden' : 'min-h-screen bg-white flex flex-col'}>
        <PublicMarketplaceNav />
        <main id="main-content" tabIndex={-1} className={`focus:outline-none ${className ?? 'flex-1'}`} style={style}>
          {children}
        </main>
        {!mapMode && !hideFooter && <PublicFooter />}
      </div>
    )
  }

  return (
    <div className={mapMode ? 'h-dvh bg-white flex flex-col overflow-hidden pt-20' : 'min-h-screen bg-white flex flex-col pt-20'}>
      <PublicNav />
      <main id="main-content" className={className ?? 'flex-1'} style={style}>
        {children}
      </main>
      {!mapMode && !hideFooter && <PublicFooter />}
    </div>
  )
}
