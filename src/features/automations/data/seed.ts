import type { Recipe } from "./types"

export const SEED_FEATURED_RECIPES: Recipe[] = [
  { id: "fr1", name: "Lease Expiry Renewal Suite", category: "Leasing", tags: ["Leasing", "Tenancy"], badge: "Most popular", trigger: "Lease expiry", actionCount: 5, modules: ["Tenancies", "People", "Notifications"], timeSaved: "12 hrs/month", successRate: 98, difficulty: "Medium", reviewFirst: true, usedCount: 124 },
  { id: "fr2", name: "Maintenance Request Flow", category: "Maintenance", tags: ["Maintenance", "Jobs"], badge: "High impact", trigger: "New maintenance", actionCount: 6, modules: ["Jobs", "Suppliers", "Notifications"], timeSaved: "18 hrs/month", successRate: 96, difficulty: "Medium", reviewFirst: false, usedCount: 98 },
  { id: "fr3", name: "Rent Collection & Follow-up", category: "Finance", tags: ["Finance", "Arrears"], badge: "Time saver", trigger: "Rent overdue", actionCount: 4, modules: ["Finance", "People"], timeSaved: "9 hrs/month", successRate: 99, difficulty: "Easy", reviewFirst: true, usedCount: 142 },
  { id: "fr4", name: "Compliance Check Cycle", category: "Compliance", tags: ["Compliance", "Safety"], badge: "Risk reducer", trigger: "Certificate expiry", actionCount: 5, modules: ["Compliance", "Documents"], timeSaved: "7 hrs/month", successRate: 97, difficulty: "Hard", reviewFirst: true, usedCount: 76 },
]

export const SEED_RECIPES: Recipe[] = [
  { id: "r1", name: "Rent overdue → draft chase", category: "Finance", tags: ["Finance"], badge: "Popular", trigger: "Rent overdue", actionCount: 3, modules: ["Finance", "People"], timeSaved: "9 hrs/month", successRate: 99, difficulty: "Easy", reviewFirst: true, usedCount: 124 },
  { id: "r2", name: "Lease expiry → renewal offer", category: "Leasing", tags: ["Leasing"], trigger: "Lease expiry", actionCount: 5, modules: ["Tenancies", "Notifications"], timeSaved: "12 hrs/month", successRate: 98, difficulty: "Medium", reviewFirst: true, usedCount: 112 },
  { id: "r3", name: "New maintenance → triage & assign", category: "Maintenance", tags: ["Maintenance"], badge: "New", trigger: "New maintenance", actionCount: 4, modules: ["Jobs", "Suppliers"], timeSaved: "18 hrs/month", successRate: 96, difficulty: "Medium", reviewFirst: false, usedCount: 98 },
  { id: "r4", name: "Supplier invoice → coding check", category: "Finance", tags: ["Finance"], trigger: "Invoice received", actionCount: 3, modules: ["Finance"], timeSaved: "6 hrs/month", successRate: 94, difficulty: "Medium", reviewFirst: true, usedCount: 87 },
  { id: "r5", name: "Inspection due → schedule visit", category: "Compliance", tags: ["Compliance"], trigger: "Inspection due", actionCount: 2, modules: ["Compliance"], timeSaved: "5 hrs/month", successRate: 97, difficulty: "Easy", reviewFirst: true, usedCount: 64 },
  { id: "r6", name: "Tenant onboarding sequence", category: "Tenant Experience", tags: ["Onboarding"], badge: "Popular", trigger: "Tenancy created", actionCount: 6, modules: ["People", "Documents", "Notifications"], timeSaved: "10 hrs/month", successRate: 95, difficulty: "Hard", reviewFirst: false, usedCount: 58 },
  { id: "r7", name: "Lead enquiry → auto response", category: "Communications", tags: ["Leads"], trigger: "Lead enquiry", actionCount: 2, modules: ["People", "Notifications"], timeSaved: "8 hrs/month", successRate: 99, difficulty: "Easy", reviewFirst: false, usedCount: 51 },
  { id: "r8", name: "Vendor statement → send monthly", category: "Reports", tags: ["Reports", "Finance"], trigger: "Schedule", actionCount: 3, modules: ["Finance", "Documents"], timeSaved: "4 hrs/month", successRate: 100, difficulty: "Easy", reviewFirst: false, usedCount: 44 },
]

export const SEED_AI_EXAMPLES = [
  "Rent arrears reminder sequence",
  "Maintenance request triage",
  "Lease expiry + renewal workflow",
  "Supplier invoice approval",
  "Tenant onboarding process",
]
