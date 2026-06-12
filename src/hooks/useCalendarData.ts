'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type CalendarEventStatus =
  | 'scheduled'
  | 'confirmed'
  | 'awaiting_supplier'
  | 'tentative'
  | 'due_today'
  | 'due_tomorrow'
  | 'overdue'
  | 'urgent'
  | 'action_required'
  | 'completed'
  | 'cancelled'
  | 'failed'
  | 'snoozed'

export type CalendarRiskLevel = 'normal' | 'important' | 'urgent' | 'critical'

export type CalendarSourceModule =
  | 'work'
  | 'supplier'
  | 'portfolio'
  | 'planning'
  | 'money'
  | 'contacts'
  | 'compliance'
  | 'manual'
  | 'ai'
  | 'system'

export type ReminderChannel =
  | 'in_app'
  | 'email'
  | 'sms'
  | 'automated'
  | 'task_reminder'
  | 'money'
  | 'compliance'
  | 'push'

export type ReminderStatus = 'pending' | 'sent' | 'failed' | 'snoozed' | 'cancelled'

export interface CalendarEvent {
  id: string
  workspace_id: string
  title: string
  description: string | null
  event_type: string
  source_module: CalendarSourceModule
  source_entity_type: string | null
  source_entity_id: string | null
  property_id: string | null
  unit_id: string | null
  tenancy_id: string | null
  contact_id: string | null
  organisation_id: string | null
  supplier_id: string | null
  assigned_to: string | null
  start_at: string
  end_at: string | null
  all_day: boolean
  timezone: string
  status: CalendarEventStatus
  risk_level: CalendarRiskLevel
  priority: number
  colour_key: string | null
  recurrence_rule: string | null
  parent_event_id: string | null
  location: string | null
  metadata_json: Record<string, unknown>
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
}

export interface CalendarReminder {
  id: string
  workspace_id: string
  event_id: string | null
  source_entity_type: string | null
  source_entity_id: string | null
  title: string
  reminder_type: string
  channel: ReminderChannel
  due_at: string
  sent_at: string | null
  status: ReminderStatus
  snoozed_until: string | null
  failure_reason: string | null
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
}

export interface CalendarSettings {
  id: string
  workspace_id: string
  default_view: string
  timezone: string
  working_hours_json: Record<string, unknown>
  default_reminder_offsets_json: Array<Record<string, unknown>>
  visible_layers_json: Record<string, unknown>
  ai_suggestions_enabled: boolean
  external_sync_enabled: boolean
  created_at: string
  updated_at: string
}

export interface CalendarReminderStats {
  active: number
  due_today: number
  sent_today: number
  failed: number
}

export interface CalendarOverviewStats {
  today_count: number
  overdue_count: number
  supplier_pending: number
  compliance_deadlines: number
  followups_due: number
  week_total: number
}

// ─────────────────────────────────────────────────────────────
// Query key factory
// ─────────────────────────────────────────────────────────────

export const calendarKeys = {
  all: (workspaceId: string) => ['calendar', workspaceId] as const,
  events: (workspaceId: string) => ['calendar', workspaceId, 'events'] as const,
  eventsFiltered: (workspaceId: string, filters: EventFilters) =>
    ['calendar', workspaceId, 'events', filters] as const,
  eventsForDate: (workspaceId: string, date: string) =>
    ['calendar', workspaceId, 'events', 'date', date] as const,
  eventsForWeek: (workspaceId: string, weekStart: string) =>
    ['calendar', workspaceId, 'events', 'week', weekStart] as const,
  eventsForMonth: (workspaceId: string, year: number, month: number) =>
    ['calendar', workspaceId, 'events', 'month', year, month] as const,
  reminders: (workspaceId: string) => ['calendar', workspaceId, 'reminders'] as const,
  remindersFiltered: (workspaceId: string, filters: ReminderFilters) =>
    ['calendar', workspaceId, 'reminders', filters] as const,
  reminderStats: (workspaceId: string) =>
    ['calendar', workspaceId, 'reminders', 'stats'] as const,
  overviewStats: (workspaceId: string) =>
    ['calendar', workspaceId, 'overview-stats'] as const,
  settings: (workspaceId: string) => ['calendar', workspaceId, 'settings'] as const,
}

