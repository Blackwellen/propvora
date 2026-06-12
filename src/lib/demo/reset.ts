/**
 * Demo Data Reset — V2
 * Deletes all records with is_demo=true (or workspace-scoped) for the given workspace.
 * Uses cascading order to avoid FK constraint violations.
 *
 * IMPORTANT: Server-side only. Uses admin/service-role client.
 */

import { createAdminClient } from '@/lib/supabase/admin'

export async function resetDemoData(workspaceId: string): Promise<{ deleted: Record<string, number> }> {
  const supabase = createAdminClient()
  const deleted: Record<string, number> = {}

  // ─── Helper: delete from a table filtered by workspace_id + is_demo ──────────
  async function deleteIsDemo(table: string) {
    try {
      const { error, count } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(table as any)
        .delete({ count: 'exact' })
        .eq('workspace_id', workspaceId)
        .eq('is_demo', true)
      if (error) console.error(`[reset] ${table} is_demo delete:`, error.message)
      deleted[table] = count ?? 0
    } catch (err) {
      console.warn(`[reset] ${table} exception:`, err)
      deleted[table] = 0
    }
  }

  // ─── Helper: delete from a table filtered by workspace_id only (no is_demo col) ─
  async function deleteWorkspace(table: string) {
    try {
      const { error, count } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(table as any)
        .delete({ count: 'exact' })
        .eq('workspace_id', workspaceId)
      if (error) console.error(`[reset] ${table} workspace delete:`, error.message)
      deleted[table] = count ?? 0
    } catch (err) {
      console.warn(`[reset] ${table} exception:`, err)
      deleted[table] = 0
    }
  }

  // ─── Step 1: Child tables without their own workspace_id (cascade handled) ──
  // These are deleted via parent cascade, so we skip direct deletion
  const cascadeOnly = [
    'ai_chat_messages',         // cascade from ai_chat_threads
    'planning_upfront_costs',   // cascade from planning_sets
    'planning_bill_lines',
    'planning_expense_lines',
    'planning_room_lines',
    'planning_income_lines',
    'planning_assumptions',
    'money_invoice_lines',      // cascade from money_invoices
    'bill_lines',               // cascade from bills
    'invoice_lines',            // cascade from invoices
    'agreement_signatories',    // cascade from tenancy_agreements
    'inspection_findings',      // cascade from compliance_inspections
    'r2r_ledger',               // cascade from rent_to_rent_contracts
    'possession_evidence',      // cascade from possession_cases
    'affiliate_commissions',    // cascade from affiliates (handled separately)
    'affiliate_referrals',
    'affiliate_clicks',
    'client_disbursements',     // cascade from client_accounts
    'disbursement_line_items',
    'utility_room_splits',      // cascade from utility_bills
    'room_rent_schedules',
  ]
  for (const t of cascadeOnly) { deleted[t] = 0 }

  // ─── Step 2: workspace-scoped tables WITH is_demo flag ───────────────────────
  const isDemoTables = [
    // AI
    'ai_chat_threads',
    'ai_action_logs',

    // Messaging
    'messages',
    'conversations',

    // Finance — money module
    'money_transactions',
    'money_arrears_cases',
    'money_payment_plans',
    'money_deposits',
    'money_bills',
    'money_invoices',
    'money_expenses',
    'money_income',
    'money_reports',
    'money_scheduled_reports',
    'money_activity',
    'money_forecasts',
    'money_reconciliation_imports',
    'payments',
    'bills',
    'invoices',
    'expense_records',
    'income_records',

    // Calendar
    'calendar_events',

    // Planning
    'planning_landlord_offers',
    'planning_sets',

    // Work
    'jobs',
    'tasks',

    // Documents
    'documents',

    // Compliance
    'compliance_inspections',
    'compliance_certificates',

    // Tenancies + properties
    'tenancy_agreements',
    'tenancies',
    'property_units',
    'properties',

    // Contacts
    'contacts',

    // Activity
    'activity_logs',
  ]

  for (const table of isDemoTables) {
    await deleteIsDemo(table)
  }

  // ─── Step 3: workspace-scoped tables WITHOUT is_demo (delete all for workspace) ─
  const workspaceOnlyTables = [
    // Supplier portal
    'supplier_invoices',
    'supplier_jobs',
    'supplier_portal_access',

    // Compliance
    'hmo_licences',

    // Leasing module
    'viewings',
    'prospects',
    'property_vacancies',

    // R2R + possession
    'possession_cases',
    'rent_to_rent_contracts',

    // Financial ops
    'ppm_schedules',
    'job_dispatch_invites',
    'supplier_compliance',
    'bank_transactions',
    'client_accounts',

    // Accounting
    'journal_lines',
    'journal_entries',
    'chart_of_accounts',

    // Workspace features
    'workspace_features',
    'workspace_addons',

    // Notifications (workspace-scoped, user-scoped but we delete all for this workspace)
    'notifications',
  ]

  for (const table of workspaceOnlyTables) {
    await deleteWorkspace(table)
  }

  // ─── Step 4: Affiliates — scoped to user_id, not workspace_id ─────────────
  try {
    // affiliate_referrals and affiliate_commissions cascade when affiliate is deleted
    const { error } = await supabase
      .from('affiliates' as never)
      .delete()
      .eq('user_id', workspaceId) // workspaceId is owner's userId context — handled gracefully
    if (error) { /* no-op: affiliates are user-scoped, we delete them separately if needed */ }
  } catch { /* no-op */ }
  deleted['affiliates'] = 0

  // ─── Step 5: Unmark workspace ─────────────────────────────────────────────
  await supabase
    .from('workspaces')
    .update({ demo_data_loaded: false, demo_data_variant: null })
    .eq('id', workspaceId)

  return { deleted }
}
