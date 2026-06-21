"use client"

/**
 * Supplier-side mounts of the shared Property-Manager feature sections.
 *
 * Each provider pins the SectionBasePath context so the SAME PM components
 * (tab navs, page bodies, in-section links) resolve their hrefs onto the
 * supplier prefix `/supplier/<section>` instead of `/property-manager/<section>`.
 * Cross-section links (e.g. /app/contacts) are left untouched and continue to
 * point at the PM app.
 */

import type { ReactNode } from "react"
import { SectionBasePathProvider } from "@/components/sections/SectionBasePath"

export function SupplierCalendarSection({ children }: { children: ReactNode }) {
  return (
    <SectionBasePathProvider
      value={{ base: "/supplier/calendar", pmBase: "/property-manager/calendar", pmPublicBase: "/property-manager/calendar" }}
    >
      {children}
    </SectionBasePathProvider>
  )
}

export function SupplierAccountingSection({ children }: { children: ReactNode }) {
  return (
    <SectionBasePathProvider
      value={{ base: "/supplier/accounting", pmBase: "/property-manager/accounting", pmPublicBase: "/property-manager/accounting" }}
    >
      {children}
    </SectionBasePathProvider>
  )
}

export function SupplierMessagesSection({ children }: { children: ReactNode }) {
  return (
    <SectionBasePathProvider
      value={{ base: "/supplier/messages", pmBase: "/property-manager/messages", pmPublicBase: "/property-manager/messages" }}
    >
      {children}
    </SectionBasePathProvider>
  )
}

export function SupplierAutomationsSection({ children }: { children: ReactNode }) {
  return (
    <SectionBasePathProvider
      value={{ base: "/supplier/automations", pmBase: "/property-manager/automations", pmPublicBase: "/property-manager/automations" }}
    >
      {children}
    </SectionBasePathProvider>
  )
}
