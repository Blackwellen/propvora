import PublicMarketplaceNav from './PublicMarketplaceNav'
import PublicFooter from '@/components/marketing/PublicFooter'

interface PublicPageShellProps {
  children: React.ReactNode
  className?: string
}

export default function PublicPageShell({ children, className }: PublicPageShellProps) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <PublicMarketplaceNav />
      <main id="main-content" className={className ?? 'flex-1'}>
        {children}
      </main>
      <PublicFooter />
    </div>
  )
}
