'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { ContactType } from '@/types/database'
import type {
  InvoiceRecord,
  JobRecord,
  ActivityRecord,
  TenancyInfo,
} from '@/components/contacts/contact-detail/types'

/**
 * Aggregated, workspace-scoped related records for a single contact.
 *
 * Every query is 42P01-safe (resolves to empty if the table is not yet
 * provisioned) and never throws, so the detail page renders honest empty
 * states rather than crashing. All reads are scoped by workspace_id AND the
 * relevant contact foreign key, so RLS + the explicit filter both apply.
 */
export interface ContactRelations {
  tenancy?: TenancyInfo
  invoices: InvoiceRecord[]
  jobs: JobRecord[]
  activity: ActivityRecord[]
  arrears: number
  linked_properties: number
  active_tenancies: number
}

const PG_MISSING = '42P01'

function num(v: unknown): number {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? ''))
  return Number.isFinite(n) ? n : 0
}

function fmtDate(d: unknown): string {
  if (!d) return '—'
  const date = new Date(String(d))
  if (Number.isNaN(date.getTime())) return String(d)
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function activityType(action: string): string {
  const a = action.toLowerCase()
  if (a.includes('payment') || a.includes('invoice') || a.includes('paid')) return 'payment'
  if (a.includes('document') || a.includes('file') || a.includes('upload')) return 'document'
  if (a.includes('task')) return 'task'
  if (a.includes('note')) return 'note'
  if (a.includes('portal')) return 'portal'
  if (a.includes('overdue') || a.includes('alert') || a.includes('arrears')) return 'alert'
  return 'system'
}

export function useContactRelations(
  workspaceId: string | undefined,
  contactId: string | undefined,
  contactType: ContactType | undefined,
) {
  const supabase = createClient()

  return useQuery<ContactRelations>({
    queryKey: ['contact-relations', workspaceId, contactId],
    enabled: !!workspaceId && !!contactId,
    staleTime: 30 * 1000,
    queryFn: async () => {
      const ws = workspaceId!
      const cid = contactId!

      // helper: never throws, swallows "table missing" + any error to [].
      async function rows<T = Record<string, unknown>>(
        builder: PromiseLike<{ data: T[] | null; error: { code?: string } | null }>,
      ): Promise<T[]> {
        try {
          const { data, error } = await builder
          if (error) return []
          return data ?? []
        } catch {
          return []
        }
      }

      const [invRows, tenRows, jobRows, actRows] = await Promise.all([
        rows(
          supabase
            .from('invoices')
            .select('*')
            .eq('workspace_id', ws)
            .eq('contact_id', cid)
            .order('issue_date', { ascending: false })
            .limit(50),
        ),
        rows(
          supabase
            .from('tenancies')
            .select('*')
            .eq('workspace_id', ws)
            .eq('primary_contact_id', cid)
            .order('start_date', { ascending: false })
            .limit(20),
        ),
        // only suppliers have linked jobs, but the query is cheap + scoped
        contactType === 'supplier'
          ? rows(
              supabase
                .from('jobs')
                .select('*, properties(name:nickname, address_line1)')
                .eq('workspace_id', ws)
                .eq('supplier_contact_id', cid)
                .order('created_at', { ascending: false })
                .limit(50),
            )
          : Promise.resolve([] as Record<string, unknown>[]),
        rows(
          supabase
            .from('activity_logs')
            .select('id, action, description, created_at, resource_type')
            .eq('workspace_id', ws)
            .eq('resource_id', cid)
            .order('created_at', { ascending: false })
            .limit(40),
        ),
      ])

      // ── Invoices ──
      const invoices: InvoiceRecord[] = invRows.map((r) => {
        const o = r as Record<string, unknown>
        return {
          id: o.id as string,
          ref: (o.invoice_number ?? o.reference ?? o.number ?? '—') as string,
          amount: num(o.total ?? o.amount ?? o.amount_due ?? o.subtotal),
          status: (o.status as string) ?? 'draft',
          date: fmtDate(o.issue_date ?? o.created_at),
        }
      })
      const arrears = invRows
        .filter((r) => {
          const s = String((r as Record<string, unknown>).status ?? '').toLowerCase()
          return s === 'overdue' || s === 'unpaid'
        })
        .reduce((sum, r) => {
          const o = r as Record<string, unknown>
          const total = num(o.total ?? o.amount ?? o.amount_due)
          const paid = num(o.paid_amount)
          return sum + Math.max(0, total - paid)
        }, 0)

      // ── Jobs ──
      const jobs: JobRecord[] = jobRows.map((r) => {
        const o = r as Record<string, unknown>
        const prop = o.properties as { name?: string; address_line1?: string } | null
        return {
          id: o.id as string,
          title: (o.title as string) ?? 'Job',
          status: (o.status as string) ?? 'open',
          date: fmtDate(o.scheduled_date ?? o.created_at),
          cost: num(o.total_cost ?? o.cost ?? o.actual_cost ?? o.estimated_cost),
          property: prop?.name || prop?.address_line1 || '—',
        }
      })

      // ── Tenancy (most-recent / active first) ──
      let tenancy: TenancyInfo | undefined
      const activeTenancies = tenRows.filter(
        (r) => String((r as Record<string, unknown>).status ?? '') === 'active',
      )
      const chosen = (activeTenancies[0] ?? tenRows[0]) as Record<string, unknown> | undefined
      if (chosen) {
        // resolve property + unit labels
        let propertyName = '—'
        let unitName = '—'
        const propId = chosen.property_id as string | undefined
        if (propId) {
          const pr = await rows(
            supabase.from('properties').select('id, nickname, address_line1').eq('id', propId).limit(1),
          )
          const p = pr[0] as Record<string, unknown> | undefined
          if (p) propertyName = (p.nickname as string) || (p.address_line1 as string) || '—'
        }
        const unitId = chosen.unit_id as string | undefined
        if (unitId) {
          const ur = await rows(
            supabase.from('units').select('id, label').eq('id', unitId).limit(1),
          )
          const u = ur[0] as Record<string, unknown> | undefined
          if (u) unitName = (u.label as string) || '—'
        }
        tenancy = {
          id: chosen.id as string,
          property: propertyName,
          unit: unitName,
          rent: num(chosen.rent_amount),
          deposit: num(chosen.deposit_amount),
          start: fmtDate(chosen.start_date),
          end: chosen.end_date ? fmtDate(chosen.end_date) : 'Ongoing',
          status: (chosen.status as string) ?? 'active',
          deposit_scheme: (chosen.deposit_scheme as string) ?? '—',
          guarantor: (chosen.guarantor_name as string) ?? null,
        }
      }

      // ── Activity ──
      const activity: ActivityRecord[] = actRows.map((r) => {
        const o = r as Record<string, unknown>
        const action = (o.description as string) || (o.action as string) || 'Activity'
        return {
          action,
          time: fmtDate(o.created_at),
          type: activityType((o.action as string) ?? ''),
        }
      })

      const propertyIds = new Set(
        tenRows.map((r) => (r as Record<string, unknown>).property_id).filter(Boolean) as string[],
      )

      return {
        tenancy,
        invoices,
        jobs,
        activity,
        arrears,
        linked_properties: propertyIds.size,
        active_tenancies: activeTenancies.length,
      }
    },
  })
}

export { PG_MISSING }
