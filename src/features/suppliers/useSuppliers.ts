"use client"

import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import type { Contact } from "@/types/database"

// ============================================================
// Shared supplier model
//
// Suppliers live in the `contacts` table (contact_type === 'supplier').
// "Preferred" is expressed via the contact `tags` array (tags.includes("preferred")),
// matching the convention used by the Contacts section.
//
// Every query path tolerates a missing table (42P01) by returning [],
// and the consuming pages fall back to a seeded list so the UI is never empty.
//
// Avatars are ALWAYS generated locally (initials + a deterministic colour) —
// never an external image URL.
// ============================================================

export interface SupplierView {
  id: string
  name: string
  initials: string
  avatarBg: string
  trade: string
  category: string
  location: string
  email: string | null
  phone: string | null
  company: string | null
  notes: string | null
  tags: string[]
  preferred: boolean
  status: Contact["status"]
  isSeed: boolean
}

const AVATAR_COLORS = [
  "bg-blue-600",
  "bg-violet-600",
  "bg-emerald-600",
  "bg-amber-600",
  "bg-rose-600",
  "bg-cyan-600",
  "bg-indigo-600",
  "bg-teal-600",
]

export function supplierInitials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .filter(Boolean)
      .join("")
      .slice(0, 2)
      .toUpperCase() || "S"
  )
}

/** Deterministic colour from a string so an avatar is stable across renders. */
export function avatarColor(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

/** Best-effort trade derivation from tags / company name (no external data). */
function deriveTrade(c: Contact): string {
  const tag = (c.tags ?? []).find((t) => t !== "preferred" && t !== "portal_access")
  if (tag) return tag.charAt(0).toUpperCase() + tag.slice(1)
  return "General Supplier"
}

export function mapContactToSupplier(c: Contact): SupplierView {
  const tags = (c.tags as string[] | null) ?? []
  return {
    id: c.id,
    name: c.full_name,
    initials: supplierInitials(c.full_name),
    avatarBg: avatarColor(c.id || c.full_name),
    trade: deriveTrade(c),
    category: c.company_name ?? "Supplier",
    location: [c.city, c.postcode].filter(Boolean).join(", ") || "—",
    email: c.email,
    phone: c.phone,
    company: c.company_name,
    notes: c.notes,
    tags,
    preferred: tags.includes("preferred"),
    status: c.status,
    isSeed: false,
  }
}

// ============================================================
// Seed fallback (used only when the contacts table is missing
// or there are no supplier contacts yet)
// ============================================================

export const SEED_SUPPLIERS: SupplierView[] = [
  {
    id: "seed-jw-electrical",
    name: "James Wright Electrical Ltd",
    initials: "JW",
    avatarBg: avatarColor("seed-jw-electrical"),
    trade: "Electrical",
    category: "Electrical Contractor",
    location: "London, EC1",
    email: "hello@jwelectrical.co.uk",
    phone: "+44 20 7946 0102",
    company: "James Wright Electrical Ltd",
    notes: "Excellent response times on emergency jobs. Preferred for East London properties.",
    tags: ["preferred", "electrical"],
    preferred: true,
    status: "active",
    isSeed: true,
  },
  {
    id: "seed-ah-plumbing",
    name: "AH Plumbing & Heating",
    initials: "AH",
    avatarBg: avatarColor("seed-ah-plumbing"),
    trade: "Plumbing",
    category: "Plumbing & Heating",
    location: "Manchester, M1",
    email: "office@ahplumbing.co.uk",
    phone: "+44 161 496 0117",
    company: "AH Plumbing & Heating",
    notes: "Use for commercial boiler installations. Very reliable and compliant.",
    tags: ["preferred", "plumbing"],
    preferred: true,
    status: "active",
    isSeed: true,
  },
  {
    id: "seed-sm-gas",
    name: "Sarah Mitchell Gas Services",
    initials: "SM",
    avatarBg: avatarColor("seed-sm-gas"),
    trade: "Gas",
    category: "Gas Engineer",
    location: "Birmingham, B1",
    email: "sarah@smgas.co.uk",
    phone: "+44 121 496 0133",
    company: "Sarah Mitchell Gas Services",
    notes: "Gas Safe registered. Fast turnaround on landlord safety certificates.",
    tags: ["preferred", "gas"],
    preferred: true,
    status: "active",
    isSeed: true,
  },
  {
    id: "seed-elite-electrical",
    name: "Elite Electrical Services",
    initials: "EE",
    avatarBg: avatarColor("seed-elite-electrical"),
    trade: "Electrical",
    category: "MEP Services",
    location: "Leeds, LS1",
    email: "contact@eliteelectrical.co.uk",
    phone: "+44 113 496 0148",
    company: "Elite Electrical Services",
    notes: null,
    tags: ["electrical"],
    preferred: false,
    status: "active",
    isSeed: true,
  },
  {
    id: "seed-green-clean",
    name: "Green Clean Solutions",
    initials: "GC",
    avatarBg: avatarColor("seed-green-clean"),
    trade: "Cleaning",
    category: "Facilities Management",
    location: "Bristol, BS1",
    email: "hello@greenclean.co.uk",
    phone: "+44 117 496 0159",
    company: "Green Clean Solutions",
    notes: null,
    tags: ["cleaning"],
    preferred: false,
    status: "active",
    isSeed: true,
  },
]

// ============================================================
// LIST hook — supplier contacts for a workspace
// ============================================================

export interface UseSuppliersResult {
  suppliers: SupplierView[]
  isSeed: boolean
  loading: boolean
}

export function useSuppliers(workspaceId: string | undefined): UseSuppliersResult {
  const supabase = createClient()

  const query = useQuery<SupplierView[]>({
    queryKey: ["suppliers", workspaceId],
    enabled: !!workspaceId,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("workspace_id", workspaceId!)
        .eq("type", "supplier")
        .order("display_name", { ascending: true })

      if (error) {
        if (error.code === "42P01") return []
        throw error
      }
      return (data ?? []).map((r: any) =>
        mapContactToSupplier({
          ...r,
          full_name: r.display_name ?? r.full_name ?? "",
          contact_type: r.type ?? r.contact_type,
          company_name: r.company ?? r.company_name ?? null,
        } as Contact)
      )
    },
  })

  const live = query.data ?? []
  const hasLive = live.length > 0

  return {
    suppliers: hasLive ? live : SEED_SUPPLIERS,
    isSeed: !hasLive,
    loading: query.isLoading,
  }
}

