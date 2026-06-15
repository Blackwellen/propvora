// ============================================================
// Statutory possession grounds catalogue — REFERENCE GUIDANCE ONLY.
//
// These are landlord-facing reference labels and *indicative* minimum notice
// periods to help a user assemble a DRAFT. They are NOT legal advice and NOT a
// statement of current statutory truth — periods and grounds change with
// legislation. The wizard surfaces a persistent disclaimer telling the user to
// verify every value with a qualified solicitor before serving or filing.
//
// Section 8 (fault-based, Housing Act 1988 Sch 2) and Section 21 (no-fault) are
// the two possession routes for assured shorthold tenancies. The catalogue is
// pure data + helpers — no DB, no side effects.
// ============================================================

export type GroundType = 'Mandatory' | 'Discretionary'
export type NoticeRoute = 'section_8' | 'section_21'

export interface Section8Ground {
  id: string
  number: string
  name: string
  type: GroundType
  description: string
  keyRequirement: string
  evidence: string[]
  /** Indicative minimum notice period in days — VERIFY with a solicitor. */
  noticeDays: number
  recommended?: boolean
}

/** Structured selection persisted on possession_cases.grounds (jsonb). */
export interface SelectedGround {
  id: string
  number: string
  name: string
  type: GroundType
  noticeDays: number
}

// Indicative S8 grounds. Notice periods reflect the common rent-arrears /
// breach routes; the longer periods (e.g. estate-management grounds) use the
// 2-month reference figure. All values are indicative and review-only.
export const SECTION_8_GROUNDS: Section8Ground[] = [
  {
    id: 'g8',
    number: 'Ground 8',
    name: 'Substantial rent arrears',
    type: 'Mandatory',
    description:
      'Rent arrears at or above the statutory threshold both when the notice is served and at the hearing date.',
    keyRequirement: 'Threshold of unpaid rent at service AND at the hearing date',
    evidence: ['Rent ledger / statement', 'Payment history'],
    noticeDays: 14,
    recommended: true,
  },
  {
    id: 'g10',
    number: 'Ground 10',
    name: 'Some rent arrears',
    type: 'Discretionary',
    description: 'Some rent is unpaid at the time the notice is served and at the date of the hearing.',
    keyRequirement: 'Any amount of unpaid rent at both dates',
    evidence: ['Rent ledger / statement', 'Payment history'],
    noticeDays: 14,
  },
  {
    id: 'g11',
    number: 'Ground 11',
    name: 'Persistent rent delays',
    type: 'Discretionary',
    description: 'The tenant has persistently delayed paying rent, even if no rent is currently outstanding.',
    keyRequirement: 'A pattern of late payments (ongoing issue)',
    evidence: ['Payment history', 'Bank statements / logs'],
    noticeDays: 14,
  },
  {
    id: 'g12',
    number: 'Ground 12',
    name: 'Breach of tenancy obligation',
    type: 'Discretionary',
    description: 'The tenant has breached one or more obligations of the tenancy agreement (other than rent).',
    keyRequirement: 'Tenant breached a term of the tenancy',
    evidence: ['Tenancy agreement', 'Incident / complaint records'],
    noticeDays: 14,
  },
  {
    id: 'g13',
    number: 'Ground 13',
    name: 'Deterioration of the property',
    type: 'Discretionary',
    description: 'The condition of the property has deteriorated due to the tenant or a person living there.',
    keyRequirement: 'Damage / neglect attributable to the tenant or occupiers',
    evidence: ['Inspection reports', 'Photographs', 'Repair invoices'],
    noticeDays: 14,
  },
  {
    id: 'g14',
    number: 'Ground 14',
    name: 'Nuisance or annoyance',
    type: 'Discretionary',
    description:
      'The tenant has caused a nuisance or annoyance to neighbours, or been convicted of a relevant offence.',
    keyRequirement: 'Nuisance or annoyance impacting others',
    evidence: ['Incident logs', 'Witness statements', 'Police / ASB references'],
    noticeDays: 0,
  },
  {
    id: 'g17',
    number: 'Ground 17',
    name: 'False statement to obtain tenancy',
    type: 'Discretionary',
    description: 'The tenancy was granted as a result of a false statement knowingly or recklessly made.',
    keyRequirement: 'A material false statement induced the grant of the tenancy',
    evidence: ['Application / referencing records', 'Correspondence'],
    noticeDays: 14,
  },
]

export function groundById(id: string): Section8Ground | undefined {
  return SECTION_8_GROUNDS.find((g) => g.id === id)
}

/** Build the persistable structured selection from a set of ground ids. */
export function toSelectedGrounds(ids: string[]): SelectedGround[] {
  return ids
    .map(groundById)
    .filter((g): g is Section8Ground => !!g)
    .map((g) => ({ id: g.id, number: g.number, name: g.name, type: g.type, noticeDays: g.noticeDays }))
}

/**
 * Indicative minimum notice period for a draft.
 * - Section 21: 2-month reference figure (review-only).
 * - Section 8: the longest noticeDays across the selected grounds.
 */
export function indicativeNoticeDays(route: NoticeRoute, grounds: SelectedGround[]): number {
  if (route === 'section_21') return 60
  if (grounds.length === 0) return 14
  return grounds.reduce((max, g) => Math.max(max, g.noticeDays), 0)
}

/** Human label for a persisted ground array (e.g. "Ground 8, Ground 10"). */
export function groundsLabel(route: NoticeRoute, grounds: SelectedGround[]): string {
  if (route === 'section_21') return 'Section 21 (no-fault)'
  if (grounds.length === 0) return 'Ground 8'
  return grounds.map((g) => g.number).join(', ')
}

/** Add `days` to an ISO/`yyyy-mm-dd` served date → expiry `yyyy-mm-dd`. */
export function computeExpiry(servedDate: string, days: number): string {
  const d = new Date(servedDate)
  if (isNaN(d.getTime())) return ''
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}
