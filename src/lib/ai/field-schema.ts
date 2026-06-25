import "server-only"

// ============================================================================
// Field-schema registry — the SAFE, per-record-type fields the Copilot may edit,
// with their DB column + type for validation/coercion. This is how "per-sub-tab
// depth" scales by CONFIG, not hand-coded handlers: adding a section's editable
// field = one line here. Arbitrary writes are impossible — only listed fields,
// every value type-checked. ALL columns below are verified against the live DB.
// ============================================================================

export type FieldType = "text" | "number" | "date" | "enum" | "boolean"
export interface FieldDef { column: string; type: FieldType; enum?: string[] }

const PRIORITY = ["low", "normal", "medium", "high", "urgent"]

/** recordType → { editable field name → definition }. */
export const FIELD_SCHEMA: Record<string, Record<string, FieldDef>> = {
  task: {
    title: { column: "title", type: "text" },
    description: { column: "description", type: "text" },
    status: { column: "status", type: "text" },
    priority: { column: "priority", type: "enum", enum: PRIORITY },
    dueDate: { column: "due_at", type: "date" },
    scheduledStart: { column: "scheduled_start", type: "date" },
    estimatedCost: { column: "estimated_cost", type: "number" },
    actualCost: { column: "actual_cost", type: "number" },
    estimatedMinutes: { column: "estimated_minutes", type: "number" },
  },
  job: {
    status: { column: "status", type: "text" },
    priority: { column: "priority", type: "enum", enum: PRIORITY },
    title: { column: "title", type: "text" },
    description: { column: "description", type: "text" },
    category: { column: "category", type: "text" },
    scheduledDate: { column: "scheduled_date", type: "date" },
    completedDate: { column: "completed_date", type: "date" },
    quotedAmount: { column: "quoted_amount", type: "number" },
    approvedAmount: { column: "approved_amount", type: "number" },
    invoicedAmount: { column: "invoiced_amount", type: "number" },
    reference: { column: "reference", type: "text" },
    notes: { column: "notes", type: "text" },
  },
  property: {
    status: { column: "status", type: "text" },
    currentValue: { column: "current_value", type: "number" },
    targetRent: { column: "target_rent_pcm", type: "number" },
    targetYield: { column: "target_yield", type: "number" },
    purchasePrice: { column: "purchase_price", type: "number" },
    mortgageBalance: { column: "mortgage_balance", type: "number" },
    epcRating: { column: "epc_rating", type: "text" },
    councilBand: { column: "council_band", type: "text" },
    serviceCharge: { column: "service_charge_amount", type: "number" },
    groundRent: { column: "ground_rent_amount", type: "number" },
    bedrooms: { column: "bedrooms", type: "number" },
    bathrooms: { column: "bathrooms", type: "number" },
    notes: { column: "notes", type: "text" },
  },
  unit: {
    status: { column: "status", type: "text" },
    rent: { column: "rent_amount", type: "number" },
    rentPeriod: { column: "rent_period", type: "text" },
    depositAmount: { column: "deposit_amount", type: "number" },
    bedrooms: { column: "bedrooms", type: "number" },
    bathrooms: { column: "bathrooms", type: "number" },
    furnishedState: { column: "furnished_state", type: "text" },
    heatingType: { column: "heating_type", type: "text" },
    label: { column: "label", type: "text" },
    floor: { column: "floor", type: "text" },
    sizeSqm: { column: "size_sqm", type: "number" },
    notes: { column: "notes", type: "text" },
  },
  tenancy: {
    status: { column: "status", type: "text" },
    rent: { column: "rent_amount", type: "number" },
    rentPeriod: { column: "rent_period", type: "text" },
    depositAmount: { column: "deposit_amount", type: "number" },
    depositScheme: { column: "deposit_scheme", type: "text" },
    startDate: { column: "start_date", type: "date" },
    endDate: { column: "end_date", type: "date" },
    breakClauseDate: { column: "break_clause_date", type: "date" },
    paymentDay: { column: "payment_day", type: "number" },
    noticePeriodDays: { column: "notice_period_days", type: "number" },
    petPolicy: { column: "pet_policy", type: "text" },
    smokingAllowed: { column: "smoking_allowed", type: "boolean" },
    notes: { column: "notes", type: "text" },
  },
  compliance: {
    status: { column: "status", type: "text" },
    dueDate: { column: "due_date", type: "date" },
    cost: { column: "cost", type: "number" },
    referenceNo: { column: "reference_no", type: "text" },
    recurrenceMonths: { column: "recurrence_months", type: "number" },
    notes: { column: "notes", type: "text" },
  },
  invoice: {
    status: { column: "status", type: "text" },
    dueDate: { column: "due_date", type: "date" },
    issueDate: { column: "issue_date", type: "date" },
    subtotal: { column: "subtotal", type: "number" },
    taxAmount: { column: "tax_amount", type: "number" },
    total: { column: "total", type: "number" },
    paidAmount: { column: "paid_amount", type: "number" },
    notes: { column: "notes", type: "text" },
  },
  bill: {
    status: { column: "status", type: "text" },
    dueDate: { column: "due_date", type: "date" },
    issueDate: { column: "issue_date", type: "date" },
    subtotal: { column: "subtotal", type: "number" },
    taxAmount: { column: "tax_amount", type: "number" },
    total: { column: "total", type: "number" },
    notes: { column: "notes", type: "text" },
  },
  ppm: {
    status: { column: "status", type: "text" },
    priority: { column: "priority", type: "enum", enum: PRIORITY },
    name: { column: "name", type: "text" },
    description: { column: "description", type: "text" },
    category: { column: "category", type: "text" },
    frequency: { column: "frequency", type: "text" },
    startDate: { column: "start_date", type: "date" },
    nextDue: { column: "next_due_date", type: "date" },
    estimatedCost: { column: "estimated_cost", type: "number" },
    reference: { column: "reference", type: "text" },
    autoGenerateJob: { column: "auto_generate_job", type: "boolean" },
    notes: { column: "notes", type: "text" },
  },
  contact: {
    status: { column: "status", type: "text" },
    displayName: { column: "display_name", type: "text" },
    email: { column: "email", type: "text" },
    phone: { column: "phone", type: "text" },
    company: { column: "company", type: "text" },
    website: { column: "website", type: "text" },
    vatNumber: { column: "vat_number", type: "text" },
    hourlyRatePence: { column: "hourly_rate_pence", type: "number" },
    calloutPence: { column: "callout_pence", type: "number" },
    slaHours: { column: "sla_hours", type: "number" },
    paymentTermsDays: { column: "payment_terms_days", type: "number" },
    addressLine1: { column: "address_line1", type: "text" },
    city: { column: "city", type: "text" },
    postcode: { column: "postcode", type: "text" },
    notes: { column: "notes", type: "text" },
  },
  deposit: {
    status: { column: "status", type: "text" },
    amount: { column: "amount", type: "number" },
    protectionScheme: { column: "protection_scheme", type: "text" },
    referenceNumber: { column: "reference_number", type: "text" },
    heldBy: { column: "held_by", type: "text" },
    receivedDate: { column: "received_date", type: "date" },
    dueDate: { column: "due_date", type: "date" },
    returnDueDate: { column: "return_due_date", type: "date" },
    notes: { column: "notes", type: "text" },
  },
  planningSet: {
    status: { column: "status", type: "text" },
    title: { column: "title", type: "text" },
    notes: { column: "notes", type: "text" },
  },
  planningProfile: {
    status: { column: "status", type: "text" },
    name: { column: "name", type: "text" },
    description: { column: "description", type: "text" },
    purchasePrice: { column: "purchase_price", type: "number" },
    depositPct: { column: "deposit_pct", type: "number" },
    occupancyPct: { column: "occupancy_pct", type: "number" },
    voidWeeks: { column: "void_weeks_per_year", type: "number" },
    managementFeePct: { column: "management_fee_pct", type: "number" },
    annualGrowthPct: { column: "annual_growth_pct", type: "number" },
    mortgageCost: { column: "mortgage_cost", type: "number" },
    utilities: { column: "utilities", type: "number" },
    councilTax: { column: "council_tax", type: "number" },
    internet: { column: "internet", type: "number" },
    cleaning: { column: "cleaning", type: "number" },
    insurance: { column: "insurance", type: "number" },
    maintenanceReserve: { column: "maintenance_reserve", type: "number" },
    licensing: { column: "licensing", type: "number" },
    notes: { column: "notes", type: "text" },
  },
}

