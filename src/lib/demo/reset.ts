/**
 * Demo Data Reset — V3 (schema-aligned).
 * Deletes ONLY rows flagged `demo = true` for the workspace, in FK-safe order.
 * Never deletes real (non-demo) data. Optionally scope to a single batch.
 *
 * Server-side only — uses the admin/service-role client.
 */

import { createAdminClient } from '@/lib/supabase/admin'

// Demo-flagged tables in child→parent order so FK constraints don't block deletes.
const DEMO_TABLES_ORDERED = [
  // leaf / child rows first
  'messages', 'agreement_signatories', 'money_invoice_lines', 'planning_scenarios',
  'money_transactions', 'supplier_invoices', 'notifications', 'documents', 'reminders',
  // finance
  'money_income', 'money_expenses', 'money_invoices', 'money_bills', 'money_arrears_cases',
  'money_deposits', 'income_records', 'expense_records', 'invoices',
  // compliance
  'compliance_certificates', 'compliance_inspections', 'compliance_documents',
  // ops
  'calendar_events', 'viewings', 'prospects', 'property_vacancies', 'possession_cases', 'legal_cases',
  // work
  'tasks', 'jobs', 'supplier_jobs', 'ppm_schedules',
  // tenancies → planning → units → conversations
  'tenancy_agreements', 'tenancies', 'planning_sets', 'property_units', 'conversations',
  // accounting
  'chart_of_accounts', 'client_accounts',
  // parents last
  'properties', 'contacts',
]

export async function resetDemoData(
  workspaceId: string,
  batchId?: string,
): Promise<{ deleted: Record<string, number>; total: number }> {
  const supabase = createAdminClient()
  const deleted: Record<string, number> = {}
  let total = 0

  for (const table of DEMO_TABLES_ORDERED) {
    try {
      let q = supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(table as any)
        .delete({ count: 'exact' })
        .eq('workspace_id', workspaceId)
        .eq('demo', true)
      if (batchId) q = q.eq('demo_batch_id', batchId)
      const { error, count } = await q
      if (error) {
        deleted[table] = 0 // missing demo column / table → skip
      } else {
        deleted[table] = count ?? 0
        total += count ?? 0
      }
    } catch {
      deleted[table] = 0
    }
  }

  // Mark workspace as no longer holding demo data.
  try {
    await supabase
      .from('workspaces')
      .update({ demo_data_loaded: false, demo_data_variant: null })
      .eq('id', workspaceId)
  } catch { /* column may not exist — non-fatal */ }

  return { deleted, total }
}

/** Count current demo rows per table (for the settings Demo Data panel). */
export async function countDemoData(
  workspaceId: string,
): Promise<{ counts: Record<string, number>; total: number; batchId: string | null; expiresAt: string | null }> {
  const supabase = createAdminClient()
  const counts: Record<string, number> = {}
  let total = 0
  let batchId: string | null = null
  let expiresAt: string | null = null

  for (const table of DEMO_TABLES_ORDERED) {
    try {
      const { count, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(table as any)
        .select('id', { head: true, count: 'exact' })
        .eq('workspace_id', workspaceId)
        .eq('demo', true)
      if (!error && count) { counts[table] = count; total += count }
    } catch { /* skip */ }
  }

  // Grab batch + expiry from the most recent demo record.
  for (const t of ['properties', 'contacts', 'tasks']) {
    try {
      const { data } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(t as any)
        .select('demo_batch_id, demo_expires_at')
        .eq('workspace_id', workspaceId)
        .eq('demo', true)
        .not('demo_batch_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (data?.demo_batch_id) { batchId = data.demo_batch_id; expiresAt = data.demo_expires_at ?? null; break }
    } catch { /* skip */ }
  }

  return { counts, total, batchId, expiresAt }
}
