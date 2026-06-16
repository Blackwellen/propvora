"use client"

import { createContext, useContext, type ReactNode } from "react"
import { DEFAULT_LOCALE, localeMeta, type Locale } from "./config"
import {
  formatMoney,
  formatMoneyMajor,
  formatDate,
  formatDateTime,
  formatRelativeTime,
  formatNumber,
  formatPercent,
} from "./format"

export interface WorkspaceLocale {
  locale: string
  currency: string
  timezone: string
  dateFormat: string
}

interface WorkspaceLocaleContextValue extends WorkspaceLocale {
  /** Locale-aware money formatter (integer pence/cents). */
  money: (minorUnits: number | null | undefined, overrideCurrency?: string) => string
  /** Locale-aware money formatter (major units, e.g. marketplace prices). */
  moneyMajor: (amount: number | null | undefined, overrideCurrency?: string) => string
  /** Locale-aware date formatter. */
  date: (value: Parameters<typeof formatDate>[0], opts?: Parameters<typeof formatDate>[1]) => string
  /** Locale-aware date + time formatter. */
  dateTime: (value: Parameters<typeof formatDateTime>[0], opts?: Parameters<typeof formatDateTime>[1]) => string
  /** Locale-aware relative time (e.g. "3 hours ago"). */
  relativeTime: (value: Parameters<typeof formatRelativeTime>[0]) => string
  /** Locale-aware number formatter. */
  number: (value: Parameters<typeof formatNumber>[0], opts?: Parameters<typeof formatNumber>[1]) => string
  /** Locale-aware percent formatter. */
  percent: (ratio: Parameters<typeof formatPercent>[0], opts?: Parameters<typeof formatPercent>[1]) => string
  /** Text direction derived from locale. */
  dir: "ltr" | "rtl"
}

const WorkspaceLocaleContext = createContext<WorkspaceLocaleContextValue | null>(null)

const DEFAULT_WORKSPACE_LOCALE: WorkspaceLocale = {
  locale: DEFAULT_LOCALE,
  currency: "GBP",
  timezone: "Europe/London",
  dateFormat: "DD/MM/YYYY",
}

function buildContextValue(wl: WorkspaceLocale): WorkspaceLocaleContextValue {
  const meta = localeMeta(wl.locale as Locale)
  const l = wl.locale || DEFAULT_LOCALE
  const c = wl.currency || "GBP"
  return {
    ...wl,
    dir: meta.dir,
    money: (v, overrideCurrency) => formatMoney(v, overrideCurrency ?? c, l),
    moneyMajor: (v, overrideCurrency) => formatMoneyMajor(v, overrideCurrency ?? c, l),
    date: (v, opts) => formatDate(v, opts, l),
    dateTime: (v, opts) => formatDateTime(v, opts, l),
    relativeTime: (v) => formatRelativeTime(v, l),
    number: (v, opts) => formatNumber(v, opts, l),
    percent: (v, opts) => formatPercent(v, opts, l),
  }
}

export function WorkspaceLocaleProvider({
  locale,
  currency,
  timezone,
  dateFormat,
  children,
}: Partial<WorkspaceLocale> & { children: ReactNode }) {
  const wl: WorkspaceLocale = {
    locale: locale ?? DEFAULT_WORKSPACE_LOCALE.locale,
    currency: currency ?? DEFAULT_WORKSPACE_LOCALE.currency,
    timezone: timezone ?? DEFAULT_WORKSPACE_LOCALE.timezone,
    dateFormat: dateFormat ?? DEFAULT_WORKSPACE_LOCALE.dateFormat,
  }
  return (
    <WorkspaceLocaleContext.Provider value={buildContextValue(wl)}>
      {children}
    </WorkspaceLocaleContext.Provider>
  )
}

/** Returns the workspace locale context. Falls back to en-GB defaults if used outside the provider. */
export function useWorkspaceLocale(): WorkspaceLocaleContextValue {
  const ctx = useContext(WorkspaceLocaleContext)
  if (ctx) return ctx
  // Graceful fallback — never throw; just return defaults.
  return buildContextValue(DEFAULT_WORKSPACE_LOCALE)
}
