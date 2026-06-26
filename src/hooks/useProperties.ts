'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Property, InsertProperty, UpdateProperty } from '@/types/database'

const QUERY_KEY = 'properties'

// ============================================================
// SCHEMA ADAPTER
// The live `properties` table uses a richer/different lineage than the
// app's Property type. We translate at the hook boundary so the rest of
// the app keeps using the canonical Property shape.
//   nickname            <-> name
//   template            <-> operation_profile (and derives property_type)
//   target_rent_pcm     <-> target_rent
//   mortgage_outstanding<-> monthly_mortgage
//   demo                <-> is_demo
//   cover_image_url / county  -> added via migration 20260611000008
// ============================================================

const TEMPLATE_TO_PROFILE: Record<string, string> = {
  standard_rental: 'long_term_let',
  long_term_let: 'long_term_let',
  hmo: 'hmo',
  student_let: 'student_let',
  serviced_accommodation: 'serviced_accommodation',
  sa_lite: 'serviced_accommodation',
  rent_to_rent: 'rent_to_rent',
  r2r: 'rent_to_rent',
  holiday_let: 'holiday_let',
  commercial: 'commercial',
  mixed_use: 'mixed_use',
  social_housing: 'social_housing',
  build_to_rent: 'build_to_rent',
}
// Every operation_profile maps to one of the 5 valid `template` enum members
// (template is NOT NULL). The true profile is stored in the dedicated
// `operation_profile` column; `template` is kept valid for legacy/template-sync.
const PROFILE_TO_TEMPLATE: Record<string, string> = {
  long_term_let: 'standard_rental',
  rent_to_rent: 'r2r',
  hmo: 'hmo',
  student_let: 'student_let',
  serviced_accommodation: 'sa_lite',
  holiday_let: 'sa_lite',
  build_to_rent: 'standard_rental',
  social_housing: 'standard_rental',
  commercial: 'standard_rental',
  mixed_use: 'standard_rental',
  refinancing: 'standard_rental',
  dev_flip: 'standard_rental',
  co_living: 'hmo',
}

// Live `properties.status` enum = active|void|off_market|archived.
// The UI historically offered vacant/under_works (no such enum members), which
// the DB would reject. Normalise in BOTH directions at the adapter boundary so
// a status write is always a valid enum member.
const PROPERTY_STATUS_TO_DB: Record<string, string> = {
  active: 'active',
  vacant: 'void',
  void: 'void',
  under_works: 'off_market',
  off_market: 'off_market',
  archived: 'archived',
  disposed: 'archived',
}
const PROPERTY_STATUS_FROM_DB: Record<string, Property['status']> = {
  active: 'active',
  void: 'vacant',
  off_market: 'under_works',
  archived: 'archived',
}

function templateToType(template: string | null): Property['property_type'] {
  switch (template) {
    case 'hmo': return 'hmo'
    case 'commercial': return 'commercial'
    case 'mixed_use': return 'mixed_use'
    default: return 'house'
  }
}

/** Live DB row -> canonical Property */
function fromDb(r: Record<string, unknown>): Property {
  // adapter boundary: untyped row in, canonical Property out
  const g = (k: string): any => r[k]
  const template = (g('template') ?? null) as string | null
  return {
    id: g('id'),
    workspace_id: g('workspace_id'),
    name: (g('nickname') ?? '') as string,
    address_line1: g('address_line1') ?? null,
    address_line2: g('address_line2') ?? null,
    city: g('city') ?? null,
    county: g('county') ?? null,
    postcode: g('postcode') ?? null,
    country: (g('country') ?? 'United Kingdom') as string,
    // Per-property jurisdiction spine. Live columns already exist.
    country_code: (g('country_code') ?? null) as string | null,
    region_code: (g('region_code') ?? null) as string | null,
    currency: (g('currency') ?? null) as string | null,
    latitude: g('latitude') ?? null,
    longitude: g('longitude') ?? null,
    property_type: templateToType(template),
    // Prefer the dedicated column; fall back to template-derived for any legacy
    // row written before the column existed.
    operation_profile: ((g('operation_profile') as string | null) ?? (template ? (TEMPLATE_TO_PROFILE[template] ?? template) : null)) as Property['operation_profile'],
    category: (g('category') ?? null) as string | null,
    status: (PROPERTY_STATUS_FROM_DB[String(g('status') ?? 'active')] ?? 'active') as Property['status'],
    bedrooms: g('bedrooms') ?? null,
    bathrooms: g('bathrooms') ?? null,
    floor_area_sqm: g('floor_area_sqm') ?? null,
    purchase_price: g('purchase_price') ?? null,
    current_value: g('current_value') ?? null,
    monthly_mortgage: g('mortgage_outstanding') ?? null,
    target_rent: g('target_rent_pcm') ?? null,
    notes: g('notes') ?? null,
    is_demo: (g('demo') ?? false) as boolean,
    cover_image_url: g('cover_image_url') ?? null,
    created_by: g('created_by') ?? null,
    created_at: g('created_at'),
    updated_at: g('updated_at'),
  }
}

