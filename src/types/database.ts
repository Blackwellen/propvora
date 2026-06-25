// ============================================================
// Propvora Database Types
// Auto-aligned with supabase/migrations/001_core_schema.sql
// ============================================================

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

// ============================================================
// ENUMS / UNION TYPES
// ============================================================

export type UserRole = 'user' | 'platform_admin' | 'support'
export type WorkspacePlan = 'trial' | 'basic' | 'pro' | 'business' | 'enterprise'
export type WorkspacePlanStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'suspended'
export type WorkspaceMemberRole = 'owner' | 'admin' | 'member' | 'viewer' | 'finance' | 'supplier'

export type PropertyType = 'house' | 'flat' | 'hmo' | 'commercial' | 'mixed_use' | 'land' | 'other'
export type OperationProfile =
  | 'long_term_let'
  | 'rent_to_rent'
  | 'hmo'
  | 'student_let'
  | 'serviced_accommodation'
  | 'holiday_let'
  | 'build_to_rent'
  | 'social_housing'
  | 'commercial'
  | 'mixed_use'
  | 'refinancing'
  | 'dev_flip'
  | 'co_living'
export type PropertyStatus = 'active' | 'vacant' | 'under_works' | 'archived' | 'disposed'
export type UnitType = 'room' | 'flat' | 'studio' | 'suite' | 'office' | 'other'
export type UnitStatus = 'occupied' | 'vacant' | 'under_works' | 'reserved'

export type TenancyStatus = 'pending' | 'active' | 'ended' | 'disputed' | 'surrendered'
export type TenancyType = 'ast' | 'periodic' | 'contractual' | 'lodger' | 'commercial' | 'hmo_room'
export type RentFrequency = 'weekly' | 'monthly' | 'quarterly' | 'annually'
export type DepositHeldBy = 'landlord' | 'scheme' | 'agent'

export type ContactType =
  | 'landlord'
  | 'tenant'
  | 'post_tenant'
  | 'applicant'
  | 'guarantor'
  | 'supplier'
  | 'agent'
  | 'local_authority'
  | 'housing_association'
  | 'legal'
  | 'accountant'
  | 'insurer'
  | 'utility_provider'
  | 'broadband'
  | 'cleaning'
  | 'maintenance'
  | 'emergency_contractor'
  | 'investor'
  | 'affiliate'
  | 'other'
export type ContactStatus = 'active' | 'inactive' | 'archived'

export type TaskStatus = 'todo' | 'in_progress' | 'waiting' | 'blocked' | 'done' | 'cancelled'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export type JobStatus =
  | 'new'
  | 'scoped'
  | 'supplier_requested'
  | 'quote_received'
  | 'approved'
  | 'scheduled'
  | 'in_progress'
  | 'complete'
  | 'invoiced'
  | 'closed'
  | 'disputed'
export type JobPriority = 'low' | 'medium' | 'high' | 'urgent'

export type PlanningSetStatus = 'draft' | 'active' | 'paused' | 'converted' | 'archived'
export type LandlordOfferStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'negotiating' | 'expired'

export type IncomeStatus = 'expected' | 'received' | 'late' | 'partial' | 'void'
export type ExpenseStatus = 'draft' | 'pending' | 'paid' | 'void'
export type InvoiceType = 'outbound' | 'supplier'
export type InvoiceStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'approved'
  | 'due'
  | 'overdue'
  | 'paid'
  | 'disputed'
  | 'cancelled'

export type CalendarEventType =
  | 'task_due'
  | 'job_scheduled'
  | 'tenancy_start'
  | 'tenancy_end'
  | 'rent_due'
  | 'invoice_due'
  | 'planning_deadline'
  | 'contact_followup'
  | 'inspection'
  | 'viewing'
  | 'custom'

export type MessageSenderType = 'user' | 'contact' | 'ai' | 'system'
export type AiRole = 'user' | 'assistant' | 'system'

