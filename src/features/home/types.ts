export interface HomeKpi {
  properties: number
  propertiesTrend: number
  units: number
  unitsTrend: number
  activeTenancies: number
  tenanciesTrend: number
  occupancyPct: number
  occupancyTrend: number
  rentCollected: number
  rentTrend: number
  openWork: number
  complianceDue: number
  arrears: number
  workTrend: number
}

export interface HomeProperty {
  id: string
  name: string
  city: string
  monthlyRent: number
  units: number
  risk: "High" | "Med" | "Low"
  occupancyPct: number
  gradient: string
  /** Resolved cover photo (cover_file_id → /api/files URL). Gradient shows when absent. */
  coverImageUrl?: string
  href?: string
  /* --- Extra fields so the home snapshot can render the canonical PropertyCard --- */
  address?: string
  postcode?: string
  type?: "HMO" | "BTL" | "SA" | "R2R" | "Commercial" | "Mixed" | "Holiday Let" | "Other"
  status?: "Active" | "Vacant" | "Under Works" | "Archived"
  occupied?: number
  tenants?: number
  operationProfile?: string
  category?: string | null
  bedrooms?: number
}

export interface HomeTenant {
  id: string
  name: string
  initials: string
  avatarColor: string
  property: string
  unit: string
  rent: number
  endDate: string
  depositStatus: "Paid" | "Protected" | "Pending"
  actionText: string
  href?: string
}

export interface HomeWorkItem {
  id: string
  title: string
  property: string
  unit: string
  dueLabel: string
  dueVariant: "red" | "amber" | "blue" | "slate"
  iconColor: string
  href?: string
}

export interface HomeMoneyData {
  income: number
  expenses: number
  netCashflow: number
}

export interface HomeEvent {
  id: string
  day: number
  month: string
  title: string
  subtitle: string
  timeOrAmount: string
  eventType?: string
  isAmount?: boolean
  href?: string
}

export interface HomeAiPriority {
  id: string
  num: number
  title: string
  subtitle: string
  action: string
  href?: string
}

export interface HomeActivity {
  id: string
  initials?: string
  avatarColor?: string
  isIcon?: boolean
  iconType?: string
  actionText: string
  entityName: string
  timeAgo: string
  href?: string
}

export interface HomePriorityItem {
  id: string
  title: string
  subtitle: string
  dueLabel: string
  urgency: "red" | "amber" | "blue"
  href: string
}

export interface HomeComplianceItem {
  id: string
  title: string
  type: "compliance" | "legal"
  dueDate: string
  status: "overdue" | "due-soon" | "ok"
  section: "compliance" | "legal"
}