/** recordType → the real DB table. */
export const RECORD_TABLES: Record<string, string> = {
  task: "tasks", job: "jobs", property: "properties", unit: "units",
  compliance: "compliance_items", tenancy: "tenancies", invoice: "invoices",
  bill: "bills", ppm: "ppm_plans", contact: "contacts", deposit: "deposits",
  planningSet: "planning_sets", planningProfile: "planning_profiles",
}

/** Validate + coerce a value for a field. Throws on an invalid value. */
export function coerceField(def: FieldDef, value: unknown): string | number | boolean {
  switch (def.type) {
    case "number": {
      const n = typeof value === "number" ? value : parseFloat(String(value).replace(/[£$,\s]/g, ""))
      if (!Number.isFinite(n)) throw new Error(`Expected a number`)
      return n
    }
    case "date": {
      const v = String(value).slice(0, 10)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) throw new Error(`Expected a date (YYYY-MM-DD)`)
      return v
    }
    case "enum": {
      const v = String(value).toLowerCase()
      if (def.enum && !def.enum.includes(v)) throw new Error(`Must be one of: ${def.enum.join(", ")}`)
      return v
    }
    case "boolean": {
      const v = String(value).toLowerCase()
      if (["true", "yes", "y", "1"].includes(v)) return true
      if (["false", "no", "n", "0"].includes(v)) return false
      throw new Error(`Expected true/false`)
    }
    default:
      return String(value).slice(0, 4000)
  }
}