export type SupplierJobStatus = 'assigned' | 'acknowledged' | 'in_progress' | 'complete' | 'invoiced'
export type SupplierInvoiceStatus = 'submitted' | 'reviewing' | 'approved' | 'rejected' | 'paid'

export type AffiliateStatus = 'pending' | 'active' | 'suspended' | 'closed'
export type AffiliateReferralStatus = 'signed_up' | 'trial' | 'converted' | 'churned'
export type AffiliateCommissionStatus = 'pending' | 'approved' | 'paid' | 'void'

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'task' | 'message' | 'payment' | 'ai'

// ============================================================
// TABLE ROW TYPES
// ============================================================

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  phone: string | null
  role: UserRole
  onboarding_completed: boolean
  onboarding_step: number | null
  created_at: string
  updated_at: string
}

export interface Workspace {
  id: string
  name: string
  slug: string | null
  owner_id: string
  plan: WorkspacePlan
  plan_status: WorkspacePlanStatus
  trial_ends_at: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  demo_data_loaded: boolean
  demo_data_variant: string | null
  settings: Json
  created_at: string
  updated_at: string
}

export interface WorkspaceMember {
  id: string
  workspace_id: string
  user_id: string
  role: WorkspaceMemberRole
  invited_by: string | null
  joined_at: string
}

