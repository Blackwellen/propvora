import { Check, Minus } from "lucide-react"
import { getPlans, type PlanTier } from "@/lib/billing/plans"

const plans = getPlans()
const tiers = plans.map((p) => p.tier)

type Cell = boolean | string

/**
 * Comparison rows. Numeric/limit rows are derived from the canonical plan
 * definitions (src/lib/billing/plans.ts). Capability rows use a per-tier
 * availability map reflecting plan entitlements — booleans render as ticks.
 */
interface Row {
  label: string
  values: Record<PlanTier, Cell>
}

function limit(get: (tier: PlanTier) => Cell): Record<PlanTier, Cell> {
  return tiers.reduce((acc, t) => {
    acc[t] = get(t)
    return acc
  }, {} as Record<PlanTier, Cell>)
}

const byTier = Object.fromEntries(plans.map((p) => [p.tier, p])) as Record<
  PlanTier,
  (typeof plans)[number]
>

const ROWS: Row[] = [
  {
    label: "Properties",
    values: limit((t) =>
      byTier[t].features.properties === "Unlimited"
        ? "Unlimited"
        : String(byTier[t].features.properties)
    ),
  },
  {
    label: "Team seats",
    values: limit((t) =>
      byTier[t].features.teamSeats === "Unlimited"
        ? "Unlimited"
        : String(byTier[t].features.teamSeats)
    ),
  },
  {
    label: "Advanced reports",
    values: limit((t) => byTier[t].features.advancedReports),
  },
  {
    label: "AI Copilot",
    values: limit((t) => byTier[t].features.aiCopilot),
  },
  {
    label: "Automations",
    values: {
      starter: false,
      operator: "Lite",
      scale: true,
      pro_agency: true,
      enterprise: true,
    },
  },
  {
    label: "Supplier marketplace",
    values: {
      starter: true,
      operator: true,
      scale: true,
      pro_agency: true,
      enterprise: true,
    },
  },
  {
    label: "Booking pages",
    values: {
      starter: false,
      operator: "Add-on",
      scale: true,
      pro_agency: true,
      enterprise: true,
    },
  },
  {
    label: "Portals & accounting",
    values: {
      starter: false,
      operator: false,
      scale: true,
      pro_agency: true,
      enterprise: true,
    },
  },
  {
    label: "Client / multi-landlord workspaces",
    values: {
      starter: false,
      operator: false,
      scale: false,
      pro_agency: true,
      enterprise: true,
    },
  },
  {
    label: "White label",
    values: {
      starter: false,
      operator: false,
      scale: "Add-on",
      pro_agency: true,
      enterprise: true,
    },
  },
  {
    label: "API access",
    values: {
      starter: false,
      operator: false,
      scale: false,
      pro_agency: true,
      enterprise: true,
    },
  },
  {
    label: "SSO / SAML",
    values: {
      starter: false,
      operator: false,
      scale: false,
      pro_agency: false,
      enterprise: true,
    },
  },
  {
    label: "Custom integrations",
    values: {
      starter: false,
      operator: false,
      scale: false,
      pro_agency: false,
      enterprise: true,
    },
  },
  {
    label: "Priority support",
    values: {
      starter: false,
      operator: "Email",
      scale: "Phone & email",
      pro_agency: "Priority phone",
      enterprise: "Dedicated",
    },
  },
  {
    label: "SLA",
    values: {
      starter: false,
      operator: false,
      scale: false,
      pro_agency: false,
      enterprise: true,
    },
  },
]

function renderCell(value: Cell) {
  if (value === true) {
    return <Check className="h-4 w-4 text-emerald-500 mx-auto" aria-label="Included" />
  }
  if (value === false) {
    return <Minus className="h-4 w-4 text-slate-300 mx-auto" aria-label="Not included" />
  }
  return <span className="text-xs font-medium text-slate-700">{value}</span>
}

export default function FeatureComparisonTable() {
  return (
    <section className="py-20 bg-white border-t border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
            Compare every plan
          </h2>
          <p className="text-slate-600">
            A full breakdown of what&apos;s included on each plan.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse">
            <thead>
              <tr>
                <th className="text-left p-4 text-sm font-bold text-slate-900 align-bottom">
                  Feature
                </th>
                {plans.map((p) => (
                  <th
                    key={p.tier}
                    className={`p-4 text-center align-bottom ${
                      p.popular ? "bg-blue-50 rounded-t-xl" : ""
                    }`}
                  >
                    <div className="text-sm font-bold text-slate-900">{p.name}</div>
                    {p.popular && (
                      <div className="text-[10px] font-bold uppercase tracking-wide text-blue-600 mt-0.5">
                        Most popular
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, i) => (
                <tr key={row.label} className={i % 2 === 0 ? "bg-slate-50/60" : ""}>
                  <td className="p-4 text-sm text-slate-700 font-medium border-t border-slate-100">
                    {row.label}
                  </td>
                  {plans.map((p) => (
                    <td
                      key={p.tier}
                      className={`p-4 text-center border-t border-slate-100 ${
                        p.popular ? "bg-blue-50/60" : ""
                      }`}
                    >
                      {renderCell(row.values[p.tier])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
