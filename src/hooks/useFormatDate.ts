'use client'

/**
 * useFormatDate — workspace-aware date formatter hook.
 *
 * Returns a function that formats a Date, ISO string, or epoch ms using the
 * workspace's configured locale. Falls back to en-GB so UK behaviour is
 * byte-identical when no locale is configured.
 *
 * FIX-291: Created as part of i18n 100/100 gap-fill.
 *
 * Usage:
 *   const fmtDate = useFormatDate()
 *   fmtDate('2026-06-15')            // → "15 Jun 2026" (en-GB medium)
 *   fmtDate('2026-06-15', { dateStyle: 'short' })   // → "15/06/2026"
 *
 *   const fmtDateTime = useFormatDateTime()
 *   fmtDateTime('2026-06-15T10:30')  // → "15 Jun 2026, 10:30"
 */

import { useWorkspaceJurisdiction } from './useWorkspaceJurisdiction'
import { formatDate, formatDateTime, formatRelativeTime } from '@/lib/i18n/format'

type DateValue = Parameters<typeof formatDate>[0]
type DateOpts = Parameters<typeof formatDate>[1]

export function useFormatDate() {
  const { locale } = useWorkspaceJurisdiction()
  return (value: DateValue, opts?: DateOpts) => formatDate(value, opts, locale)
}

export function useFormatDateTime() {
  const { locale } = useWorkspaceJurisdiction()
  return (value: DateValue, opts?: DateOpts) => formatDateTime(value, opts, locale)
}

export function useFormatRelativeTime() {
  const { locale } = useWorkspaceJurisdiction()
  return (value: DateValue) => formatRelativeTime(value, locale)
}