// ============================================================
// SINGLE hook — one supplier contact by id
// ============================================================

export interface UseSupplierResult {
  supplier: SupplierView | null
  isSeed: boolean
  loading: boolean
}

export function useSupplier(
  workspaceId: string | undefined,
  supplierId: string | undefined
): UseSupplierResult {
  const supabase = createClient()

  const query = useQuery<SupplierView | null>({
    queryKey: ["supplier", workspaceId, supplierId],
    enabled: !!workspaceId && !!supplierId,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("workspace_id", workspaceId!)
        .eq("id", supplierId!)
        .maybeSingle()

      if (error) {
        if (error.code === "42P01") return null
        throw error
      }
      return data
        ? mapContactToSupplier({
            ...(data as any),
            full_name: (data as any).display_name ?? (data as any).full_name ?? "",
            contact_type: (data as any).type ?? (data as any).contact_type,
            company_name: (data as any).company ?? (data as any).company_name ?? null,
          } as Contact)
        : null
    },
  })

  const live = query.data ?? null
  if (live) {
    return { supplier: live, isSeed: false, loading: query.isLoading }
  }

  // Seed fallback when the contact / table is missing.
  const seed =
    SEED_SUPPLIERS.find((s) => s.id === supplierId) ?? SEED_SUPPLIERS[0] ?? null
  return { supplier: seed, isSeed: true, loading: query.isLoading }
}
