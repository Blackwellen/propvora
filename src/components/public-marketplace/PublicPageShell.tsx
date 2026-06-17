import type { CSSProperties } from 'react'
import PublicMarketplaceNav from './PublicMarketplaceNav'
import PublicFooter from '@/components/marketing/PublicFooter'

interface PublicPageShellProps {
  children: React.ReactNode
  className?: string
  style?: CSSProperties
  /** Pass true on map pages to suppress the footer and use full remaining height */
  mapMode?: boolean
}

export default function PublicPageShell({ children, className, style, mapMode }: PublicPageShellProps) {
  return (
    <div className={mapMode ? 'h-dvh bg-white flex flex-col overflow-hidden' : 'min-h-screen bg-white flex flex-col'}>
      <PublicMarketplaceNav />
      <main id="main-content" className={className ?? 'flex-1'} style={style}>
        {children}
      </main>
      {!mapMode && <PublicFooter />}
    </div>
  )
}
