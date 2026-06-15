'use client'

// ─────────────────────────────────────────────────────────────────────────────
// Shared relationship-option sources for InlineEditRelationshipSelect.
//
// Foreign-key inline editors (property_id, contact_id, supplier_contact_id,
// assigned_to) must never expose a raw UUID. These hooks resolve the workspace's
// properties / contacts / suppliers / members into { value, label, sublabel }
// option lists the picker can search. All are workspace-scoped, RLS-bound and
// 42P01-tolerant via the underlying section hooks.
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo } from 'react'
import { useProperties } from '@/hooks/useProperties'
import { useContacts } from '@/hooks/useContacts'
import { useWorkspaceMembers } from '@/hooks/useWorkspace'
import type { RelationshipOption } from './InlineEditRelationshipSelect'

/** Property options (label = nickname/name, sublabel = address). */
export function usePropertyOptions(workspaceId: string | undefined): RelationshipOption[] {
  const { data: properties = [] } = useProperties(workspaceId)
  return useMemo(
    () =>
      properties.map((p) => ({
        value: p.id,
        label: p.name || p.address_line1 || 'Property',
        sublabel: [p.address_line1, p.city, p.postcode].filter(Boolean).join(', ') || undefined,
      })),
    [properties]
  )
}

/**
 * Contact options. Pass a `type` predicate to narrow (e.g. suppliers only).
 * label = full name, sublabel = company / email.
 */
export function useContactOptions(
  workspaceId: string | undefined,
  filter?: (contactType: string) => boolean
): RelationshipOption[] {
  const { data: contacts = [] } = useContacts(workspaceId)
  return useMemo(
    () =>
      contacts
        .filter((c) => (filter ? filter(c.contact_type) : true))
        .map((c) => ({
          value: c.id,
          label: c.full_name || c.company_name || c.email || 'Contact',
          sublabel: c.company_name ?? c.email ?? undefined,
        })),
    [contacts, filter]
  )
}

const SUPPLIER_TYPES = new Set([
  'supplier',
  'maintenance',
  'emergency_contractor',
  'cleaning',
  'utility_provider',
  'broadband',
  'insurer',
])
const isSupplierType = (t: string) => SUPPLIER_TYPES.has(t)

/** Supplier-only contact options (for job supplier assignment). */
export function useSupplierOptions(workspaceId: string | undefined): RelationshipOption[] {
  return useContactOptions(workspaceId, isSupplierType)
}

/**
 * Workspace member options for assignee fields. `workspace_members` carries no
 * profile name/email columns (no verified join), so members are labelled by
 * role with a short id reference rather than fabricating names.
 */
export function useMemberOptions(workspaceId: string | undefined): RelationshipOption[] {
  const { data: members = [] } = useWorkspaceMembers(workspaceId)
  return useMemo(
    () =>
      members.map((m) => ({
        value: m.user_id,
        label: `${m.role.charAt(0).toUpperCase()}${m.role.slice(1)} · ${m.user_id.slice(0, 8)}`,
        sublabel: undefined,
      })),
    [members]
  )
}
