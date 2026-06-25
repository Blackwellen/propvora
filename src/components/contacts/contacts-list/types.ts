export type ViewMode = "overview" | "grid" | "list" | "table"
export type TypeFilter = "all" | "tenants" | "landlords" | "suppliers" | "applicants" | "past_tenants" | "professionals" | "other"

export interface MappedContact {
  id: string
  workspace_id: string
  is_demo: boolean
  full_name: string
  email: string | null
  phone: string | null
  contact_type: string
  status: string
  company_name: string | null
  city: string | null
  tags: string[]
  service_categories: string[]
  updated_at: string
}

export const TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  tenant:               { label: "Tenant",         cls: "bg-emerald-100 text-emerald-700" },
  post_tenant:          { label: "Past Tenant",    cls: "bg-slate-100 text-slate-600" },
  applicant:            { label: "Applicant",      cls: "bg-sky-100 text-sky-700" },
  landlord:             { label: "Landlord",       cls: "bg-blue-100 text-blue-700" },
  owner:                { label: "Landlord",       cls: "bg-blue-100 text-blue-700" },
  guarantor:            { label: "Guarantor",      cls: "bg-violet-100 text-violet-700" },
  supplier:             { label: "Supplier",       cls: "bg-amber-100 text-amber-700" },
  maintenance:          { label: "Maintenance",    cls: "bg-amber-100 text-amber-700" },
  cleaning:             { label: "Cleaner",        cls: "bg-amber-100 text-amber-700" },
  emergency_contractor: { label: "Emergency",      cls: "bg-red-100 text-red-700" },
  agent:                { label: "Agent",          cls: "bg-violet-100 text-violet-700" },
  local_authority:      { label: "Local Auth",     cls: "bg-teal-100 text-teal-700" },
  housing_association:  { label: "Housing Assoc",  cls: "bg-teal-100 text-teal-700" },
  legal:                { label: "Solicitor",      cls: "bg-blue-100 text-blue-700" },
  accountant:           { label: "Accountant",     cls: "bg-emerald-100 text-emerald-700" },
  insurer:              { label: "Insurer",        cls: "bg-red-100 text-red-700" },
  utility_provider:     { label: "Utility",        cls: "bg-amber-100 text-amber-700" },
  broadband:            { label: "Broadband",      cls: "bg-indigo-100 text-indigo-700" },
  investor:             { label: "Investor",       cls: "bg-violet-100 text-violet-700" },
  affiliate:            { label: "Affiliate",      cls: "bg-sky-100 text-sky-700" },
  other:                { label: "Other",          cls: "bg-slate-100 text-slate-600" },
}

export const PIE_COLOURS: Record<string, string> = {
  tenant:      "#10B981",
  landlord:    "#2563EB",
  owner:       "#2563EB",
  supplier:    "#F59E0B",
  applicant:   "#0EA5E9",
  post_tenant: "#64748B",
  agent:       "#7C3AED",
  other:       "#94A3B8",
}

export const TYPE_FILTER_MAP: Record<TypeFilter, string[]> = {
  all:          [],
  tenants:      ["tenant"],
  landlords:    ["landlord","owner"],
  suppliers:    ["supplier","maintenance","cleaning","emergency_contractor"],
  applicants:   ["applicant"],
  past_tenants: ["post_tenant"],
  professionals:["legal","accountant","insurer","agent","local_authority","housing_association","investor","affiliate"],
  other:        ["other","guarantor","broadband","utility_provider"],
}

export const TYPE_CHIPS: { key: TypeFilter; label: string }[] = [
  { key: "all",           label: "All" },
  { key: "tenants",       label: "Tenants" },
  { key: "landlords",     label: "Landlords" },
  { key: "suppliers",     label: "Suppliers" },
  { key: "applicants",    label: "Applicants" },
  { key: "past_tenants",  label: "Past Tenants" },
  { key: "professionals", label: "Professionals" },
  { key: "other",         label: "Other" },
]

export const AVATAR_BG = ["bg-blue-500","bg-emerald-500","bg-violet-500","bg-amber-500","bg-rose-500","bg-cyan-500","bg-indigo-500","bg-teal-500"]

export function avatarBg(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_BG[Math.abs(h) % AVATAR_BG.length]
}

export function getInitials(name: string): string {
  const p = name.trim().split(/\s+/)
  return p.length === 1 ? p[0].slice(0, 2).toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase()
}

export function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

export function relativeTime(d: string): string {
  const diff = Date.now() - new Date(d).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return "Today"
  if (days === 1) return "Yesterday"
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}
