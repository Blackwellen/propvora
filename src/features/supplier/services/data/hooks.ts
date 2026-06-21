"use client"

/* Workspace-scoped, 42P01-safe data hooks for the supplier Services surfaces.
   Attempts a Supabase read; falls back to rich seed on ANY failure so the UI
   always renders. Shape: { data, loading, error, source, denied, reload }. */

import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useSupplierWorkspace } from "@/components/supplier-workspace/SupplierWorkspaceContext"
import type {
  CatalogueData,
  PackagesData,
  CatalogueService,
  ServiceCategory,
  PricingModel,
  PackageLine,
  PackageAddon,
} from "./types"

const IMAGE_PALETTE = [
  "from-rose-400 to-orange-400",
  "from-sky-400 to-blue-500",
  "from-emerald-400 to-teal-500",
  "from-amber-400 to-orange-500",
  "from-violet-400 to-indigo-500",
  "from-cyan-400 to-sky-500",
]

const EMPTY_CATALOGUE: CatalogueData = {
  supplier: { name: "", verified: false, rating: 0, reviews: 0 },
  services: [],
  kpis: {
    activeServices: 0, quoteOnlyServices: 0, instantPayServices: 0,
    emergencyServices: 0, topRevenueServiceName: "—", topRevenuePence: 0,
  },
}

const EMPTY_PACKAGES: PackagesData = {
  packages: [],
  kpis: { activePackages: 0, mostBookedPackage: "—", packageRevenuePence: 0, addOnAttachRate: 0 },
}

export interface ServicesHookState<T> {
  data: T
  loading: boolean
  error: string | null
  source: "live" | "seed"
  denied: boolean
  reload: () => void
}

function useServicesResource<T>(
  seed: T,
  fetcher: (
    supabase: ReturnType<typeof createClient>,
    workspaceId: string
  ) => Promise<{ data: T | null; denied?: boolean }>,
): ServicesHookState<T> {
  const { workspaceId, ready } = useSupplierWorkspace()
  const [data, setData] = useState<T>(seed)
  const [loading, setLoading] = useState(true)
  const [error] = useState<string | null>(null)
  const [denied, setDenied] = useState(false)
  const [source, setSource] = useState<"live" | "seed">("seed")
  const [nonce, setNonce] = useState(0)

  const reload = useCallback(() => setNonce((n) => n + 1), [])

  useEffect(() => {
    if (!ready) return
    let cancelled = false
    setLoading(true)
    setDenied(false)
    ;(async () => {
      if (!workspaceId) {
        if (!cancelled) {
          setData(seed)
          setSource("seed")
          setLoading(false)
        }
        return
      }
      try {
        const supabase = createClient()
        const res = await fetcher(supabase, workspaceId)
        if (cancelled) return
        if (res.denied) {
          setDenied(true)
          setData(seed)
          setSource("seed")
        } else if (res.data != null) {
          setData(res.data)
          setSource("live")
        } else {
          setData(seed)
          setSource("seed")
        }
      } catch {
        if (!cancelled) {
          setData(seed)
          setSource("seed")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, ready, nonce])

  return { data, loading, error, source, denied, reload }
}

function isDenied(err: { code?: string } | null): boolean {
  return err?.code === "42501"
}

function mapPricingModel(m: string | null): PricingModel {
  if (m === "fixed" || m === "hourly") return "fixed"
  if (m === "range") return "range"
  return "quote_only"
}

// ── Catalogue ──────────────────────────────────────────────────────────────────
export function useServicesCatalogue(): ServicesHookState<CatalogueData> {
  return useServicesResource<CatalogueData>(EMPTY_CATALOGUE, async (supabase, workspaceId) => {
    const { data, error } = await supabase
      .from("supplier_workspace_services")
      .select("id,name,category,pricing_model,rate_pence,active")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
    if (error) return { data: null, denied: isDenied(error) }
    if (!data || data.length === 0) return { data: null }

    const services: CatalogueService[] = data.map((r, i) => {
      const model = mapPricingModel(r.pricing_model)
      const cat = (r.category as ServiceCategory) ?? "general"
      return {
        id: r.id,
        name: r.name ?? "Service",
        category: cat,
        categories: [cat],
        imageHue: IMAGE_PALETTE[i % IMAGE_PALETTE.length],
        pricingModel: model,
        pricePence: model === "fixed" ? r.rate_pence ?? null : null,
        priceMinPence: model === "range" ? r.rate_pence ?? null : null,
        priceMaxPence: null,
        instantPay: model === "fixed",
        emergency: false,
        docsCount: 0,
        coverage: "All areas",
        rating: 0,
        jobsCount: 0,
        revenuePence: 0,
        visible: Boolean(r.active),
      }
    })
    const fixedRevenueTop = services.reduce(
      (best, s) => (s.revenuePence > best.revenuePence ? s : best),
      services[0]
    )
    return {
      data: {
        supplier: { name: "", verified: false, rating: 0, reviews: 0 },
        services,
        kpis: {
          activeServices: services.filter((s) => s.visible).length,
          quoteOnlyServices: services.filter((s) => s.pricingModel === "quote_only").length,
          instantPayServices: services.filter((s) => s.instantPay).length,
          emergencyServices: services.filter((s) => s.emergency).length,
          topRevenueServiceName: fixedRevenueTop?.name ?? "—",
          topRevenuePence: fixedRevenueTop?.revenuePence ?? 0,
        },
      },
    }
  })
}

// ── Packages ──────────────────────────────────────────────────────────────────
export function useServicesPackages(): ServicesHookState<PackagesData> {
  return useServicesResource<PackagesData>(EMPTY_PACKAGES, async (supabase, workspaceId) => {
    const { data, error } = await supabase
      .from("supplier_workspace_packages")
      .select("id,name,description,price_pence,active")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
    if (error) return { data: null, denied: isDenied(error) }
    if (!data || data.length === 0) return { data: null }

    const packages = data.map((r, i) => ({
      id: r.id,
      name: r.name ?? "Package",
      description: r.description ?? "",
      imageHue: IMAGE_PALETTE[i % IMAGE_PALETTE.length],
      pricingModel: "fixed" as PricingModel,
      pricePence: r.price_pence ?? null,
      priceMinPence: null,
      priceMaxPence: null,
      marginPence: 0,
      attachRate: 0,
      bookings: 0,
      rating: 0,
      health: "on_track" as const,
      mostPopular: false,
      active: Boolean(r.active),
      recurring: false,
      lines: [] as PackageLine[],
      addons: [] as PackageAddon[],
      materialsIncluded: [] as string[],
      materialsExcluded: [] as string[],
      upsells: [] as { id: string; label: string; attachPct: number }[],
    }))
    return {
      data: {
        packages,
        kpis: {
          activePackages: packages.filter((p) => p.active).length,
          mostBookedPackage: packages.length > 0 ? packages[0].name : "—",
          packageRevenuePence: 0,
          addOnAttachRate: 0,
        },
      },
    }
  })
}
