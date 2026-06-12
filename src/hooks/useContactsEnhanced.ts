'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { ContactType } from '@/types/database'

// ============================================================
// ENHANCED CONTACT TYPES
// ============================================================

export type RelationshipHealth = 'strong' | 'good' | 'neutral' | 'at_risk' | 'critical'
export type PortalLinkStatus = 'active' | 'pending' | 'expired' | 'revoked'
export type ConversationChannel = 'internal' | 'email' | 'sms' | 'whatsapp' | 'portal'
export type ConversationStatus = 'open' | 'closed' | 'archived'
export type MessageSenderType = 'user' | 'contact' | 'system'
export type MessageType = 'text' | 'note' | 'system' | 'attachment'
export type DeliveryStatus = 'draft' | 'sent' | 'delivered' | 'read' | 'failed'
export type DocumentStatus =
  | 'uploaded'
  | 'verified'
  | 'needs_review'
  | 'expiring'
  | 'expired'
  | 'missing'
  | 'requested'
export type ContactTaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type ContactTaskStatus = 'pending' | 'in_progress' | 'completed' | 'overdue'

export interface ContactEnhanced {
  id: string
  workspace_id: string
  contact_type: ContactType
  full_name: string
  email: string | null
  phone: string | null
  mobile: string | null
  company_name: string | null
  address_line1: string | null
  address_line2: string | null
  city: string | null
  postcode: string | null
  country: string | null
  notes: string | null
  tags: string[] | null
  status: string
  is_demo: boolean
  avatar_url: string | null
  logo_url: string | null
  website: string | null
  is_organisation: boolean
  organisation_type: string | null
  primary_contact_id: string | null
  relationship_status: string | null
  relationship_health: RelationshipHealth | null
  last_interaction_at: string | null
  source: string | null
  preferred: boolean
  follow_up_at: string | null
  board_status: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface ContactActivity {
  id: string
  workspace_id: string
  contact_id: string | null
  entity_type: string | null
  entity_id: string | null
  event_type: string
  title: string
  description: string | null
  amount: number | null
  status: string | null
  actor_user_id: string | null
  metadata_json: Record<string, unknown>
  created_at: string
}

export interface ContactPortalLink {
  id: string
  workspace_id: string
  contact_id: string | null
  purpose: string
  status: PortalLinkStatus
  token_hash: string
  expires_at: string | null
  last_opened_at: string | null
  open_count: number
  created_by: string | null
  revoked_by: string | null
  revoked_at: string | null
  created_at: string
  updated_at: string
}

export interface ContactConversation {
  id: string
  workspace_id: string
  contact_id: string | null
  property_id: string | null
  subject: string | null
  channel: ConversationChannel
  status: ConversationStatus
  last_message_at: string | null
  unread_count: number
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface ContactMessage {
  id: string
  workspace_id: string
  conversation_id: string
  sender_type: MessageSenderType
  sender_user_id: string | null
  sender_contact_id: string | null
  body: string
  message_type: MessageType
  read_at: string | null
  delivery_status: DeliveryStatus
  created_at: string
}

export interface ContactDocument {
  id: string
  workspace_id: string
  contact_id: string | null
  property_id: string | null
  document_name: string
  file_name: string | null
  file_type: string | null
  file_size_bytes: number | null
  storage_path: string | null
  category: string
  status: DocumentStatus
  expiry_date: string | null
  uploaded_by: string | null
  verified_by: string | null
  verified_at: string | null
  created_at: string
  updated_at: string
}

export interface ContactTask {
  id: string
  workspace_id: string
  contact_id: string | null
  title: string
  description: string | null
  priority: ContactTaskPriority
  status: ContactTaskStatus
  due_date: string | null
  assigned_to: string | null
  source_type: string | null
  source_id: string | null
  created_at: string
  updated_at: string
}

export interface ContactStats {
  total: number
  people: number
  organisations: number
  active: number
  inactive: number
  by_type: Record<string, number>
}

// ============================================================
// ORGANISATION CONTACT TYPES
// ============================================================

const ORGANISATION_CONTACT_TYPES: ContactType[] = [
  'supplier',
  'agent',
  'local_authority',
  'housing_association',
  'legal',
  'accountant',
  'insurer',
  'utility_provider',
  'broadband',
  'cleaning',
  'maintenance',
  'emergency_contractor',
  'investor',
  'affiliate',
]

// ============================================================
// FILTERS
// ============================================================

export interface ContactPeopleFilters {
  contact_type?: ContactType
  status?: string
  relationship_health?: RelationshipHealth
  search?: string
}

export interface ContactOrgFilters {
  contact_type?: ContactType
  status?: string
  search?: string
}

export interface ContactActivityFilters {
  contact_id?: string
  event_type?: string
}

export interface ContactPortalLinkFilters {
  contact_id?: string
  status?: PortalLinkStatus
}

export interface ContactDocumentFilters {
  contact_id?: string
  status?: DocumentStatus
  category?: string
}

// ============================================================
// QUERY KEYS
// ============================================================

const KEYS = {
  people: (wsId: string) => ['contacts_people', wsId] as const,
  organisations: (wsId: string) => ['contacts_organisations', wsId] as const,
  stats: (wsId: string) => ['contact_stats', wsId] as const,
  activity: (wsId: string) => ['contact_activity', wsId] as const,
  portalLinks: (wsId: string) => ['contact_portal_links', wsId] as const,
  conversations: (wsId: string) => ['contact_conversations', wsId] as const,
  documents: (wsId: string) => ['contact_documents', wsId] as const,
  tasks: (wsId: string) => ['contact_tasks', wsId] as const,
}

// ============================================================
// useContactsPeople
// ============================================================

export function useContactsPeople(
  workspaceId: string | undefined,
  filters?: ContactPeopleFilters
) {
  const supabase = createClient()

  return useQuery<ContactEnhanced[]>({
    queryKey: [KEYS.people(workspaceId ?? ''), filters],
    enabled: !!workspaceId,
    queryFn: async () => {
      let query = supabase
        .from('contacts')
        .select('*')
        .eq('workspace_id', workspaceId!)
        // People = not marked as organisation AND not an org contact_type
        .eq('is_organisation', false)
        .not('contact_type', 'in', `(${ORGANISATION_CONTACT_TYPES.join(',')})`)
        .order('full_name', { ascending: true })

      if (filters?.contact_type) {
        query = query.eq('contact_type', filters.contact_type)
      }
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }
      if (filters?.relationship_health) {
        query = query.eq('relationship_health', filters.relationship_health)
      }
      if (filters?.search) {
        query = query.or(
          `full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`
        )
      }

      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as ContactEnhanced[]
    },
    staleTime: 60 * 1000,
  })
}

// ============================================================
// useContactsOrganisations
// ============================================================

export function useContactsOrganisations(
  workspaceId: string | undefined,
  filters?: ContactOrgFilters
) {
  const supabase = createClient()

  return useQuery<ContactEnhanced[]>({
    queryKey: [KEYS.organisations(workspaceId ?? ''), filters],
    enabled: !!workspaceId,
    queryFn: async () => {
      let query = supabase
        .from('contacts')
        .select('*')
        .eq('workspace_id', workspaceId!)
        .or(
          `is_organisation.eq.true,contact_type.in.(${ORGANISATION_CONTACT_TYPES.join(',')})`
        )
        .order('full_name', { ascending: true })

      if (filters?.contact_type) {
        query = query.eq('contact_type', filters.contact_type)
      }
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }
      if (filters?.search) {
        query = query.or(
          `full_name.ilike.%${filters.search}%,company_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
        )
      }

      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as ContactEnhanced[]
    },
    staleTime: 60 * 1000,
  })
}

// ============================================================
// useContactStats
// ============================================================

export function useContactStats(workspaceId: string | undefined) {
  const supabase = createClient()

  return useQuery<ContactStats>({
    queryKey: KEYS.stats(workspaceId ?? ''),
    enabled: !!workspaceId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('contact_type, status, is_organisation')
        .eq('workspace_id', workspaceId!)

      if (error) throw error
      const rows = data ?? []

      const byType: Record<string, number> = {}
      let people = 0
      let organisations = 0
      let active = 0
      let inactive = 0

      for (const row of rows) {
        const ct = row.contact_type as string
        byType[ct] = (byType[ct] ?? 0) + 1

        if (row.is_organisation || ORGANISATION_CONTACT_TYPES.includes(ct as ContactType)) {
          organisations++
        } else {
          people++
        }

        if (row.status === 'active') {
          active++
        } else {
          inactive++
        }
      }

      return {
        total: rows.length,
        people,
        organisations,
        active,
        inactive,
        by_type: byType,
      }
    },
    staleTime: 2 * 60 * 1000,
  })
}

// ============================================================
// useContactActivity
// ============================================================

export function useContactActivity(
  workspaceId: string | undefined,
  filters?: ContactActivityFilters
) {
  const supabase = createClient()

  return useQuery<ContactActivity[]>({
    queryKey: [KEYS.activity(workspaceId ?? ''), filters],
    enabled: !!workspaceId,
    queryFn: async () => {
      let query = supabase
        .from('contact_activity')
        .select('*')
        .eq('workspace_id', workspaceId!)
        .order('created_at', { ascending: false })

      if (filters?.contact_id) {
        query = query.eq('contact_id', filters.contact_id)
      }
      if (filters?.event_type) {
        query = query.eq('event_type', filters.event_type)
      }

      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as ContactActivity[]
    },
    staleTime: 30 * 1000,
  })
}

// ============================================================
// useContactPortalLinks
// ============================================================

export function useContactPortalLinks(
  workspaceId: string | undefined,
  filters?: ContactPortalLinkFilters
) {
  const supabase = createClient()

  return useQuery<ContactPortalLink[]>({
    queryKey: [KEYS.portalLinks(workspaceId ?? ''), filters],
    enabled: !!workspaceId,
    queryFn: async () => {
      let query = supabase
        .from('contact_portal_links')
        .select('*')
        .eq('workspace_id', workspaceId!)
        .order('created_at', { ascending: false })

      if (filters?.contact_id) {
        query = query.eq('contact_id', filters.contact_id)
      }
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as ContactPortalLink[]
    },
    staleTime: 60 * 1000,
  })
}

// ============================================================
// useContactConversations
// ============================================================

export function useContactConversations(workspaceId: string | undefined) {
  const supabase = createClient()

  return useQuery<ContactConversation[]>({
    queryKey: KEYS.conversations(workspaceId ?? ''),
    enabled: !!workspaceId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_conversations')
        .select('*')
        .eq('workspace_id', workspaceId!)
        .order('last_message_at', { ascending: false, nullsFirst: false })

      if (error) throw error
      return (data ?? []) as ContactConversation[]
    },
    staleTime: 30 * 1000,
  })
}

// ============================================================
// useContactDocuments
// ============================================================

export function useContactDocuments(
  workspaceId: string | undefined,
  filters?: ContactDocumentFilters
) {
  const supabase = createClient()

  return useQuery<ContactDocument[]>({
    queryKey: [KEYS.documents(workspaceId ?? ''), filters],
    enabled: !!workspaceId,
    queryFn: async () => {
      let query = supabase
        .from('contact_documents')
        .select('*')
        .eq('workspace_id', workspaceId!)
        .order('created_at', { ascending: false })

      if (filters?.contact_id) {
        query = query.eq('contact_id', filters.contact_id)
      }
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }
      if (filters?.category) {
        query = query.eq('category', filters.category)
      }

      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as ContactDocument[]
    },
    staleTime: 60 * 1000,
  })
}

// ============================================================
// useContactTasks
// ============================================================

export function useContactTasks(workspaceId: string | undefined) {
  const supabase = createClient()

  return useQuery<ContactTask[]>({
    queryKey: KEYS.tasks(workspaceId ?? ''),
    enabled: !!workspaceId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_tasks')
        .select('*')
        .eq('workspace_id', workspaceId!)
        .order('due_date', { ascending: true, nullsFirst: false })

      if (error) throw error
      return (data ?? []) as ContactTask[]
    },
    staleTime: 60 * 1000,
  })
}

// ============================================================
// useUpdateContactBoardStatus
// ============================================================

export function useUpdateContactBoardStatus(workspaceId: string) {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation<
    void,
    Error,
    { contactId: string; boardStatus: string }
  >({
    mutationFn: async ({ contactId, boardStatus }) => {
      const { error } = await supabase
        .from('contacts')
        .update({ board_status: boardStatus, updated_at: new Date().toISOString() })
        .eq('id', contactId)
        .eq('workspace_id', workspaceId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.people(workspaceId) })
      queryClient.invalidateQueries({ queryKey: KEYS.organisations(workspaceId) })
    },
  })
}

// ============================================================
// useCreatePortalLink
// ============================================================

export interface CreatePortalLinkPayload {
  contact_id: string
  purpose: string
  expires_at?: string | null
  created_by?: string | null
}

export function useCreatePortalLink(workspaceId: string) {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation<ContactPortalLink, Error, CreatePortalLinkPayload>({
    mutationFn: async (payload) => {
      const token_hash = crypto.randomUUID()

      const { data, error } = await supabase
        .from('contact_portal_links')
        .insert({
          workspace_id: workspaceId,
          contact_id: payload.contact_id,
          purpose: payload.purpose,
          status: 'active' as PortalLinkStatus,
          token_hash,
          expires_at: payload.expires_at ?? null,
          created_by: payload.created_by ?? null,
        })
        .select()
        .single()

      if (error) throw error
      return data as ContactPortalLink
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.portalLinks(workspaceId) })
    },
  })
}

// ============================================================
// useRevokePortalLink
// ============================================================

export interface RevokePortalLinkPayload {
  linkId: string
  revokedBy?: string | null
}

export function useRevokePortalLink(workspaceId: string) {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation<void, Error, RevokePortalLinkPayload>({
    mutationFn: async ({ linkId, revokedBy }) => {
      const { error } = await supabase
        .from('contact_portal_links')
        .update({
          status: 'revoked' as PortalLinkStatus,
          revoked_at: new Date().toISOString(),
          revoked_by: revokedBy ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', linkId)
        .eq('workspace_id', workspaceId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.portalLinks(workspaceId) })
    },
  })
}

// ============================================================
// useCreateContactActivity
// ============================================================

export interface CreateContactActivityPayload {
  contact_id?: string | null
  entity_type?: string | null
  entity_id?: string | null
  event_type: string
  title: string
  description?: string | null
  amount?: number | null
  status?: string | null
  actor_user_id?: string | null
  metadata_json?: Record<string, unknown>
}

export function useCreateContactActivity(workspaceId: string) {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation<ContactActivity, Error, CreateContactActivityPayload>({
    mutationFn: async (payload) => {
      const { data, error } = await supabase
        .from('contact_activity')
        .insert({
          workspace_id: workspaceId,
          contact_id: payload.contact_id ?? null,
          entity_type: payload.entity_type ?? null,
          entity_id: payload.entity_id ?? null,
          event_type: payload.event_type,
          title: payload.title,
          description: payload.description ?? null,
          amount: payload.amount ?? null,
          status: payload.status ?? null,
          actor_user_id: payload.actor_user_id ?? null,
          metadata_json: payload.metadata_json ?? {},
        })
        .select()
        .single()

      if (error) throw error
      return data as ContactActivity
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.activity(workspaceId) })
    },
  })
}
