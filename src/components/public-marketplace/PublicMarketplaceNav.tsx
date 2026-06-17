'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { label: 'Stays', href: '/stays', match: '/stays' },
  { label: 'Services', href: '/services', match: '/services' },
  { label: 'Providers', href: '/providers', match: '/providers' },
  { label: 'Emergency', href: '/emergency', match: '/emergency' },
  { label: 'How it works', href: '/how-it-works', match: '/how-it-works' },
]

type RightCTA = 'default' | 'list-property' | 'list-service' | 'list-business'

function getRightCTA(pathname: string): RightCTA {
  if (pathname.startsWith('/stays')) return 'list-property'
  if (pathname.startsWith('/services')) return 'list-service'
  if (pathname.startsWith('/providers')) return 'list-business'
  if (pathname.startsWith('/emergency')) return 'list-service'
  return 'default'
}

export default function PublicMarketplaceNav() {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const ctaType = getRightCTA(pathname)

  return (
    <header
      className={cn(
        'sticky top-0 z-50 bg-white border-b border-slate-200 transition-shadow duration-200',
        scrolled && 'shadow-sm',
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center h-16 gap-6">
          {/* Logo */}
          <Link href="/" className="shrink-0">
            <Image
              src="/propvora-logo-dark.png"
              alt="Propvora"
              width={120}
              height={32}
              className="h-8 w-auto"
              priority
            />
          </Link>

          {/* Center nav */}
          <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.match || pathname.startsWith(link.match + '/')
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'text-blue-600 border-b-2 border-blue-600 rounded-none pb-0.5'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50',
                  )}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>

          {/* Right CTAs */}
          <div className="hidden md:flex items-center gap-3 shrink-0 ml-auto">
            {ctaType === 'default' && (
              <>
                <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Get started
                </Link>
              </>
            )}
            {ctaType === 'list-property' && (
              <>
                <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  List a property
                </Link>
              </>
            )}
            {ctaType === 'list-service' && (
              <>
                <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  List a service
                </Link>
              </>
            )}
            {ctaType === 'list-business' && (
              <>
                <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  List your business
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden ml-auto p-2 rounded-md text-slate-600 hover:bg-slate-100"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-100 py-3 space-y-1">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.match || pathname.startsWith(link.match + '/')
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'block px-4 py-2.5 text-sm font-medium rounded-lg',
                    isActive ? 'text-blue-600 bg-blue-50' : 'text-slate-600 hover:bg-slate-50',
                  )}
                >
                  {link.label}
                </Link>
              )
            })}
            <div className="pt-3 pb-1 px-4 flex flex-col gap-2">
              <Link href="/login" className="block text-center py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg">
                Sign in
              </Link>
              <Link href="/register" className="block text-center py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-lg">
                Get started
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
