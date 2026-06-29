"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import {
  Home, MapPin, PoundSterling, Calendar, ShieldCheck, FileText, ChevronRight, DoorOpen,
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Skeleton } from "@/components/ui/Skeleton"
import { createClient } from "@/lib/supabase/client"
import {
  resolveTenantContext, resolveTenantTenancies,
  formatMoney, formatDate, propertyLabel, rentFrequencyLabel,
  tenancyStatusMeta,
  type TenancyLite, type PropertyLite,
} from "../_lib/tenant-context"

interface UnitLite {
  id: string
  label: string | null
  unit_number: string | null
}

function code(e: unknown): string | undefined {
  return (e as { code?: string } | null)?.code
}

export default function TenantTenancyPage() {
  const [loading, setLoading] = useState(true)
  const [noContext, setNoContext] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tenancies, setTenancies] = useState<TenancyLite[]>([])
  const [propertyById, setPropertyById] = useState<Map<string, PropertyLite>>(new Map())
  const [unitById, setUnitById] = useState<Map<string, UnitLite>>(new Map())

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()
        const tenant = await resolveTenantContext()
        if (!tenant) { setNoContext(true); setLoading(false); return }

        const myTenancies = await resolveTenantTenancies(tenant.contactId, tenant.workspaceId)
        setTenancies(myTenancies)

        const pIds = Array.from(new Set(myTenancies.map((t) => t.property_id).filter(Boolean))) as string[]
        const uIds = Array.from(new Set(myTenancies.map((t) => t.unit_id).filter(Boolean))) as string[]

        if (pIds.length > 0) {
          const { data, error: pErr } = await supabase
            .from("properties")
            .select("id, nickname, address_line1, address_line2, city, postcode, status")
            .in("id", pIds)
          if (pErr && code(pErr) !== "42P01") console.error(pErr)
          const m = new Map<string, PropertyLite>()
          for (const r of (data ?? []) as unknown as PropertyLite[]) m.set(r.id, r)
          setPropertyById(m)
        }

        if (uIds.length > 0) {
          try {
            const { data } = await supabase
              .from("units")
              .select("id, label")
              .in("id", uIds)
            const m = new Map<string, UnitLite>()
            for (const r of (data ?? []) as unknown as UnitLite[]) m.set(r.id, r)
            setUnitById(m)
          } catch { /* tolerate */ }
        }
      } catch (err) {
        console.error(err)
        setError("Could not load your tenancy.")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <div className="space-y-2"><Skeleton className="h-7 w-40" /><Skeleton className="h-4 w-56" /></div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    )
  }

  if (noContext) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <Home className="w-7 h-7 text-slate-400" />
        </div>
        <h1 className="text-lg font-bold text-slate-900">No tenant account linked</h1>
        <p className="text-sm text-slate-500 mt-1 max-w-sm">
          Ask your managing agent to grant you portal access, or sign in with the email they have on file.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-slate-900">My Tenancy</h1>
        <p className="text-sm text-slate-500">Your tenancy agreement details</p>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>
      )}

      {tenancies.length === 0 ? (
        <Card className="rounded-2xl border-slate-200">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <DoorOpen className="w-7 h-7 text-slate-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-700">No tenancy linked yet</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-md">
              No tenancy is linked to your account. Once your managing agent links your tenancy, the property,
              dates, rent and deposit details will appear here.
            </p>
          </div>
        </Card>
      ) : (
        tenancies.map((t) => {
          const property = t.property_id ? propertyById.get(t.property_id) ?? null : null
          const unit = t.unit_id ? unitById.get(t.unit_id) ?? null : null
          const meta = tenancyStatusMeta(t.status)
          const unitLabel = unit ? (unit.label || unit.unit_number || null) : null
          return (
            <Card key={t.id} className="rounded-2xl border-slate-200">
              <CardHeader>
                <div className="flex items-center gap-2 flex-wrap">
                  <CardTitle>{property ? propertyLabel(property) : "Your Home"}</CardTitle>
                  <Badge variant={meta.variant} dot>{meta.label}</Badge>
                </div>
                {t.reference && <span className="text-xs text-slate-400 font-mono">{t.reference}</span>}
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Address */}
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-slate-700">
                    {[property?.address_line1, property?.address_line2, property?.city, property?.postcode]
                      .filter(Boolean).join(", ") || "Address not set"}
                    {unitLabel && <span className="block text-xs text-slate-400 mt-0.5">Unit: {unitLabel}</span>}
                  </p>
                </div>

                {/* Detail grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <DetailRow icon={PoundSterling} label="Rent">
                    {t.rent_amount != null
                      ? <>{formatMoney(t.rent_amount)} <span className="text-xs font-normal text-slate-400">{rentFrequencyLabel(t.rent_frequency)}</span></>
                      : "—"}
                  </DetailRow>
                  <DetailRow icon={ShieldCheck} label="Deposit">
                    {t.deposit_amount != null ? formatMoney(t.deposit_amount) : "—"}
                  </DetailRow>
                  <DetailRow icon={Calendar} label="Start Date">{formatDate(t.start_date)}</DetailRow>
                  <DetailRow icon={Calendar} label="End Date">{t.end_date ? formatDate(t.end_date) : "Ongoing / periodic"}</DetailRow>
                  {t.tenancy_type && (
                    <DetailRow icon={FileText} label="Tenancy Type">
                      <span className="capitalize">{t.tenancy_type.replace(/_/g, " ")}</span>
                    </DetailRow>
                  )}
                  {t.deposit_scheme && (
                    <DetailRow icon={ShieldCheck} label="Deposit Scheme">{t.deposit_scheme}</DetailRow>
                  )}
                  {t.deposit_reference && (
                    <DetailRow icon={FileText} label="Deposit Reference">
                      <span className="font-mono text-xs">{t.deposit_reference}</span>
                    </DetailRow>
                  )}
                </div>

                <div className="flex flex-wrap gap-3 pt-1">
                  <Link href="/tenant-portal/rent" className="inline-flex items-center gap-1 text-xs text-[var(--brand)] hover:underline">
                    Rent &amp; payments <ChevronRight className="w-3 h-3" />
                  </Link>
                  <Link href="/tenant-portal/documents" className="inline-flex items-center gap-1 text-xs text-[var(--brand)] hover:underline">
                    Tenancy documents <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          )
        })
      )}

      <div className="rounded-2xl bg-[var(--brand-soft)] border border-[var(--color-brand-100)] p-3 flex items-start gap-2">
        <FileText className="w-4 h-4 text-[var(--brand)] mt-0.5 shrink-0" />
        <p className="text-xs text-[#1e40af]">
          These details are read-only and reflect the tenancy your managing agent holds on record. To request a
          change, send them a message.
        </p>
      </div>
    </div>
  )
}

function DetailRow({
  icon: Icon, label, children,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-slate-500" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-semibold text-slate-800 mt-0.5">{children}</p>
      </div>
    </div>
  )
}