// ─────────────────────────────────────────────────────────────
// Filter interfaces
// ─────────────────────────────────────────────────────────────

export interface EventFilters {
  start_at?: string
  end_at?: string
  source_module?: CalendarSourceModule
  status?: CalendarEventStatus
  property_id?: string
}

export interface ReminderFilters {
  status?: ReminderStatus
  channel?: ReminderChannel
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function isoWeekEnd(weekStart: string): string {
  const d = new Date(weekStart)
  d.setDate(d.getDate() + 7)
  return d.toISOString()
}

function monthBounds(year: number, month: number): { start: string; end: string } {
  // month is 1-based
  const start = new Date(year, month - 1, 1).toISOString()
  const end = new Date(year, month, 1).toISOString()
  return { start, end }
}

function dayBounds(date: string): { start: string; end: string } {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const start = d.toISOString()
  d.setDate(d.getDate() + 1)
  const end = d.toISOString()
  return { start, end }
}

// ─────────────────────────────────────────────────────────────
// useCalendarEvents
// ─────────────────────────────────────────────────────────────

export function useCalendarEvents(workspaceId: string, filters: EventFilters = {}) {
  const supabase = createClient()
  return useQuery({
    queryKey: calendarKeys.eventsFiltered(workspaceId, filters),
    queryFn: async (): Promise<CalendarEvent[]> => {
      let query = supabase
        .from('calendar_events')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('start_at', { ascending: true })

      if (filters.start_at) query = query.gte('start_at', filters.start_at)
      if (filters.end_at)   query = query.lt('start_at', filters.end_at)
      if (filters.source_module) query = query.eq('source_module', filters.source_module)
      if (filters.status)        query = query.eq('status', filters.status)
      if (filters.property_id)   query = query.eq('property_id', filters.property_id)

      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as CalendarEvent[]
    },
    enabled: Boolean(workspaceId),
  })
}

// ─────────────────────────────────────────────────────────────
// useCalendarEventsForDate
// ─────────────────────────────────────────────────────────────

export function useCalendarEventsForDate(workspaceId: string, date: string) {
  const supabase = createClient()
  const { start, end } = dayBounds(date)
  return useQuery({
    queryKey: calendarKeys.eventsForDate(workspaceId, date),
    queryFn: async (): Promise<CalendarEvent[]> => {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('workspace_id', workspaceId)
        .gte('start_at', start)
        .lt('start_at', end)
        .order('start_at', { ascending: true })
      if (error) throw error
      return (data ?? []) as CalendarEvent[]
    },
    enabled: Boolean(workspaceId) && Boolean(date),
  })
}

// ─────────────────────────────────────────────────────────────
// useCalendarEventsForWeek
// ─────────────────────────────────────────────────────────────

export function useCalendarEventsForWeek(workspaceId: string, weekStart: string) {
  const supabase = createClient()
  const weekEnd = isoWeekEnd(weekStart)
  return useQuery({
    queryKey: calendarKeys.eventsForWeek(workspaceId, weekStart),
    queryFn: async (): Promise<CalendarEvent[]> => {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('workspace_id', workspaceId)
        .gte('start_at', weekStart)
        .lt('start_at', weekEnd)
        .order('start_at', { ascending: true })
      if (error) throw error
      return (data ?? []) as CalendarEvent[]
    },
    enabled: Boolean(workspaceId) && Boolean(weekStart),
  })
}

// ─────────────────────────────────────────────────────────────
// useCalendarEventsForMonth
// ─────────────────────────────────────────────────────────────

export function useCalendarEventsForMonth(
  workspaceId: string,
  year: number,
  month: number
) {
  const supabase = createClient()
  const { start, end } = monthBounds(year, month)
  return useQuery({
    queryKey: calendarKeys.eventsForMonth(workspaceId, year, month),
    queryFn: async (): Promise<CalendarEvent[]> => {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('workspace_id', workspaceId)
        .gte('start_at', start)
        .lt('start_at', end)
        .order('start_at', { ascending: true })
      if (error) throw error
      return (data ?? []) as CalendarEvent[]
    },
    enabled: Boolean(workspaceId) && year > 0 && month >= 1 && month <= 12,
  })
}

// ─────────────────────────────────────────────────────────────
// useCalendarReminders
// ─────────────────────────────────────────────────────────────

export function useCalendarReminders(workspaceId: string, filters: ReminderFilters = {}) {
  const supabase = createClient()
  return useQuery({
    queryKey: calendarKeys.remindersFiltered(workspaceId, filters),
    queryFn: async (): Promise<CalendarReminder[]> => {
      let query = supabase
        .from('calendar_reminders')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('due_at', { ascending: true })

      if (filters.status)  query = query.eq('status', filters.status)
      if (filters.channel) query = query.eq('channel', filters.channel)

      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as CalendarReminder[]
    },
    enabled: Boolean(workspaceId),
  })
}

// ─────────────────────────────────────────────────────────────
// useCalendarReminderStats
// ─────────────────────────────────────────────────────────────

export function useCalendarReminderStats(workspaceId: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: calendarKeys.reminderStats(workspaceId),
    queryFn: async (): Promise<CalendarReminderStats> => {
      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
      const todayEnd   = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString()

      const [activeRes, dueTodayRes, sentTodayRes, failedRes] = await Promise.all([
        supabase
          .from('calendar_reminders')
          .select('id', { count: 'exact', head: true })
          .eq('workspace_id', workspaceId)
          .eq('status', 'pending'),
        supabase
          .from('calendar_reminders')
          .select('id', { count: 'exact', head: true })
          .eq('workspace_id', workspaceId)
          .eq('status', 'pending')
          .gte('due_at', todayStart)
          .lt('due_at', todayEnd),
        supabase
          .from('calendar_reminders')
          .select('id', { count: 'exact', head: true })
          .eq('workspace_id', workspaceId)
          .eq('status', 'sent')
          .gte('sent_at', todayStart)
          .lt('sent_at', todayEnd),
        supabase
          .from('calendar_reminders')
          .select('id', { count: 'exact', head: true })
          .eq('workspace_id', workspaceId)
          .eq('status', 'failed'),
      ])

      if (activeRes.error)   throw activeRes.error
      if (dueTodayRes.error) throw dueTodayRes.error
      if (sentTodayRes.error) throw sentTodayRes.error
      if (failedRes.error)   throw failedRes.error

      return {
        active:    activeRes.count    ?? 0,
        due_today: dueTodayRes.count  ?? 0,
        sent_today: sentTodayRes.count ?? 0,
        failed:    failedRes.count    ?? 0,
      }
    },
    enabled: Boolean(workspaceId),
  })
}

