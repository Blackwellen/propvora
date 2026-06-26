"use client"

import React from "react"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface AuthShellProps {
  children: React.ReactNode
  /** Shown below the form — e.g., "Already have an account? Sign in" */
  footer?: React.ReactNode
  /**
   * When true, renders children full-width without the card wrapper.
   * Used for full-page flows like the onboarding wizard.
   */
  fullPage?: boolean
}

export default function AuthShell({ children, footer, fullPage = false }: AuthShellProps) {
  // Full-page mode: render children directly without the card constraint
  if (fullPage) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center group-hover:opacity-80 transition-opacity">
          <Image
            src="/propvora-logo-dark.png"
            alt="Propvora"
            width={520}
            height={130}
            className="h-12 w-auto"
            priority
          />
        </Link>
        <Link
          href="/"
          className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          Back to home
        </Link>
      </header>

      {/* Centered content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-[440px]">
          {/* Card */}
          <div
            className={cn(
              "bg-white rounded-2xl shadow-xl",
              "border border-slate-200",
              "p-8"
            )}
          >
            {children}
          </div>

          {/* Footer links */}
          {footer && (
            <div className="mt-6 text-center text-sm text-slate-500">
              {footer}
            </div>
          )}
        </div>
      </main>

      {/* Bottom strip */}
      <footer className="px-6 py-4 text-center text-xs text-slate-400">
        &copy;{" "}{new Date().getFullYear()}{" "}Propvora Ltd. &nbsp;&middot;&nbsp;
        <Link href="/legal/terms" className="hover:text-slate-600 transition-colors">Terms</Link>
        &nbsp;&middot;&nbsp;
        <Link href="/legal/privacy" className="hover:text-slate-600 transition-colors">Privacy</Link>
      </footer>
    </div>
  )
}