export interface Property {
  id: string
  workspace_id: string
  name: string
  address_line1: string | null
  address_line2: string | null
  city: string | null
  county: string | null
  postcode: string | null
  country: string
  latitude: number | null
  longitude: number | null
  property_type: PropertyType | null
  operation_profile: OperationProfile | null
  /** Free-text dwelling type stored in `properties.category` (see lib/constants/propertyTypes.ts). */
  category: string | null
  status: PropertyStatus
  bedrooms: number | null
  bathrooms: number | null
  floor_area_sqm: number | null
  purchase_price: number | null
  current_value: number | null
  monthly_mortgage: number | null
  target_rent: number | null
  notes: string | null
  is_demo: boolean
  cover_image_url: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface PropertyUnit {
  id: string
  workspace_id: string
  property_id: string
  unit_name: string
  unit_type: UnitType | null
  floor: number | null
  bedrooms: number
  bathrooms: number
  floor_area_sqm: number | null
  target_rent: number | null
  status: UnitStatus
  is_demo: boolean
  created_at: string
  updated_at: string
}

export interface Tenancy {
  id: string
  workspace_id: string
  property_id: string
  unit_id: string | null
  tenant_contact_id: string | null
  start_date: string
  end_date: string | null
  rent_amount: number
  deposit_amount: number | null
  deposit_held_by: DepositHeldBy | null
  deposit_scheme: string | null
  deposit_reference: string | null
  rent_frequency: RentFrequency
  status: TenancyStatus
  tenancy_type: TenancyType | null
  reference: string | null
  notes: string | null
  is_demo: boolean
  created_at: string
  updated_at: string
}

export interface Contact {
  id: string
  workspace_id: string
  contact_type: ContactType
  full_name: string
  email: string | null
  phone: string | null
  company_name: string | null
  address_line1: string | null
  city: string | null
  postcode: string | null
  notes: string | null
  tags: string[] | null
  /** Supplier primary service category (free-text, `contacts.category`). */
  category: string | null
  /** Supplier service sub-category (free-text, `contacts.subcategory`). */
  subcategory: string | null
  status: ContactStatus
  is_demo: boolean
  avatar_url: string | null
  /** Namespaced type-specific detail (supplier/enquiry/tenant/landlord/professional). */
  metadata: Json | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  workspace_id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  category: string | null
  property_id: string | null
  contact_id: string | null
  assigned_to: string | null
  due_date: string | null
  scheduled_start: string | null
  scheduled_end: string | null
  completed_at: string | null
  estimated_cost: number | null
  actual_cost: number | null
  metadata: Json | null
  is_demo: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Job {
  id: string
  workspace_id: string
  title: string
  description: string | null
  status: JobStatus
  priority: JobPriority
  category: string | null
  property_id: string | null
  contact_id: string | null
  supplier_contact_id: string | null
  assigned_to: string | null
  scheduled_date: string | null
  completed_date: string | null
  quoted_amount: number | null
  approved_amount: number | null
  invoiced_amount: number | null
  reference: string | null
  notes: string | null
  is_demo: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface PlanningSet {
  id: string
  workspace_id: string
  title: string
  operation_profile: OperationProfile
  status: PlanningSetStatus
  property_id: string | null
  address: string | null
  postcode: string | null
  gross_monthly_income: number
  gross_annual_income: number
  total_monthly_expenses: number
  net_monthly_income: number
  net_annual_income: number
  gross_yield: number
  net_yield: number
  roi: number
  upfront_cash_required: number
  breakeven_month: number
  risk_score: number
  notes: string | null
  is_demo: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface PlanningAssumptions {
  id: string
  planning_set_id: string
  property_purchase_price: number | null
  property_value: number | null
  monthly_mortgage: number | null
  landlord_monthly_rent: number | null
  contract_length_months: number | null
  break_clause_months: number | null
  rent_review_months: number | null
  void_allowance_pct: number
  management_fee_pct: number
  occupancy_rate_pct: number
  average_daily_rate: number | null
  created_at: string
  updated_at: string
}

export interface PlanningIncomeLine {
  id: string
  planning_set_id: string
  label: string
  monthly_amount: number
  source: string | null
  notes: string | null
  sort_order: number
}

export interface PlanningRoomLine {
  id: string
  planning_set_id: string
  room_label: string
  room_type: string
  monthly_rent: number
  bills_included: boolean
  notes: string | null
  sort_order: number
}

export interface PlanningExpenseLine {
  id: string
  planning_set_id: string
  label: string
  monthly_amount: number
  category: string | null
  notes: string | null
  sort_order: number
}

export interface PlanningBillLine {
  id: string
  planning_set_id: string
  label: string
  monthly_amount: number
  provider: string | null
  notes: string | null
  sort_order: number
}

export interface PlanningUpfrontCost {
  id: string
  planning_set_id: string
  label: string
  amount: number
  category: string | null
  notes: string | null
  sort_order: number
}

export interface PlanningLandlordOffer {
  id: string
  workspace_id: string
  planning_set_id: string | null
  landlord_contact_id: string | null
  property_address: string
  proposed_rent: number
  proposed_term_months: number | null
  break_clause_months: number | null
  management_fee_included: boolean
  bills_included: boolean
  notes: string | null
  status: LandlordOfferStatus
  sent_at: string | null
  responded_at: string | null
  is_demo: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface IncomeRecord {
  id: string
  workspace_id: string
  property_id: string | null
  tenancy_id: string | null
  contact_id: string | null
  category: string
  description: string | null
  amount: number
  currency: string
  date: string
  status: IncomeStatus
  reference: string | null
  notes: string | null
  is_demo: boolean
  created_by: string | null
  created_at: string
}

export interface ExpenseRecord {
  id: string
  workspace_id: string
  property_id: string | null
  job_id: string | null
  contact_id: string | null
  category: string
  description: string | null
  amount: number
  currency: string
  date: string
  status: ExpenseStatus
  reference: string | null
  receipt_url: string | null
  notes: string | null
  is_demo: boolean
  created_by: string | null
  created_at: string
}

export interface Invoice {
  id: string
  workspace_id: string
  invoice_number: string | null
  contact_id: string | null
  property_id: string | null
  job_id: string | null
  invoice_type: InvoiceType
  issue_date: string
  due_date: string | null
  subtotal: number
  tax_amount: number
  total: number
  currency: string
  status: InvoiceStatus
  paid_at: string | null
  paid_amount: number | null
  notes: string | null
  is_demo: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface CalendarEvent {
  id: string
  workspace_id: string
  title: string
  description: string | null
  event_type: CalendarEventType
  start_at: string
  end_at: string | null
  all_day: boolean
  property_id: string | null
  contact_id: string | null
  task_id: string | null
  job_id: string | null
  is_demo: boolean
  created_by: string | null
  created_at: string
}

export interface Conversation {
  id: string
  workspace_id: string
  contact_id: string | null
  subject: string | null
  last_message_at: string | null
  unread_count: number
  is_demo: boolean
  created_at: string
}

export interface Message {
  id: string
  conversation_id: string
  workspace_id: string
  sender_id: string | null
  sender_type: MessageSenderType
  body: string
  read_at: string | null
  is_demo: boolean
  created_at: string
}

export interface AiChatThread {
  id: string
  workspace_id: string
  user_id: string
  title: string | null
  context_route: string | null
  context_record_id: string | null
  created_at: string
  updated_at: string
}

export interface AiChatMessage {
  id: string
  thread_id: string
  workspace_id: string
  role: AiRole
  content: string
  created_at: string
}

export interface AiActionLog {
  id: string
  workspace_id: string
  user_id: string
  action_type: string
  context: Json | null
  result: Json | null
  approved: boolean | null
  approved_at: string | null
  created_at: string
}

export interface SupplierPortalAccess {
  id: string
  workspace_id: string
  contact_id: string
  user_id: string | null
  active: boolean
  created_at: string
}

export interface SupplierJob {
  id: string
  workspace_id: string
  job_id: string
  supplier_contact_id: string
  status: SupplierJobStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export interface SupplierInvoice {
  id: string
  workspace_id: string
  supplier_job_id: string | null
  contact_id: string
  invoice_number: string | null
  amount: number
  currency: string
  status: SupplierInvoiceStatus
  submitted_at: string
  approved_at: string | null
  paid_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Affiliate {
  id: string
  user_id: string
  code: string
  status: AffiliateStatus
  commission_rate: number
  payout_email: string | null
  notes: string | null
  approved_at: string | null
  created_at: string
  updated_at: string
}

export interface AffiliateClick {
  id: string
  affiliate_id: string
  ip_hash: string | null
  referrer: string | null
  created_at: string
}

export interface AffiliateReferral {
  id: string
  affiliate_id: string
  referred_user_id: string | null
  workspace_id: string | null
  status: AffiliateReferralStatus
  converted_at: string | null
  created_at: string
}

export interface AffiliateCommission {
  id: string
  affiliate_id: string
  referral_id: string
  amount: number
  currency: string
  period_start: string | null
  period_end: string | null
  status: AffiliateCommissionStatus
  approved_at: string | null
  paid_at: string | null
  created_at: string
}

export interface Document {
  id: string
  workspace_id: string
  name: string
  file_path: string | null
  file_url: string | null
  file_size: number | null
  mime_type: string | null
  category: string | null
  property_id: string | null
  contact_id: string | null
  tenancy_id: string | null
  job_id: string | null
  planning_set_id: string | null
  is_demo: boolean
  uploaded_by: string | null
  created_at: string
}

export interface Subscription {
  id: string
  workspace_id: string
  stripe_subscription_id: string | null
  stripe_customer_id: string | null
  plan: string
  status: string
  current_period_start: string | null
  current_period_end: string | null
  cancel_at: string | null
  canceled_at: string | null
  created_at: string
  updated_at: string
}

export interface AuditLog {
  id: string
  workspace_id: string | null
  user_id: string | null
  action: string
  resource_type: string | null
  resource_id: string | null
  old_data: Json | null
  new_data: Json | null
  ip_address: string | null
  created_at: string
}

export interface ActivityLog {
  id: string
  workspace_id: string
  user_id: string | null
  action: string
  description: string | null
  resource_type: string | null
  resource_id: string | null
  metadata: Json | null
  is_demo: boolean
  created_at: string
}

export interface Notification {
  id: string
  workspace_id: string
  user_id: string
  title: string
  body: string | null
  type: NotificationType
  resource_type: string | null
  resource_id: string | null
  read_at: string | null
  created_at: string
}

export interface FeatureFlag {
  id: string
  flag_key: string
  enabled: boolean
  description: string | null
  updated_at: string
}

// ============================================================
// INSERT TYPES
// ============================================================

export type InsertProfile = Omit<Profile, 'created_at' | 'updated_at'>
export type InsertWorkspace = Omit<Workspace, 'id' | 'created_at' | 'updated_at'>
export type InsertWorkspaceMember = Omit<WorkspaceMember, 'id' | 'joined_at'>

export interface InsertProperty {
  workspace_id: string
  name: string
  status: PropertyStatus
  is_demo: boolean
  country?: string
  address_line1?: string | null
  address_line2?: string | null
  city?: string | null
  county?: string | null
  postcode?: string | null
  latitude?: number | null
  longitude?: number | null
  property_type?: PropertyType | null
  operation_profile?: OperationProfile | null
  bedrooms?: number | null
  bathrooms?: number | null
  floor_area_sqm?: number | null
  purchase_price?: number | null
  current_value?: number | null
  monthly_mortgage?: number | null
  target_rent?: number | null
  notes?: string | null
  cover_image_url?: string | null
  created_by?: string | null
}

export interface InsertPropertyUnit {
  workspace_id: string
  property_id: string
  unit_name: string
  bedrooms: number
  bathrooms: number
  status: UnitStatus
  is_demo: boolean
  unit_type?: UnitType | null
  floor?: number | null
  floor_area_sqm?: number | null
  target_rent?: number | null
}

export interface InsertTenancy {
  workspace_id: string
  property_id: string
  start_date: string
  rent_amount: number
  rent_frequency: RentFrequency
  status: TenancyStatus
  is_demo: boolean
  unit_id?: string | null
  tenant_contact_id?: string | null
  end_date?: string | null
  deposit_amount?: number | null
  deposit_held_by?: DepositHeldBy | null
  deposit_scheme?: string | null
  deposit_reference?: string | null
  tenancy_type?: TenancyType | null
  reference?: string | null
  notes?: string | null
}

export interface InsertContact {
  workspace_id: string
  contact_type: ContactType
  full_name: string
  email?: string | null
  status: ContactStatus
  is_demo: boolean
  phone?: string | null
  company_name?: string | null
  address_line1?: string | null
  city?: string | null
  postcode?: string | null
  notes?: string | null
  tags?: string[] | null
  avatar_url?: string | null
  metadata?: Json | null
  created_by?: string | null
}

export interface InsertTask {
  workspace_id: string
  title: string
  status: TaskStatus
  priority: TaskPriority
  is_demo: boolean
  description?: string | null
  category?: string | null
  property_id?: string | null
  contact_id?: string | null
  assigned_to?: string | null
  due_date?: string | null
  scheduled_start?: string | null
  completed_at?: string | null
  estimated_cost?: number | null
  actual_cost?: number | null
  metadata?: Json | null
  created_by?: string | null
}

export interface InsertJob {
  workspace_id: string
  title: string
  status: JobStatus
  priority: JobPriority
  is_demo: boolean
  description?: string | null
  category?: string | null
  property_id?: string | null
  contact_id?: string | null
  supplier_contact_id?: string | null
  assigned_to?: string | null
  scheduled_date?: string | null
  completed_date?: string | null
  quoted_amount?: number | null
  approved_amount?: number | null
  invoiced_amount?: number | null
  reference?: string | null
  notes?: string | null
  created_by?: string | null
}

export interface InsertPlanningSet {
  workspace_id: string
  title: string
  operation_profile: OperationProfile
  status: PlanningSetStatus
  gross_monthly_income: number
  gross_annual_income: number
  total_monthly_expenses: number
  net_monthly_income: number
  net_annual_income: number
  gross_yield: number
  net_yield: number
  roi: number
  upfront_cash_required: number
  breakeven_month: number
  risk_score: number
  is_demo: boolean
  property_id?: string | null
  address?: string | null
  postcode?: string | null
  notes?: string | null
  created_by?: string | null
}

export interface InsertPlanningAssumptions {
  planning_set_id: string
  void_allowance_pct: number
  management_fee_pct: number
  occupancy_rate_pct: number
  property_purchase_price?: number | null
  property_value?: number | null
  monthly_mortgage?: number | null
  landlord_monthly_rent?: number | null
  contract_length_months?: number | null
  break_clause_months?: number | null
  rent_review_months?: number | null
  average_daily_rate?: number | null
}

export interface InsertPlanningIncomeLine {
  planning_set_id: string
  label: string
  monthly_amount: number
  sort_order: number
  source?: string | null
  notes?: string | null
}

export interface InsertPlanningRoomLine {
  planning_set_id: string
  room_label: string
  room_type: string
  monthly_rent: number
  bills_included: boolean
  sort_order: number
  notes?: string | null
}

export interface InsertPlanningExpenseLine {
  planning_set_id: string
  label: string
  monthly_amount: number
  sort_order: number
  category?: string | null
  notes?: string | null
}

export interface InsertPlanningBillLine {
  planning_set_id: string
  label: string
  monthly_amount: number
  sort_order: number
  provider?: string | null
  notes?: string | null
}

export interface InsertPlanningUpfrontCost {
  planning_set_id: string
  label: string
  amount: number
  sort_order: number
  category?: string | null
  notes?: string | null
}

export type InsertPlanningLandlordOffer = Omit<PlanningLandlordOffer, 'id' | 'created_at' | 'updated_at'>
export interface InsertIncomeRecord {
  workspace_id: string
  category: string
  amount: number
  currency: string
  date: string
  status: IncomeStatus
  is_demo: boolean
  property_id?: string | null
  tenancy_id?: string | null
  contact_id?: string | null
  description?: string | null
  reference?: string | null
  notes?: string | null
  created_by?: string | null
}

export interface InsertExpenseRecord {
  workspace_id: string
  category: string
  amount: number
  currency: string
  date: string
  status: ExpenseStatus
  is_demo: boolean
  property_id?: string | null
  job_id?: string | null
  contact_id?: string | null
  description?: string | null
  reference?: string | null
  receipt_url?: string | null
  notes?: string | null
  created_by?: string | null
}

export interface InsertInvoice {
  workspace_id: string
  invoice_type: InvoiceType
  issue_date: string
  subtotal: number
  tax_amount: number
  total: number
  currency: string
  status: InvoiceStatus
  is_demo: boolean
  invoice_number?: string | null
  contact_id?: string | null
  property_id?: string | null
  job_id?: string | null
  due_date?: string | null
  paid_at?: string | null
  paid_amount?: number | null
  notes?: string | null
  created_by?: string | null
}
export interface InsertCalendarEvent {
  workspace_id: string
  title: string
  event_type: CalendarEventType
  start_at: string
  is_demo: boolean
  description?: string | null
  end_at?: string | null
  all_day?: boolean
  property_id?: string | null
  contact_id?: string | null
  task_id?: string | null
  job_id?: string | null
  created_by?: string | null
}

export type InsertConversation = Omit<Conversation, 'id' | 'created_at'>

export interface InsertMessage {
  conversation_id: string
  workspace_id: string
  sender_type: MessageSenderType
  body: string
  is_demo: boolean
  sender_id?: string | null
  read_at?: string | null
  created_at?: string
}
export type InsertAiChatThread = Omit<AiChatThread, 'id' | 'created_at' | 'updated_at'>
export type InsertAiChatMessage = Omit<AiChatMessage, 'id' | 'created_at'>
export type InsertAiActionLog = Omit<AiActionLog, 'id' | 'created_at'>
export type InsertDocument = Omit<Document, 'id' | 'created_at'>
export type InsertNotification = Omit<Notification, 'id' | 'created_at'>

// ============================================================
// UPDATE TYPES (all fields optional except id)
// ============================================================

export type UpdateProfile = Partial<InsertProfile>
export type UpdateWorkspace = Partial<InsertWorkspace>
export type UpdateProperty = Partial<InsertProperty>
export type UpdatePropertyUnit = Partial<InsertPropertyUnit>
export type UpdateTenancy = Partial<InsertTenancy>
export type UpdateContact = Partial<InsertContact>
export type UpdateTask = Partial<InsertTask>
export type UpdateJob = Partial<InsertJob>
export type UpdatePlanningSet = Partial<InsertPlanningSet>
export type UpdateInvoice = Partial<InsertInvoice>
export type UpdateIncomeRecord = Partial<InsertIncomeRecord>
export type UpdateExpenseRecord = Partial<InsertExpenseRecord>

// ============================================================
// DATABASE TYPE MAP (for Supabase generics)
// ============================================================

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: InsertProfile
        Update: UpdateProfile
      }
      workspaces: {
        Row: Workspace
        Insert: InsertWorkspace
        Update: UpdateWorkspace
      }
      workspace_members: {
        Row: WorkspaceMember
        Insert: InsertWorkspaceMember
        Update: Partial<InsertWorkspaceMember>
      }
      properties: {
        Row: Property
        Insert: InsertProperty
        Update: UpdateProperty
      }
      property_units: {
        Row: PropertyUnit
        Insert: InsertPropertyUnit
        Update: UpdatePropertyUnit
      }
      tenancies: {
        Row: Tenancy
        Insert: InsertTenancy
        Update: UpdateTenancy
      }
      contacts: {
        Row: Contact
        Insert: InsertContact
        Update: UpdateContact
      }
      tasks: {
        Row: Task
        Insert: InsertTask
        Update: UpdateTask
      }
      jobs: {
        Row: Job
        Insert: InsertJob
        Update: UpdateJob
      }
      planning_sets: {
        Row: PlanningSet
        Insert: InsertPlanningSet
        Update: UpdatePlanningSet
      }
      planning_assumptions: {
        Row: PlanningAssumptions
        Insert: InsertPlanningAssumptions
        Update: Partial<InsertPlanningAssumptions>
      }
      planning_income_lines: {
        Row: PlanningIncomeLine
        Insert: InsertPlanningIncomeLine
        Update: Partial<InsertPlanningIncomeLine>
      }
      planning_room_lines: {
        Row: PlanningRoomLine
        Insert: InsertPlanningRoomLine
        Update: Partial<InsertPlanningRoomLine>
      }
      planning_expense_lines: {
        Row: PlanningExpenseLine
        Insert: InsertPlanningExpenseLine
        Update: Partial<InsertPlanningExpenseLine>
      }
      planning_bill_lines: {
        Row: PlanningBillLine
        Insert: InsertPlanningBillLine
        Update: Partial<InsertPlanningBillLine>
      }
      planning_upfront_costs: {
        Row: PlanningUpfrontCost
        Insert: InsertPlanningUpfrontCost
        Update: Partial<InsertPlanningUpfrontCost>
      }
      planning_landlord_offers: {
        Row: PlanningLandlordOffer
        Insert: InsertPlanningLandlordOffer
        Update: Partial<InsertPlanningLandlordOffer>
      }
      income_records: {
        Row: IncomeRecord
        Insert: InsertIncomeRecord
        Update: UpdateIncomeRecord
      }
      expense_records: {
        Row: ExpenseRecord
        Insert: InsertExpenseRecord
        Update: UpdateExpenseRecord
      }
      invoices: {
        Row: Invoice
        Insert: InsertInvoice
        Update: UpdateInvoice
      }
      calendar_events: {
        Row: CalendarEvent
        Insert: InsertCalendarEvent
        Update: Partial<InsertCalendarEvent>
      }
      conversations: {
        Row: Conversation
        Insert: InsertConversation
        Update: Partial<InsertConversation>
      }
      messages: {
        Row: Message
        Insert: InsertMessage
        Update: Partial<InsertMessage>
      }
      ai_chat_threads: {
        Row: AiChatThread
        Insert: InsertAiChatThread
        Update: Partial<InsertAiChatThread>
      }
      ai_chat_messages: {
        Row: AiChatMessage
        Insert: InsertAiChatMessage
        Update: Partial<InsertAiChatMessage>
      }
      ai_action_logs: {
        Row: AiActionLog
        Insert: InsertAiActionLog
        Update: Partial<InsertAiActionLog>
      }
      supplier_portal_access: {
        Row: SupplierPortalAccess
        Insert: Omit<SupplierPortalAccess, 'id' | 'created_at'>
        Update: Partial<Omit<SupplierPortalAccess, 'id' | 'created_at'>>
      }
      supplier_jobs: {
        Row: SupplierJob
        Insert: Omit<SupplierJob, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<SupplierJob, 'id' | 'created_at' | 'updated_at'>>
      }
      supplier_invoices: {
        Row: SupplierInvoice
        Insert: Omit<SupplierInvoice, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<SupplierInvoice, 'id' | 'created_at' | 'updated_at'>>
      }
      affiliates: {
        Row: Affiliate
        Insert: Omit<Affiliate, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Affiliate, 'id' | 'created_at' | 'updated_at'>>
      }
      affiliate_clicks: {
        Row: AffiliateClick
        Insert: Omit<AffiliateClick, 'id' | 'created_at'>
        Update: Partial<Omit<AffiliateClick, 'id' | 'created_at'>>
      }
      affiliate_referrals: {
        Row: AffiliateReferral
        Insert: Omit<AffiliateReferral, 'id' | 'created_at'>
        Update: Partial<Omit<AffiliateReferral, 'id' | 'created_at'>>
      }
      affiliate_commissions: {
        Row: AffiliateCommission
        Insert: Omit<AffiliateCommission, 'id' | 'created_at'>
        Update: Partial<Omit<AffiliateCommission, 'id' | 'created_at'>>
      }
      documents: {
        Row: Document
        Insert: InsertDocument
        Update: Partial<InsertDocument>
      }
      subscriptions: {
        Row: Subscription
        Insert: Omit<Subscription, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Subscription, 'id' | 'created_at' | 'updated_at'>>
      }
      audit_logs: {
        Row: AuditLog
        Insert: Omit<AuditLog, 'id' | 'created_at'>
        Update: never
      }
      activity_logs: {
        Row: ActivityLog
        Insert: Omit<ActivityLog, 'id' | 'created_at'>
        Update: never
      }
      notifications: {
        Row: Notification
        Insert: InsertNotification
        Update: Partial<InsertNotification>
      }
      feature_flags: {
        Row: FeatureFlag
        Insert: Omit<FeatureFlag, 'id'>
        Update: Partial<Omit<FeatureFlag, 'id'>>
      }
    }
    Views: Record<string, never>
    Functions: {
      is_workspace_member: {
        Args: { ws_id: string }
        Returns: boolean
      }
      seed_demo_workspace: {
        Args: { p_workspace_id: string; p_user_id: string }
        Returns: string
      }
      seed_full_demo_workspace: {
        Args: { p_workspace_id: string; p_user_id: string }
        Returns: string
      }
      delete_demo_data: {
        Args: { p_workspace_id: string; p_preserve_edited?: boolean }
        Returns: undefined
      }
      reset_demo_data: {
        Args: { p_workspace_id: string }
        Returns: undefined
      }
      demo_data_status: {
        Args: { p_workspace_id: string }
        Returns: Json
      }
      user_workspace_ids: {
        Args: Record<string, never>
        Returns: string[]
      }
      is_platform_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
      get_workspace_portfolio_summary: {
        Args: { ws_id: string }
        Returns: Json
      }
    }
    Enums: Record<string, never>
  }
}
