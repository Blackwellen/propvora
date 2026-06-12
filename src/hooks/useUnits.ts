'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export interface Unit {
  id: string
  workspace_id: string
  property_id: string
  unit_name: string
  unit_type: string | null
  floor: number | null
  bedrooms: number | null
  bathrooms: number | null
  floor_area_sqm: number | null
  target_rent: number | null
  status: 'occupied' | 'vacant' | 'under_works' | 'reserved'
  is_demo: boolean
  created_at: string
  updated_at: string
}

export interface UnitWithProperty extends Unit {
  property_name?: string
  property_address?: string
}

export interface InsertUnit {
  workspace_id: string
  property_id: string
  unit_name: string
  unit_type?: string
  floor?: number
  bedrooms?: number
  bathrooms?: number
  floor_area_sqm?: number
  target_rent?: number
  status?: string
}

export interface UpdateUnit extends Partial<InsertUnit> {
  id?: string
}

// Live table is `units` (rich lineage: label/rent_amount/size_sqm). Adapter maps to app Unit.
const TABLE = 'units'
const KEY = 'units'

function fromDb(r: Record<string, unknown>): Unit {
  const g = (k: string): any => r[k]
  const floorRaw = g('floor')
  return {
    id: g('id'),
    workspace_id: g('workspace_id'),
    property_id: g('property_id'),
    unit_name: (g('label') ?? '') as string,
    unit_type: g('unit_type') ?? null,
    floor: floorRaw == null ? null : (typeof floorRaw === 'number' ? floorRaw : parseInt(String(floorRaw), 10) || null),
    bedrooms: g('bedrooms') ?? null,
    bathrooms: g('bathrooms') ?? null,
    floor_area_sqm: g('size_sqm') ?? null,
    target_rent: g('rent_amount') ?? null,
    status: (g('status') ?? 'vacant') as Unit['status'],
    is_demo: false,
    created_at: g('created_at'),
    updated_at: g('updated_at'),
  }
}

function toDb(p: Record<string, any>): Record<string, unknown> {
  const o: Record<string, unknown> = {}
  if ('unit_name' in p) o.label = p.unit_name
  if ('floor_area_sqm' in p) o.size_sqm = p.floor_area_sqm
  if ('target_rent' in p) o.rent_amount = p.target_rent
  if ('floor' in p) o.floor = p.floor == null ? null : String(p.floor)
  for (const k of ['workspace_id', 'property_id', 'status', 'bedrooms', 'bathrooms'] as const) {
    if (k in p) o[k] = (p as Record<string, unknown>)[k]
  }
  return o
}

export function useUnits(workspaceId: string | undefined, propertyId?: string) {
  const supabase = createClient()
  return useQuery<Unit[]>({
    queryKey: [KEY, workspaceId, propertyId],
    enabled: !!workspaceId,
    queryFn: async () => {
      let q = supabase
        .from(TABLE)
        .select('*')
        .eq('workspace_id', workspaceId!)
        .order('label', { ascending: true })
      if (propertyId) q = q.eq('property_id', propertyId)
      const { data, error } = await q
      if (error) {
        if (error.code === '42P01') return []
        throw error
      }
      return (data ?? []).map(fromDb)
    },
    staleTime: 60 * 1000,
  })
}

export function useUnit(workspaceId: string | undefined, unitId: string | undefined) {
  const supabase = createClient()
  return useQuery<Unit | null>({
    queryKey: [KEY, workspaceId, 'single', unitId],
    enabled: !!workspaceId && !!unitId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .eq('id', unitId!)
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

export function useCreateUnit() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation<Unit, Error, InsertUnit>({
    mutationFn: async (payload) => {
      const { data, error } = await supabase
        .from(TABLE)
        .insert(toDb(payload))
        .select()
        .single()
      if (error) throw error
      return fromDb(data)
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: [KEY, data.workspace_id] })
      qc.invalidateQueries({ queryKey: [KEY, data.workspace_id, data.property_id] })
    },
  })
}

export function useUpdateUnit() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation<Unit, Error, { id: string; workspaceId: string; payload: UpdateUnit }>({
    mutationFn: async ({ id, payload }) => {
      const { data, error } = await supabase
        .from(TABLE)
        .update(toDb(payload))
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return fromDb(data)
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: [KEY, data.workspace_id] })
    },
  })
}

export function useDeleteUnit() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation<void, Error, { id: string; workspaceId: string; propertyId: string }>({
    mutationFn: async ({ id }) => {
      const { error } = await supabase.from(TABLE).delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: (_d, { workspaceId, propertyId }) => {
      qc.invalidateQueries({ queryKey: [KEY, workspaceId] })
      qc.invalidateQueries({ queryKey: [KEY, workspaceId, propertyId] })
    },
  })
}