// ─────────────────────────────────────────────────────────────
// useCalendarOverviewStats
// ─────────────────────────────────────────────────────────────

export function useCalendarOverviewStats(workspaceId: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: calendarKeys.overviewStats(workspaceId),
    queryFn: async (): Promise<CalendarOverviewStats> => {
      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
      const todayEnd   = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString()
      const weekEnd    = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7).toISOString()

      const [
        todayRes,
        overdueRes,
        supplierRes,
        complianceRes,
        followupRes,
        weekRes,
      ] = await Promise.all([
        // today_count: events starting today
        supabase
          .from('calendar_events')
          .select('id', { count: 'exact', head: true })
          .eq('workspace_id', workspaceId)
          .gte('start_at', todayStart)
          .lt('start_at', todayEnd),
        // overdue_count: events with overdue status
        supabase
          .from('calendar_events')
          .select('id', { count: 'exact', head: true })
          .eq('workspace_id', workspaceId)
          .eq('status', 'overdue'),
        // supplier_pending: awaiting_supplier
        supabase
          .from('calendar_events')
          .select('id', { count: 'exact', head: true })
          .eq('workspace_id', workspaceId)
          .eq('status', 'awaiting_supplier'),
        // compliance_deadlines: compliance source module, not completed
        supabase
          .from('calendar_events')
          .select('id', { count: 'exact', head: true })
          .eq('workspace_id', workspaceId)
          .eq('source_module', 'compliance')
          .not('status', 'in', '("completed","cancelled")'),
        // followups_due: contacts source module, due in next 7 days
        supabase
          .from('calendar_events')
          .select('id', { count: 'exact', head: true })
          .eq('workspace_id', workspaceId)
          .eq('source_module', 'contacts')
          .gte('start_at', todayStart)
          .lt('start_at', weekEnd),
        // week_total: all events in next 7 days
        supabase
          .from('calendar_events')
          .select('id', { count: 'exact', head: true })
          .eq('workspace_id', workspaceId)
          .gte('start_at', todayStart)
          .lt('start_at', weekEnd),
      ])

      if (todayRes.error)      throw todayRes.error
      if (overdueRes.error)    throw overdueRes.error
      if (supplierRes.error)   throw supplierRes.error
      if (complianceRes.error) throw complianceRes.error
      if (followupRes.error)   throw followupRes.error
      if (weekRes.error)       throw weekRes.error

      return {
        today_count:           todayRes.count      ?? 0,
        overdue_count:         overdueRes.count     ?? 0,
        supplier_pending:      supplierRes.count    ?? 0,
        compliance_deadlines:  complianceRes.count  ?? 0,
        followups_due:         followupRes.count    ?? 0,
        week_total:            weekRes.count        ?? 0,
      }
    },
    enabled: Boolean(workspaceId),
  })
}