/** canonical Property fields -> live DB columns (only keys present in input) */
function toDb(p: Partial<Property>): Record<string, unknown> {
  const o: Record<string, unknown> = {}
  if ('name' in p) o.nickname = p.name
  if ('operation_profile' in p && p.operation_profile) {
    o.operation_profile = p.operation_profile
    o.template = PROFILE_TO_TEMPLATE[p.operation_profile] ?? 'standard_rental'
  }
  if ('target_rent' in p) o.target_rent_pcm = p.target_rent
  if ('monthly_mortgage' in p) o.mortgage_outstanding = p.monthly_mortgage
  if ('is_demo' in p) o.demo = p.is_demo
  if ('status' in p && p.status) o.status = PROPERTY_STATUS_TO_DB[String(p.status)] ?? 'active'
  for (const k of [
    'workspace_id', 'address_line1', 'address_line2', 'city', 'county', 'postcode', 'country',
    'country_code', 'region_code', 'currency',
    'latitude', 'longitude', 'bedrooms', 'bathrooms', 'floor_area_sqm',
    'purchase_price', 'current_value', 'notes', 'cover_image_url', 'created_by', 'category',
  ] as const) {
    if (k in p) o[k] = (p as Record<string, unknown>)[k]
  }
  return o
}

// ============================================================
// LIST
// ============================================================

export function useProperties(workspaceId: string | undefined) {
  const supabase = createClient()
  return useQuery<Property[]>({
    queryKey: [QUERY_KEY, workspaceId],
    enabled: !!workspaceId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('workspace_id', workspaceId!)
        .order('created_at', { ascending: false })
      if (error) {
        if (error.code === '42P01') return []
        throw error
      }
      return (data ?? []).map(fromDb)
    },
    staleTime: 60 * 1000,
  })
}

// ============================================================
// SINGLE
// ============================================================

export function useProperty(workspaceId: string | undefined, propertyId: string | undefined) {
  const supabase = createClient()
  return useQuery<Property | null>({
    queryKey: [QUERY_KEY, workspaceId, propertyId],
    enabled: !!workspaceId && !!propertyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId!)
        .eq('workspace_id', workspaceId!)
        .single()
      if (error) {
        if (error.code === '42P01' || error.code === 'PGRST116') return null
        throw error
      }
      return data ? fromDb(data) : null
    },
  })
}

// ============================================================
// CREATE
// ============================================================

export function useCreateProperty() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  return useMutation<Property, Error, InsertProperty>({
    mutationFn: async (payload) => {
      const { data, error } = await supabase
        .from('properties')
        .insert(toDb(payload as Partial<Property>))
        .select()
        .single()
      if (error) throw error
      return fromDb(data)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, data.workspace_id] })
    },
  })
}

// ============================================================
// UPDATE
// ============================================================

export function useUpdateProperty() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  return useMutation<Property, Error, { id: string; workspaceId: string; payload: UpdateProperty }>({
    mutationFn: async ({ id, payload }) => {
      const { data, error } = await supabase
        .from('properties')
        .update(toDb(payload as Partial<Property>))
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return fromDb(data)
    },
    onMutate: async ({ id, workspaceId, payload }) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY, workspaceId, id] })
      const previous = queryClient.getQueryData<Property>([QUERY_KEY, workspaceId, id])
      if (previous) {
        queryClient.setQueryData<Property>([QUERY_KEY, workspaceId, id], { ...previous, ...payload })
      }
      return { previous }
    },
    onError: (_err, { id, workspaceId }, context) => {
      const ctx = context as { previous: Property | undefined } | undefined
      if (ctx?.previous) {
        queryClient.setQueryData([QUERY_KEY, workspaceId, id], ctx.previous)
      }
    },
    onSettled: (_data, _err, { workspaceId }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, workspaceId] })
    },
  })
}

// ============================================================
// DELETE
// ============================================================

export function useDeleteProperty() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  return useMutation<void, Error, { id: string; workspaceId: string }>({
    mutationFn: async ({ id }) => {
      const { error } = await supabase.from('properties').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: (_data, { workspaceId }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, workspaceId] })
    },
  })
}
