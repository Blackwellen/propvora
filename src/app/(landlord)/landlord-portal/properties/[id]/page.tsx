"use client"

import React, { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import {
  ArrowLeft, Building2, MapPin, BedDouble, Bath, Wrench,
  PoundSterling, Calendar, ChevronRight, Receipt,
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs"
import { Skeleton } from "@/components/ui/Skeleton"
import { createClient } from "@/lib/supabase/client"
import {
  resolveLandlordContext, resolveLandlordPropertyIds,
  formatMoney, formatDate, propertyLabel, propertyStatusMeta,
  jobStatusMeta,
} from "../../_lib/landlord-context"

interface PageProps { params: Promise<{ id: string }> }

interface PropertyDetail {
  id: string
  nickname: string | null
  address_line1: string | null
  address_line2: string | null
  city: string | null
  county: string | null
  postcode: string | null
  status: string | null
  template: string | null
  bedrooms: number | null
  bathrooms: number | null
  floor_area_sqm: number | null
  target_rent_pcm: number | null
  current_value: number | null
}

interface JobRow {
  id: string
  title: string
  status: string
  scheduled_date: string | null
  category: string | null
}

interface IncomeRow {
  id: string
  amount: number
  currency: string | null
  date: string
  status: string
  category: string | null
}

function code(e: unknown): string | undefined {
  return (e as { code?: string } | null)?.code
}

export default function LandlordPropertyDetailPage({ params }: PageProps) {
  const [propertyId, setPropertyId] = useState<string | null>(null)
  const [property, setProperty] = useState<PropertyDetail | null>(null)
  const [jobs, setJobs] = useState<JobRow[]>([])
  const [income, setIncome] = useState<IncomeRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    params.then((p) => setPropertyId(p.id))
  }, [params])

  const load = useCallback(async () => {
    if (!propertyId) return
    try {
      const supabase = createClient()
      const landlord = await resolveLandlordContext()
      if (!landlord) { setError("No landlord account linked."); setLoading(false); return }

      // Ownership check — landlord can only view properties linked to them
      const propertyIds = await resolveLandlordPropertyIds(landlord.contactId, landlord.workspaceId)
      if (!propertyIds.includes(propertyId)) {
        setError("You don't have access to this property."); setLoading(false); return
      }

      const { data: p, error: pErr } = await supabase
        .from("properties")
        .select("id, nickname, address_line1, address_line2, city, county, postcode, status, template, bedrooms, bathrooms, floor_area_sqm, target_rent_pcm, current_value")
        .eq("id", propertyId)
        .maybeSingle()

      if (pErr || !p) { setError("Property not found."); setLoading(false); return }
      setProperty(p as unknown as PropertyDetail)

      // LIVE work on this property
      const { data: jobData, error: jobErr } = await supabase
        .from("jobs")
        .select("id, title, status, scheduled_date, category")
        .eq("property_id", propertyId)
        .order("created_at", { ascending: false })
      if (jobErr && code(jobErr) !== "42P01") console.error(jobErr)
      if (jobData) setJobs(jobData as unknown as JobRow[])

      // LIVE rent received on this property (owner-facing income only — no supplier costs/margins)
      try {
        const { data: incData, error: incErr } = await supabase
          .from("income_records")
          .select("id, amount, currency, date, status, category")
          .eq("property_id", propertyId)
          .order("date", { ascending: false })
          .limit(12)
        if (!incErr && incData) setIncome(incData as unknown as IncomeRow[])
      } catch { /* tolerate */ }
    } catch (err) {
      console.error(err)
      setError("Failed to load property.")
    } finally {
      setLoading(false)
    }
  }, [propertyId])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-5 w-40" />
        <div className="space-y-2"><Skeleton className="h-7 w-96" /><Skeleton className="h-4 w-64" /></div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    )
  }

  if (error || !property) {
    return (
      <div className="space-y-5">
        <Link href="/landlord-portal/properties" className="flex items-center gap-1 text-sm text-slate-500 hover:text-[#2563EB]">
          <ArrowLeft className="w-4 h-4" /> Properties
        </Link>
        <Card className="rounded-2xl border-slate-200">
          <div className="p-6 text-center">
            <p className="text-sm text-slate-600">{error ?? "Property not found."}</p>
            <Link href="/landlord-portal/properties">
              <Button variant="outline" size="sm" className="mt-3">Back to Properties</Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  const meta = propertyStatusMeta(property.status)
  const rentReceived = income
    .filter((i) => i.status === "received")
    .reduce((s, i) => s + (i.amount ?? 0), 0)

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/landlord-portal/properties" className="hover:text-[#2563EB] flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Properties
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-medium truncate">{propertyLabel(property)}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h1 className="text-xl font-bold text-slate-900">{propertyLabel(property)}</h1>
            <Badge variant={meta.variant} dot>{meta.label}</Badge>
          </div>
          <div className="flex items-center gap-4 flex-wrap text-sm text-slate-500">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              {[property.address_line1, property.city, property.postcode].filter(Boolean).join(", ") || "Address not set"}
            </span>
            {property.bedrooms != null && (
              <span className="flex items-center gap-1.5"><BedDouble className="w-4 h-4" />{property.bedrooms} bed</span>
            )}
            {property.bathrooms != null && (
              <span className="flex items-center gap-1.5"><Bath className="w-4 h-4" />{property.bathrooms} bath</span>
            )}
          </div>
        </div>
        {property.target_rent_pcm != null && (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-right shrink-0">
            <p className="text-xs text-slate-500">Target Rent</p>
            <p className="text-lg font-bold text-[#2563EB]">{formatMoney(property.target_rent_pcm)} <span className="text-xs font-normal text-slate-400">pcm</span></p>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList variant="underline" className="w-full overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="work">Work Updates</TabsTrigger>
          <TabsTrigger value="statements">Statements</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-4">
              <Card className="rounded-2xl border-slate-200">
                <CardHeader><CardTitle>Property Details</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
                  <Field label="Status" value={meta.label} />
                  <Field label="Type" value={property.template ?? "—"} />
                  <Field label="Bedrooms" value={property.bedrooms != null ? String(property.bedrooms) : "—"} />
                  <Field label="Bathrooms" value={property.bathrooms != null ? String(property.bathrooms) : "—"} />
                  <Field label="Floor area" value={property.floor_area_sqm != null ? `${property.floor_area_sqm} m²` : "—"} />
                  <Field label="County" value={property.county ?? "—"} />
                </CardContent>
              </Card>
            </div>
            <div className="space-y-4">
              <Card className="rounded-2xl border-slate-200">
                <CardHeader><CardTitle>Financials</CardTitle></CardHeader>
                <CardContent className="space-y-2.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Target rent</span>
                    <span className="font-semibold text-slate-800">
                      {property.target_rent_pcm != null ? `${formatMoney(property.target_rent_pcm)} pcm` : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Rent received</span>
                    <span className="font-semibold text-emerald-600">{formatMoney(rentReceived)}</span>
                  </div>
                  {property.current_value != null && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Current value</span>
                      <span className="font-semibold text-slate-800">{formatMoney(property.current_value)}</span>
                    </div>
                  )}
                  <Link href="/landlord-portal/statements" className="block pt-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Receipt className="w-4 h-4" /> View Statements
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Work */}
        <TabsContent value="work">
          <Card className="rounded-2xl border-slate-200">
            <CardHeader><CardTitle>Work on this Property</CardTitle></CardHeader>
            <CardContent>
              {jobs.length === 0 ? (
                <div className="text-center py-10">
                  <Wrench className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">No work recorded on this property.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {jobs.map((j) => {
                    const jmeta = jobStatusMeta(j.status)
                    return (
                      <div key={j.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2.5">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{j.title}</p>
                          <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <Calendar className="w-3 h-3" />{formatDate(j.scheduled_date)}
                            {j.category && <span>· {j.category}</span>}
                          </p>
                        </div>
                        <Badge variant={jmeta.variant} dot>{jmeta.label}</Badge>
                      </div>
                    )
                  })}
                </div>
              )}
              <p className="text-xs text-slate-400 mt-3">
                Work updates are read-only summaries. Supplier costs and internal margins are not shown.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statements */}
        <TabsContent value="statements">
          <Card className="rounded-2xl border-slate-200">
            <CardHeader><CardTitle>Rent Received</CardTitle></CardHeader>
            <CardContent>
              {income.length === 0 ? (
                <div className="text-center py-10">
                  <PoundSterling className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">No income records for this property yet.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {income.map((i) => (
                    <div key={i.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 capitalize">{i.category ?? "Rent"}</p>
                        <p className="text-[11px] text-slate-400">{formatDate(i.date)}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={i.status === "received" ? "success" : "warning"} dot>
                          {i.status === "received" ? "Received" : i.status}
                        </Badge>
                        <span className="text-sm font-semibold text-slate-800">{formatMoney(i.amount, i.currency ?? "GBP")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm font-medium text-slate-800 capitalize">{value}</p>
    </div>
  )
}