// ─────────────────────────────────────────────────────────────
// useCreateCalendarEvent
// ─────────────────────────────────────────────────────────────

export type CreateCalendarEventInput = Omit<
  CalendarEvent,
  'id' | 'created_at' | 'updated_at'
>

export function useCreateCalendarEvent(workspaceId: string) {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateCalendarEventInput): Promise<CalendarEvent> => {
      const { data, error } = await supabase
        .from('calendar_events')
        .insert({ ...input, workspace_id: workspaceId })
        .select()
        .single()
      if (error) throw error
      return data as CalendarEvent
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: calendarKeys.events(workspaceId) })
      void qc.invalidateQueries({ queryKey: calendarKeys.overviewStats(workspaceId) })
    },
  })
}

// ─────────────────────────────────────────────────────────────
// useUpdateCalendarEvent
// ─────────────────────────────────────────────────────────────

export interface UpdateCalendarEventInput {
  id: string
  updates: Partial<Omit<CalendarEvent, 'id' | 'workspace_id' | 'created_at'>>
}

export function useUpdateCalendarEvent(workspaceId: string) {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, updates }: UpdateCalendarEventInput): Promise<CalendarEvent> => {
      const { data, error } = await supabase
        .from('calendar_events')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('workspace_id', workspaceId)
        .select()
        .single()
      if (error) throw error
      return data as CalendarEvent
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: calendarKeys.events(workspaceId) })
      void qc.invalidateQueries({ queryKey: calendarKeys.overviewStats(workspaceId) })
    },
  })
}

// ─────────────────────────────────────────────────────────────
// useDeleteCalendarEvent
// ─────────────────────────────────────────────────────────────

export function useDeleteCalendarEvent(workspaceId: string) {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (eventId: string): Promise<void> => {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId)
        .eq('workspace_id', workspaceId)
      if (error) throw error
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: calendarKeys.events(workspaceId) })
      void qc.invalidateQueries({ queryKey: calendarKeys.overviewStats(workspaceId) })
    },
  })
}

// ─────────────────────────────────────────────────────────────
// useCreateCalendarReminder
// ─────────────────────────────────────────────────────────────

export type CreateCalendarReminderInput = Omit<
  CalendarReminder,
  'id' | 'created_at' | 'updated_at'
>