/**
 * Build a validated patch for record.update from caller args. Only fields in the
 * type's schema are accepted; everything else is ignored (never written).
 */
export function buildPatch(recordType: string, args: Record<string, unknown>): { table: string; patch: Record<string, unknown> } {
  const table = RECORD_TABLES[recordType]
  const schema = FIELD_SCHEMA[recordType]
  if (!table || !schema) throw new Error(`record.update doesn't support type "${recordType}"`)
  const patch: Record<string, unknown> = {}
  for (const [field, def] of Object.entries(schema)) {
    if (args[field] !== undefined && args[field] !== null && args[field] !== "") {
      patch[def.column] = coerceField(def, args[field])
    }
  }
  if (Object.keys(patch).length === 0) {
    throw new Error(`Provide at least one editable field for a ${recordType} (${Object.keys(schema).join(", ")})`)
  }
  return { table, patch }
}

// ── Child-row collections (line items, rooms, checklist) ─────────────────────
export interface ChildDef {
  table: string
  /** FK column linking to the parent. */
  parentColumn: string
  /** Parent record type (key in RECORD_TABLES) that owns these rows. */
  parentType: string
  fields: Record<string, FieldDef>
  /** Static column values always set on insert (defaults for NOT-NULL columns). */
  defaults?: Record<string, unknown>
  /** Whether the child table has a workspace_id column (default true). */
  hasWorkspaceId?: boolean
}

/** Whitelisted child collections the Copilot can add a row to. */
export const CHILD_SCHEMA: Record<string, ChildDef> = {
  "invoice.line": {
    table: "invoice_lines", parentColumn: "invoice_id", parentType: "invoice", hasWorkspaceId: true,
    defaults: { sort_order: 0 },
    fields: {
      description: { column: "description", type: "text" },
      quantity: { column: "quantity", type: "number" },
      unitPrice: { column: "unit_price", type: "number" },
      taxRate: { column: "tax_rate", type: "number" },
    },
  },
  "bill.line": {
    table: "bill_lines", parentColumn: "bill_id", parentType: "bill", hasWorkspaceId: true,
    defaults: { sort_order: 0 },
    fields: {
      description: { column: "description", type: "text" },
      quantity: { column: "quantity", type: "number" },
      unitPrice: { column: "unit_price", type: "number" },
      taxRate: { column: "tax_rate", type: "number" },
    },
  },
  "task.checklist": {
    table: "task_checklist_items", parentColumn: "task_id", parentType: "task", hasWorkspaceId: true,
    defaults: { position: 0, done: false },
    fields: { label: { column: "label", type: "text" } },
  },
  "planning.room": {
    table: "planning_room_lines", parentColumn: "planning_set_id", parentType: "planningSet", hasWorkspaceId: false,
    defaults: { sort_order: 0 },
    fields: {
      roomLabel: { column: "room_label", type: "text" },
      monthlyRent: { column: "monthly_rent", type: "number" },
      roomType: { column: "room_type", type: "text" },
      billsIncluded: { column: "bills_included", type: "boolean" },
    },
  },
}