export function useCreateCalendarReminder(workspaceId: string) {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateCalendarReminderInput): Promise<CalendarReminder> => {
      const { data, error } = await supabase
        .from('calendar_reminders')
        .insert({ ...input, workspace_id: workspaceId })
        .select()
        .single()
      if (error) throw error
      return data as CalendarReminder
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: calendarKeys.reminders(workspaceId) })
      void qc.invalidateQueries({ queryKey: calendarKeys.reminderStats(workspaceId) })
    },
  })
}

// ─────────────────────────────────────────────────────────────
// useUpdateCalendarReminder
// ─────────────────────────────────────────────────────────────

export interface UpdateCalendarReminderInput {
  id: string
  updates: Partial<Omit<CalendarReminder, 'id' | 'workspace_id' | 'created_at'>>
}

export function useUpdateCalendarReminder(workspaceId: string) {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, updates }: UpdateCalendarReminderInput): Promise<CalendarReminder> => {
      const { data, error } = await supabase
        .from('calendar_reminders')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('workspace_id', workspaceId)
        .select()
        .single()
      if (error) throw error
      return data as CalendarReminder
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: calendarKeys.reminders(workspaceId) })
      void qc.invalidateQueries({ queryKey: calendarKeys.reminderStats(workspaceId) })
    },
  })
}

// ─────────────────────────────────────────────────────────────
// useSnoozeReminder
// ─────────────────────────────────────────────────────────────

export interface SnoozeReminderInput {
  id: string
  snoozed_until: string
}

export function useSnoozeReminder(workspaceId: string) {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, snoozed_until }: SnoozeReminderInput): Promise<CalendarReminder> => {
      const { data, error } = await supabase
        .from('calendar_reminders')
        .update({
          status: 'snoozed' as ReminderStatus,
          snoozed_until,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('workspace_id', workspaceId)
        .select()
        .single()
      if (error) throw error
      return data as CalendarReminder
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: calendarKeys.reminders(workspaceId) })
      void qc.invalidateQueries({ queryKey: calendarKeys.reminderStats(workspaceId) })
    },
  })
}

// ─────────────────────────────────────────────────────────────
// useMarkEventDone
// ─────────────────────────────────────────────────────────────

export function useMarkEventDone(workspaceId: string) {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (eventId: string): Promise<CalendarEvent> => {
      const { data, error } = await supabase
        .from('calendar_events')
        .update({
          status: 'completed' as CalendarEventStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', eventId)
        .eq('workspace_id', workspaceId)
        .select()
        .single()
      if (error) throw error
      return data as CalendarEvent
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: calendarKeys.events(workspaceId) })
      void qc.invalidateQueries({ queryKey: calendarKeys.overviewStats(workspaceId) })
    },
  })
}

// ─────────────────────────────────────────────────────────────
// useCalendarSettings
// ─────────────────────────────────────────────────────────────

export function useCalendarSettings(workspaceId: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: calendarKeys.settings(workspaceId),
    queryFn: async (): Promise<CalendarSettings | null> => {
      const { data, error } = await supabase
        .from('calendar_settings')
        .select('*')
        .eq('workspace_id', workspaceId)
        .maybeSingle()
      if (error) throw error
      return data as CalendarSettings | null
    },
    enabled: Boolean(workspaceId),
  })
}

// ─────────────────────────────────────────────────────────────
// useUpdateCalendarSettings
// ─────────────────────────────────────────────────────────────

export type UpdateCalendarSettingsInput = Partial<
  Omit<CalendarSettings, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>
>

export function useUpdateCalendarSettings(workspaceId: string) {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (updates: UpdateCalendarSettingsInput): Promise<CalendarSettings> => {
      const { data, error } = await supabase
        .from('calendar_settings')
        .upsert(
          { ...updates, workspace_id: workspaceId, updated_at: new Date().toISOString() },
          { onConflict: 'workspace_id' }
        )
        .select()
        .single()
      if (error) throw error
      return data as CalendarSettings
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: calendarKeys.settings(workspaceId) })
    },
  })
}
