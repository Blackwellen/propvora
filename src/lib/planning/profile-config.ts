// ─── Profile Config ───────────────────────────────────────────────────────────
// Static commercial configuration for all 13 Planning Profile types.

export type RiskLevelType = "Low" | "Medium" | "High" | "Critical"
export type IntensityType = "Low" | "Medium" | "High"
export type LikelihoodType = "Low" | "Possible" | "Likely" | "High"
export type ImpactType = "Low" | "Medium" | "High" | "Severe"
export type PriorityType = "High" | "Medium" | "Low"
export type ScenarioType = "base" | "optimistic" | "conservative" | "stress"
export type CostType = "fixed" | "variable" | "percentage"
export type TrendType = "up" | "down" | "neutral"

export interface ProfileKpi {
  label: string
  value: string
  sublabel?: string
  trend?: TrendType
  highlight?: boolean
}

export interface ProfileConfig {
  key: string
  slug: string
  name: string
  tagline: string
  description: string
  icon: string
  accentColor: string
  bgColor: string
  number: number
  group: "residential" | "lease-managed" | "commercial" | "capital-strategy"
  groupLabel: string
  tags: string[]
  riskLevel: RiskLevelType
  managementIntensity: IntensityType
  complianceIntensity: IntensityType
  capitalIntensity: IntensityType
  primaryMetric: { label: string; value: string; sublabel: string }
  overviewKpis: ProfileKpi[]
  whoItSuits: string[]
  idealAssets: Array<{ icon: string; label: string; sub?: string }>
  advantages: string[]
  constraints: string[]
  bestMarket: string[]
  riskPosture: Array<{ label: string; level: RiskLevelType }>
  timeline: Array<{ label: string; sub: string; duration: string }>
  modelSnapshot: { label: string; lines: Array<{ label: string; value: string; highlight?: boolean }> }
  incomeModel: {
    type: string
    kpis: ProfileKpi[]
    structure: { label: string; description: string; lines: Array<{ label: string; formula: string; example: string }> }
    assumptions: Array<{ label: string; default: string; range: string }>
    exampleCalc: { inputs: Array<{ label: string; value: string }>; outputs: Array<{ label: string; value: string; highlight?: boolean }> }
    sensitivityNote: string
    benchmarkRanges: Array<{ label: string; low: string; mid: string; high: string }>
  }
  costDrivers: {
    kpis: ProfileKpi[]
    categories: Array<{ name: string; items: Array<{ label: string; typical: string; frequency: string; type: CostType }> }>
    sensitivityNote: string
    costControlTips: string[]
  }
  compliance: {
    score: number
    scoreLabel: string
    criticalCount: number
    requirements: Array<{ area: string; item: string; priority: PriorityType; required: boolean; renewal: string; estimatedCost: string; riskIfMissing: string }>
    upcomingDeadlines: Array<{ label: string; due: string; priority: PriorityType }>
    requiredDocs: string[]
    aiInsight: string
  }
  forecast: {
    scenarios: Array<{ name: string; type: ScenarioType; kpis: ProfileKpi[]; monthly: Array<{ month: string; income: number; costs: number; net: number }> }>
    baseKpis: ProfileKpi[]
    assumptions: Array<{ label: string; value: string }>
    sensitivityRows: Array<{ variable: string; base: string; upside: string; downside: string }>
    forecastNote: string
  }
  checklist: {
    phases: Array<{ name: string; tasks: Array<{ label: string; priority: PriorityType; owner: string; daysOffset: number }> }>
    criticalPathItems: string[]
  }
  risks: {
    overallRating: RiskLevelType
    totalExposureEstimate: string
    register: Array<{ name: string; category: string; likelihood: LikelihoodType; impact: ImpactType; score: number; mitigation: string; owner: string }>
    topByExposure: Array<{ label: string; exposure: string; level: RiskLevelType }>
    mitigationActions: string[]
  }
  aiQuestions: {
    suggestedQuestions: Array<{ question: string; category: string; insight: string }>
    keyDrivers: string[]
    quickStats: ProfileKpi[]
    recommendations: string[]
    confidenceScore: number
    confidenceLabel: string
  }
  quickActions: Array<{ label: string; sub: string; icon: string; action: string }>
  pros: string[]
  cons: string[]
}

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE 1 — LONG-TERM LET
// ─────────────────────────────────────────────────────────────────────────────
export const LONG_TERM_LET_CONFIG: ProfileConfig = {
  key: "long_term_let", slug: "long-term-let", name: "Long-Term Let", number: 1,
  tagline: "Stable residential income with predictable monthly cashflow",
  description: "Purchase or manage a residential property and let to a single household on an assured shorthold tenancy. The most common UK landlord model.",
  icon: "Home", accentColor: "#10B981", bgColor: "#ECFDF5",
  group: "residential", groupLabel: "Residential Rental",
  tags: ["Residential", "Low Risk", "Low Management", "Stable Income"],
  riskLevel: "Low", managementIntensity: "Low", complianceIntensity: "Medium", capitalIntensity: "Medium",
  primaryMetric: { label: "Typical Gross Yield", value: "4-7%", sublabel: "Single-let AST income" },
  overviewKpis: [
    { label: "Gross Yield", value: "4-7%", sublabel: "Market benchmark", trend: "neutral" },
    { label: "Net Yield", value: "3-5.5%", sublabel: "After costs", trend: "neutral" },
    { label: "Avg Monthly Rent", value: "850-1400 GBP", sublabel: "UK 2-bed average", trend: "up" },
    { label: "Typical Void Rate", value: "4-8%", sublabel: "Annual allowance", trend: "neutral" },
  ],
  whoItSuits: ["First-time landlords", "Portfolio builders", "Pension supplement investors", "Low-management preference investors", "Conservative risk appetite holders"],
  idealAssets: [
    { icon: "Home", label: "2-3 Bed Houses", sub: "Most lettable type" },
    { icon: "Building", label: "Flats/Apartments", sub: "Urban demand" },
    { icon: "Landmark", label: "Bungalows", sub: "Older tenant demand" },
  ],
  advantages: ["Stable predictable income", "Simpler management", "Lower compliance burden vs HMO", "Long-term capital appreciation", "Easy to understand for lenders"],
  constraints: ["Lower yield than room-based models", "Void risk on single tenant exit", "Interest rate sensitivity", "Rent regulation risk", "Capital appreciation varies by area"],
  bestMarket: ["Cities with strong employment base", "Commuter belt towns", "Regeneration areas", "University towns (whole house)"],
  riskPosture: [
    { label: "Tenant Arrears", level: "Medium" },
    { label: "Void Periods", level: "Medium" },
    { label: "Regulatory Change", level: "Low" },
    { label: "Repair Shocks", level: "Low" },
  ],
  timeline: [
    { label: "Setup", sub: "Find, offer, due diligence", duration: "4-8 weeks" },
    { label: "Legal & Finance", sub: "Mortgage, solicitors", duration: "6-10 weeks" },
    { label: "Pre-Let Compliance", sub: "Gas, EICR, EPC, AST", duration: "1-2 weeks" },
    { label: "Tenant Find", sub: "Marketing, referencing", duration: "2-4 weeks" },
    { label: "First Income", sub: "Rent receipt", duration: "Month 1" },
  ],
  modelSnapshot: {
    label: "Example Monthly P&L - 2-bed 220k property",
    lines: [
      { label: "Monthly Rent", value: "950 GBP" },
      { label: "Less Voids (5%)", value: "-47 GBP" },
      { label: "Less Agent Fee (10%)", value: "-90 GBP" },
      { label: "Less Maintenance Reserve", value: "-60 GBP" },
      { label: "Less Finance Cost", value: "-350 GBP" },
      { label: "Net Monthly Cashflow", value: "403 GBP", highlight: true },
      { label: "Annual Net Income", value: "4836 GBP" },
      { label: "Gross Yield", value: "5.2%" },
      { label: "Net Yield", value: "3.8%" },
    ],
  },
  incomeModel: {
    type: "AST Monthly Rent",
    kpis: [
      { label: "Gross Monthly Rent", value: "950 GBP", sublabel: "Market rent", trend: "neutral" },
      { label: "Void Allowance", value: "5%", sublabel: "570 GBP/yr", trend: "neutral" },
      { label: "Net Rent", value: "812 GBP", sublabel: "After voids and fees", trend: "neutral" },
      { label: "Annual Net Income", value: "4836 GBP", sublabel: "After all costs", trend: "up" },
    ],
    structure: {
      label: "Income Calculation",
      description: "Monthly rent adjusted for voids, agent fees, maintenance and finance costs",
      lines: [
        { label: "Gross Monthly Rent", formula: "Market rent x 12", example: "950 x 12 = 11400 GBP" },
        { label: "Less Void Allowance", formula: "Gross x void %", example: "11400 x 5% = 570 GBP" },
        { label: "Less Agent Fee", formula: "Net rent x agent %", example: "10830 x 10% = 1083 GBP" },
        { label: "Less Maintenance", formula: "Fixed monthly reserve", example: "60 x 12 = 720 GBP" },
        { label: "Less Finance Cost", formula: "Mortgage x 12", example: "350 x 12 = 4200 GBP" },
        { label: "Net Annual Income", formula: "Sum of above", example: "4836 GBP" },
      ],
    },
    assumptions: [
      { label: "Monthly Rent", default: "950 GBP", range: "700-1400 GBP" },
      { label: "Void Rate", default: "5%", range: "3-10%" },
      { label: "Agent Fee", default: "10%", range: "8-15%" },
      { label: "Maintenance Reserve", default: "60 GBP/mo", range: "40-120 GBP/mo" },
      { label: "Mortgage Rate", default: "4.75%", range: "3.5-6.5%" },
      { label: "LTV", default: "75%", range: "60-85%" },
    ],
    exampleCalc: {
      inputs: [
        { label: "Property Value", value: "220000 GBP" },
        { label: "Monthly Rent", value: "950 GBP" },
        { label: "Mortgage (75% LTV @ 4.75%)", value: "165000 GBP" },
      ],
      outputs: [
        { label: "Gross Monthly Rent", value: "950 GBP" },
        { label: "Net of Voids (5%)", value: "902 GBP" },
        { label: "Net of Fees (10%)", value: "812 GBP" },
        { label: "Net Monthly Cashflow", value: "403 GBP", highlight: true },
        { label: "Gross Yield", value: "5.18%" },
        { label: "Net Yield", value: "2.2%" },
        { label: "Annual Cashflow", value: "4836 GBP" },
      ],
    },
    sensitivityNote: "Net cashflow is most sensitive to mortgage rate changes. A 1% rate increase on 165k reduces net cashflow by approximately 138/month.",
    benchmarkRanges: [
      { label: "Gross Yield", low: "4%", mid: "5.5%", high: "7%" },
      { label: "Net Yield", low: "2.5%", mid: "3.5%", high: "5%" },
      { label: "Void Rate", low: "3%", mid: "5%", high: "10%" },
    ],
  },
  costDrivers: {
    kpis: [
      { label: "Total Monthly Costs", value: "547 GBP", sublabel: "Ex-mortgage", trend: "neutral" },
      { label: "Finance as % of Income", value: "37%", sublabel: "Mortgage burden", trend: "neutral" },
      { label: "Annual Compliance Cost", value: "350-600 GBP", sublabel: "Certs and docs", trend: "neutral" },
      { label: "Void Cost/Week", value: "219 GBP", sublabel: "Lost rent", trend: "neutral" },
    ],
    categories: [
      {
        name: "Finance",
        items: [
          { label: "Mortgage Payment", typical: "350-750 GBP/mo", frequency: "Monthly", type: "fixed" },
          { label: "Mortgage Arrangement Fee", typical: "995-2000 GBP", frequency: "On remortgage", type: "fixed" },
        ],
      },
      {
        name: "Agent Fees",
        items: [
          { label: "Letting/Management Fee", typical: "8-12% of rent", frequency: "Monthly", type: "percentage" },
          { label: "Tenant Find Fee", typical: "50-100% of first month", frequency: "Per tenancy", type: "fixed" },
        ],
      },
      {
        name: "Maintenance",
        items: [
          { label: "Monthly Reserve", typical: "50-100 GBP/mo", frequency: "Monthly", type: "fixed" },
          { label: "Boiler Service", typical: "80-120 GBP/yr", frequency: "Annual", type: "fixed" },
          { label: "Emergency Repairs", typical: "150-800 GBP", frequency: "As needed", type: "variable" },
        ],
      },
      {
        name: "Compliance",
        items: [
          { label: "Gas Safety Certificate", typical: "70-90 GBP/yr", frequency: "Annual", type: "fixed" },
          { label: "EICR", typical: "150-250 GBP", frequency: "5-yearly", type: "fixed" },
          { label: "EPC", typical: "80-120 GBP", frequency: "10-yearly", type: "fixed" },
          { label: "Smoke/CO Alarms", typical: "30-80 GBP", frequency: "On install", type: "fixed" },
        ],
      },
      {
        name: "Insurance",
        items: [
          { label: "Landlord Buildings Insurance", typical: "25-45 GBP/mo", frequency: "Monthly", type: "fixed" },
          { label: "Rent Guarantee Insurance", typical: "15-30 GBP/mo", frequency: "Monthly", type: "fixed" },
        ],
      },
    ],
    sensitivityNote: "Finance costs dominate at 37% of gross income. A 1% rate rise costs 138/mo on a 165k mortgage. Maintenance can spike with boiler or roof failure.",
    costControlTips: [
      "Self-manage to save 10-15% of rent",
      "Bundle annual safety certificates",
      "Build 100 GBP/mo maintenance reserve",
      "Review mortgage rate every 2 years",
    ],
  },
  compliance: {
    score: 72, scoreLabel: "Moderate", criticalCount: 4,
    requirements: [
      { area: "Safety", item: "Gas Safety Certificate", priority: "High", required: true, renewal: "Annual", estimatedCost: "70-90 GBP", riskIfMissing: "Criminal prosecution, void tenancy" },
      { area: "Safety", item: "EICR", priority: "High", required: true, renewal: "5-yearly", estimatedCost: "150-250 GBP", riskIfMissing: "30000 GBP fine" },
      { area: "Energy", item: "EPC (minimum E rating)", priority: "High", required: true, renewal: "On let", estimatedCost: "80-120 GBP", riskIfMissing: "Cannot let property" },
      { area: "Tenancy", item: "Right to Rent Check", priority: "High", required: true, renewal: "Pre-tenancy", estimatedCost: "No cost", riskIfMissing: "Fine up to 10000 GBP per tenant" },
      { area: "Deposit", item: "Deposit Protection Scheme", priority: "High", required: true, renewal: "Within 30 days", estimatedCost: "15-30 GBP", riskIfMissing: "3x deposit penalty" },
      { area: "Safety", item: "Smoke and CO Alarms", priority: "Medium", required: true, renewal: "On installation", estimatedCost: "30-80 GBP", riskIfMissing: "5000 GBP fine" },
      { area: "Tenancy", item: "AST Agreement", priority: "Medium", required: true, renewal: "Per tenancy", estimatedCost: "50-200 GBP solicitor", riskIfMissing: "Unenforceable tenancy" },
      { area: "Licensing", item: "Selective Landlord Licence (if applicable)", priority: "Medium", required: false, renewal: "Annual", estimatedCost: "100-700 GBP", riskIfMissing: "Criminal offence if applicable" },
    ],
    upcomingDeadlines: [
      { label: "Gas Safety Certificate renewal", due: "Annual", priority: "High" },
      { label: "EICR renewal", due: "5-yearly", priority: "High" },
      { label: "EPC expiry check", due: "10-yearly", priority: "Medium" },
    ],
    requiredDocs: ["AST Agreement", "Gas Safety Certificate", "EICR Report", "EPC Certificate", "Right to Rent Records", "Deposit Protection Certificate", "How to Rent Guide", "Inventory Report"],
    aiInsight: "Long-term let compliance is manageable but gas safety and EICR are non-negotiable. Deposit protection within 30 days is the most commonly missed item for new landlords.",
  },
  forecast: {
    scenarios: [
      {
        name: "Base Case", type: "base",
        kpis: [
          { label: "Annual Income", value: "11400 GBP", trend: "neutral" },
          { label: "Annual Costs", value: "6564 GBP", trend: "neutral" },
          { label: "Net Profit", value: "4836 GBP", highlight: true, trend: "neutral" },
          { label: "Net Yield", value: "2.2%", trend: "neutral" },
        ],
        monthly: [
          { month: "Jan", income: 950, costs: 547, net: 403 },
          { month: "Feb", income: 950, costs: 547, net: 403 },
          { month: "Mar", income: 950, costs: 547, net: 403 },
          { month: "Apr", income: 950, costs: 547, net: 403 },
          { month: "May", income: 950, costs: 547, net: 403 },
          { month: "Jun", income: 0, costs: 197, net: -197 },
          { month: "Jul", income: 950, costs: 547, net: 403 },
          { month: "Aug", income: 950, costs: 547, net: 403 },
          { month: "Sep", income: 950, costs: 547, net: 403 },
          { month: "Oct", income: 950, costs: 547, net: 403 },
          { month: "Nov", income: 950, costs: 547, net: 403 },
          { month: "Dec", income: 950, costs: 547, net: 403 },
        ],
      },
      {
        name: "Optimistic", type: "optimistic",
        kpis: [
          { label: "Annual Income", value: "12600 GBP", trend: "up" },
          { label: "Annual Costs", value: "6120 GBP", trend: "down" },
          { label: "Net Profit", value: "6480 GBP", highlight: true, trend: "up" },
          { label: "Net Yield", value: "2.95%", trend: "up" },
        ],
        monthly: [
          { month: "Jan", income: 1050, costs: 510, net: 540 },
          { month: "Feb", income: 1050, costs: 510, net: 540 },
          { month: "Mar", income: 1050, costs: 510, net: 540 },
          { month: "Apr", income: 1050, costs: 510, net: 540 },
          { month: "May", income: 1050, costs: 510, net: 540 },
          { month: "Jun", income: 1050, costs: 510, net: 540 },
          { month: "Jul", income: 1050, costs: 510, net: 540 },
          { month: "Aug", income: 1050, costs: 510, net: 540 },
          { month: "Sep", income: 1050, costs: 510, net: 540 },
          { month: "Oct", income: 1050, costs: 510, net: 540 },
          { month: "Nov", income: 1050, costs: 510, net: 540 },
          { month: "Dec", income: 1050, costs: 510, net: 540 },
        ],
      },
      {
        name: "Conservative", type: "conservative",
        kpis: [
          { label: "Annual Income", value: "9680 GBP", trend: "down" },
          { label: "Annual Costs", value: "7248 GBP", trend: "up" },
          { label: "Net Profit", value: "2432 GBP", highlight: true, trend: "down" },
          { label: "Net Yield", value: "1.1%", trend: "down" },
        ],
        monthly: [
          { month: "Jan", income: 880, costs: 604, net: 276 },
          { month: "Feb", income: 880, costs: 604, net: 276 },
          { month: "Mar", income: 880, costs: 604, net: 276 },
          { month: "Apr", income: 880, costs: 604, net: 276 },
          { month: "May", income: 880, costs: 604, net: 276 },
          { month: "Jun", income: 0, costs: 254, net: -254 },
          { month: "Jul", income: 0, costs: 254, net: -254 },
          { month: "Aug", income: 880, costs: 604, net: 276 },
          { month: "Sep", income: 880, costs: 604, net: 276 },
          { month: "Oct", income: 880, costs: 604, net: 276 },
          { month: "Nov", income: 880, costs: 604, net: 276 },
          { month: "Dec", income: 880, costs: 604, net: 276 },
        ],
      },
    ],
    baseKpis: [
      { label: "Annual Income", value: "11400 GBP", trend: "neutral" },
      { label: "Annual Costs", value: "6564 GBP", trend: "neutral" },
      { label: "Net Profit", value: "4836 GBP", highlight: true },
      { label: "Gross Yield", value: "5.18%", trend: "neutral" },
      { label: "Net Yield", value: "2.2%", trend: "neutral" },
      { label: "Breakeven Void Rate", value: "42%", sublabel: "Before cashflow turns negative" },
    ],
    assumptions: [
      { label: "Property Value", value: "220000 GBP" },
      { label: "Mortgage Rate", value: "4.75%" },
      { label: "LTV", value: "75%" },
      { label: "Agent Fee", value: "10%" },
      { label: "Void Rate", value: "5%" },
      { label: "Maintenance", value: "60 GBP/mo" },
    ],
    sensitivityRows: [
      { variable: "Monthly Rent +/- 100 GBP", base: "403/mo net", upside: "+90/mo", downside: "-90/mo" },
      { variable: "Void Rate +/- 2%", base: "5% void", upside: "+19/mo", downside: "-19/mo" },
      { variable: "Mortgage Rate +/- 0.5%", base: "4.75%", upside: "+69/mo", downside: "-69/mo" },
      { variable: "Agent Fee +/- 2%", base: "10%", upside: "+19/mo", downside: "-19/mo" },
    ],
    forecastNote: "Base assumes stable tenancy, 4-week void on renewal, no major repairs in Year 1. Conservative reflects 8-week void and minor repair event.",
  },
  checklist: {
    phases: [
      {
        name: "Research and Acquisition",
        tasks: [
          { label: "Confirm local rent levels", priority: "High", owner: "Investor", daysOffset: 0 },
          { label: "Check area demand indicators", priority: "Medium", owner: "Investor", daysOffset: 7 },
          { label: "Review rental comparables", priority: "Medium", owner: "Investor", daysOffset: 14 },
          { label: "Mortgage decision in principle", priority: "High", owner: "Investor", daysOffset: 14 },
          { label: "Instruct solicitor", priority: "Medium", owner: "Investor", daysOffset: 21 },
        ],
      },
      {
        name: "Legal and Finance",
        tasks: [
          { label: "Mortgage offer confirmed", priority: "High", owner: "Lender", daysOffset: 35 },
          { label: "Exchange contracts", priority: "High", owner: "Solicitor", daysOffset: 42 },
          { label: "Title insurance arranged", priority: "Medium", owner: "Solicitor", daysOffset: 42 },
          { label: "Completion", priority: "High", owner: "Solicitor", daysOffset: 49 },
        ],
      },
      {
        name: "Pre-Let Compliance",
        tasks: [
          { label: "Gas safety certificate obtained", priority: "High", owner: "Engineer", daysOffset: 56 },
          { label: "EICR completed", priority: "High", owner: "Engineer", daysOffset: 56 },
          { label: "EPC obtained (min E)", priority: "High", owner: "Assessor", daysOffset: 56 },
          { label: "Smoke and CO alarms fitted", priority: "High", owner: "Investor", daysOffset: 56 },
          { label: "AST agreement prepared", priority: "High", owner: "Agent", daysOffset: 63 },
        ],
      },
      {
        name: "Tenant Find",
        tasks: [
          { label: "List with agent and portals", priority: "High", owner: "Agent", daysOffset: 63 },
          { label: "Reference tenants", priority: "High", owner: "Agent", daysOffset: 70 },
          { label: "Right to Rent check", priority: "High", owner: "Agent", daysOffset: 70 },
          { label: "Protect deposit", priority: "High", owner: "Agent", daysOffset: 77 },
        ],
      },
      {
        name: "Live and Ongoing",
        tasks: [
          { label: "First rent received", priority: "High", owner: "Tenant", daysOffset: 84 },
          { label: "Set up maintenance reserve account", priority: "Medium", owner: "Investor", daysOffset: 84 },
          { label: "Schedule annual safety review", priority: "Medium", owner: "Investor", daysOffset: 420 },
        ],
      },
    ],
    criticalPathItems: [
      "Gas Safety Certificate before tenancy start",
      "Deposit protected within 30 days",
      "Right to Rent check before move-in",
      "EPC minimum E before marketing",
    ],
  },
  risks: {
    overallRating: "Low", totalExposureEstimate: "3000-8000 GBP/year",
    register: [
      { name: "Tenant Arrears", category: "Financial", likelihood: "Possible", impact: "Medium", score: 6, mitigation: "Tenant referencing, guarantor, rent guarantee insurance", owner: "Investor" },
      { name: "Extended Void Period", category: "Financial", likelihood: "Possible", impact: "Medium", score: 6, mitigation: "Strong marketing, competitive pricing, periodic redecoration", owner: "Agent" },
      { name: "Boiler or Roof Failure", category: "Operational", likelihood: "Possible", impact: "High", score: 9, mitigation: "Annual boiler service, maintenance reserve fund, buildings insurance", owner: "Investor" },
      { name: "Regulatory Change", category: "Regulatory", likelihood: "Low", impact: "Medium", score: 3, mitigation: "Monitor NRLA updates, use agent compliance service", owner: "Investor" },
      { name: "Interest Rate Rise", category: "Financial", likelihood: "Likely", impact: "High", score: 12, mitigation: "Stress test at +2%, fix mortgage rate for 5 years", owner: "Investor" },
      { name: "Tenant Damage", category: "Operational", likelihood: "Low", impact: "Medium", score: 3, mitigation: "Comprehensive inventory, deposit protection, deposit insurance", owner: "Investor" },
    ],
    topByExposure: [
      { label: "Interest Rate Rise", exposure: "1200-2400 GBP/yr", level: "High" },
      { label: "Boiler/Roof Failure", exposure: "1500-4000 GBP", level: "Medium" },
      { label: "Void Period", exposure: "950-2850 GBP", level: "Medium" },
    ],
    mitigationActions: [
      "Get rent guarantee insurance (15-30 GBP/mo)",
      "Fix mortgage rate for 5 years",
      "Build 1500 GBP emergency maintenance reserve",
      "Annual gas service contract",
    ],
  },
  aiQuestions: {
    suggestedQuestions: [
      { question: "What rent should I target for this area?", category: "Pricing", insight: "Market rent benchmarks using local comparables, HMO vs single-let split, demand indicators" },
      { question: "Is this the right area for long-term letting?", category: "Demand Analysis", insight: "Employment base, transport links, rental demand index, void rate data" },
      { question: "What gross yield should I target to make this viable?", category: "Viability", insight: "Finance costs vs net yield, breakeven analysis, stress test at higher rates" },
      { question: "What compliance items am I missing?", category: "Compliance", insight: "Compliance gap analysis against statutory requirements for this property type" },
      { question: "How much maintenance reserve should I hold?", category: "Cost Management", insight: "Age of property, historic maintenance data, typical spend patterns for property type" },
    ],
    keyDrivers: ["Monthly Rent Level", "Mortgage Rate", "Void Rate", "Agent Fee", "Maintenance Reserve"],
    quickStats: [
      { label: "Avg Setup Cost", value: "1500-3000 GBP" },
      { label: "Time to First Rent", value: "8-14 weeks" },
      { label: "Typical Contract", value: "12 months AST" },
      { label: "Annual Compliance Cost", value: "350-600 GBP" },
    ],
    recommendations: [
      "Target 5%+ gross yield in current rate environment",
      "Fix mortgage for 5 years to protect cashflow",
      "Use a local letting agent for the first year",
    ],
    confidenceScore: 87, confidenceLabel: "High Confidence",
  },
  quickActions: [
    { label: "Start Planning Set", sub: "Build your LTL plan", icon: "Play", action: "start-planning" },
    { label: "Compare Profile", sub: "vs HMO or Co-Living", icon: "BarChart2", action: "compare" },
    { label: "Run Quick Scenario", sub: "Instant cashflow calc", icon: "Zap", action: "quick-scenario" },
    { label: "Download Pack", sub: "PDF profile guide", icon: "Download", action: "download" },
  ],
  pros: ["Predictable monthly income", "Simple to understand and manage", "Well-established legal framework", "Lower compliance burden vs HMO", "Long-term capital growth potential", "Mainstream mortgage availability"],
  cons: ["Lower yield than multi-let models", "Single tenant exit creates full void", "Interest rate sensitive with typical 75% LTV", "Limited income diversity", "Rent increases constrained by market and law"],
}

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE 2 — HMO
// ─────────────────────────────────────────────────────────────────────────────
export const HMO_CONFIG: ProfileConfig = {
  key: "hmo", slug: "hmo", name: "HMO", number: 2,
  tagline: "Room-based lettings with higher yields and diversified tenant income",
  description: "House in Multiple Occupation - let individual rooms to separate tenants on individual ASTs for maximum cashflow per square foot.",
  icon: "Users", accentColor: "#7C3AED", bgColor: "#F5F3FF",
  group: "residential", groupLabel: "Residential Rental",
  tags: ["Residential Rental", "Higher Yield", "High Management", "High Compliance"],
  riskLevel: "Medium", managementIntensity: "High", complianceIntensity: "High", capitalIntensity: "Medium",
  primaryMetric: { label: "Typical Gross Yield", value: "8-15%", sublabel: "Room-by-room income" },
  overviewKpis: [
    { label: "Gross Yield", value: "8-15%", sublabel: "Market benchmark", trend: "up" },
    { label: "Avg Room Rent", value: "450-700 GBP/mo", sublabel: "All-inclusive", trend: "up" },
    { label: "Breakeven Occupancy", value: "70-75%", sublabel: "Covers all costs", trend: "neutral" },
    { label: "Compliance Items", value: "15-25", sublabel: "Typical HMO register", trend: "neutral" },
  ],
  whoItSuits: ["Experienced landlords", "Yield-focused investors", "Portfolio HMO operators", "Investors near cities/universities", "Operators comfortable with active management"],
  idealAssets: [
    { icon: "Home", label: "4-6 Bed Houses", sub: "Mandatory HMO threshold" },
    { icon: "Building", label: "Large Terraced Houses", sub: "Common HMO stock" },
    { icon: "Landmark", label: "Semi-Detached 5+ beds", sub: "Good room count" },
  ],
  advantages: ["Significantly higher yield than single let", "Income diversified across multiple tenants", "Room pricing flexibility", "Resilient to single void", "Strong demand near employment hubs"],
  constraints: ["Complex licensing requirements", "Fire safety capital cost", "High management intensity", "Bills included in rent creates cost risk", "Article 4 restrictions in many areas"],
  bestMarket: ["University cities", "Large urban employment centres", "Commuter towns with housing pressure", "Areas with young professional demand"],
  riskPosture: [
    { label: "Bills Inflation", level: "High" },
    { label: "Tenant Conflict", level: "Medium" },
    { label: "Room Void", level: "Low" },
    { label: "Licence Refusal", level: "Medium" },
  ],
  timeline: [
    { label: "Acquisition", sub: "Find, survey, due diligence", duration: "6-10 weeks" },
    { label: "HMO Licence Application", sub: "Submit to council", duration: "8-12 weeks" },
    { label: "Refurbishment", sub: "Fire doors, alarms, rooms", duration: "4-8 weeks" },
    { label: "Compliance Pack", sub: "Gas, EICR, EPC, FRA", duration: "1-2 weeks" },
    { label: "Let Rooms", sub: "Marketing and referencing", duration: "2-4 weeks" },
  ],
  modelSnapshot: {
    label: "Example Monthly P&L - 5-bed HMO 225k property",
    lines: [
      { label: "5 Rooms x 550 GBP/mo", value: "2750 GBP" },
      { label: "Less Bills (gas/electric/broadband/CT)", value: "-400 GBP" },
      { label: "Less Management (12%)", value: "-330 GBP" },
      { label: "Less Maintenance Reserve", value: "-150 GBP" },
      { label: "Less Licence/Compliance monthly equiv", value: "-75 GBP" },
      { label: "Net Monthly NOI", value: "1795 GBP", highlight: true },
      { label: "Annual NOI", value: "21540 GBP" },
      { label: "Gross Yield", value: "14.7%" },
      { label: "Net Yield (after finance)", value: "5.4%" },
    ],
  },
  incomeModel: {
    type: "Room-by-Room AST",
    kpis: [
      { label: "Gross Room Income", value: "2750 GBP/mo", sublabel: "5 rooms at 550", trend: "up" },
      { label: "Net of Bills", value: "2350 GBP/mo", sublabel: "After utilities", trend: "neutral" },
      { label: "NOI", value: "1795 GBP/mo", sublabel: "After all opex", trend: "neutral" },
      { label: "Breakeven Occupancy", value: "72%", sublabel: "3.6 rooms of 5", trend: "neutral" },
    ],
    structure: {
      label: "HMO Income Calculation",
      description: "Room rents minus bills, management, maintenance and compliance costs",
      lines: [
        { label: "Gross Room Income", formula: "Rooms x Avg Room Rent", example: "5 x 550 = 2750 GBP" },
        { label: "Less Bills", formula: "Gas + Electric + Broadband + CT", example: "400 GBP/mo all-inclusive" },
        { label: "Less Management Fee", formula: "Gross income x mgmt %", example: "2750 x 12% = 330 GBP" },
        { label: "Less Maintenance Reserve", formula: "Fixed monthly", example: "150 GBP/mo" },
        { label: "Less Compliance Monthly Equiv", formula: "Annual compliance / 12", example: "75 GBP/mo" },
        { label: "Net Monthly NOI", formula: "Sum above", example: "1795 GBP" },
      ],
    },
    assumptions: [
      { label: "Room Count", default: "5", range: "4-8" },
      { label: "Average Room Rent", default: "550 GBP/mo", range: "400-750 GBP/mo" },
      { label: "Void Rate", default: "8%", range: "5-15%" },
      { label: "Monthly Bills", default: "400 GBP/mo", range: "280-600 GBP/mo" },
      { label: "Management Fee", default: "12%", range: "10-15%" },
      { label: "Maintenance Reserve", default: "150 GBP/mo", range: "100-250 GBP/mo" },
    ],
    exampleCalc: {
      inputs: [
        { label: "Property Value", value: "225000 GBP" },
        { label: "5 Rooms at 550/mo", value: "2750 GBP/mo gross" },
        { label: "Monthly Bills", value: "400 GBP/mo" },
        { label: "Mortgage (75% LTV at 4.75%)", value: "168750 GBP" },
      ],
      outputs: [
        { label: "Gross Room Income", value: "2750 GBP" },
        { label: "Net of Void (8%)", value: "2530 GBP" },
        { label: "Net of Bills", value: "2130 GBP" },
        { label: "Net of Management (12%)", value: "1800 GBP" },
        { label: "Net of Maintenance", value: "1650 GBP" },
        { label: "Net Monthly Cashflow (after mortgage)", value: "1010 GBP", highlight: true },
        { label: "Gross Yield", value: "14.7%" },
        { label: "Net Yield", value: "5.4%" },
      ],
    },
    sensitivityNote: "HMO cashflow is most sensitive to occupancy and bill costs. A 10% occupancy drop loses 275/mo. A 100/mo bill spike reduces margin directly.",
    benchmarkRanges: [
      { label: "Gross Yield", low: "8%", mid: "11%", high: "15%" },
      { label: "Room Rent", low: "380 GBP", mid: "520 GBP", high: "700 GBP" },
      { label: "Occupancy", low: "75%", mid: "88%", high: "95%" },
    ],
  },
  costDrivers: {
    kpis: [
      { label: "Monthly Bills", value: "400 GBP", sublabel: "Utilities and CT", trend: "up" },
      { label: "Annual Licence Cost", value: "200-700 GBP", sublabel: "Local authority", trend: "neutral" },
      { label: "Fire Safety Capex", value: "3000-10000 GBP", sublabel: "One-off setup", trend: "neutral" },
      { label: "Furnishing Cost/Room", value: "500-800 GBP", sublabel: "Replace 3-4 yrs", trend: "neutral" },
    ],
    categories: [
      {
        name: "Utilities and Bills",
        items: [
          { label: "Gas", typical: "60-100 GBP/mo", frequency: "Monthly", type: "variable" },
          { label: "Electricity", typical: "80-140 GBP/mo", frequency: "Monthly", type: "variable" },
          { label: "Broadband", typical: "35-50 GBP/mo", frequency: "Monthly", type: "fixed" },
          { label: "Council Tax", typical: "100-180 GBP/mo", frequency: "Monthly", type: "fixed" },
          { label: "Water", typical: "30-50 GBP/mo", frequency: "Monthly", type: "fixed" },
        ],
      },
      {
        name: "Management",
        items: [
          { label: "HMO Management Fee", typical: "10-15% of gross", frequency: "Monthly", type: "percentage" },
          { label: "Tenant Find Fee", typical: "75% first month/room", frequency: "Per room let", type: "fixed" },
        ],
      },
      {
        name: "Maintenance",
        items: [
          { label: "Monthly Reserve", typical: "150-250 GBP/mo", frequency: "Monthly", type: "fixed" },
          { label: "Communal Cleaning", typical: "60-120 GBP/mo", frequency: "Monthly", type: "fixed" },
          { label: "Room Turnover Refresh", typical: "200-500 GBP/room", frequency: "Per vacancy", type: "variable" },
        ],
      },
      {
        name: "HMO Licensing and Compliance",
        items: [
          { label: "HMO Licence Fee", typical: "200-700 GBP/yr", frequency: "Annual/5-yearly", type: "fixed" },
          { label: "Fire Risk Assessment", typical: "200-400 GBP", frequency: "Annual review", type: "fixed" },
          { label: "Fire Doors", typical: "150-300 GBP/door", frequency: "On install/replace", type: "fixed" },
          { label: "Interlinked Alarm Service", typical: "80-150 GBP/yr", frequency: "Annual", type: "fixed" },
          { label: "Gas Safety Certificate", typical: "80-120 GBP/yr", frequency: "Annual", type: "fixed" },
          { label: "EICR (large property)", typical: "200-350 GBP", frequency: "5-yearly", type: "fixed" },
        ],
      },
      {
        name: "Furnishing",
        items: [
          { label: "Room Furnish (all-inclusive)", typical: "500-800 GBP/room", frequency: "Every 3-4 years", type: "fixed" },
          { label: "Communal Area Furniture", typical: "1000-2500 GBP", frequency: "Every 4-5 years", type: "fixed" },
        ],
      },
      {
        name: "Insurance",
        items: [
          { label: "Specialist HMO Insurance", typical: "60-120 GBP/mo", frequency: "Monthly", type: "fixed" },
        ],
      },
    ],
    sensitivityNote: "Bills represent ~15% of gross income. Energy price volatility is the highest uncontrolled cost risk. Fixed energy tariffs are strongly recommended.",
    costControlTips: [
      "Install smart meters to catch usage anomalies",
      "Negotiate fixed-price utility tariff annually",
      "Bulk-furnish rooms at renewal cycle",
      "Build dedicated HMO maintenance reserve of 200 GBP/mo",
    ],
  },
  compliance: {
    score: 58, scoreLabel: "High Burden", criticalCount: 8,
    requirements: [
      { area: "Licensing", item: "Mandatory HMO Licence (5+ persons)", priority: "High", required: true, renewal: "5-yearly", estimatedCost: "200-700 GBP", riskIfMissing: "Criminal offence, unlimited fine" },
      { area: "Fire Safety", item: "Fire Risk Assessment", priority: "High", required: true, renewal: "Annual review", estimatedCost: "200-400 GBP", riskIfMissing: "Prosecution, injury liability" },
      { area: "Fire Safety", item: "30-Minute Fire Doors", priority: "High", required: true, renewal: "On refurb/replace", estimatedCost: "150-300 GBP/door", riskIfMissing: "Criminal offence, licence refusal" },
      { area: "Fire Safety", item: "Interlinked Smoke Alarms", priority: "High", required: true, renewal: "Annual test", estimatedCost: "200-400 GBP system", riskIfMissing: "Prosecution, licence refusal" },
      { area: "Safety", item: "Gas Safety Certificate", priority: "High", required: true, renewal: "Annual", estimatedCost: "80-120 GBP", riskIfMissing: "Criminal prosecution" },
      { area: "Safety", item: "EICR", priority: "High", required: true, renewal: "5-yearly", estimatedCost: "200-350 GBP", riskIfMissing: "30000 GBP fine" },
      { area: "Energy", item: "EPC (min E)", priority: "High", required: true, renewal: "On let", estimatedCost: "80-120 GBP", riskIfMissing: "Cannot let" },
      { area: "Standards", item: "Room Size Compliance (min 6.5m2)", priority: "High", required: true, renewal: "Pre-let", estimatedCost: "Survey cost", riskIfMissing: "Licence refusal" },
      { area: "Tenancy", item: "AST per Room and Deposit Protection", priority: "High", required: true, renewal: "Per tenancy", estimatedCost: "30-60 GBP/tenant", riskIfMissing: "3x deposit penalty" },
    ],
    upcomingDeadlines: [
      { label: "Gas Safety Certificate renewal", due: "Annual", priority: "High" },
      { label: "Fire Risk Assessment review", due: "Annual", priority: "High" },
      { label: "HMO Licence renewal", due: "5-yearly", priority: "High" },
    ],
    requiredDocs: ["HMO Licence", "Fire Risk Assessment", "Gas Safety Certificate", "EICR Report", "EPC Certificate", "AST Agreements per room", "Deposit Protection Certificates", "Room Inventories", "Right to Rent Records"],
    aiInsight: "HMO compliance has the highest cost and complexity of any residential model. Fire safety is the critical risk - non-compliance can mean immediate council enforcement, injury liability and criminal prosecution.",
  },
  forecast: {
    scenarios: [
      {
        name: "Base Case", type: "base",
        kpis: [
          { label: "Annual Room Income", value: "29700 GBP", trend: "neutral" },
          { label: "Annual Costs (opex)", value: "17520 GBP", trend: "neutral" },
          { label: "Annual NOI", value: "12180 GBP", highlight: true },
          { label: "Net Yield (after finance)", value: "5.4%", trend: "neutral" },
        ],
        monthly: [
          { month: "Jan", income: 2530, costs: 1515, net: 1015 },
          { month: "Feb", income: 2530, costs: 1515, net: 1015 },
          { month: "Mar", income: 2530, costs: 1515, net: 1015 },
          { month: "Apr", income: 2530, costs: 1515, net: 1015 },
          { month: "May", income: 2530, costs: 1515, net: 1015 },
          { month: "Jun", income: 2200, costs: 1515, net: 685 },
          { month: "Jul", income: 2200, costs: 1515, net: 685 },
          { month: "Aug", income: 2530, costs: 1515, net: 1015 },
          { month: "Sep", income: 2750, costs: 1515, net: 1235 },
          { month: "Oct", income: 2750, costs: 1515, net: 1235 },
          { month: "Nov", income: 2530, costs: 1515, net: 1015 },
          { month: "Dec", income: 2530, costs: 1515, net: 1015 },
        ],
      },
      {
        name: "Optimistic", type: "optimistic",
        kpis: [
          { label: "Annual Room Income", value: "32850 GBP", trend: "up" },
          { label: "Annual Costs (opex)", value: "15960 GBP", trend: "down" },
          { label: "Annual NOI", value: "16890 GBP", highlight: true },
          { label: "Net Yield", value: "7.5%", trend: "up" },
        ],
        monthly: [
          { month: "Jan", income: 2755, costs: 1330, net: 1425 },
          { month: "Feb", income: 2755, costs: 1330, net: 1425 },
          { month: "Mar", income: 2755, costs: 1330, net: 1425 },
          { month: "Apr", income: 2755, costs: 1330, net: 1425 },
          { month: "May", income: 2755, costs: 1330, net: 1425 },
          { month: "Jun", income: 2755, costs: 1330, net: 1425 },
          { month: "Jul", income: 2755, costs: 1330, net: 1425 },
          { month: "Aug", income: 2755, costs: 1330, net: 1425 },
          { month: "Sep", income: 2755, costs: 1330, net: 1425 },
          { month: "Oct", income: 2755, costs: 1330, net: 1425 },
          { month: "Nov", income: 2755, costs: 1330, net: 1425 },
          { month: "Dec", income: 2755, costs: 1330, net: 1425 },
        ],
      },
      {
        name: "Conservative", type: "conservative",
        kpis: [
          { label: "Annual Room Income", value: "24336 GBP", trend: "down" },
          { label: "Annual Costs (opex)", value: "20160 GBP", trend: "up" },
          { label: "Annual NOI", value: "4176 GBP", highlight: true },
          { label: "Net Yield", value: "1.9%", trend: "down" },
        ],
        monthly: [
          { month: "Jan", income: 2028, costs: 1680, net: 348 },
          { month: "Feb", income: 2028, costs: 1680, net: 348 },
          { month: "Mar", income: 2028, costs: 1680, net: 348 },
          { month: "Apr", income: 2028, costs: 1680, net: 348 },
          { month: "May", income: 2028, costs: 1680, net: 348 },
          { month: "Jun", income: 1560, costs: 1680, net: -120 },
          { month: "Jul", income: 1560, costs: 1680, net: -120 },
          { month: "Aug", income: 2028, costs: 1680, net: 348 },
          { month: "Sep", income: 2028, costs: 1680, net: 348 },
          { month: "Oct", income: 2028, costs: 1680, net: 348 },
          { month: "Nov", income: 2028, costs: 1680, net: 348 },
          { month: "Dec", income: 2028, costs: 1680, net: 348 },
        ],
      },
    ],
    baseKpis: [
      { label: "Annual Gross Income", value: "29700 GBP", trend: "neutral" },
      { label: "Annual Operating Costs", value: "17520 GBP", trend: "neutral" },
      { label: "Annual NOI", value: "12180 GBP", highlight: true },
      { label: "Gross Yield", value: "14.7%", trend: "neutral" },
      { label: "Net Yield", value: "5.4%", trend: "neutral" },
      { label: "Breakeven Occupancy", value: "72%", sublabel: "3.6 rooms of 5" },
    ],
    assumptions: [
      { label: "Rooms", value: "5" },
      { label: "Average Room Rent", value: "550 GBP/mo" },
      { label: "Occupancy", value: "88%" },
      { label: "Monthly Bills", value: "400 GBP" },
      { label: "Management", value: "12%" },
      { label: "Maintenance", value: "150 GBP/mo" },
    ],
    sensitivityRows: [
      { variable: "Occupancy +/- 5%", base: "88%", upside: "+137/mo", downside: "-137/mo" },
      { variable: "Room Rent +/- 30 GBP", base: "550 GBP", upside: "+132/mo", downside: "-132/mo" },
      { variable: "Bills +/- 50 GBP/mo", base: "400 GBP", upside: "+50/mo", downside: "-50/mo" },
      { variable: "Management +/- 2%", base: "12%", upside: "+55/mo", downside: "-55/mo" },
    ],
    forecastNote: "Base assumes licence granted, 88% occupancy at stabilisation, standard utility costs. Stress models licence delay and winter bills spike.",
  },
  checklist: {
    phases: [
      {
        name: "Pre-Purchase",
        tasks: [
          { label: "Check Article 4 direction in target area", priority: "High", owner: "Investor", daysOffset: 0 },
          { label: "Confirm local HMO demand and room rents", priority: "Medium", owner: "Investor", daysOffset: 7 },
          { label: "Pre-consult council on HMO licence viability", priority: "High", owner: "Investor", daysOffset: 7 },
          { label: "Confirm HMO mortgage availability with broker", priority: "High", owner: "Broker", daysOffset: 14 },
          { label: "Check minimum room size standards", priority: "Medium", owner: "Surveyor", daysOffset: 21 },
        ],
      },
      {
        name: "Acquisition",
        tasks: [
          { label: "Offer accepted and solicitors instructed", priority: "High", owner: "Solicitor", daysOffset: 28 },
          { label: "Full structural survey", priority: "High", owner: "Surveyor", daysOffset: 28 },
          { label: "HMO mortgage application submitted", priority: "High", owner: "Lender", daysOffset: 35 },
          { label: "Exchange contracts", priority: "High", owner: "Solicitor", daysOffset: 49 },
        ],
      },
      {
        name: "HMO Setup and Compliance",
        tasks: [
          { label: "Submit HMO licence application to council", priority: "High", owner: "Investor", daysOffset: 56 },
          { label: "Fire risk assessment completed", priority: "High", owner: "Assessor", daysOffset: 56 },
          { label: "Fire doors installed (30-min rated)", priority: "High", owner: "Contractor", daysOffset: 63 },
          { label: "Interlinked smoke alarms installed", priority: "High", owner: "Contractor", daysOffset: 63 },
          { label: "EICR completed", priority: "High", owner: "Engineer", daysOffset: 70 },
          { label: "Gas safety certificate obtained", priority: "High", owner: "Engineer", daysOffset: 70 },
          { label: "EPC obtained (min E)", priority: "High", owner: "Assessor", daysOffset: 70 },
          { label: "Rooms furnished to standard", priority: "Medium", owner: "Investor", daysOffset: 77 },
        ],
      },
      {
        name: "Lettings",
        tasks: [
          { label: "Room marketing launched", priority: "High", owner: "Agent", daysOffset: 77 },
          { label: "Tenant referencing completed", priority: "High", owner: "Agent", daysOffset: 84 },
          { label: "AST per room prepared and signed", priority: "High", owner: "Agent", daysOffset: 84 },
          { label: "Deposit protected per tenant", priority: "High", owner: "Agent", daysOffset: 91 },
        ],
      },
      {
        name: "Operations",
        tasks: [
          { label: "Utility accounts set up in operator name", priority: "High", owner: "Investor", daysOffset: 91 },
          { label: "Cleaning schedule established", priority: "Medium", owner: "Investor", daysOffset: 91 },
          { label: "Maintenance log and reporting set up", priority: "Medium", owner: "Investor", daysOffset: 91 },
          { label: "Annual compliance calendar created", priority: "Medium", owner: "Investor", daysOffset: 98 },
        ],
      },
    ],
    criticalPathItems: [
      "HMO licence must be in place before any tenants move in",
      "Fire risk assessment and fire doors must be completed pre-let",
      "EICR and gas safety certificate required before occupation",
      "Article 4 - confirm permitted development rights before purchase",
    ],
  },
  risks: {
    overallRating: "Medium", totalExposureEstimate: "8000-20000 GBP/year",
    register: [
      { name: "Licensing Refusal or Delay", category: "Regulatory", likelihood: "Possible", impact: "Severe", score: 12, mitigation: "Pre-consult council, confirm compliance criteria before purchase", owner: "Investor" },
      { name: "Tenant Conflict or Disputes", category: "Operational", likelihood: "Likely", impact: "Medium", score: 12, mitigation: "House rules document, robust tenant vetting, active management", owner: "Manager" },
      { name: "Bills Inflation", category: "Financial", likelihood: "Likely", impact: "Medium", score: 12, mitigation: "Fixed energy tariffs, smart metering, monitor usage", owner: "Investor" },
      { name: "High Room Turnover", category: "Operational", likelihood: "Likely", impact: "Medium", score: 12, mitigation: "Good tenant vetting, competitive rent, responsive management", owner: "Agent" },
      { name: "Fire Safety Failure", category: "Regulatory", likelihood: "Low", impact: "Severe", score: 8, mitigation: "Annual FRA, quarterly alarm test, check fire doors regularly", owner: "Investor" },
      { name: "Council Enforcement Action", category: "Regulatory", likelihood: "Low", impact: "High", score: 8, mitigation: "Full licence compliance, proactive council relationship", owner: "Investor" },
      { name: "Boiler Failure (multi-tenant)", category: "Operational", likelihood: "Possible", impact: "High", score: 9, mitigation: "Annual service contract, 24hr emergency plumber on retainer", owner: "Investor" },
    ],
    topByExposure: [
      { label: "Bills Inflation", exposure: "1800-3600 GBP/yr", level: "High" },
      { label: "Turnover Void Cost", exposure: "1100-2200 GBP", level: "Medium" },
      { label: "Compliance Failure", exposure: "500-5000 GBP", level: "High" },
    ],
    mitigationActions: [
      "Pre-apply with council before purchase to confirm licence approval",
      "Install smart meters in all HMO properties",
      "Create house manual and rules document for all tenants",
      "Annual compliance calendar managed by letting agent",
    ],
  },
  aiQuestions: {
    suggestedQuestions: [
      { question: "What room rents can I realistically charge in this area?", category: "Pricing", insight: "Local room rent benchmarks, demand by room type, bills-inclusive vs exclusive comparison" },
      { question: "Is Article 4 a problem in my target area?", category: "Planning", insight: "Article 4 direction map, exempt property types, council enforcement history" },
      { question: "What will HMO compliance cost me?", category: "Cost Planning", insight: "Fire safety capex, licensing fees, ongoing annual compliance schedule and cost" },
      { question: "What occupancy do I need to break even?", category: "Viability", insight: "Breakeven room count based on your specific fixed cost structure and room rents" },
      { question: "How do I manage bill risk?", category: "Cost Management", insight: "Fixed tariff options, bill-capping strategies, smart meter monitoring, tenant fair use clauses" },
    ],
    keyDrivers: ["Room Occupancy Rate", "Average Room Rent", "Monthly Bill Cost", "Management Fee", "HMO Licence Status"],
    quickStats: [
      { label: "Typical Setup Capex", value: "5000-15000 GBP" },
      { label: "Fire Safety One-Off", value: "3000-10000 GBP" },
      { label: "Time to First Income", value: "14-22 weeks" },
      { label: "Annual Compliance Cost", value: "800-1500 GBP" },
    ],
    recommendations: [
      "Pre-consult the council before exchanging on any HMO purchase",
      "Budget 3000-10000 GBP for fire safety capex before modelling returns",
      "Use a specialist HMO management agent for first 12 months",
    ],
    confidenceScore: 79, confidenceLabel: "Good Confidence",
  },
  quickActions: [
    { label: "Start Planning Set", sub: "Build your HMO plan", icon: "Play", action: "start-planning" },
    { label: "Compare Profile", sub: "vs Long-Term Let", icon: "BarChart2", action: "compare" },
    { label: "Run Quick Scenario", sub: "Room-by-room calc", icon: "Zap", action: "quick-scenario" },
    { label: "Download Pack", sub: "PDF profile guide", icon: "Download", action: "download" },
  ],
  pros: ["2-3x yield of single-let residential", "Income spread across multiple tenants", "Room rent adjustable faster than single AST", "Strong demand in most cities", "Resilient to individual tenant exit"],
  cons: ["Complex HMO licensing", "Fire safety capex can be 3000-10000 GBP+", "Active management required", "Bills risk erodes margin if energy prices rise", "Article 4 restrictions in many boroughs"],
}

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE 3 — STUDENT LET
// ─────────────────────────────────────────────────────────────────────────────
export const STUDENT_LET_CONFIG: ProfileConfig = {
  key: "student_let", slug: "student-let", name: "Student Let", number: 3,
  tagline: "Academic-cycle letting with group tenancies and predictable term structure",
  description: "Let rooms or a whole property to students on academic-year tenancies. Predictable demand cycle with parental guarantors and summer void management.",
  icon: "GraduationCap", accentColor: "#2563EB", bgColor: "#EFF6FF",
  group: "residential", groupLabel: "Residential Rental",
  tags: ["Student Market", "Academic Cycle", "Seasonal", "Group Tenancy"],
  riskLevel: "Medium", managementIntensity: "Medium", complianceIntensity: "Medium", capitalIntensity: "Low",
  primaryMetric: { label: "Typical Gross Yield", value: "6-12%", sublabel: "Academic-year income" },
  overviewKpis: [
    { label: "Gross Yield", value: "6-12%", sublabel: "University locations", trend: "up" },
    { label: "Room Rent", value: "400-600 GBP/mo", sublabel: "Academic year", trend: "up" },
    { label: "Summer Void Risk", value: "8-12 weeks", sublabel: "Jun-Aug", trend: "neutral" },
    { label: "Contract Length", value: "10-12 months", sublabel: "Typical student AST", trend: "neutral" },
  ],
  whoItSuits: ["Landlords near universities", "Investors seeking group tenancies", "Operators comfortable with seasonal rhythm", "Low capital entry investors"],
  idealAssets: [
    { icon: "Home", label: "4-6 Bed Houses", sub: "Group let ideal" },
    { icon: "Building", label: "Terraced Properties", sub: "Near campus" },
    { icon: "Landmark", label: "Converted HMOs", sub: "Room-let model" },
  ],
  advantages: ["Predictable academic cycle income", "Group tenancies reduce void complexity", "Guarantors reduce arrears risk", "Strong demand in university towns", "Lower capex than premium co-living"],
  constraints: ["Summer void risk", "Higher wear and tear", "Guarantor administration", "Seasonal re-let cycle", "Competition from PBSA"],
  bestMarket: ["Cities with Russell Group or major universities", "Student population over 15000", "Limited PBSA supply", "Within 1 mile of campus"],
  riskPosture: [
    { label: "Summer Void", level: "Medium" },
    { label: "Property Damage", level: "Medium" },
    { label: "Guarantor Default", level: "Low" },
    { label: "PBSA Competition", level: "Low" },
  ],
  timeline: [
    { label: "Setup", sub: "Purchase and compliance", duration: "6-10 weeks" },
    { label: "Summer Marketing", sub: "Aug-Oct for next year", duration: "8-12 weeks" },
    { label: "Let and Move In", sub: "Sep/Jan intakes", duration: "2-4 weeks" },
    { label: "Academic Year", sub: "Rent period", duration: "10-12 months" },
    { label: "Summer Void/Refurb", sub: "Turnover and clean", duration: "6-8 weeks" },
  ],
  modelSnapshot: {
    label: "Example Monthly P&L - 5-bed student let 190k property",
    lines: [
      { label: "5 Rooms x 475 GBP/mo (10 months)", value: "2375 GBP term-time" },
      { label: "Summer Void Allowance (annualised)", value: "-595 GBP/mo equiv" },
      { label: "Less Management (10%)", value: "-238 GBP" },
      { label: "Less Maintenance/Turnover", value: "-200 GBP" },
      { label: "Less Compliance/Bills equiv", value: "-70 GBP" },
      { label: "Net Monthly (annualised)", value: "1272 GBP", highlight: true },
      { label: "Annual Net Income", value: "15264 GBP" },
      { label: "Gross Yield", value: "9.4%" },
      { label: "Net Yield", value: "8.0%" },
    ],
  },
  incomeModel: {
    type: "Academic Year Room Rent",
    kpis: [
      { label: "Term-Time Room Income", value: "2375 GBP/mo", sublabel: "5 rooms at 475", trend: "neutral" },
      { label: "Annualised Yield", value: "9.4%", sublabel: "Gross on 190k", trend: "up" },
      { label: "Annual Net Income", value: "15264 GBP", sublabel: "After all costs", trend: "up" },
      { label: "Guarantor Coverage", value: "95%+", sublabel: "Parental guarantors", trend: "up" },
    ],
    structure: {
      label: "Student Let Income Calculation",
      description: "Room rents over 10-11 month academic year, adjusted for summer void and costs",
      lines: [
        { label: "Gross Term Income", formula: "Rooms x Room Rent x 10.5 months", example: "5 x 475 x 10.5 = 24938 GBP" },
        { label: "Summer Void Cost", formula: "Rooms x Rent x 1.5 void months", example: "5 x 475 x 1.5 = 3563 GBP" },
        { label: "Less Management", formula: "Gross x 10%", example: "24938 x 10% = 2494 GBP" },
        { label: "Less Maintenance/Turnover", formula: "Annual refurb and clean", example: "2400 GBP/yr" },
        { label: "Less Finance", formula: "Mortgage payments annual", example: "4200 GBP/yr" },
        { label: "Net Annual Income", formula: "Sum above", example: "15264 GBP" },
      ],
    },
    assumptions: [
      { label: "Room Count", default: "5", range: "4-7" },
      { label: "Room Rent", default: "475 GBP/mo", range: "380-620 GBP/mo" },
      { label: "Academic Year Length", default: "10.5 months", range: "10-12 months" },
      { label: "Summer Void", default: "6 weeks", range: "4-10 weeks" },
      { label: "Management Fee", default: "10%", range: "8-12%" },
      { label: "Turnover/Refurb", default: "200 GBP/mo equiv", range: "150-350 GBP/mo" },
    ],
    exampleCalc: {
      inputs: [
        { label: "Property Value", value: "190000 GBP" },
        { label: "5 Rooms at 475/mo", value: "2375 GBP/mo term-time" },
        { label: "Academic Year", value: "10.5 months" },
        { label: "Mortgage (75% LTV at 4.75%)", value: "142500 GBP" },
      ],
      outputs: [
        { label: "Gross Annual Income", value: "24938 GBP" },
        { label: "Less Summer Void (6 wks)", value: "-3563 GBP" },
        { label: "Less Management (10%)", value: "-2494 GBP" },
        { label: "Less Turnover/Maintenance", value: "-2400 GBP" },
        { label: "Less Mortgage Annual", value: "-4350 GBP" },
        { label: "Net Annual Income", value: "12131 GBP", highlight: true },
        { label: "Gross Yield", value: "13.1%" },
        { label: "Net Yield", value: "6.4%" },
      ],
    },
    sensitivityNote: "Student let cashflow is most sensitive to summer void length and room rent level. A 2-week extra void costs approximately 475 per room in lost rent.",
    benchmarkRanges: [
      { label: "Gross Yield", low: "6%", mid: "9%", high: "12%" },
      { label: "Room Rent", low: "350 GBP", mid: "475 GBP", high: "620 GBP" },
      { label: "Summer Void", low: "4 weeks", mid: "6 weeks", high: "10 weeks" },
    ],
  },
  costDrivers: {
    kpis: [
      { label: "Annual Turnover Cost", value: "1500-3000 GBP", sublabel: "Summer clean/refresh", trend: "neutral" },
      { label: "Summer Void Loss", value: "2400-4800 GBP", sublabel: "Lost rent", trend: "neutral" },
      { label: "Annual Compliance", value: "400-700 GBP", sublabel: "Certs and docs", trend: "neutral" },
      { label: "Management", value: "10%", sublabel: "Of gross rent", trend: "neutral" },
    ],
    categories: [
      {
        name: "Finance",
        items: [
          { label: "Mortgage Payment", typical: "350-600 GBP/mo", frequency: "Monthly", type: "fixed" },
        ],
      },
      {
        name: "Management",
        items: [
          { label: "Letting and Management Fee", typical: "8-12% of rent", frequency: "Monthly", type: "percentage" },
          { label: "Tenant Find Fee", typical: "50-75% of first month", frequency: "Per academic year", type: "fixed" },
        ],
      },
      {
        name: "Turnover and Maintenance",
        items: [
          { label: "Summer Deep Clean", typical: "300-600 GBP/yr", frequency: "Annual", type: "fixed" },
          { label: "Annual Room Refresh", typical: "100-200 GBP/room/yr", frequency: "Annual", type: "fixed" },
          { label: "Maintenance Reserve", typical: "100-150 GBP/mo", frequency: "Monthly", type: "fixed" },
          { label: "Garden/Exterior", typical: "200-400 GBP/yr", frequency: "Annual", type: "fixed" },
        ],
      },
      {
        name: "Compliance",
        items: [
          { label: "Gas Safety Certificate", typical: "70-90 GBP/yr", frequency: "Annual", type: "fixed" },
          { label: "EICR", typical: "150-250 GBP", frequency: "5-yearly", type: "fixed" },
          { label: "EPC", typical: "80-120 GBP", frequency: "10-yearly", type: "fixed" },
          { label: "HMO Licence (if 5+ persons)", typical: "200-700 GBP", frequency: "5-yearly", type: "fixed" },
        ],
      },
      {
        name: "Insurance",
        items: [
          { label: "Landlord Insurance (student specialist)", typical: "35-65 GBP/mo", frequency: "Monthly", type: "fixed" },
        ],
      },
    ],
    sensitivityNote: "Summer void and annual turnover cost are the two largest controllable variables. Marketing early (Jan-Feb) for next academic year significantly reduces void risk.",
    costControlTips: [
      "Market to next year students in January to minimise summer void",
      "Use group tenancy to reduce admin vs per-room ASTs",
      "Get parental guarantors for all student tenants",
      "Annual summer maintenance blitz between tenancies",
    ],
  },
  compliance: {
    score: 68, scoreLabel: "Moderate", criticalCount: 4,
    requirements: [
      { area: "Safety", item: "Gas Safety Certificate", priority: "High", required: true, renewal: "Annual", estimatedCost: "70-90 GBP", riskIfMissing: "Criminal prosecution" },
      { area: "Safety", item: "EICR", priority: "High", required: true, renewal: "5-yearly", estimatedCost: "150-250 GBP", riskIfMissing: "30000 GBP fine" },
      { area: "Energy", item: "EPC (min E)", priority: "High", required: true, renewal: "On let", estimatedCost: "80-120 GBP", riskIfMissing: "Cannot let" },
      { area: "Licensing", item: "HMO Licence (if 5+ unrelated persons)", priority: "High", required: false, renewal: "5-yearly", estimatedCost: "200-700 GBP", riskIfMissing: "Criminal offence if applicable" },
      { area: "Tenancy", item: "Right to Rent Check", priority: "High", required: true, renewal: "Pre-tenancy", estimatedCost: "No cost", riskIfMissing: "Fine up to 10000 GBP per tenant" },
      { area: "Deposit", item: "Deposit Protection", priority: "High", required: true, renewal: "Within 30 days", estimatedCost: "15-30 GBP", riskIfMissing: "3x deposit penalty" },
      { area: "Safety", item: "Smoke and CO Alarms", priority: "Medium", required: true, renewal: "On installation", estimatedCost: "30-80 GBP", riskIfMissing: "5000 GBP fine" },
      { area: "Tenancy", item: "Guarantor Agreements", priority: "Medium", required: false, renewal: "Per tenancy", estimatedCost: "0-50 GBP", riskIfMissing: "Unenforceable guarantor liability" },
    ],
    upcomingDeadlines: [
      { label: "Gas Safety Certificate renewal", due: "Annual", priority: "High" },
      { label: "EICR renewal", due: "5-yearly", priority: "High" },
      { label: "HMO Licence renewal (if applicable)", due: "5-yearly", priority: "Medium" },
    ],
    requiredDocs: ["AST Agreement (joint or per-room)", "Gas Safety Certificate", "EICR Report", "EPC Certificate", "Right to Rent Records", "Deposit Protection Certificate", "Guarantor Agreements", "How to Rent Guide", "Inventory Report"],
    aiInsight: "Student lets have moderate compliance burden. If 5+ unrelated students, full HMO compliance applies. Guarantor agreements are not legally required but are strongly recommended for debt recovery.",
  },
  forecast: {
    scenarios: [
      {
        name: "Base Case", type: "base",
        kpis: [
          { label: "Annual Gross Income", value: "24938 GBP", trend: "neutral" },
          { label: "Annual Costs", value: "12807 GBP", trend: "neutral" },
          { label: "Net Profit", value: "12131 GBP", highlight: true },
          { label: "Net Yield", value: "6.4%", trend: "neutral" },
        ],
        monthly: [
          { month: "Jan", income: 2375, costs: 850, net: 1525 },
          { month: "Feb", income: 2375, costs: 850, net: 1525 },
          { month: "Mar", income: 2375, costs: 850, net: 1525 },
          { month: "Apr", income: 2375, costs: 850, net: 1525 },
          { month: "May", income: 2375, costs: 850, net: 1525 },
          { month: "Jun", income: 2375, costs: 850, net: 1525 },
          { month: "Jul", income: 0, costs: 1200, net: -1200 },
          { month: "Aug", income: 0, costs: 1200, net: -1200 },
          { month: "Sep", income: 2375, costs: 850, net: 1525 },
          { month: "Oct", income: 2375, costs: 850, net: 1525 },
          { month: "Nov", income: 2375, costs: 850, net: 1525 },
          { month: "Dec", income: 2375, costs: 850, net: 1525 },
        ],
      },
      {
        name: "Optimistic", type: "optimistic",
        kpis: [
          { label: "Annual Gross Income", value: "27300 GBP", trend: "up" },
          { label: "Annual Costs", value: "11400 GBP", trend: "down" },
          { label: "Net Profit", value: "15900 GBP", highlight: true },
          { label: "Net Yield", value: "8.4%", trend: "up" },
        ],
        monthly: [
          { month: "Jan", income: 2600, costs: 800, net: 1800 },
          { month: "Feb", income: 2600, costs: 800, net: 1800 },
          { month: "Mar", income: 2600, costs: 800, net: 1800 },
          { month: "Apr", income: 2600, costs: 800, net: 1800 },
          { month: "May", income: 2600, costs: 800, net: 1800 },
          { month: "Jun", income: 2600, costs: 800, net: 1800 },
          { month: "Jul", income: 2600, costs: 800, net: 1800 },
          { month: "Aug", income: 1000, costs: 1400, net: -400 },
          { month: "Sep", income: 2600, costs: 800, net: 1800 },
          { month: "Oct", income: 2600, costs: 800, net: 1800 },
          { month: "Nov", income: 2600, costs: 800, net: 1800 },
          { month: "Dec", income: 2600, costs: 800, net: 1800 },
        ],
      },
      {
        name: "Conservative", type: "conservative",
        kpis: [
          { label: "Annual Gross Income", value: "19950 GBP", trend: "down" },
          { label: "Annual Costs", value: "14400 GBP", trend: "up" },
          { label: "Net Profit", value: "5550 GBP", highlight: true },
          { label: "Net Yield", value: "2.9%", trend: "down" },
        ],
        monthly: [
          { month: "Jan", income: 2100, costs: 950, net: 1150 },
          { month: "Feb", income: 2100, costs: 950, net: 1150 },
          { month: "Mar", income: 2100, costs: 950, net: 1150 },
          { month: "Apr", income: 2100, costs: 950, net: 1150 },
          { month: "May", income: 2100, costs: 950, net: 1150 },
          { month: "Jun", income: 0, costs: 1200, net: -1200 },
          { month: "Jul", income: 0, costs: 1200, net: -1200 },
          { month: "Aug", income: 0, costs: 1200, net: -1200 },
          { month: "Sep", income: 2100, costs: 950, net: 1150 },
          { month: "Oct", income: 2100, costs: 950, net: 1150 },
          { month: "Nov", income: 2100, costs: 950, net: 1150 },
          { month: "Dec", income: 2100, costs: 950, net: 1150 },
        ],
      },
    ],
    baseKpis: [
      { label: "Annual Gross Income", value: "24938 GBP", trend: "neutral" },
      { label: "Annual Costs", value: "12807 GBP", trend: "neutral" },
      { label: "Net Profit", value: "12131 GBP", highlight: true },
      { label: "Gross Yield", value: "13.1%", trend: "neutral" },
      { label: "Net Yield", value: "6.4%", trend: "neutral" },
      { label: "Summer Void Cost", value: "3563 GBP/yr", sublabel: "6-week average" },
    ],
    assumptions: [
      { label: "Property Value", value: "190000 GBP" },
      { label: "Room Count", value: "5" },
      { label: "Room Rent", value: "475 GBP/mo" },
      { label: "Academic Year", value: "10.5 months" },
      { label: "Management Fee", value: "10%" },
      { label: "Summer Void", value: "6 weeks" },
    ],
    sensitivityRows: [
      { variable: "Room Rent +/- 25 GBP", base: "475 GBP", upside: "+1313/yr", downside: "-1313/yr" },
      { variable: "Summer Void +/- 2 weeks", base: "6 weeks", upside: "+4750/yr", downside: "-4750/yr" },
      { variable: "Mortgage Rate +/- 0.5%", base: "4.75%", upside: "+712/yr", downside: "-712/yr" },
      { variable: "Turnover Cost +/- 500 GBP/yr", base: "2400 GBP/yr", upside: "+500/yr", downside: "-500/yr" },
    ],
    forecastNote: "Base assumes 10.5-month academic year, 6-week summer void, annual turnover between tenancies. Optimistic reflects 12-month let with overseas students. Conservative reflects 10-week void and higher turnover damage.",
  },
  checklist: {
    phases: [
      {
        name: "Acquisition",
        tasks: [
          { label: "Confirm university proximity and campus demand", priority: "High", owner: "Investor", daysOffset: 0 },
          { label: "Check local student room rents", priority: "High", owner: "Investor", daysOffset: 7 },
          { label: "Review PBSA supply in area", priority: "Medium", owner: "Investor", daysOffset: 7 },
          { label: "Mortgage decision in principle (student specialist)", priority: "High", owner: "Broker", daysOffset: 14 },
          { label: "Check HMO licence requirement", priority: "High", owner: "Investor", daysOffset: 14 },
          { label: "Instruct solicitor", priority: "Medium", owner: "Investor", daysOffset: 21 },
        ],
      },
      {
        name: "Pre-Let Setup",
        tasks: [
          { label: "Gas safety certificate obtained", priority: "High", owner: "Engineer", daysOffset: 56 },
          { label: "EICR completed", priority: "High", owner: "Engineer", daysOffset: 56 },
          { label: "EPC obtained (min E)", priority: "High", owner: "Assessor", daysOffset: 56 },
          { label: "Smoke and CO alarms fitted", priority: "High", owner: "Investor", daysOffset: 56 },
          { label: "HMO licence applied for (if applicable)", priority: "High", owner: "Investor", daysOffset: 56 },
          { label: "Furnish rooms to student standard", priority: "Medium", owner: "Investor", daysOffset: 63 },
        ],
      },
      {
        name: "Marketing",
        tasks: [
          { label: "List on student portals (Rightmove, SpareRoom, Unipol)", priority: "High", owner: "Agent", daysOffset: 63 },
          { label: "Market to universities and student unions", priority: "Medium", owner: "Investor", daysOffset: 70 },
          { label: "Tenant referencing and guarantor checks", priority: "High", owner: "Agent", daysOffset: 77 },
          { label: "AST signed and deposit protected", priority: "High", owner: "Agent", daysOffset: 84 },
        ],
      },
      {
        name: "Annual Operations",
        tasks: [
          { label: "Start next year marketing in January", priority: "High", owner: "Agent", daysOffset: 270 },
          { label: "Summer turnover and deep clean", priority: "High", owner: "Investor", daysOffset: 365 },
          { label: "Annual gas safety renewal", priority: "High", owner: "Engineer", daysOffset: 365 },
          { label: "Room refresh and maintenance", priority: "Medium", owner: "Investor", daysOffset: 375 },
        ],
      },
    ],
    criticalPathItems: [
      "Gas Safety Certificate before tenancy start",
      "HMO licence in place if 5+ unrelated persons",
      "Deposit protected within 30 days",
      "Marketing must start Jan/Feb for September intake",
    ],
  },
  risks: {
    overallRating: "Medium", totalExposureEstimate: "3000-9000 GBP/year",
    register: [
      { name: "Extended Summer Void", category: "Financial", likelihood: "Possible", impact: "Medium", score: 6, mitigation: "Early marketing in January, 12-month tenancy option, overseas students", owner: "Agent" },
      { name: "Property Damage Beyond Deposit", category: "Operational", likelihood: "Possible", impact: "Medium", score: 6, mitigation: "Robust inventory, full deposit, student specialist insurance", owner: "Investor" },
      { name: "Guarantor Default", category: "Financial", likelihood: "Low", impact: "Medium", score: 3, mitigation: "Full credit check on guarantors, parental guarantors preferred", owner: "Investor" },
      { name: "PBSA Competition", category: "Market", likelihood: "Possible", impact: "Medium", score: 6, mitigation: "Target proximity to campus, competitive all-inclusive pricing", owner: "Investor" },
      { name: "Regulatory Change (HMO)", category: "Regulatory", likelihood: "Low", impact: "High", score: 8, mitigation: "Monitor NRLA and council updates, compliant property standard", owner: "Investor" },
      { name: "Group Tenancy Breakdown", category: "Operational", likelihood: "Low", impact: "Medium", score: 3, mitigation: "Joint tenancy agreement, guarantors for each tenant", owner: "Agent" },
    ],
    topByExposure: [
      { label: "Summer Void", exposure: "2400-5700 GBP/yr", level: "Medium" },
      { label: "Damage Beyond Deposit", exposure: "500-3000 GBP", level: "Medium" },
      { label: "PBSA Competition Impact", exposure: "Yield reduction risk", level: "Low" },
    ],
    mitigationActions: [
      "Market to next academic year in January each year",
      "Require parental guarantors for all student tenants",
      "Specialist student let insurance covering accidental damage",
      "Detailed room-by-room inventory with photos at each check-in",
    ],
  },
  aiQuestions: {
    suggestedQuestions: [
      { question: "What room rents are realistic near this university?", category: "Pricing", insight: "Student portal benchmarks, room type demand, distance to campus premium analysis" },
      { question: "How do I reduce the summer void risk?", category: "Void Management", insight: "12-month tenancy options, overseas student demand, summer let strategies" },
      { question: "Should I use joint tenancy or individual room ASTs?", category: "Tenancy Structure", insight: "Risk allocation, admin burden, HMO licence implications, debt recovery comparison" },
      { question: "Is PBSA competition a risk in this area?", category: "Market Analysis", insight: "PBSA pipeline data, private student housing vacancy rates, price gap analysis" },
      { question: "What guarantor protections should I have in place?", category: "Risk Management", insight: "Guarantor agreement requirements, creditworthiness checks, enforcement routes" },
    ],
    keyDrivers: ["Summer Void Length", "Room Rent Level", "Distance to Campus", "PBSA Competition", "Guarantor Quality"],
    quickStats: [
      { label: "Typical Setup Cost", value: "1200-3000 GBP" },
      { label: "Annual Turnover Cost", value: "1500-3500 GBP" },
      { label: "Summer Void Average", value: "6-8 weeks" },
      { label: "Annual Compliance Cost", value: "300-600 GBP" },
    ],
    recommendations: [
      "Start marketing for next academic year in January",
      "Require parental guarantors for all tenants",
      "Consider 12-month tenancy to cover summer months",
    ],
    confidenceScore: 81, confidenceLabel: "Good Confidence",
  },
  quickActions: [
    { label: "Start Planning Set", sub: "Build your student let plan", icon: "Play", action: "start-planning" },
    { label: "Compare Profile", sub: "vs HMO or Co-Living", icon: "BarChart2", action: "compare" },
    { label: "Run Quick Scenario", sub: "Academic year cashflow", icon: "Zap", action: "quick-scenario" },
    { label: "Download Pack", sub: "PDF profile guide", icon: "Download", action: "download" },
  ],
  pros: ["Predictable annual demand cycle", "Group tenancies simplify administration", "Parental guarantors reduce arrears risk", "Strong demand in university cities", "Lower capex than premium models"],
  cons: ["Summer void risk reduces annual yield", "Higher wear and tear than professional lets", "Guarantor administration adds complexity", "PBSA competition increasing in many cities", "Academic cycle limits flexibility"],
}

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE 4 — CO-LIVING
// ─────────────────────────────────────────────────────────────────────────────
export const CO_LIVING_CONFIG: ProfileConfig = {
  key: "co_living", slug: "co-living", name: "Co-Living", number: 4,
  tagline: "Premium managed shared living with community services and amenity income",
  description: "Managed shared living spaces targeting young professionals. All-inclusive room pricing with community amenities, events and services creating a membership-style experience.",
  icon: "Sofa", accentColor: "#0891B2", bgColor: "#ECFEFF",
  group: "residential", groupLabel: "Residential Rental",
  tags: ["Premium Shared Living", "Community", "High Management", "Young Professionals"],
  riskLevel: "Medium", managementIntensity: "High", complianceIntensity: "Medium", capitalIntensity: "High",
  primaryMetric: { label: "Typical Gross Yield", value: "8-14%", sublabel: "Room plus services income" },
  overviewKpis: [
    { label: "Gross Yield", value: "8-14%", sublabel: "Market benchmark", trend: "up" },
    { label: "Avg Room Rate", value: "700-1100 GBP/mo", sublabel: "All-inclusive premium", trend: "up" },
    { label: "Target Occupancy", value: "88-95%", sublabel: "Required for viability", trend: "up" },
    { label: "Premium vs HMO", value: "25-40%", sublabel: "Per room rate uplift", trend: "up" },
  ],
  whoItSuits: ["Premium BTL investors", "Operators with hospitality mindset", "Urban block owners", "Portfolio operators seeking brand", "Build-to-rent investors at smaller scale"],
  idealAssets: [
    { icon: "Home", label: "Large Urban Houses 5+ beds", sub: "Conversion to co-living" },
    { icon: "Building", label: "Former Commercial Buildings", sub: "Urban conversion" },
    { icon: "Landmark", label: "Purpose-Built Blocks", sub: "Institutional co-living" },
  ],
  advantages: ["Premium room rates vs standard HMO", "Amenity income streams (gym, events, parking)", "Brand loyalty and lower churn", "Strong professional tenant demand", "Community model reduces isolation-driven churn"],
  constraints: ["High fit-out capex requirement", "Operational complexity", "Management intensity high", "Needs brand and community infrastructure", "Longer ramp-up to stabilise occupancy"],
  bestMarket: ["London Zone 2-4", "Major city centre locations", "Tech hub proximity", "Transport-connected urban areas"],
  riskPosture: [
    { label: "Occupancy Ramp Risk", level: "Medium" },
    { label: "Fit-Out Cost Overrun", level: "Medium" },
    { label: "Community Management", level: "Medium" },
    { label: "Bills Cost", level: "Medium" },
  ],
  timeline: [
    { label: "Acquisition", sub: "Find, survey, planning check", duration: "6-10 weeks" },
    { label: "Design and Fit-Out", sub: "Premium rooms, communal spaces", duration: "8-16 weeks" },
    { label: "Compliance", sub: "HMO licence, FRA, certs", duration: "4-8 weeks" },
    { label: "Brand and Marketing", sub: "Website, photos, launch", duration: "3-5 weeks" },
    { label: "Lease-Up", sub: "Reach stabilised occupancy", duration: "2-4 months" },
  ],
  modelSnapshot: {
    label: "Example Monthly P&L - 8-room co-living 420k property",
    lines: [
      { label: "8 Rooms x 850 GBP/mo", value: "6800 GBP" },
      { label: "Amenity Income (events/extras)", value: "400 GBP" },
      { label: "Less Bills (all-inclusive)", value: "-600 GBP" },
      { label: "Less Management (15%)", value: "-1020 GBP" },
      { label: "Less Maintenance/Community", value: "-250 GBP" },
      { label: "Less Finance (mortgage)", value: "-1300 GBP" },
      { label: "Net Monthly Cashflow", value: "4030 GBP", highlight: true },
      { label: "Gross Yield", value: "19.4%" },
      { label: "Net Yield", value: "11.5%" },
    ],
  },
  incomeModel: {
    type: "All-Inclusive Room Membership",
    kpis: [
      { label: "Gross Room Income", value: "6800 GBP/mo", sublabel: "8 rooms at 850", trend: "up" },
      { label: "Amenity Income", value: "400 GBP/mo", sublabel: "Services and events", trend: "up" },
      { label: "Total Revenue", value: "7200 GBP/mo", sublabel: "Room plus amenity", trend: "up" },
      { label: "Net Monthly", value: "4030 GBP/mo", sublabel: "After all costs", trend: "up" },
    ],
    structure: {
      label: "Co-Living Income Calculation",
      description: "Room rates plus amenity income minus bills, management, maintenance and finance",
      lines: [
        { label: "Gross Room Revenue", formula: "Rooms x Premium Room Rate", example: "8 x 850 = 6800 GBP" },
        { label: "Plus Amenity Income", formula: "Events + services + extras", example: "400 GBP/mo" },
        { label: "Less Bills (all-inclusive)", formula: "Gas + Electric + Broadband + CT + WiFi", example: "600 GBP/mo" },
        { label: "Less Management", formula: "Total revenue x 15%", example: "1080 GBP/mo" },
        { label: "Less Community/Maintenance", formula: "Events + cleaning + upkeep", example: "250 GBP/mo" },
        { label: "Less Finance", formula: "Monthly mortgage", example: "1300 GBP/mo" },
        { label: "Net Monthly", formula: "Sum above", example: "4030 GBP" },
      ],
    },
    assumptions: [
      { label: "Room Count", default: "8", range: "6-20" },
      { label: "Average Room Rate", default: "850 GBP/mo", range: "650-1200 GBP/mo" },
      { label: "Amenity Income", default: "400 GBP/mo", range: "200-800 GBP/mo" },
      { label: "Monthly Bills", default: "600 GBP/mo", range: "400-900 GBP/mo" },
      { label: "Management Fee", default: "15%", range: "12-18%" },
      { label: "Occupancy", default: "90%", range: "80-96%" },
    ],
    exampleCalc: {
      inputs: [
        { label: "Property Value", value: "420000 GBP" },
        { label: "8 Rooms at 850/mo", value: "6800 GBP/mo" },
        { label: "Amenity Income", value: "400 GBP/mo" },
        { label: "Mortgage (65% LTV at 5%)", value: "273000 GBP" },
      ],
      outputs: [
        { label: "Total Monthly Revenue", value: "7200 GBP" },
        { label: "Net of Bills", value: "6600 GBP" },
        { label: "Net of Management (15%)", value: "5520 GBP" },
        { label: "Net of Maintenance/Community", value: "5270 GBP" },
        { label: "Net Monthly Cashflow (after mortgage)", value: "4030 GBP", highlight: true },
        { label: "Gross Yield", value: "19.4%" },
        { label: "Net Yield", value: "11.5%" },
      ],
    },
    sensitivityNote: "Co-living cashflow is most sensitive to occupancy rate and room rate premium. Losing 2 rooms to void costs 1700/mo. Rate drops of 50/room cost 400/mo.",
    benchmarkRanges: [
      { label: "Gross Yield", low: "8%", mid: "12%", high: "14%" },
      { label: "Room Rate", low: "650 GBP", mid: "850 GBP", high: "1100 GBP" },
      { label: "Occupancy", low: "80%", mid: "90%", high: "96%" },
    ],
  },
  costDrivers: {
    kpis: [
      { label: "Fit-Out Capex", value: "15000-30000 GBP", sublabel: "Per room premium", trend: "neutral" },
      { label: "Monthly Bills", value: "600-900 GBP", sublabel: "All utilities", trend: "up" },
      { label: "Management Cost", value: "15%", sublabel: "Of total revenue", trend: "neutral" },
      { label: "Community Budget", value: "200-400 GBP/mo", sublabel: "Events and extras", trend: "neutral" },
    ],
    categories: [
      {
        name: "Fit-Out (One-Off Capex)",
        items: [
          { label: "Room Premium Fit-Out", typical: "8000-15000 GBP/room", frequency: "One-off", type: "fixed" },
          { label: "Communal Area Design", typical: "15000-40000 GBP", frequency: "One-off", type: "fixed" },
          { label: "Smart Technology/Access", typical: "2000-5000 GBP", frequency: "One-off", type: "fixed" },
          { label: "Branding/Photography", typical: "1500-4000 GBP", frequency: "One-off", type: "fixed" },
        ],
      },
      {
        name: "Utilities and Bills",
        items: [
          { label: "Gas and Electricity", typical: "200-400 GBP/mo", frequency: "Monthly", type: "variable" },
          { label: "Broadband (high speed)", typical: "60-100 GBP/mo", frequency: "Monthly", type: "fixed" },
          { label: "Council Tax", typical: "120-200 GBP/mo", frequency: "Monthly", type: "fixed" },
          { label: "Water", typical: "40-60 GBP/mo", frequency: "Monthly", type: "fixed" },
        ],
      },
      {
        name: "Management",
        items: [
          { label: "Co-Living Management Fee", typical: "12-18% of revenue", frequency: "Monthly", type: "percentage" },
          { label: "Community Manager", typical: "0 or 500-1500 GBP/mo", frequency: "Monthly", type: "fixed" },
        ],
      },
      {
        name: "Community and Amenity",
        items: [
          { label: "Monthly Events Budget", typical: "100-300 GBP/mo", frequency: "Monthly", type: "fixed" },
          { label: "Communal Cleaning", typical: "100-200 GBP/mo", frequency: "Monthly", type: "fixed" },
          { label: "Consumables (coffee, toiletries)", typical: "50-100 GBP/mo", frequency: "Monthly", type: "variable" },
        ],
      },
      {
        name: "Finance",
        items: [
          { label: "Mortgage Payment", typical: "1000-2000 GBP/mo", frequency: "Monthly", type: "fixed" },
        ],
      },
    ],
    sensitivityNote: "Fit-out capex is the largest upfront variable and materially affects ROI. Premium communal areas command 15-25% higher room rates but cost 15000-40000 GBP to create.",
    costControlTips: [
      "Phase community area upgrades to manage cashflow",
      "Negotiate fixed energy tariff at portfolio level",
      "Community events can be self-funding through ticket sales",
      "Smart access tech reduces on-site management cost",
    ],
  },
  compliance: {
    score: 62, scoreLabel: "Moderate-High", criticalCount: 6,
    requirements: [
      { area: "Licensing", item: "HMO Licence (typically required)", priority: "High", required: true, renewal: "5-yearly", estimatedCost: "200-700 GBP", riskIfMissing: "Criminal offence" },
      { area: "Fire Safety", item: "Fire Risk Assessment", priority: "High", required: true, renewal: "Annual review", estimatedCost: "200-400 GBP", riskIfMissing: "Prosecution, injury liability" },
      { area: "Fire Safety", item: "Fire Doors and Suppression", priority: "High", required: true, renewal: "On install", estimatedCost: "150-300 GBP/door", riskIfMissing: "Licence refusal" },
      { area: "Safety", item: "Gas Safety Certificate", priority: "High", required: true, renewal: "Annual", estimatedCost: "80-120 GBP", riskIfMissing: "Criminal prosecution" },
      { area: "Safety", item: "EICR", priority: "High", required: true, renewal: "5-yearly", estimatedCost: "200-350 GBP", riskIfMissing: "30000 GBP fine" },
      { area: "Energy", item: "EPC (min E)", priority: "High", required: true, renewal: "On let", estimatedCost: "80-120 GBP", riskIfMissing: "Cannot let" },
      { area: "Tenancy", item: "Licence Agreement or AST per member", priority: "Medium", required: true, renewal: "Per member", estimatedCost: "30-80 GBP", riskIfMissing: "Unenforceable tenancy" },
      { area: "Tenancy", item: "Deposit Protection", priority: "High", required: true, renewal: "Per member", estimatedCost: "15-30 GBP", riskIfMissing: "3x deposit penalty" },
    ],
    upcomingDeadlines: [
      { label: "Gas Safety Certificate renewal", due: "Annual", priority: "High" },
      { label: "Fire Risk Assessment review", due: "Annual", priority: "High" },
      { label: "HMO Licence renewal", due: "5-yearly", priority: "High" },
    ],
    requiredDocs: ["HMO Licence", "Fire Risk Assessment", "Gas Safety Certificate", "EICR Report", "EPC Certificate", "Member Agreements or ASTs", "Deposit Protection Certificates", "House Rules Document", "Inventory per Room"],
    aiInsight: "Co-living falls under HMO regulations in most cases. The main compliance risk beyond standard HMO is the member agreement structure - ensure your occupancy agreement is legally robust and does not create an unintended AST.",
  },
  forecast: {
    scenarios: [
      {
        name: "Base Case", type: "base",
        kpis: [
          { label: "Annual Revenue", value: "86400 GBP", trend: "neutral" },
          { label: "Annual Costs", value: "37680 GBP", trend: "neutral" },
          { label: "Net Annual", value: "48360 GBP", highlight: true },
          { label: "Net Yield", value: "11.5%", trend: "neutral" },
        ],
        monthly: [
          { month: "Jan", income: 6120, costs: 3140, net: 2980 },
          { month: "Feb", income: 6120, costs: 3140, net: 2980 },
          { month: "Mar", income: 7200, costs: 3140, net: 4060 },
          { month: "Apr", income: 7200, costs: 3140, net: 4060 },
          { month: "May", income: 7200, costs: 3140, net: 4060 },
          { month: "Jun", income: 7200, costs: 3140, net: 4060 },
          { month: "Jul", income: 7200, costs: 3140, net: 4060 },
          { month: "Aug", income: 7200, costs: 3140, net: 4060 },
          { month: "Sep", income: 7200, costs: 3140, net: 4060 },
          { month: "Oct", income: 7200, costs: 3140, net: 4060 },
          { month: "Nov", income: 6120, costs: 3140, net: 2980 },
          { month: "Dec", income: 5640, costs: 3140, net: 2500 },
        ],
      },
      {
        name: "Optimistic", type: "optimistic",
        kpis: [
          { label: "Annual Revenue", value: "97200 GBP", trend: "up" },
          { label: "Annual Costs", value: "35400 GBP", trend: "down" },
          { label: "Net Annual", value: "61800 GBP", highlight: true },
          { label: "Net Yield", value: "14.7%", trend: "up" },
        ],
        monthly: [
          { month: "Jan", income: 8100, costs: 2950, net: 5150 },
          { month: "Feb", income: 8100, costs: 2950, net: 5150 },
          { month: "Mar", income: 8100, costs: 2950, net: 5150 },
          { month: "Apr", income: 8100, costs: 2950, net: 5150 },
          { month: "May", income: 8100, costs: 2950, net: 5150 },
          { month: "Jun", income: 8100, costs: 2950, net: 5150 },
          { month: "Jul", income: 8100, costs: 2950, net: 5150 },
          { month: "Aug", income: 8100, costs: 2950, net: 5150 },
          { month: "Sep", income: 8100, costs: 2950, net: 5150 },
          { month: "Oct", income: 8100, costs: 2950, net: 5150 },
          { month: "Nov", income: 8100, costs: 2950, net: 5150 },
          { month: "Dec", income: 8100, costs: 2950, net: 5150 },
        ],
      },
      {
        name: "Conservative", type: "conservative",
        kpis: [
          { label: "Annual Revenue", value: "68400 GBP", trend: "down" },
          { label: "Annual Costs", value: "43200 GBP", trend: "up" },
          { label: "Net Annual", value: "25200 GBP", highlight: true },
          { label: "Net Yield", value: "6.0%", trend: "down" },
        ],
        monthly: [
          { month: "Jan", income: 5100, costs: 3600, net: 1500 },
          { month: "Feb", income: 5100, costs: 3600, net: 1500 },
          { month: "Mar", income: 5100, costs: 3600, net: 1500 },
          { month: "Apr", income: 5700, costs: 3600, net: 2100 },
          { month: "May", income: 5700, costs: 3600, net: 2100 },
          { month: "Jun", income: 6120, costs: 3600, net: 2520 },
          { month: "Jul", income: 6120, costs: 3600, net: 2520 },
          { month: "Aug", income: 6120, costs: 3600, net: 2520 },
          { month: "Sep", income: 6120, costs: 3600, net: 2520 },
          { month: "Oct", income: 5700, costs: 3600, net: 2100 },
          { month: "Nov", income: 5100, costs: 3600, net: 1500 },
          { month: "Dec", income: 4320, costs: 3600, net: 720 },
        ],
      },
    ],
    baseKpis: [
      { label: "Annual Revenue", value: "86400 GBP", trend: "neutral" },
      { label: "Annual Costs", value: "37680 GBP", trend: "neutral" },
      { label: "Net Annual", value: "48360 GBP", highlight: true },
      { label: "Gross Yield", value: "19.4%", trend: "neutral" },
      { label: "Net Yield", value: "11.5%", trend: "neutral" },
      { label: "Breakeven Occupancy", value: "68%", sublabel: "5.4 of 8 rooms" },
    ],
    assumptions: [
      { label: "Property Value", value: "420000 GBP" },
      { label: "Room Count", value: "8" },
      { label: "Room Rate", value: "850 GBP/mo" },
      { label: "Occupancy", value: "90%" },
      { label: "Management Fee", value: "15%" },
      { label: "Monthly Bills", value: "600 GBP" },
    ],
    sensitivityRows: [
      { variable: "Room Rate +/- 50 GBP", base: "850 GBP", upside: "+4800/yr", downside: "-4800/yr" },
      { variable: "Occupancy +/- 5%", base: "90%", upside: "+4080/yr", downside: "-4080/yr" },
      { variable: "Management Fee +/- 2%", base: "15%", upside: "+2074/yr", downside: "-2074/yr" },
      { variable: "Bills +/- 100 GBP/mo", base: "600 GBP", upside: "+1200/yr", downside: "-1200/yr" },
    ],
    forecastNote: "Base assumes 90% occupancy after 3-month ramp-up, stable professional tenants, seasonal dip in December and January. Optimistic reflects full occupancy with amenity premium.",
  },
  checklist: {
    phases: [
      {
        name: "Acquisition and Planning",
        tasks: [
          { label: "Confirm planning use class for co-living", priority: "High", owner: "Planner", daysOffset: 0 },
          { label: "Check HMO licence requirement", priority: "High", owner: "Investor", daysOffset: 7 },
          { label: "Competitor room rate research", priority: "High", owner: "Investor", daysOffset: 7 },
          { label: "Design brief and fit-out specification", priority: "Medium", owner: "Investor", daysOffset: 21 },
          { label: "Mortgage with co-living specialist lender", priority: "High", owner: "Broker", daysOffset: 14 },
        ],
      },
      {
        name: "Fit-Out and Compliance",
        tasks: [
          { label: "Fire risk assessment and fire doors", priority: "High", owner: "Assessor", daysOffset: 56 },
          { label: "Premium room fit-out completed", priority: "High", owner: "Contractor", daysOffset: 77 },
          { label: "Communal areas fitted and styled", priority: "High", owner: "Contractor", daysOffset: 77 },
          { label: "Gas safety cert, EICR, EPC obtained", priority: "High", owner: "Engineer", daysOffset: 84 },
          { label: "HMO licence application submitted", priority: "High", owner: "Investor", daysOffset: 56 },
        ],
      },
      {
        name: "Launch",
        tasks: [
          { label: "Professional photography and virtual tour", priority: "High", owner: "Photographer", daysOffset: 84 },
          { label: "Website and listing profiles live", priority: "High", owner: "Manager", daysOffset: 91 },
          { label: "Social media and influencer outreach", priority: "Medium", owner: "Manager", daysOffset: 91 },
          { label: "First member applications and referencing", priority: "High", owner: "Manager", daysOffset: 98 },
        ],
      },
      {
        name: "Stabilisation",
        tasks: [
          { label: "Reach 80% occupancy", priority: "High", owner: "Manager", daysOffset: 120 },
          { label: "First community events programme", priority: "Medium", owner: "Manager", daysOffset: 105 },
          { label: "Review pricing and adjust", priority: "Medium", owner: "Investor", daysOffset: 150 },
          { label: "Reach stabilised 90%+ occupancy", priority: "High", owner: "Manager", daysOffset: 180 },
        ],
      },
    ],
    criticalPathItems: [
      "HMO licence in place before any members move in",
      "Fire safety compliance pre-let",
      "Member agreement structure reviewed by solicitor",
      "Minimum 80% occupancy required to cover operating costs",
    ],
  },
  risks: {
    overallRating: "Medium", totalExposureEstimate: "10000-25000 GBP/year",
    register: [
      { name: "Slow Lease-Up (occupancy ramp risk)", category: "Financial", likelihood: "Possible", impact: "High", score: 9, mitigation: "Pre-launch waitlist, referral incentives, flexible short-stay options", owner: "Manager" },
      { name: "Fit-Out Cost Overrun", category: "Financial", likelihood: "Possible", impact: "Medium", score: 6, mitigation: "Fixed-price contract, staged payments, 15% contingency", owner: "Investor" },
      { name: "Bills Inflation", category: "Financial", likelihood: "Likely", impact: "Medium", score: 12, mitigation: "Fixed energy tariffs, smart monitoring, fair-use clause", owner: "Investor" },
      { name: "High Member Churn", category: "Operational", likelihood: "Possible", impact: "Medium", score: 6, mitigation: "Community programme, responsive management, competitive pricing", owner: "Manager" },
      { name: "Planning/Licensing Refusal", category: "Regulatory", likelihood: "Low", impact: "High", score: 8, mitigation: "Pre-application advice, confirm use class before purchase", owner: "Planner" },
      { name: "Community Management Failure", category: "Operational", likelihood: "Low", impact: "Medium", score: 3, mitigation: "Dedicated community manager, structured events programme", owner: "Manager" },
    ],
    topByExposure: [
      { label: "Lease-Up Void Period", exposure: "7200-14400 GBP in ramp", level: "High" },
      { label: "Bills Inflation", exposure: "1800-4800 GBP/yr", level: "Medium" },
      { label: "Fit-Out Overrun", exposure: "5000-20000 GBP one-off", level: "Medium" },
    ],
    mitigationActions: [
      "Build 3-month void reserve before opening",
      "Pre-launch marketing to build waitlist",
      "Fix energy tariffs on all co-living properties",
      "Invest in community management from day one",
    ],
  },
  aiQuestions: {
    suggestedQuestions: [
      { question: "What premium can I charge over standard HMO rates?", category: "Pricing", insight: "Co-living premium benchmarks by city, amenity contribution to rate, target demographic willingness to pay" },
      { question: "What fit-out specification maximises ROI?", category: "Capex Planning", insight: "Room upgrade vs communal area ROI analysis, spec level vs target market, premium materials vs turnover cost" },
      { question: "How long does it take to reach stable occupancy?", category: "Ramp-Up", insight: "Typical lease-up timeline for co-living, marketing channel effectiveness, waitlist strategy" },
      { question: "Should I use a licence agreement or AST?", category: "Legal Structure", insight: "Co-living tenancy structure options, licence vs AST implications, deposit and eviction implications" },
      { question: "What amenities drive the highest willingness to pay?", category: "Amenity Strategy", insight: "Co-living amenity benchmarking, high-speed WiFi vs gym vs events, operational cost per amenity" },
    ],
    keyDrivers: ["Room Rate Premium", "Occupancy Rate", "Amenity Income", "Management Quality", "Community Churn"],
    quickStats: [
      { label: "Typical Fit-Out Cost", value: "80000-200000 GBP" },
      { label: "Ramp-Up Period", value: "2-4 months to stabilise" },
      { label: "Target Churn Rate", value: "Less than 20%/yr" },
      { label: "Annual Operating Cost", value: "35-45% of revenue" },
    ],
    recommendations: [
      "Build a waitlist before launch to minimise lease-up void",
      "Invest in communal areas - they drive 25-40% rate premium",
      "Fix energy costs - bills are the largest variable cost in all-inclusive model",
    ],
    confidenceScore: 74, confidenceLabel: "Good Confidence",
  },
  quickActions: [
    { label: "Start Planning Set", sub: "Build your co-living plan", icon: "Play", action: "start-planning" },
    { label: "Compare Profile", sub: "vs HMO or BTR", icon: "BarChart2", action: "compare" },
    { label: "Run Quick Scenario", sub: "Room yield with amenity", icon: "Zap", action: "quick-scenario" },
    { label: "Download Pack", sub: "PDF profile guide", icon: "Download", action: "download" },
  ],
  pros: ["25-40% room rate premium over standard HMO", "Amenity income diversifies revenue", "Community model reduces churn", "Strong young professional demand", "Brand and platform scalability"],
  cons: ["High fit-out capex requirement", "Longer ramp-up to stabilised occupancy", "Active community management required", "Bills risk in all-inclusive model", "Planning and licensing complexity"],
}

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE 5 — SERVICED ACCOMMODATION
// ─────────────────────────────────────────────────────────────────────────────
export const SERVICED_ACCOMMODATION_CONFIG: ProfileConfig = {
  key: "serviced_accommodation", slug: "serviced-accommodation", name: "Serviced Accommodation", number: 5,
  tagline: "Short-stay nightly revenue driven by ADR, occupancy and RevPAR optimisation",
  description: "Short-term lets via Airbnb and Booking.com for nightly or weekly corporate and leisure stays. Revenue driven by dynamic pricing, occupancy management and guest experience.",
  icon: "Bed", accentColor: "#F59E0B", bgColor: "#FFFBEB",
  group: "residential", groupLabel: "Short-Stay",
  tags: ["Short-Stay", "Hospitality", "High Turnover", "Dynamic Pricing"],
  riskLevel: "High", managementIntensity: "High", complianceIntensity: "High", capitalIntensity: "Medium",
  primaryMetric: { label: "Typical RevPAR", value: "45-90 GBP/night", sublabel: "Revenue per available night" },
  overviewKpis: [
    { label: "ADR", value: "65-130 GBP", sublabel: "Average daily rate", trend: "up" },
    { label: "Occupancy", value: "65-82%", sublabel: "Annual average", trend: "up" },
    { label: "RevPAR", value: "45-90 GBP", sublabel: "Per available night", trend: "up" },
    { label: "Gross Yield", value: "12-30%", sublabel: "vs purchase price", trend: "up" },
  ],
  whoItSuits: ["Active investors with hospitality mindset", "Corporate corridor property owners", "City centre flat owners", "Rent-to-rent SA operators", "Dynamic pricing enthusiasts"],
  idealAssets: [
    { icon: "Building", label: "City Centre Apartments", sub: "Corporate and tourist" },
    { icon: "Home", label: "Near Hospitals/Stadia", sub: "Corporate and event demand" },
    { icon: "Landmark", label: "Unique Properties", sub: "Airbnb Plus potential" },
  ],
  advantages: ["Highest yield potential of residential models", "Dynamic pricing captures seasonal upside", "Flexible use - personal stays possible", "Corporate bookings provide stability", "Platform reviews compound over time"],
  constraints: ["90-day limit in London without planning", "High operational intensity", "Platform fee drag 15-20%", "Seasonal demand variance", "Cleaning and linen cost per turn"],
  bestMarket: ["London and major UK cities", "Near hospitals for key workers", "University towns with event demand", "Tourist destinations", "Corporate travel hubs"],
  riskPosture: [
    { label: "Regulatory/Planning Risk", level: "High" },
    { label: "Seasonal Demand", level: "Medium" },
    { label: "Platform Dependency", level: "Medium" },
    { label: "Operational Complexity", level: "High" },
  ],
  timeline: [
    { label: "Setup", sub: "Purchase, furnish, photograph", duration: "4-8 weeks" },
    { label: "Platform Onboarding", sub: "Listings, pricing strategy", duration: "1-2 weeks" },
    { label: "Ramp-Up", sub: "Reviews and ranking build", duration: "4-8 weeks" },
    { label: "Optimisation", sub: "Dynamic pricing calibration", duration: "3-6 months" },
    { label: "Steady State", sub: "Ongoing ops and pricing", duration: "Ongoing" },
  ],
  modelSnapshot: {
    label: "Example Monthly P&L - city centre 1-bed at 200k",
    lines: [
      { label: "ADR 85 GBP x 72% Occupancy x 30 nights", value: "1836 GBP" },
      { label: "Less OTA Platform Fees (15%)", value: "-275 GBP" },
      { label: "Less Cleaning/Linen (avg 5 turns/wk)", value: "-540 GBP" },
      { label: "Less Utilities and Bills", value: "-180 GBP" },
      { label: "Less Management (if used, 20%)", value: "-312 GBP" },
      { label: "Less Finance (mortgage)", value: "-350 GBP" },
      { label: "Net Monthly Cashflow", value: "179 GBP", highlight: true },
      { label: "Annual Revenue", value: "22032 GBP" },
      { label: "Gross Yield", value: "11.0%" },
    ],
  },
  incomeModel: {
    type: "Nightly ADR x Occupancy (RevPAR)",
    kpis: [
      { label: "Monthly Revenue", value: "1836 GBP", sublabel: "ADR 85 at 72% occ", trend: "up" },
      { label: "Annual Revenue", value: "22032 GBP", sublabel: "Before costs", trend: "up" },
      { label: "RevPAR", value: "61.20 GBP", sublabel: "ADR x occupancy", trend: "up" },
      { label: "Net After Costs", value: "2148 GBP/yr", sublabel: "After platform, cleaning, ops", trend: "neutral" },
    ],
    structure: {
      label: "SA Income Calculation",
      description: "ADR multiplied by occupancy rate gives RevPAR. Total revenue minus OTA fees, cleaning, utilities and management gives NOI.",
      lines: [
        { label: "Gross Nightly Revenue", formula: "ADR x Nights Available", example: "85 x 365 = 31025 GBP" },
        { label: "Occupancy Adjustment", formula: "Gross x Occupancy %", example: "31025 x 72% = 22338 GBP" },
        { label: "Less OTA Platform Fees", formula: "Revenue x 15%", example: "22338 x 15% = 3351 GBP" },
        { label: "Less Cleaning per Turn", formula: "Turns/yr x Cleaning Cost", example: "260 turns x 35 = 9100 GBP" },
        { label: "Less Utilities and Bills", formula: "Monthly bills x 12", example: "180 x 12 = 2160 GBP" },
        { label: "Less Management", formula: "Revenue x 20%", example: "22338 x 20% = 4468 GBP" },
        { label: "Net Annual Income", formula: "Sum above", example: "3259 GBP" },
      ],
    },
    assumptions: [
      { label: "ADR", default: "85 GBP", range: "55-150 GBP" },
      { label: "Occupancy", default: "72%", range: "55-85%" },
      { label: "OTA Platform Fee", default: "15%", range: "12-20%" },
      { label: "Cleaning per Turn", default: "35 GBP", range: "25-60 GBP" },
      { label: "Average Stay Length", default: "2.8 nights", range: "1.5-4 nights" },
      { label: "Management Fee", default: "20%", range: "15-25%" },
    ],
    exampleCalc: {
      inputs: [
        { label: "Property Value", value: "200000 GBP" },
        { label: "ADR", value: "85 GBP/night" },
        { label: "Annual Occupancy", value: "72%" },
        { label: "Average Stay", value: "2.8 nights" },
      ],
      outputs: [
        { label: "Annual Gross Revenue", value: "22338 GBP" },
        { label: "Less OTA Fees (15%)", value: "-3351 GBP" },
        { label: "Less Cleaning (260 turns)", value: "-9100 GBP" },
        { label: "Less Utilities", value: "-2160 GBP" },
        { label: "Less Management (20%)", value: "-4468 GBP" },
        { label: "Net Operating Income", value: "3259 GBP", highlight: true },
        { label: "Less Finance", value: "-4200 GBP" },
        { label: "Net Cashflow", value: "-941 GBP" },
      ],
    },
    sensitivityNote: "SA is highly sensitive to ADR and occupancy. At 85 ADR and 72% occupancy, SA is marginally cashflow positive or negative depending on management structure. ADR 100+ at 75%+ drives strong returns.",
    benchmarkRanges: [
      { label: "ADR", low: "55 GBP", mid: "85 GBP", high: "130 GBP" },
      { label: "Occupancy", low: "55%", mid: "72%", high: "85%" },
      { label: "RevPAR", low: "30 GBP", mid: "61 GBP", high: "110 GBP" },
    ],
  },
  costDrivers: {
    kpis: [
      { label: "Cleaning Cost/Year", value: "7000-12000 GBP", sublabel: "Per property (high turnover)", trend: "up" },
      { label: "OTA Platform Fees", value: "15-20%", sublabel: "Of gross revenue", trend: "neutral" },
      { label: "Annual Linen/Consumables", value: "1200-2400 GBP", sublabel: "Per property", trend: "neutral" },
      { label: "Management Fee", value: "15-25%", sublabel: "Of gross revenue", trend: "neutral" },
    ],
    categories: [
      {
        name: "Platform and Distribution",
        items: [
          { label: "Airbnb Platform Fee", typical: "3% host + 14% guest", frequency: "Per booking", type: "percentage" },
          { label: "Booking.com Commission", typical: "15-18%", frequency: "Per booking", type: "percentage" },
          { label: "Channel Manager Software", typical: "30-80 GBP/mo", frequency: "Monthly", type: "fixed" },
        ],
      },
      {
        name: "Operations",
        items: [
          { label: "Cleaning per Turn", typical: "30-60 GBP", frequency: "Per stay", type: "variable" },
          { label: "Linen Laundry", typical: "10-20 GBP/turn", frequency: "Per stay", type: "variable" },
          { label: "Guest Consumables", typical: "5-15 GBP/stay", frequency: "Per stay", type: "variable" },
          { label: "Key Management/Lockbox", typical: "10-20 GBP/mo or smart lock", frequency: "Monthly", type: "fixed" },
        ],
      },
      {
        name: "Utilities",
        items: [
          { label: "Gas and Electricity", typical: "100-200 GBP/mo", frequency: "Monthly", type: "variable" },
          { label: "Broadband (fast)", typical: "30-50 GBP/mo", frequency: "Monthly", type: "fixed" },
          { label: "Council Tax", typical: "100-180 GBP/mo", frequency: "Monthly", type: "fixed" },
          { label: "Water", typical: "30-50 GBP/mo", frequency: "Monthly", type: "fixed" },
        ],
      },
      {
        name: "Management",
        items: [
          { label: "SA Management Company", typical: "15-25% of revenue", frequency: "Monthly", type: "percentage" },
          { label: "Dynamic Pricing Tool", typical: "20-60 GBP/mo", frequency: "Monthly", type: "fixed" },
        ],
      },
      {
        name: "Finance",
        items: [
          { label: "Mortgage or Rent (R2R)", typical: "350-800 GBP/mo", frequency: "Monthly", type: "fixed" },
        ],
      },
    ],
    sensitivityNote: "Cleaning cost is the largest variable and scales with number of turns. At high occupancy with short stays, cleaning can consume 30-40% of revenue. Increasing minimum stay length materially improves margins.",
    costControlTips: [
      "Set minimum 2-3 night stay to reduce turns and cleaning cost",
      "Use direct booking channel to reduce OTA dependency",
      "Dynamic pricing tool is essential - manual pricing loses 10-20% revenue",
      "Negotiate block cleaning rates with local cleaner",
    ],
  },
  compliance: {
    score: 55, scoreLabel: "High Burden", criticalCount: 5,
    requirements: [
      { area: "Planning", item: "Short-Let Permitted (90-day London rule)", priority: "High", required: true, renewal: "Ongoing", estimatedCost: "Planning fee if needed", riskIfMissing: "Enforcement notice, fines" },
      { area: "Safety", item: "Fire Risk Assessment", priority: "High", required: true, renewal: "Annual", estimatedCost: "200-400 GBP", riskIfMissing: "Prosecution, injury liability" },
      { area: "Safety", item: "Gas Safety Certificate", priority: "High", required: true, renewal: "Annual", estimatedCost: "70-90 GBP", riskIfMissing: "Criminal prosecution" },
      { area: "Safety", item: "EICR", priority: "High", required: true, renewal: "5-yearly", estimatedCost: "150-250 GBP", riskIfMissing: "30000 GBP fine" },
      { area: "Insurance", item: "Short-Let Specialist Insurance", priority: "High", required: true, renewal: "Annual", estimatedCost: "600-1500 GBP/yr", riskIfMissing: "Uninsured liability" },
      { area: "Energy", item: "EPC (min E)", priority: "High", required: true, renewal: "On let", estimatedCost: "80-120 GBP", riskIfMissing: "Cannot let" },
      { area: "Tax", item: "Business Rates (may replace Council Tax)", priority: "Medium", required: false, renewal: "Annual", estimatedCost: "Variable - often zero rated", riskIfMissing: "Incorrect tax position" },
    ],
    upcomingDeadlines: [
      { label: "Gas Safety Certificate renewal", due: "Annual", priority: "High" },
      { label: "Fire Risk Assessment review", due: "Annual", priority: "High" },
      { label: "90-day count tracking (London)", due: "Ongoing", priority: "High" },
    ],
    requiredDocs: ["Fire Risk Assessment", "Gas Safety Certificate", "EICR Report", "EPC Certificate", "Short-Let Insurance Policy", "Planning Compliance Evidence (London)", "Guest Check-In Records"],
    aiInsight: "In London, the 90-day short-let limit without full planning permission is the critical compliance risk. Exceeding it is a planning enforcement offence. Outside London, most areas permit SA but local councils are increasingly introducing Article 4 restrictions.",
  },
  forecast: {
    scenarios: [
      {
        name: "Base Case", type: "base",
        kpis: [
          { label: "Annual Revenue", value: "22338 GBP", trend: "neutral" },
          { label: "Annual Costs", value: "19079 GBP", trend: "neutral" },
          { label: "Net Profit", value: "3259 GBP", highlight: true },
          { label: "RevPAR", value: "61.20 GBP/night", trend: "neutral" },
        ],
        monthly: [
          { month: "Jan", income: 1360, costs: 1550, net: -190 },
          { month: "Feb", income: 1530, costs: 1550, net: -20 },
          { month: "Mar", income: 2040, costs: 1600, net: 440 },
          { month: "Apr", income: 2380, costs: 1650, net: 730 },
          { month: "May", income: 2550, costs: 1680, net: 870 },
          { month: "Jun", income: 2380, costs: 1650, net: 730 },
          { month: "Jul", income: 2720, costs: 1720, net: 1000 },
          { month: "Aug", income: 2720, costs: 1720, net: 1000 },
          { month: "Sep", income: 2040, costs: 1600, net: 440 },
          { month: "Oct", income: 1700, costs: 1570, net: 130 },
          { month: "Nov", income: 1360, costs: 1540, net: -180 },
          { month: "Dec", income: 1558, costs: 1550, net: 8 },
        ],
      },
      {
        name: "Optimistic", type: "optimistic",
        kpis: [
          { label: "Annual Revenue", value: "32760 GBP", trend: "up" },
          { label: "Annual Costs", value: "22100 GBP", trend: "neutral" },
          { label: "Net Profit", value: "10660 GBP", highlight: true },
          { label: "RevPAR", value: "89.75 GBP/night", trend: "up" },
        ],
        monthly: [
          { month: "Jan", income: 2000, costs: 1680, net: 320 },
          { month: "Feb", income: 2400, costs: 1720, net: 680 },
          { month: "Mar", income: 3000, costs: 1820, net: 1180 },
          { month: "Apr", income: 3200, costs: 1850, net: 1350 },
          { month: "May", income: 3400, costs: 1880, net: 1520 },
          { month: "Jun", income: 3200, costs: 1850, net: 1350 },
          { month: "Jul", income: 3600, costs: 1920, net: 1680 },
          { month: "Aug", income: 3600, costs: 1920, net: 1680 },
          { month: "Sep", income: 2800, costs: 1780, net: 1020 },
          { month: "Oct", income: 2400, costs: 1720, net: 680 },
          { month: "Nov", income: 1980, costs: 1680, net: 300 },
          { month: "Dec", income: 2180, costs: 1700, net: 480 },
        ],
      },
      {
        name: "Conservative", type: "conservative",
        kpis: [
          { label: "Annual Revenue", value: "14820 GBP", trend: "down" },
          { label: "Annual Costs", value: "18000 GBP", trend: "neutral" },
          { label: "Net Profit", value: "-3180 GBP", highlight: true },
          { label: "RevPAR", value: "40.60 GBP/night", trend: "down" },
        ],
        monthly: [
          { month: "Jan", income: 680, costs: 1500, net: -820 },
          { month: "Feb", income: 850, costs: 1510, net: -660 },
          { month: "Mar", income: 1360, costs: 1540, net: -180 },
          { month: "Apr", income: 1530, costs: 1550, net: -20 },
          { month: "May", income: 1700, costs: 1570, net: 130 },
          { month: "Jun", income: 1700, costs: 1570, net: 130 },
          { month: "Jul", income: 1870, costs: 1580, net: 290 },
          { month: "Aug", income: 1870, costs: 1580, net: 290 },
          { month: "Sep", income: 1360, costs: 1540, net: -180 },
          { month: "Oct", income: 850, costs: 1510, net: -660 },
          { month: "Nov", income: 680, costs: 1500, net: -820 },
          { month: "Dec", income: 370, costs: 1550, net: -1180 },
        ],
      },
    ],
    baseKpis: [
      { label: "Annual Revenue", value: "22338 GBP", trend: "neutral" },
      { label: "Annual Costs", value: "19079 GBP", trend: "neutral" },
      { label: "Net Profit (before finance)", value: "7459 GBP", highlight: true },
      { label: "ADR", value: "85 GBP", trend: "neutral" },
      { label: "Occupancy", value: "72%", trend: "neutral" },
      { label: "RevPAR", value: "61.20 GBP", trend: "neutral" },
    ],
    assumptions: [
      { label: "Property Value", value: "200000 GBP" },
      { label: "ADR", value: "85 GBP/night" },
      { label: "Annual Occupancy", value: "72%" },
      { label: "Platform Fee", value: "15%" },
      { label: "Cleaning per Turn", value: "35 GBP" },
      { label: "Management Fee", value: "20%" },
    ],
    sensitivityRows: [
      { variable: "ADR +/- 10 GBP", base: "85 GBP", upside: "+2628/yr", downside: "-2628/yr" },
      { variable: "Occupancy +/- 5%", base: "72%", upside: "+1557/yr", downside: "-1557/yr" },
      { variable: "Cleaning Cost +/- 5 GBP/turn", base: "35 GBP", upside: "+1300/yr", downside: "-1300/yr" },
      { variable: "Management Fee +/- 5%", base: "20%", upside: "+1117/yr", downside: "-1117/yr" },
    ],
    forecastNote: "SA cashflow is highly seasonal. Base reflects UK city centre with strong summer and event demand. Q1 and Q4 are often marginal or negative. Annual view is essential for SA viability assessment.",
  },
  checklist: {
    phases: [
      {
        name: "Setup",
        tasks: [
          { label: "Confirm 90-day rule/planning compliance", priority: "High", owner: "Investor", daysOffset: 0 },
          { label: "Check mortgage allows SA use", priority: "High", owner: "Broker", daysOffset: 0 },
          { label: "Research local ADR and occupancy benchmarks", priority: "High", owner: "Investor", daysOffset: 7 },
          { label: "SA management company due diligence", priority: "Medium", owner: "Investor", daysOffset: 14 },
          { label: "Premium furniture and fittings sourced", priority: "High", owner: "Investor", daysOffset: 28 },
        ],
      },
      {
        name: "Compliance",
        tasks: [
          { label: "Gas safety certificate obtained", priority: "High", owner: "Engineer", daysOffset: 42 },
          { label: "EICR completed", priority: "High", owner: "Engineer", daysOffset: 42 },
          { label: "Fire risk assessment completed", priority: "High", owner: "Assessor", daysOffset: 42 },
          { label: "Short-let insurance arranged", priority: "High", owner: "Investor", daysOffset: 42 },
          { label: "EPC obtained", priority: "High", owner: "Assessor", daysOffset: 42 },
        ],
      },
      {
        name: "Launch",
        tasks: [
          { label: "Professional photography completed", priority: "High", owner: "Photographer", daysOffset: 49 },
          { label: "Airbnb and Booking.com listings created", priority: "High", owner: "Manager", daysOffset: 56 },
          { label: "Channel manager set up", priority: "High", owner: "Manager", daysOffset: 56 },
          { label: "Dynamic pricing tool configured", priority: "High", owner: "Manager", daysOffset: 56 },
          { label: "Key management/lockbox installed", priority: "High", owner: "Investor", daysOffset: 56 },
        ],
      },
      {
        name: "Optimisation",
        tasks: [
          { label: "First 10 reviews achieved", priority: "High", owner: "Manager", daysOffset: 90 },
          { label: "Pricing model reviewed", priority: "Medium", owner: "Manager", daysOffset: 90 },
          { label: "Direct booking website launched", priority: "Medium", owner: "Investor", daysOffset: 120 },
          { label: "90-day count tracking (London)", priority: "High", owner: "Investor", daysOffset: 30 },
        ],
      },
    ],
    criticalPathItems: [
      "Confirm 90-day planning compliance before any bookings in London",
      "Check mortgage terms allow short-let use",
      "Fire risk assessment completed before first guest",
      "Short-let insurance in place before first booking",
    ],
  },
  risks: {
    overallRating: "High", totalExposureEstimate: "5000-20000 GBP/year",
    register: [
      { name: "Planning Enforcement (London 90-day)", category: "Regulatory", likelihood: "Possible", impact: "Severe", score: 12, mitigation: "Track 90-day count, apply for planning permission, consider R2R outside London", owner: "Investor" },
      { name: "Low Occupancy/Poor Reviews", category: "Financial", likelihood: "Possible", impact: "High", score: 9, mitigation: "Dynamic pricing, professional photography, responsive guest management", owner: "Manager" },
      { name: "Guest Damage", category: "Operational", likelihood: "Possible", impact: "Medium", score: 6, mitigation: "Airbnb damage cover, short-let insurance, security deposit", owner: "Manager" },
      { name: "Platform Algorithm Change", category: "Market", likelihood: "Possible", impact: "Medium", score: 6, mitigation: "Multi-platform listing, direct booking channel", owner: "Manager" },
      { name: "Regulatory Restriction (Article 4)", category: "Regulatory", likelihood: "Possible", impact: "High", score: 9, mitigation: "Monitor local planning policy, consider planning application", owner: "Investor" },
      { name: "Mortgage Breach", category: "Legal", likelihood: "Low", impact: "Severe", score: 8, mitigation: "Use SA-specific or commercial mortgage", owner: "Investor" },
    ],
    topByExposure: [
      { label: "Planning Enforcement", exposure: "Unlimited fine + enforcement", level: "High" },
      { label: "Seasonal Low Occupancy", exposure: "3000-8000 GBP/yr lost revenue", level: "Medium" },
      { label: "Guest Damage", exposure: "500-5000 GBP per incident", level: "Medium" },
    ],
    mitigationActions: [
      "Track 90-day count daily with channel manager",
      "Maintain minimum 4.7 star rating on all platforms",
      "Use dedicated SA mortgage - never standard BTL",
      "Build 3-month cash reserve for seasonal lows",
    ],
  },
  aiQuestions: {
    suggestedQuestions: [
      { question: "What ADR can I realistically achieve in this location?", category: "Pricing", insight: "Local SA comparables, seasonal rate analysis, corporate vs leisure demand split" },
      { question: "Am I affected by the 90-day London rule?", category: "Compliance", insight: "Planning use class analysis, permitted development rights, Article 4 direction map" },
      { question: "Should I self-manage or use a management company?", category: "Operations", insight: "Management fee vs self-management time cost, guest experience quality, review impact" },
      { question: "What occupancy do I need to break even?", category: "Viability", insight: "Breakeven ADR x occupancy calculation based on your specific cost structure" },
      { question: "How do I grow my review count quickly?", category: "Platform Strategy", insight: "Review velocity strategies, early pricing discounts, response time optimisation" },
    ],
    keyDrivers: ["ADR", "Annual Occupancy", "Platform Fees", "Cleaning Cost per Turn", "Stay Length Average"],
    quickStats: [
      { label: "Setup Capex", value: "5000-15000 GBP" },
      { label: "Platform Fee", value: "15-20% of revenue" },
      { label: "Cleaning Cost/Year", value: "7000-12000 GBP" },
      { label: "Ramp-Up Period", value: "4-8 weeks to reviews" },
    ],
    recommendations: [
      "Set minimum 2-night stays to reduce cleaning cost drag",
      "Use a dynamic pricing tool from day one - manual pricing loses 15-20%",
      "Confirm planning compliance before any first booking",
    ],
    confidenceScore: 71, confidenceLabel: "Good Confidence",
  },
  quickActions: [
    { label: "Start Planning Set", sub: "Build your SA plan", icon: "Play", action: "start-planning" },
    { label: "Compare Profile", sub: "vs Holiday Let", icon: "BarChart2", action: "compare" },
    { label: "RevPAR Calculator", sub: "ADR x occupancy model", icon: "Zap", action: "quick-scenario" },
    { label: "Download Pack", sub: "PDF profile guide", icon: "Download", action: "download" },
  ],
  pros: ["Highest yield potential of all residential models", "Dynamic pricing captures seasonal peaks", "Flexible personal use possible", "Corporate bookings provide income stability", "Platform reviews compound over time"],
  cons: ["90-day London planning restriction", "High operational intensity", "Platform fee drag 15-20%", "Seasonal cashflow variance", "Cleaning costs at scale reduce margins"],
}

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE 6 — HOLIDAY LET
// ─────────────────────────────────────────────────────────────────────────────
export const HOLIDAY_LET_CONFIG: ProfileConfig = {
  key: "holiday_let", slug: "holiday-let", name: "Holiday Let", number: 6,
  tagline: "Leisure and tourism rental income with seasonal pricing and FHL tax advantages",
  description: "Furnished Holiday Letting in tourist and leisure areas. HMRC FHL status provides mortgage interest relief and capital allowances if occupancy thresholds are met.",
  icon: "Palmtree", accentColor: "#0EA5E9", bgColor: "#F0F9FF",
  group: "residential", groupLabel: "Short-Stay",
  tags: ["Holiday Market", "Seasonal Demand", "Short-Stay", "FHL Tax Status"],
  riskLevel: "Medium", managementIntensity: "Medium", complianceIntensity: "Low", capitalIntensity: "Medium",
  primaryMetric: { label: "Typical Gross Yield", value: "6-14%", sublabel: "Location-dependent" },
  overviewKpis: [
    { label: "Peak Season Rate", value: "800-2500 GBP/wk", sublabel: "Coastal/rural peak", trend: "up" },
    { label: "Annual Occupancy", value: "55-75%", sublabel: "FHL minimum 105 days", trend: "neutral" },
    { label: "FHL Availability", value: "210 days/yr", sublabel: "HMRC minimum", trend: "neutral" },
    { label: "Gross Yield", value: "6-14%", sublabel: "Location-dependent", trend: "up" },
  ],
  whoItSuits: ["Coastal and rural property investors", "Tax-efficient investors", "Investors who want personal use", "Lifestyle investors", "Portfolio diversifiers"],
  idealAssets: [
    { icon: "Home", label: "Coastal Cottages", sub: "Beach and harbour access" },
    { icon: "Landmark", label: "Rural Retreats", sub: "Lake District, Peak District" },
    { icon: "Building", label: "Converted Barns", sub: "Unique stays, premium rates" },
  ],
  advantages: ["FHL tax regime: mortgage interest relief, capital allowances", "Personal use allowed", "Peak season pricing 3-5x off-season", "No tenancy legislation complexity", "Strong capital appreciation in holiday hotspots"],
  constraints: ["Strict FHL occupancy thresholds (210 available, 105 let)", "High seasonality creates income volatility", "Location-dependent - rural areas have low liquidity", "Agent fees 15-20%", "High running costs"],
  bestMarket: ["Coastal destinations (Cornwall, Devon, Dorset)", "Lake District, Peak District, Yorkshire Dales", "Scotland Highlands and Islands", "Popular rural tourism areas"],
  riskPosture: [
    { label: "Seasonality Risk", level: "High" },
    { label: "FHL Threshold Risk", level: "Medium" },
    { label: "Weather/External Events", level: "Medium" },
    { label: "Capital Appreciation", level: "Low" },
  ],
  timeline: [
    { label: "Purchase and Furnish", sub: "Holiday standard fit-out", duration: "6-12 weeks" },
    { label: "Listing and Photography", sub: "Platform onboarding", duration: "2-3 weeks" },
    { label: "First Season", sub: "Pricing calibration", duration: "3-6 months" },
    { label: "FHL Qualification", sub: "Meet 105-day threshold", duration: "12 months" },
    { label: "Tax Review", sub: "Confirm FHL status with accountant", duration: "After year 1" },
  ],
  modelSnapshot: {
    label: "Example Annual P&L - 2-bed coastal cottage 350k",
    lines: [
      { label: "Peak Season (12 weeks at 1400/wk)", value: "16800 GBP" },
      { label: "Shoulder Season (15 weeks at 800/wk)", value: "12000 GBP" },
      { label: "Off-Peak (15 weeks at 400/wk)", value: "6000 GBP" },
      { label: "Total Gross Revenue", value: "34800 GBP" },
      { label: "Less Agent Fees (18%)", value: "-6264 GBP" },
      { label: "Less Cleaning/Changeovers", value: "-3500 GBP" },
      { label: "Less Running Costs", value: "-2400 GBP" },
      { label: "Less Finance", value: "-7875 GBP" },
      { label: "Net Annual Profit", value: "14761 GBP", highlight: true },
      { label: "Gross Yield", value: "9.9%" },
    ],
  },
  incomeModel: {
    type: "Seasonal Weekly/Nightly Rates",
    kpis: [
      { label: "Annual Gross Revenue", value: "34800 GBP", sublabel: "42 let weeks", trend: "up" },
      { label: "Gross Yield", value: "9.9%", sublabel: "On 350k purchase", trend: "up" },
      { label: "Net Yield", value: "4.2%", sublabel: "After all costs", trend: "neutral" },
      { label: "FHL Occupancy", value: "42 weeks = 294 days", sublabel: "Exceeds 105-day FHL threshold", trend: "up" },
    ],
    structure: {
      label: "Holiday Let Income Calculation",
      description: "Seasonal weekly rates applied across peak, shoulder and off-peak periods",
      lines: [
        { label: "Peak Season Income", formula: "Weeks x Peak Weekly Rate", example: "12 x 1400 = 16800 GBP" },
        { label: "Shoulder Season Income", formula: "Weeks x Shoulder Rate", example: "15 x 800 = 12000 GBP" },
        { label: "Off-Peak Income", formula: "Weeks x Off-Peak Rate", example: "15 x 400 = 6000 GBP" },
        { label: "Less Agent Fees", formula: "Gross x 18%", example: "34800 x 18% = 6264 GBP" },
        { label: "Less Cleaning/Changeovers", formula: "Weeks let x changeover cost", example: "42 x 83 = 3500 GBP" },
        { label: "Net Operating Income", formula: "Gross minus costs", example: "22636 GBP" },
      ],
    },
    assumptions: [
      { label: "Peak Weeks", default: "12 weeks", range: "8-16 weeks" },
      { label: "Peak Weekly Rate", default: "1400 GBP/wk", range: "800-3000 GBP/wk" },
      { label: "Shoulder Weeks", default: "15 weeks", range: "10-20 weeks" },
      { label: "Shoulder Rate", default: "800 GBP/wk", range: "400-1500 GBP/wk" },
      { label: "Agent Commission", default: "18%", range: "15-22%" },
      { label: "Annual Let Weeks", default: "42 weeks", range: "28-50 weeks" },
    ],
    exampleCalc: {
      inputs: [
        { label: "Property Value", value: "350000 GBP" },
        { label: "Peak Season (12 wks at 1400/wk)", value: "16800 GBP" },
        { label: "Shoulder Season (15 wks at 800/wk)", value: "12000 GBP" },
        { label: "Off-Peak (15 wks at 400/wk)", value: "6000 GBP" },
      ],
      outputs: [
        { label: "Annual Gross Revenue", value: "34800 GBP" },
        { label: "Less Agent Fees (18%)", value: "-6264 GBP" },
        { label: "Less Cleaning/Changeovers", value: "-3500 GBP" },
        { label: "Less Running Costs/Insurance", value: "-2400 GBP" },
        { label: "Less Mortgage Annual", value: "-7875 GBP" },
        { label: "Net Annual Profit", value: "14761 GBP", highlight: true },
        { label: "Gross Yield", value: "9.9%" },
        { label: "Net Yield", value: "4.2%" },
      ],
    },
    sensitivityNote: "Holiday let income is highly concentrated in peak season. A poor summer (bad weather, external events) can reduce annual income by 20-30%. Two extra peak weeks adds approximately 2800 GBP revenue.",
    benchmarkRanges: [
      { label: "Gross Yield", low: "6%", mid: "10%", high: "14%" },
      { label: "Peak Weekly Rate", low: "800 GBP", mid: "1400 GBP", high: "3000 GBP" },
      { label: "Annual Occupancy", low: "50%", mid: "65%", high: "80%" },
    ],
  },
  costDrivers: {
    kpis: [
      { label: "Agent Commission", value: "15-22%", sublabel: "Of gross revenue", trend: "neutral" },
      { label: "Annual Changeover Cost", value: "2500-5000 GBP", sublabel: "Cleaning per booking", trend: "neutral" },
      { label: "Running Costs", value: "2000-4000 GBP/yr", sublabel: "Utilities and maintenance", trend: "neutral" },
      { label: "Annual Compliance", value: "300-500 GBP", sublabel: "Safety certs", trend: "neutral" },
    ],
    categories: [
      {
        name: "Agency and Distribution",
        items: [
          { label: "Holiday Let Agency Commission", typical: "15-22% of revenue", frequency: "Per booking", type: "percentage" },
          { label: "OTA Platform Fees (if direct)", typical: "3-15%", frequency: "Per booking", type: "percentage" },
        ],
      },
      {
        name: "Changeover and Operations",
        items: [
          { label: "Cleaning per Changeover", typical: "60-150 GBP", frequency: "Per booking", type: "variable" },
          { label: "Linen Changeover", typical: "20-40 GBP", frequency: "Per booking", type: "variable" },
          { label: "Welcome Pack", typical: "10-30 GBP", frequency: "Per booking", type: "variable" },
          { label: "Keyholder Service", typical: "20-50 GBP/wk", frequency: "Per booking", type: "variable" },
        ],
      },
      {
        name: "Running Costs",
        items: [
          { label: "Utilities (gas/electric/water)", typical: "1200-2400 GBP/yr", frequency: "Annual", type: "variable" },
          { label: "Broadband", typical: "400-600 GBP/yr", frequency: "Annual", type: "fixed" },
          { label: "Council Tax / Business Rates", typical: "Variable", frequency: "Annual", type: "fixed" },
          { label: "Maintenance Reserve", typical: "1000-2000 GBP/yr", frequency: "Annual", type: "fixed" },
        ],
      },
      {
        name: "Insurance",
        items: [
          { label: "Holiday Let Insurance", typical: "400-800 GBP/yr", frequency: "Annual", type: "fixed" },
          { label: "Public Liability", typical: "Included in above", frequency: "Annual", type: "fixed" },
        ],
      },
      {
        name: "Finance",
        items: [
          { label: "Holiday Let Mortgage", typical: "500-1500 GBP/mo", frequency: "Monthly", type: "fixed" },
        ],
      },
    ],
    sensitivityNote: "Agent commission and changeover cleaning are the two largest variable costs. Self-managing saves 15-22% but requires significant time during peak season.",
    costControlTips: [
      "Self-manage direct bookings to save 15-22% commission",
      "Build a loyal repeat guest base through excellent experience",
      "Schedule own maintenance visits during low season",
      "Seek small business rates relief if property qualifies",
    ],
  },
  compliance: {
    score: 70, scoreLabel: "Manageable", criticalCount: 3,
    requirements: [
      { area: "Safety", item: "Gas Safety Certificate", priority: "High", required: true, renewal: "Annual", estimatedCost: "70-90 GBP", riskIfMissing: "Liability, guest injury" },
      { area: "Safety", item: "EICR", priority: "High", required: true, renewal: "5-yearly", estimatedCost: "150-250 GBP", riskIfMissing: "Guest injury liability" },
      { area: "Safety", item: "Fire Safety - Alarms and Escape Routes", priority: "High", required: true, renewal: "Annual check", estimatedCost: "50-150 GBP", riskIfMissing: "Injury liability, negligence" },
      { area: "Energy", item: "EPC (min E)", priority: "High", required: true, renewal: "On let", estimatedCost: "80-120 GBP", riskIfMissing: "Cannot let commercially" },
      { area: "Tax", item: "FHL Criteria: 210 days available, 105 days let", priority: "High", required: false, renewal: "Annual", estimatedCost: "Accountant fee", riskIfMissing: "Loss of FHL tax advantages" },
      { area: "Insurance", item: "Holiday Let Buildings and Liability Insurance", priority: "High", required: true, renewal: "Annual", estimatedCost: "400-800 GBP/yr", riskIfMissing: "Uninsured liability" },
      { area: "Tax", item: "Business Rates Registration (if applicable)", priority: "Medium", required: false, renewal: "Annual", estimatedCost: "Variable", riskIfMissing: "Incorrect tax position" },
    ],
    upcomingDeadlines: [
      { label: "Gas Safety Certificate renewal", due: "Annual", priority: "High" },
      { label: "FHL occupancy threshold review", due: "Annual (5 Apr)", priority: "High" },
      { label: "EICR renewal", due: "5-yearly", priority: "High" },
    ],
    requiredDocs: ["Gas Safety Certificate", "EICR Report", "EPC Certificate", "Fire Safety Check Records", "Holiday Let Insurance Policy", "FHL Occupancy Records", "Guest Register (optional but recommended)"],
    aiInsight: "Holiday let compliance is lighter than SA in terms of planning risk. The critical annual obligation is tracking FHL occupancy to confirm the 105-day letting threshold is met. Loss of FHL status removes mortgage interest relief and capital allowances - significant tax impact.",
  },
  forecast: {
    scenarios: [
      {
        name: "Base Case", type: "base",
        kpis: [
          { label: "Annual Revenue", value: "34800 GBP", trend: "neutral" },
          { label: "Annual Costs", value: "20039 GBP", trend: "neutral" },
          { label: "Net Profit", value: "14761 GBP", highlight: true },
          { label: "Gross Yield", value: "9.9%", trend: "neutral" },
        ],
        monthly: [
          { month: "Jan", income: 800, costs: 1400, net: -600 },
          { month: "Feb", income: 1200, costs: 1450, net: -250 },
          { month: "Mar", income: 2400, costs: 1600, net: 800 },
          { month: "Apr", income: 3600, costs: 1750, net: 1850 },
          { month: "May", income: 4200, costs: 1850, net: 2350 },
          { month: "Jun", income: 4800, costs: 1950, net: 2850 },
          { month: "Jul", income: 5600, costs: 2100, net: 3500 },
          { month: "Aug", income: 5600, costs: 2100, net: 3500 },
          { month: "Sep", income: 3200, costs: 1680, net: 1520 },
          { month: "Oct", income: 2000, costs: 1520, net: 480 },
          { month: "Nov", income: 800, costs: 1400, net: -600 },
          { month: "Dec", income: 600, costs: 1400, net: -800 },
        ],
      },
      {
        name: "Optimistic", type: "optimistic",
        kpis: [
          { label: "Annual Revenue", value: "44000 GBP", trend: "up" },
          { label: "Annual Costs", value: "22000 GBP", trend: "neutral" },
          { label: "Net Profit", value: "22000 GBP", highlight: true },
          { label: "Gross Yield", value: "12.6%", trend: "up" },
        ],
        monthly: [
          { month: "Jan", income: 1200, costs: 1450, net: -250 },
          { month: "Feb", income: 2000, costs: 1550, net: 450 },
          { month: "Mar", income: 3200, costs: 1680, net: 1520 },
          { month: "Apr", income: 4400, costs: 1870, net: 2530 },
          { month: "May", income: 5200, costs: 1980, net: 3220 },
          { month: "Jun", income: 5600, costs: 2060, net: 3540 },
          { month: "Jul", income: 7200, costs: 2300, net: 4900 },
          { month: "Aug", income: 7200, costs: 2300, net: 4900 },
          { month: "Sep", income: 4000, costs: 1800, net: 2200 },
          { month: "Oct", income: 2400, costs: 1600, net: 800 },
          { month: "Nov", income: 800, costs: 1400, net: -600 },
          { month: "Dec", income: 800, costs: 1400, net: -600 },
        ],
      },
      {
        name: "Conservative", type: "conservative",
        kpis: [
          { label: "Annual Revenue", value: "24000 GBP", trend: "down" },
          { label: "Annual Costs", value: "19000 GBP", trend: "neutral" },
          { label: "Net Profit", value: "5000 GBP", highlight: true },
          { label: "Gross Yield", value: "6.9%", trend: "down" },
        ],
        monthly: [
          { month: "Jan", income: 400, costs: 1380, net: -980 },
          { month: "Feb", income: 800, costs: 1400, net: -600 },
          { month: "Mar", income: 1600, costs: 1500, net: 100 },
          { month: "Apr", income: 2400, costs: 1600, net: 800 },
          { month: "May", income: 3200, costs: 1680, net: 1520 },
          { month: "Jun", income: 3600, costs: 1750, net: 1850 },
          { month: "Jul", income: 4000, costs: 1820, net: 2180 },
          { month: "Aug", income: 4000, costs: 1820, net: 2180 },
          { month: "Sep", income: 2400, costs: 1600, net: 800 },
          { month: "Oct", income: 1200, costs: 1450, net: -250 },
          { month: "Nov", income: 400, costs: 1380, net: -980 },
          { month: "Dec", income: 0, costs: 1380, net: -1380 },
        ],
      },
    ],
    baseKpis: [
      { label: "Annual Revenue", value: "34800 GBP", trend: "neutral" },
      { label: "Annual Costs", value: "20039 GBP", trend: "neutral" },
      { label: "Net Profit", value: "14761 GBP", highlight: true },
      { label: "Gross Yield", value: "9.9%", trend: "neutral" },
      { label: "Net Yield", value: "4.2%", trend: "neutral" },
      { label: "FHL Days Let", value: "294 days (42 weeks)", sublabel: "Exceeds 105-day threshold" },
    ],
    assumptions: [
      { label: "Property Value", value: "350000 GBP" },
      { label: "Peak Weeks", value: "12 at 1400/wk" },
      { label: "Shoulder Weeks", value: "15 at 800/wk" },
      { label: "Off-Peak Weeks", value: "15 at 400/wk" },
      { label: "Agent Commission", value: "18%" },
      { label: "Mortgage Rate", value: "4.75% (holiday let product)" },
    ],
    sensitivityRows: [
      { variable: "Peak Rate +/- 200 GBP/wk", base: "1400/wk", upside: "+2400/yr", downside: "-2400/yr" },
      { variable: "Let Weeks +/- 4 weeks", base: "42 weeks", upside: "+3200/yr (avg rate)", downside: "-3200/yr" },
      { variable: "Agent Fee +/- 2%", base: "18%", upside: "+696/yr", downside: "-696/yr" },
      { variable: "Mortgage Rate +/- 0.5%", base: "4.75%", upside: "+984/yr", downside: "-984/yr" },
    ],
    forecastNote: "Holiday let income is concentrated in Jul-Aug (peak) and shoulder season (Apr-Jun, Sep). Q1 and Q4 are typically negative cashflow months. Annual view required. FHL threshold review annually in April.",
  },
  checklist: {
    phases: [
      {
        name: "Purchase and Setup",
        tasks: [
          { label: "Confirm FHL-eligible location demand", priority: "High", owner: "Investor", daysOffset: 0 },
          { label: "Research local comparable let rates", priority: "High", owner: "Investor", daysOffset: 7 },
          { label: "Holiday let mortgage arranged", priority: "High", owner: "Broker", daysOffset: 14 },
          { label: "Holiday let insurance arranged", priority: "High", owner: "Investor", daysOffset: 42 },
          { label: "Premium holiday standard furnishing", priority: "High", owner: "Investor", daysOffset: 42 },
        ],
      },
      {
        name: "Compliance",
        tasks: [
          { label: "Gas safety certificate obtained", priority: "High", owner: "Engineer", daysOffset: 56 },
          { label: "EICR completed", priority: "High", owner: "Engineer", daysOffset: 56 },
          { label: "EPC obtained", priority: "High", owner: "Assessor", daysOffset: 56 },
          { label: "Fire alarms and escape routes checked", priority: "High", owner: "Investor", daysOffset: 56 },
        ],
      },
      {
        name: "Launch",
        tasks: [
          { label: "Professional photography completed", priority: "High", owner: "Photographer", daysOffset: 63 },
          { label: "Holiday agency or OTA listings live", priority: "High", owner: "Agent", daysOffset: 70 },
          { label: "Pricing calendar set up (seasonal)", priority: "High", owner: "Agent", daysOffset: 70 },
          { label: "First bookings confirmed", priority: "High", owner: "Agent", daysOffset: 84 },
        ],
      },
      {
        name: "Annual Operations",
        tasks: [
          { label: "FHL occupancy threshold check (April)", priority: "High", owner: "Accountant", daysOffset: 365 },
          { label: "Gas safety renewal", priority: "High", owner: "Engineer", daysOffset: 365 },
          { label: "Annual maintenance check", priority: "Medium", owner: "Investor", daysOffset: 365 },
          { label: "Insurance renewal review", priority: "Medium", owner: "Investor", daysOffset: 365 },
        ],
      },
    ],
    criticalPathItems: [
      "Gas Safety Certificate before first guest",
      "Holiday let insurance in place before first booking",
      "FHL occupancy tracking from day one to confirm tax status",
      "EPC in place before commercial letting",
    ],
  },
  risks: {
    overallRating: "Medium", totalExposureEstimate: "4000-12000 GBP/year",
    register: [
      { name: "Poor Peak Season (weather/events)", category: "Market", likelihood: "Possible", impact: "High", score: 9, mitigation: "Multi-season pricing, early booking discounts, weather guarantee clause", owner: "Investor" },
      { name: "FHL Threshold Not Met", category: "Tax", likelihood: "Possible", impact: "Medium", score: 6, mitigation: "Track occupancy monthly, last-minute discounting to fill gaps", owner: "Accountant" },
      { name: "Property Damage by Guests", category: "Operational", likelihood: "Possible", impact: "Medium", score: 6, mitigation: "Damage deposit, holiday let insurance, guest screening", owner: "Agent" },
      { name: "Location Demand Change", category: "Market", likelihood: "Low", impact: "High", score: 8, mitigation: "Select proven destination, capital appreciation buffer", owner: "Investor" },
      { name: "Competitor PBSA/Holiday Parks", category: "Market", likelihood: "Low", impact: "Medium", score: 3, mitigation: "Unique property type, direct booking base, loyalty programme", owner: "Investor" },
      { name: "Mortgage Rate Rise", category: "Financial", likelihood: "Possible", impact: "Medium", score: 6, mitigation: "Fix rate for 5 years, stress test at +1%", owner: "Investor" },
    ],
    topByExposure: [
      { label: "Poor Peak Season", exposure: "5000-12000 GBP lost revenue", level: "High" },
      { label: "FHL Status Loss", exposure: "Tax liability increase", level: "Medium" },
      { label: "Guest Damage", exposure: "500-3000 GBP per incident", level: "Low" },
    ],
    mitigationActions: [
      "Track FHL occupancy monthly against 105-day threshold",
      "Build 3-month cashflow reserve to cover winter months",
      "Fix holiday let mortgage rate for 5 years",
      "Review and increase peak pricing annually using comparables",
    ],
  },
  aiQuestions: {
    suggestedQuestions: [
      { question: "What peak season rates should I charge?", category: "Pricing", insight: "Local comparable analysis, seasonal premium benchmarks, unique features pricing strategy" },
      { question: "Will my property qualify for FHL status?", category: "Tax", insight: "HMRC FHL criteria: 210 days available, 105 days let. Accountant review recommended." },
      { question: "Should I use an agency or list direct?", category: "Operations", insight: "Agency vs direct booking economics, time cost, marketing channel analysis by location" },
      { question: "How do I manage the winter cashflow gap?", category: "Financial Planning", insight: "Winter let options, off-peak pricing, maintenance timing, reserve fund sizing" },
      { question: "What are the business rates implications?", category: "Tax", insight: "Business rates vs council tax for FHL, small business relief eligibility, registration process" },
    ],
    keyDrivers: ["Peak Season Rate", "Annual Let Weeks", "Agent Commission", "Mortgage Rate", "FHL Occupancy Days"],
    quickStats: [
      { label: "FHL Minimum Let Days", value: "105 days/yr" },
      { label: "FHL Availability Required", value: "210 days/yr" },
      { label: "Peak vs Off-Peak Premium", value: "3-5x rate differential" },
      { label: "Typical Agent Fee", value: "15-22% of revenue" },
    ],
    recommendations: [
      "Track FHL occupancy monthly from April - losing FHL status has significant tax implications",
      "Invest in professional photography - holiday let bookings are visually driven",
      "Build a direct booking base to reduce agency dependency long-term",
    ],
    confidenceScore: 78, confidenceLabel: "Good Confidence",
  },
  quickActions: [
    { label: "Start Planning Set", sub: "Build your holiday let plan", icon: "Play", action: "start-planning" },
    { label: "Compare Profile", sub: "vs Serviced Accommodation", icon: "BarChart2", action: "compare" },
    { label: "FHL Threshold Check", sub: "Occupancy tracker", icon: "Zap", action: "quick-scenario" },
    { label: "Download Pack", sub: "PDF profile guide", icon: "Download", action: "download" },
  ],
  pros: ["FHL tax regime advantages (mortgage interest, capital allowances)", "Peak season pricing premium 3-5x", "Personal use allowed", "No tenancy legislation complexity", "Strong capital appreciation in prime locations"],
  cons: ["High income seasonality - negative cashflow in winter", "FHL occupancy threshold creates pressure", "Location-dependent - poor liquidity in some areas", "Agent commission 15-22% is significant", "High changeover and running costs"],
}

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE 7 — RENT-TO-RENT
// ─────────────────────────────────────────────────────────────────────────────
export const RENT_TO_RENT_CONFIG: ProfileConfig = {
  key: "rent_to_rent", slug: "rent-to-rent", name: "Rent-to-Rent", number: 7,
  tagline: "Lease residential property from landlords, sublet at premium and manage the spread",
  description: "Control a property by leasing it from a landlord at a fixed guaranteed rent, then subletting rooms or nights at a higher rate. ROI calculated on setup capital, not property value.",
  icon: "ArrowLeftRight", accentColor: "#6366F1", bgColor: "#EEF2FF",
  group: "lease-managed", groupLabel: "Lease and Managed Models",
  tags: ["Lease and Managed", "Low Capital Entry", "High Management", "Contract Risk"],
  riskLevel: "High", managementIntensity: "High", complianceIntensity: "High", capitalIntensity: "Low",
  primaryMetric: { label: "Typical ROI", value: "15-35%", sublabel: "On setup capital deployed" },
  overviewKpis: [
    { label: "ROI", value: "15-35%", sublabel: "On deployed capital", trend: "up" },
    { label: "Management Spread", value: "300-800 GBP/mo", sublabel: "Gross less guaranteed rent", trend: "neutral" },
    { label: "Setup Capital", value: "2000-8000 GBP", sublabel: "Furnishing plus deposit", trend: "neutral" },
    { label: "Breakeven", value: "3-6 months", sublabel: "Recover setup capital", trend: "neutral" },
  ],
  whoItSuits: ["Capital-light operators", "SA and HMO operators", "Property entrepreneurs", "Those building portfolio without mortgage", "Operators with strong management systems"],
  idealAssets: [
    { icon: "Home", label: "HMO-Ready Houses", sub: "4-6 beds with room potential" },
    { icon: "Building", label: "City Centre Flats", sub: "SA and corporate let" },
    { icon: "Landmark", label: "Properties from Motivated Landlords", sub: "Willing to lease long-term" },
  ],
  advantages: ["Control without ownership", "Very low capital entry", "Scalable without mortgages", "Can combine with SA or HMO strategy", "ROI on capital deployed is very high"],
  constraints: ["Must have explicit right to sublet in contract", "Management obligation falls on operator", "Landlord mortgage consent required", "Contract break clauses create risk", "No capital appreciation benefit"],
  bestMarket: ["High-demand urban areas", "Corporate travel corridors", "University towns", "SA-viable city centres"],
  riskPosture: [
    { label: "Contract Termination Risk", level: "High" },
    { label: "Occupancy/Void Risk", level: "High" },
    { label: "Compliance Liability", level: "High" },
    { label: "Landlord Relationship", level: "Medium" },
  ],
  timeline: [
    { label: "Find and Negotiate", sub: "Landlord sourcing and due diligence", duration: "2-8 weeks" },
    { label: "Legal Agreement", sub: "Management agreement drafted", duration: "1-3 weeks" },
    { label: "Setup", sub: "Furnish, comply, list", duration: "2-4 weeks" },
    { label: "Operations", sub: "Sublet and manage", duration: "Ongoing" },
    { label: "Renewal", sub: "Contract renegotiation", duration: "On expiry" },
  ],
  modelSnapshot: {
    label: "Example Monthly P&L - 5-room R2R HMO",
    lines: [
      { label: "Room Rents (5 x 550/mo at 88% occ)", value: "2420 GBP" },
      { label: "Less Guaranteed Rent to Landlord", value: "-1400 GBP" },
      { label: "Less Bills (all-inclusive)", value: "-380 GBP" },
      { label: "Less Management/Cleaning", value: "-200 GBP" },
      { label: "Net Monthly Profit", value: "440 GBP", highlight: true },
      { label: "Annual Profit", value: "5280 GBP" },
      { label: "Setup Capital", value: "5000 GBP" },
      { label: "ROI on Capital", value: "105%" },
    ],
  },
  incomeModel: {
    type: "Sublet Spread (Room Income minus Guaranteed Rent)",
    kpis: [
      { label: "Gross Room Income", value: "2420 GBP/mo", sublabel: "5 rooms at 88% occ", trend: "up" },
      { label: "Guaranteed Rent Paid", value: "1400 GBP/mo", sublabel: "Fixed to landlord", trend: "neutral" },
      { label: "Gross Spread", value: "1020 GBP/mo", sublabel: "Before ops costs", trend: "neutral" },
      { label: "Net Monthly Profit", value: "440 GBP/mo", sublabel: "After bills and mgmt", trend: "up" },
    ],
    structure: {
      label: "R2R Income Calculation",
      description: "Room or SA income minus guaranteed rent to landlord, bills and operational costs",
      lines: [
        { label: "Gross Room Income", formula: "Rooms x Rent x Occupancy", example: "5 x 550 x 88% = 2420 GBP" },
        { label: "Less Guaranteed Rent", formula: "Fixed monthly to landlord", example: "1400 GBP/mo" },
        { label: "Less Bills", formula: "Gas + Electric + Broadband + CT", example: "380 GBP/mo" },
        { label: "Less Management/Cleaning", formula: "Staff or agent costs", example: "200 GBP/mo" },
        { label: "Net Monthly Profit", formula: "Sum above", example: "440 GBP" },
      ],
    },
    assumptions: [
      { label: "Room Count", default: "5", range: "3-8" },
      { label: "Room Rent", default: "550 GBP/mo", range: "400-750 GBP/mo" },
      { label: "Guaranteed Rent", default: "1400 GBP/mo", range: "1000-2200 GBP/mo" },
      { label: "Occupancy", default: "88%", range: "75-95%" },
      { label: "Monthly Bills", default: "380 GBP/mo", range: "250-550 GBP/mo" },
      { label: "Setup Capital", default: "5000 GBP", range: "2000-8000 GBP" },
    ],
    exampleCalc: {
      inputs: [
        { label: "5 Rooms at 550/mo", value: "2750 GBP/mo gross" },
        { label: "Guaranteed Rent to Landlord", value: "1400 GBP/mo" },
        { label: "Setup Capital Deployed", value: "5000 GBP" },
      ],
      outputs: [
        { label: "Gross Room Income (88% occ)", value: "2420 GBP" },
        { label: "Less Guaranteed Rent", value: "-1400 GBP" },
        { label: "Less Bills", value: "-380 GBP" },
        { label: "Less Management", value: "-200 GBP" },
        { label: "Net Monthly Profit", value: "440 GBP", highlight: true },
        { label: "Annual Profit", value: "5280 GBP" },
        { label: "ROI on Setup Capital", value: "105.6%" },
      ],
    },
    sensitivityNote: "R2R profitability is highly sensitive to void rate. The guaranteed rent is a fixed obligation. If occupancy drops below breakeven, the operator still pays the landlord. Breakeven occupancy is approximately 72% in this example.",
    benchmarkRanges: [
      { label: "Monthly Spread (Gross)", low: "400 GBP", mid: "700 GBP", high: "1200 GBP" },
      { label: "ROI on Setup Capital", low: "15%", mid: "60%", high: "150%+" },
      { label: "Setup Capital Required", low: "2000 GBP", mid: "5000 GBP", high: "8000 GBP" },
    ],
  },
  costDrivers: {
    kpis: [
      { label: "Guaranteed Rent", value: "1400 GBP/mo", sublabel: "Fixed cost to landlord", trend: "neutral" },
      { label: "Monthly Bills", value: "350-550 GBP", sublabel: "All utilities", trend: "up" },
      { label: "Setup Capex", value: "2000-8000 GBP", sublabel: "Furnishing and deposit", trend: "neutral" },
      { label: "Management/Cleaning", value: "150-250 GBP/mo", sublabel: "Ops costs", trend: "neutral" },
    ],
    categories: [
      {
        name: "Lease Obligations",
        items: [
          { label: "Guaranteed Rent to Landlord", typical: "1000-2500 GBP/mo", frequency: "Monthly", type: "fixed" },
          { label: "Security Deposit to Landlord", typical: "1 to 2 months rent", frequency: "One-off", type: "fixed" },
        ],
      },
      {
        name: "Utilities and Bills",
        items: [
          { label: "Gas", typical: "60-100 GBP/mo", frequency: "Monthly", type: "variable" },
          { label: "Electricity", typical: "80-140 GBP/mo", frequency: "Monthly", type: "variable" },
          { label: "Broadband", typical: "35-50 GBP/mo", frequency: "Monthly", type: "fixed" },
          { label: "Council Tax", typical: "100-180 GBP/mo", frequency: "Monthly", type: "fixed" },
        ],
      },
      {
        name: "Setup Capex",
        items: [
          { label: "Furnishing (per room)", typical: "400-600 GBP/room", frequency: "One-off", type: "fixed" },
          { label: "Compliance Upgrades", typical: "200-1000 GBP", frequency: "One-off", type: "fixed" },
          { label: "Photography/Listing", typical: "100-300 GBP", frequency: "One-off", type: "fixed" },
        ],
      },
      {
        name: "Operations",
        items: [
          { label: "Cleaning/Communal", typical: "80-150 GBP/mo", frequency: "Monthly", type: "fixed" },
          { label: "Maintenance Reserve", typical: "50-100 GBP/mo", frequency: "Monthly", type: "fixed" },
          { label: "Management (if outsourced)", typical: "10-15% of room income", frequency: "Monthly", type: "percentage" },
        ],
      },
    ],
    sensitivityNote: "Guaranteed rent is the dominant fixed cost and cannot be reduced if voids increase. Buffer between room income and guaranteed rent must absorb bills AND provide profit margin.",
    costControlTips: [
      "Negotiate guaranteed rent at 65-75% of expected room income to create adequate spread",
      "Get fixed energy tariffs to manage bill risk",
      "Self-manage to avoid 10-15% management fee drag",
      "Ensure HMO compliance before taking on any property",
    ],
  },
  compliance: {
    score: 56, scoreLabel: "High Burden", criticalCount: 6,
    requirements: [
      { area: "Contract", item: "Management Agreement with explicit sublet rights", priority: "High", required: true, renewal: "Per contract", estimatedCost: "300-600 GBP solicitor", riskIfMissing: "Illegal sublet, contract void" },
      { area: "Licensing", item: "HMO Licence (if applicable)", priority: "High", required: false, renewal: "5-yearly", estimatedCost: "200-700 GBP", riskIfMissing: "Criminal offence" },
      { area: "Fire Safety", item: "Fire Risk Assessment", priority: "High", required: true, renewal: "Annual", estimatedCost: "200-400 GBP", riskIfMissing: "Prosecution" },
      { area: "Safety", item: "Gas Safety Certificate", priority: "High", required: true, renewal: "Annual", estimatedCost: "70-90 GBP", riskIfMissing: "Criminal prosecution" },
      { area: "Safety", item: "EICR", priority: "High", required: true, renewal: "5-yearly", estimatedCost: "150-350 GBP", riskIfMissing: "30000 GBP fine" },
      { area: "Insurance", item: "Operator Liability Insurance", priority: "High", required: true, renewal: "Annual", estimatedCost: "300-600 GBP/yr", riskIfMissing: "Uninsured liability" },
      { area: "Tenancy", item: "Sub-tenancy ASTs and Deposit Protection", priority: "High", required: true, renewal: "Per tenant", estimatedCost: "15-30 GBP/tenant", riskIfMissing: "3x deposit penalty" },
    ],
    upcomingDeadlines: [
      { label: "Gas Safety Certificate renewal", due: "Annual", priority: "High" },
      { label: "Management agreement renewal review", due: "On expiry", priority: "High" },
      { label: "HMO Licence renewal (if applicable)", due: "5-yearly", priority: "High" },
    ],
    requiredDocs: ["Management Agreement (with sublet clause)", "HMO Licence (if applicable)", "Gas Safety Certificate", "EICR Report", "Fire Risk Assessment", "Sub-Tenant ASTs", "Deposit Protection Certificates", "Operator Liability Insurance"],
    aiInsight: "R2R compliance sits with the operator, not the landlord. The operator is legally responsible for all occupant safety, HMO licensing and tenancy obligations. The management agreement must explicitly grant subletting rights - without this the operator has no legal basis to sublet.",
  },
  forecast: {
    scenarios: [
      {
        name: "Base Case", type: "base",
        kpis: [
          { label: "Annual Room Income", value: "29040 GBP", trend: "neutral" },
          { label: "Annual Fixed Costs", value: "23760 GBP", trend: "neutral" },
          { label: "Annual Profit", value: "5280 GBP", highlight: true },
          { label: "ROI on Setup Capital", value: "105.6%", trend: "up" },
        ],
        monthly: [
          { month: "Jan", income: 2420, costs: 1980, net: 440 },
          { month: "Feb", income: 2420, costs: 1980, net: 440 },
          { month: "Mar", income: 2420, costs: 1980, net: 440 },
          { month: "Apr", income: 2420, costs: 1980, net: 440 },
          { month: "May", income: 2420, costs: 1980, net: 440 },
          { month: "Jun", income: 2200, costs: 1980, net: 220 },
          { month: "Jul", income: 2200, costs: 1980, net: 220 },
          { month: "Aug", income: 2420, costs: 1980, net: 440 },
          { month: "Sep", income: 2750, costs: 1980, net: 770 },
          { month: "Oct", income: 2750, costs: 1980, net: 770 },
          { month: "Nov", income: 2420, costs: 1980, net: 440 },
          { month: "Dec", income: 2200, costs: 1980, net: 220 },
        ],
      },
      {
        name: "Optimistic", type: "optimistic",
        kpis: [
          { label: "Annual Room Income", value: "33000 GBP", trend: "up" },
          { label: "Annual Fixed Costs", value: "22320 GBP", trend: "down" },
          { label: "Annual Profit", value: "10680 GBP", highlight: true },
          { label: "ROI on Setup Capital", value: "213%", trend: "up" },
        ],
        monthly: [
          { month: "Jan", income: 2750, costs: 1860, net: 890 },
          { month: "Feb", income: 2750, costs: 1860, net: 890 },
          { month: "Mar", income: 2750, costs: 1860, net: 890 },
          { month: "Apr", income: 2750, costs: 1860, net: 890 },
          { month: "May", income: 2750, costs: 1860, net: 890 },
          { month: "Jun", income: 2750, costs: 1860, net: 890 },
          { month: "Jul", income: 2750, costs: 1860, net: 890 },
          { month: "Aug", income: 2750, costs: 1860, net: 890 },
          { month: "Sep", income: 2750, costs: 1860, net: 890 },
          { month: "Oct", income: 2750, costs: 1860, net: 890 },
          { month: "Nov", income: 2750, costs: 1860, net: 890 },
          { month: "Dec", income: 2750, costs: 1860, net: 890 },
        ],
      },
      {
        name: "Conservative", type: "conservative",
        kpis: [
          { label: "Annual Room Income", value: "22440 GBP", trend: "down" },
          { label: "Annual Fixed Costs", value: "24720 GBP", trend: "up" },
          { label: "Annual Profit", value: "-2280 GBP", highlight: true },
          { label: "ROI on Setup Capital", value: "-46%", trend: "down" },
        ],
        monthly: [
          { month: "Jan", income: 1870, costs: 2060, net: -190 },
          { month: "Feb", income: 1870, costs: 2060, net: -190 },
          { month: "Mar", income: 1870, costs: 2060, net: -190 },
          { month: "Apr", income: 1870, costs: 2060, net: -190 },
          { month: "May", income: 2200, costs: 2060, net: 140 },
          { month: "Jun", income: 1650, costs: 2060, net: -410 },
          { month: "Jul", income: 1650, costs: 2060, net: -410 },
          { month: "Aug", income: 1870, costs: 2060, net: -190 },
          { month: "Sep", income: 2200, costs: 2060, net: 140 },
          { month: "Oct", income: 2200, costs: 2060, net: 140 },
          { month: "Nov", income: 1870, costs: 2060, net: -190 },
          { month: "Dec", income: 1650, costs: 2060, net: -410 },
        ],
      },
    ],
    baseKpis: [
      { label: "Annual Room Income", value: "29040 GBP", trend: "neutral" },
      { label: "Annual Costs", value: "23760 GBP", trend: "neutral" },
      { label: "Annual Profit", value: "5280 GBP", highlight: true },
      { label: "ROI on Setup Capital", value: "105.6%", trend: "up" },
      { label: "Breakeven Occupancy", value: "72%", sublabel: "3.6 of 5 rooms" },
      { label: "Months to Recover Setup", value: "11 months", sublabel: "At 440/mo profit" },
    ],
    assumptions: [
      { label: "Room Count", value: "5" },
      { label: "Room Rent", value: "550 GBP/mo" },
      { label: "Guaranteed Rent", value: "1400 GBP/mo" },
      { label: "Occupancy", value: "88%" },
      { label: "Bills", value: "380 GBP/mo" },
      { label: "Setup Capital", value: "5000 GBP" },
    ],
    sensitivityRows: [
      { variable: "Occupancy +/- 5%", base: "88%", upside: "+137/mo", downside: "-137/mo" },
      { variable: "Guaranteed Rent +/- 100/mo", base: "1400/mo", upside: "+1200/yr", downside: "-1200/yr" },
      { variable: "Room Rent +/- 25/mo", base: "550/mo", upside: "+1320/yr", downside: "-1320/yr" },
      { variable: "Bills +/- 50/mo", base: "380/mo", upside: "+600/yr", downside: "-600/yr" },
    ],
    forecastNote: "R2R is highly leveraged on occupancy. Fixed guaranteed rent creates binary risk: full occupancy = strong returns, low occupancy = losses despite no mortgage. Cash buffer of 3 guaranteed rent payments is essential.",
  },
  checklist: {
    phases: [
      {
        name: "Deal Sourcing",
        tasks: [
          { label: "Identify landlords willing to do R2R", priority: "High", owner: "Operator", daysOffset: 0 },
          { label: "Confirm landlord mortgage allows subletting", priority: "High", owner: "Operator", daysOffset: 7 },
          { label: "Negotiate guaranteed rent and contract terms", priority: "High", owner: "Operator", daysOffset: 14 },
          { label: "Agree contract length and break clauses", priority: "High", owner: "Operator", daysOffset: 14 },
        ],
      },
      {
        name: "Legal Agreement",
        tasks: [
          { label: "Management agreement drafted by solicitor", priority: "High", owner: "Solicitor", daysOffset: 21 },
          { label: "Confirm explicit sublet rights in agreement", priority: "High", owner: "Solicitor", daysOffset: 21 },
          { label: "Landlord and operator sign agreement", priority: "High", owner: "Operator", daysOffset: 28 },
          { label: "Operator liability insurance arranged", priority: "High", owner: "Operator", daysOffset: 28 },
        ],
      },
      {
        name: "Setup and Compliance",
        tasks: [
          { label: "Gas safety certificate obtained", priority: "High", owner: "Engineer", daysOffset: 35 },
          { label: "EICR completed", priority: "High", owner: "Engineer", daysOffset: 35 },
          { label: "Fire risk assessment", priority: "High", owner: "Assessor", daysOffset: 35 },
          { label: "HMO licence applied for (if applicable)", priority: "High", owner: "Operator", daysOffset: 35 },
          { label: "Rooms furnished", priority: "High", owner: "Operator", daysOffset: 42 },
        ],
      },
      {
        name: "Launch",
        tasks: [
          { label: "Room marketing launched", priority: "High", owner: "Operator", daysOffset: 42 },
          { label: "Sub-tenants referenced and ASTs signed", priority: "High", owner: "Operator", daysOffset: 49 },
          { label: "Deposits protected", priority: "High", owner: "Operator", daysOffset: 49 },
          { label: "Utility accounts set up", priority: "High", owner: "Operator", daysOffset: 42 },
        ],
      },
    ],
    criticalPathItems: [
      "Subletting rights must be explicit in management agreement",
      "Landlord mortgage must permit commercial subletting",
      "HMO licence in place if 5+ unrelated occupants",
      "Gas safety and EICR before any occupants",
    ],
  },
  risks: {
    overallRating: "High", totalExposureEstimate: "6000-18000 GBP/year",
    register: [
      { name: "High Void Rate Loses Money", category: "Financial", likelihood: "Possible", impact: "High", score: 9, mitigation: "Strong marketing, competitive pricing, always maintain waitlist", owner: "Operator" },
      { name: "Landlord Contract Termination", category: "Operational", likelihood: "Possible", impact: "Severe", score: 12, mitigation: "Long contract with break clause protections, good landlord relationship", owner: "Operator" },
      { name: "Illegal Sublet (no clause)", category: "Legal", likelihood: "Low", impact: "Severe", score: 8, mitigation: "Solicitor-drafted agreement with explicit sublet rights", owner: "Solicitor" },
      { name: "Compliance Failure (operator liable)", category: "Regulatory", likelihood: "Low", impact: "High", score: 8, mitigation: "Full compliance programme, annual audit", owner: "Operator" },
      { name: "Bills Cost Overrun", category: "Financial", likelihood: "Likely", impact: "Medium", score: 12, mitigation: "Fixed energy tariffs, smart meters, fair use tenant clauses", owner: "Operator" },
      { name: "Landlord Mortgage Breach", category: "Legal", likelihood: "Low", impact: "Severe", score: 8, mitigation: "Confirm mortgage terms with landlord in writing before contract", owner: "Operator" },
    ],
    topByExposure: [
      { label: "Contract Termination Loss", exposure: "Setup capital plus income", level: "High" },
      { label: "High Void Period", exposure: "1400+ GBP/mo guaranteed rent still owed", level: "High" },
      { label: "Compliance Failure", exposure: "Fine plus enforcement", level: "High" },
    ],
    mitigationActions: [
      "Never take on a R2R without a solicitor-drafted agreement",
      "Maintain 3-month guaranteed rent cash buffer at all times",
      "Confirm landlord mortgage terms allow subletting in writing",
      "Strong void management: never let rooms sit empty more than 2 weeks",
    ],
  },
  aiQuestions: {
    suggestedQuestions: [
      { question: "How do I find landlords willing to do R2R?", category: "Deal Sourcing", insight: "Landlord pain points analysis, direct marketing strategies, property portal targeting, agent relationships" },
      { question: "What should the management agreement include?", category: "Legal", insight: "Essential clauses for R2R agreements, sublet rights wording, break clause negotiation, repairs obligation" },
      { question: "What guaranteed rent should I offer the landlord?", category: "Negotiation", insight: "Guaranteed rent sizing relative to market rent, landlord decision factors, value proposition analysis" },
      { question: "What is my breakeven occupancy?", category: "Viability", insight: "Breakeven occupancy calculation based on guaranteed rent, bills and management cost structure" },
      { question: "How do I scale an R2R business?", category: "Strategy", insight: "Multi-property management systems, financial modelling, team structure, funding for setup capex" },
    ],
    keyDrivers: ["Guaranteed Rent Level", "Room Occupancy", "Monthly Bills", "Management Spread", "Contract Length"],
    quickStats: [
      { label: "Minimum Setup Capital", value: "2000-8000 GBP" },
      { label: "Breakeven Occupancy", value: "Typically 70-75%" },
      { label: "Target Spread", value: "600-1000 GBP/mo gross" },
      { label: "ROI on Capital", value: "50-150%+ pa" },
    ],
    recommendations: [
      "Never sign a R2R agreement without a solicitor review",
      "Negotiate guaranteed rent at no more than 70% of expected gross room income",
      "Keep 3 months guaranteed rent in reserve at all times",
    ],
    confidenceScore: 68, confidenceLabel: "Moderate Confidence",
  },
  quickActions: [
    { label: "Start Planning Set", sub: "Build your R2R plan", icon: "Play", action: "start-planning" },
    { label: "Compare Profile", sub: "vs HMO ownership", icon: "BarChart2", action: "compare" },
    { label: "R2R Spread Calculator", sub: "Model your spread", icon: "Zap", action: "quick-scenario" },
    { label: "Download Pack", sub: "PDF profile guide", icon: "Download", action: "download" },
  ],
  pros: ["Control without ownership or mortgage", "Very high ROI on capital deployed", "Scalable without large capital base", "Can use SA or HMO model on same property", "Quick to set up vs purchasing"],
  cons: ["No capital appreciation benefit", "Fixed guaranteed rent creates loss risk in void", "Contract termination leaves operator exposed", "All compliance liability falls on operator", "Landlord relationship risk"],
}

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE 8 — SOCIAL HOUSING
// ─────────────────────────────────────────────────────────────────────────────
export const SOCIAL_HOUSING_CONFIG: ProfileConfig = {
  key: "social_housing", slug: "social-housing", name: "Social Housing", number: 8,
  tagline: "Guaranteed or semi-guaranteed rental income via councils and housing associations",
  description: "Let to councils, housing associations or exempt accommodation providers under long lease arrangements. Guaranteed or near-guaranteed income with low management burden.",
  icon: "Shield", accentColor: "#DC2626", bgColor: "#FEF2F2",
  group: "lease-managed", groupLabel: "Lease and Managed Models",
  tags: ["Guaranteed Income", "Social Impact", "High Compliance", "Long Lease"],
  riskLevel: "Low", managementIntensity: "Low", complianceIntensity: "High", capitalIntensity: "Medium",
  primaryMetric: { label: "Guaranteed Yield", value: "4-8%", sublabel: "Backed by council or HA" },
  overviewKpis: [
    { label: "Guaranteed Yield", value: "4-8%", sublabel: "Council or HA backed", trend: "neutral" },
    { label: "Void Rate", value: "0%", sublabel: "Guaranteed rent paid", trend: "down" },
    { label: "Lease Length", value: "3-10 years", sublabel: "Typical council lease", trend: "neutral" },
    { label: "Management Burden", value: "Minimal", sublabel: "LA manages tenants", trend: "down" },
  ],
  whoItSuits: ["Truly passive investors", "Risk-averse landlords", "Retirees and pension-income investors", "Investors seeking long-term stability", "Ethical/impact investors"],
  idealAssets: [
    { icon: "Home", label: "2-4 Bed Houses", sub: "Standard family housing" },
    { icon: "Building", label: "Flats and Apartments", sub: "Urban social housing stock" },
    { icon: "Landmark", label: "Converted Properties", sub: "Supported accommodation use" },
  ],
  advantages: ["Zero voids - guaranteed rent paid regardless", "Council manages tenant selection", "Very low day-to-day management burden", "Long-term income security", "Social impact credentials"],
  constraints: ["Below-market rents (LHA rates as income ceiling)", "Property must meet decent homes standard", "Repairs obligations often with landlord", "Less control over tenants or use", "Contract break clauses create risk"],
  bestMarket: ["High social housing demand areas", "Urban centres with housing shortage", "Areas with strong council/HA partnerships", "Outside expensive prime areas"],
  riskPosture: [
    { label: "Counterparty Risk", level: "Low" },
    { label: "Property Condition", level: "Medium" },
    { label: "Contract Break", level: "Medium" },
    { label: "Regulatory Standards", level: "High" },
  ],
  timeline: [
    { label: "Apply to LA Scheme", sub: "Registration and inspection", duration: "2-8 weeks" },
    { label: "Property Inspection", sub: "Decent homes standard check", duration: "2-4 weeks" },
    { label: "Agreement", sub: "Lease terms negotiation", duration: "2-4 weeks" },
    { label: "Lease Start", sub: "Guaranteed rent begins", duration: "Month 1" },
    { label: "Annual Review", sub: "Rent review and inspection", duration: "Annual" },
  ],
  modelSnapshot: {
    label: "Example Annual P&L - 3-bed house 200k at LHA rate",
    lines: [
      { label: "LHA Guaranteed Rent (monthly 700 GBP)", value: "8400 GBP/yr" },
      { label: "Less Mortgage", value: "-4500 GBP/yr" },
      { label: "Less Maintenance Obligation", value: "-1200 GBP/yr" },
      { label: "Less Insurance", value: "-360 GBP/yr" },
      { label: "Net Annual Income", value: "2340 GBP/yr", highlight: true },
      { label: "Gross Yield", value: "4.2%" },
      { label: "Net Yield", value: "1.2%" },
      { label: "Voids", value: "Zero - guaranteed" },
    ],
  },
  incomeModel: {
    type: "Guaranteed Monthly Lease Income (LHA-Backed)",
    kpis: [
      { label: "Monthly Guaranteed Rent", value: "700-1100 GBP", sublabel: "LHA rates vary by area", trend: "neutral" },
      { label: "Annual Gross Income", value: "8400-13200 GBP", sublabel: "Zero void", trend: "neutral" },
      { label: "Net Annual Income", value: "2000-5000 GBP", sublabel: "After mortgage and costs", trend: "neutral" },
      { label: "Void Rate", value: "0%", sublabel: "Guaranteed payment", trend: "down" },
    ],
    structure: {
      label: "Social Housing Income Calculation",
      description: "Fixed monthly lease payment from council or HA minus mortgage and landlord obligations",
      lines: [
        { label: "Guaranteed Monthly Rent", formula: "LHA rate for property size and area", example: "700 GBP/mo" },
        { label: "Annual Gross Income", formula: "Monthly x 12", example: "8400 GBP" },
        { label: "Less Mortgage", formula: "Monthly x 12", example: "4500 GBP" },
        { label: "Less Landlord Maintenance Obligation", formula: "Annual cost", example: "1200 GBP" },
        { label: "Less Insurance", formula: "Annual", example: "360 GBP" },
        { label: "Net Annual Income", formula: "Sum above", example: "2340 GBP" },
      ],
    },
    assumptions: [
      { label: "Property Value", default: "200000 GBP", range: "100000-400000 GBP" },
      { label: "LHA Monthly Rate", default: "700 GBP/mo", range: "550-1200 GBP/mo" },
      { label: "Mortgage Rate", default: "4.75%", range: "3.5-6.5%" },
      { label: "LTV", default: "75%", range: "60-80%" },
      { label: "Annual Maintenance", default: "1200 GBP", range: "800-2500 GBP" },
      { label: "Lease Length", default: "5 years", range: "3-10 years" },
    ],
    exampleCalc: {
      inputs: [
        { label: "Property Value", value: "200000 GBP" },
        { label: "LHA Monthly Rent", value: "700 GBP/mo" },
        { label: "Mortgage (75% LTV at 4.75%)", value: "150000 GBP" },
      ],
      outputs: [
        { label: "Annual Gross Income", value: "8400 GBP" },
        { label: "Less Mortgage Annual", value: "-4500 GBP" },
        { label: "Less Maintenance", value: "-1200 GBP" },
        { label: "Less Insurance", value: "-360 GBP" },
        { label: "Net Annual Income", value: "2340 GBP", highlight: true },
        { label: "Gross Yield", value: "4.2%" },
        { label: "Net Yield", value: "1.2%" },
        { label: "Void Allowance", value: "Zero (guaranteed)" },
      ],
    },
    sensitivityNote: "Social housing yields are low but the guaranteed income and zero void create exceptional cashflow predictability. Main sensitivity is mortgage rate and maintenance obligation scope.",
    benchmarkRanges: [
      { label: "Gross Yield", low: "4%", mid: "5.5%", high: "8%" },
      { label: "LHA Monthly Rate", low: "550 GBP", mid: "750 GBP", high: "1200 GBP" },
      { label: "Lease Length", low: "3 years", mid: "5 years", high: "10 years" },
    ],
  },
  costDrivers: {
    kpis: [
      { label: "Mortgage Payment", value: "375-700 GBP/mo", sublabel: "Dominant cost", trend: "neutral" },
      { label: "Annual Maintenance Obligation", value: "1000-2500 GBP", sublabel: "Landlord responsibility", trend: "neutral" },
      { label: "Annual Insurance", value: "300-500 GBP", sublabel: "Buildings and liability", trend: "neutral" },
      { label: "Management Cost", value: "Near zero", sublabel: "LA manages tenants", trend: "down" },
    ],
    categories: [
      {
        name: "Finance",
        items: [
          { label: "Buy-to-Let Mortgage", typical: "375-700 GBP/mo", frequency: "Monthly", type: "fixed" },
        ],
      },
      {
        name: "Maintenance",
        items: [
          { label: "Structural and External Repairs", typical: "800-2000 GBP/yr", frequency: "Annual", type: "variable" },
          { label: "Boiler Service and Repairs", typical: "100-300 GBP/yr", frequency: "Annual", type: "fixed" },
          { label: "Appliance Replacement", typical: "200-600 GBP/yr", frequency: "Annual", type: "variable" },
        ],
      },
      {
        name: "Insurance",
        items: [
          { label: "Buildings Insurance (social use)", typical: "300-500 GBP/yr", frequency: "Annual", type: "fixed" },
        ],
      },
      {
        name: "Compliance",
        items: [
          { label: "Gas Safety Certificate", typical: "70-90 GBP/yr", frequency: "Annual", type: "fixed" },
          { label: "EICR", typical: "150-250 GBP", frequency: "5-yearly", type: "fixed" },
          { label: "EPC (min D for social housing)", typical: "80-120 GBP", frequency: "10-yearly", type: "fixed" },
          { label: "Legionella Assessment", typical: "100-200 GBP", frequency: "Periodically", type: "fixed" },
        ],
      },
    ],
    sensitivityNote: "Mortgage cost is the dominant variable. At high LTV, net yield can be very thin or zero. Properties should be assessed with aim for minimum 30-40% net-to-gross ratio after all fixed costs.",
    costControlTips: [
      "Fix mortgage rate for 5-10 years to match lease term stability",
      "Negotiate repairs cap or void liability clause in lease agreement",
      "Annual planned maintenance visit to prevent emergency costs",
      "Review LHA rates annually - apply for increases where justified",
    ],
  },
  compliance: {
    score: 62, scoreLabel: "Moderate-High", criticalCount: 5,
    requirements: [
      { area: "Standards", item: "Decent Homes Standard", priority: "High", required: true, renewal: "Annual inspection", estimatedCost: "Varies", riskIfMissing: "Contract breach, enforcement" },
      { area: "Safety", item: "Gas Safety Certificate", priority: "High", required: true, renewal: "Annual", estimatedCost: "70-90 GBP", riskIfMissing: "Contract breach, prosecution" },
      { area: "Safety", item: "EICR", priority: "High", required: true, renewal: "5-yearly", estimatedCost: "150-250 GBP", riskIfMissing: "Contract breach, fine" },
      { area: "Energy", item: "EPC (min D for social housing)", priority: "High", required: true, renewal: "On let", estimatedCost: "80-120 GBP", riskIfMissing: "Cannot let" },
      { area: "Safety", item: "Fire Alarms and CO Detectors", priority: "High", required: true, renewal: "Annual check", estimatedCost: "30-80 GBP", riskIfMissing: "Contract breach" },
      { area: "Health", item: "Legionella Risk Assessment", priority: "Medium", required: true, renewal: "Every 2 years", estimatedCost: "100-200 GBP", riskIfMissing: "Health liability" },
      { area: "Licensing", item: "Supported Accommodation Registration (if applicable)", priority: "Medium", required: false, renewal: "Annual", estimatedCost: "Variable", riskIfMissing: "Regulatory non-compliance" },
    ],
    upcomingDeadlines: [
      { label: "Gas Safety Certificate renewal", due: "Annual", priority: "High" },
      { label: "Decent Homes inspection", due: "Annual", priority: "High" },
      { label: "EICR renewal", due: "5-yearly", priority: "High" },
    ],
    requiredDocs: ["Lease Agreement with Council/HA", "Gas Safety Certificate", "EICR Report", "EPC Certificate", "Decent Homes Inspection Record", "Buildings Insurance Policy", "Legionella Assessment"],
    aiInsight: "Social housing compliance is centred on property standards rather than tenancy management. The Decent Homes Standard requires adequate heating, freedom from damp, and modern facilities. Failure means lease suspension and potential liability.",
  },
  forecast: {
    scenarios: [
      {
        name: "Base Case", type: "base",
        kpis: [
          { label: "Annual Gross Income", value: "8400 GBP", trend: "neutral" },
          { label: "Annual Costs", value: "6060 GBP", trend: "neutral" },
          { label: "Net Annual Income", value: "2340 GBP", highlight: true },
          { label: "Gross Yield", value: "4.2%", trend: "neutral" },
        ],
        monthly: [
          { month: "Jan", income: 700, costs: 505, net: 195 },
          { month: "Feb", income: 700, costs: 505, net: 195 },
          { month: "Mar", income: 700, costs: 505, net: 195 },
          { month: "Apr", income: 700, costs: 505, net: 195 },
          { month: "May", income: 700, costs: 505, net: 195 },
          { month: "Jun", income: 700, costs: 505, net: 195 },
          { month: "Jul", income: 700, costs: 505, net: 195 },
          { month: "Aug", income: 700, costs: 505, net: 195 },
          { month: "Sep", income: 700, costs: 505, net: 195 },
          { month: "Oct", income: 700, costs: 505, net: 195 },
          { month: "Nov", income: 700, costs: 505, net: 195 },
          { month: "Dec", income: 700, costs: 505, net: 195 },
        ],
      },
      {
        name: "Optimistic", type: "optimistic",
        kpis: [
          { label: "Annual Gross Income", value: "10800 GBP", trend: "up" },
          { label: "Annual Costs", value: "5760 GBP", trend: "down" },
          { label: "Net Annual Income", value: "5040 GBP", highlight: true },
          { label: "Gross Yield", value: "5.4%", trend: "up" },
        ],
        monthly: [
          { month: "Jan", income: 900, costs: 480, net: 420 },
          { month: "Feb", income: 900, costs: 480, net: 420 },
          { month: "Mar", income: 900, costs: 480, net: 420 },
          { month: "Apr", income: 900, costs: 480, net: 420 },
          { month: "May", income: 900, costs: 480, net: 420 },
          { month: "Jun", income: 900, costs: 480, net: 420 },
          { month: "Jul", income: 900, costs: 480, net: 420 },
          { month: "Aug", income: 900, costs: 480, net: 420 },
          { month: "Sep", income: 900, costs: 480, net: 420 },
          { month: "Oct", income: 900, costs: 480, net: 420 },
          { month: "Nov", income: 900, costs: 480, net: 420 },
          { month: "Dec", income: 900, costs: 480, net: 420 },
        ],
      },
      {
        name: "Conservative", type: "conservative",
        kpis: [
          { label: "Annual Gross Income", value: "7200 GBP", trend: "down" },
          { label: "Annual Costs", value: "6960 GBP", trend: "up" },
          { label: "Net Annual Income", value: "240 GBP", highlight: true },
          { label: "Gross Yield", value: "3.6%", trend: "down" },
        ],
        monthly: [
          { month: "Jan", income: 600, costs: 580, net: 20 },
          { month: "Feb", income: 600, costs: 580, net: 20 },
          { month: "Mar", income: 600, costs: 580, net: 20 },
          { month: "Apr", income: 600, costs: 580, net: 20 },
          { month: "May", income: 600, costs: 580, net: 20 },
          { month: "Jun", income: 600, costs: 580, net: 20 },
          { month: "Jul", income: 600, costs: 580, net: 20 },
          { month: "Aug", income: 600, costs: 580, net: 20 },
          { month: "Sep", income: 600, costs: 580, net: 20 },
          { month: "Oct", income: 600, costs: 580, net: 20 },
          { month: "Nov", income: 600, costs: 580, net: 20 },
          { month: "Dec", income: 600, costs: 580, net: 20 },
        ],
      },
    ],
    baseKpis: [
      { label: "Annual Gross Income", value: "8400 GBP", trend: "neutral" },
      { label: "Annual Costs", value: "6060 GBP", trend: "neutral" },
      { label: "Net Annual Income", value: "2340 GBP", highlight: true },
      { label: "Gross Yield", value: "4.2%", trend: "neutral" },
      { label: "Net Yield", value: "1.2%", trend: "neutral" },
      { label: "Void Rate", value: "Zero", sublabel: "Guaranteed payment" },
    ],
    assumptions: [
      { label: "Property Value", value: "200000 GBP" },
      { label: "LHA Monthly Rate", value: "700 GBP/mo" },
      { label: "Mortgage Rate", value: "4.75%" },
      { label: "LTV", value: "75%" },
      { label: "Annual Maintenance", value: "1200 GBP" },
      { label: "Lease Length", value: "5 years" },
    ],
    sensitivityRows: [
      { variable: "LHA Rate +/- 50 GBP/mo", base: "700 GBP/mo", upside: "+600/yr", downside: "-600/yr" },
      { variable: "Mortgage Rate +/- 0.5%", base: "4.75%", upside: "+712/yr", downside: "-712/yr" },
      { variable: "Maintenance +/- 300 GBP/yr", base: "1200 GBP/yr", upside: "+300/yr", downside: "-300/yr" },
      { variable: "Lease Length +/- 2 years", base: "5 years", upside: "More income certainty", downside: "Shorter term = renegotiation risk" },
    ],
    forecastNote: "Social housing provides perfectly flat income (no seasonality, no voids). Value comes from predictability and zero management, not yield. Net yield is modest but highly stable.",
  },
  checklist: {
    phases: [
      {
        name: "Pre-Purchase",
        tasks: [
          { label: "Identify local council/HA lease scheme", priority: "High", owner: "Investor", daysOffset: 0 },
          { label: "Confirm LHA rates for area and property size", priority: "High", owner: "Investor", daysOffset: 7 },
          { label: "Assess property against Decent Homes Standard", priority: "High", owner: "Surveyor", daysOffset: 14 },
          { label: "Confirm mortgage lender allows social housing lease", priority: "High", owner: "Broker", daysOffset: 14 },
        ],
      },
      {
        name: "Property Preparation",
        tasks: [
          { label: "Bring property to Decent Homes Standard", priority: "High", owner: "Contractor", daysOffset: 42 },
          { label: "Gas safety certificate obtained", priority: "High", owner: "Engineer", daysOffset: 49 },
          { label: "EICR completed", priority: "High", owner: "Engineer", daysOffset: 49 },
          { label: "EPC obtained (min D)", priority: "High", owner: "Assessor", daysOffset: 49 },
          { label: "Fire alarms and CO detectors fitted", priority: "High", owner: "Investor", daysOffset: 49 },
          { label: "Legionella assessment", priority: "Medium", owner: "Assessor", daysOffset: 49 },
        ],
      },
      {
        name: "Agreement",
        tasks: [
          { label: "Council/HA inspection completed", priority: "High", owner: "Council", daysOffset: 56 },
          { label: "Lease terms negotiated", priority: "High", owner: "Solicitor", daysOffset: 63 },
          { label: "Lease signed", priority: "High", owner: "Investor", daysOffset: 70 },
          { label: "First rent received", priority: "High", owner: "Council", daysOffset: 77 },
        ],
      },
      {
        name: "Annual Operations",
        tasks: [
          { label: "Annual gas safety renewal", priority: "High", owner: "Engineer", daysOffset: 365 },
          { label: "Annual property inspection by council", priority: "High", owner: "Council", daysOffset: 365 },
          { label: "Rent review discussion", priority: "Medium", owner: "Investor", daysOffset: 365 },
          { label: "Buildings insurance renewal", priority: "High", owner: "Investor", daysOffset: 365 },
        ],
      },
    ],
    criticalPathItems: [
      "Property must meet Decent Homes Standard before lease",
      "EPC minimum D (stricter than private rented sector minimum E)",
      "Mortgage must permit social housing lease arrangement",
      "Annual gas safety certificate required for lease continuation",
    ],
  },
  risks: {
    overallRating: "Low", totalExposureEstimate: "2000-6000 GBP/year",
    register: [
      { name: "Contract Break by Council", category: "Operational", likelihood: "Low", impact: "High", score: 8, mitigation: "Long lease, break clause notice period, re-let plan ready", owner: "Investor" },
      { name: "Property Maintenance Escalation", category: "Financial", likelihood: "Possible", impact: "Medium", score: 6, mitigation: "Annual maintenance visit, planned maintenance schedule", owner: "Investor" },
      { name: "Rent Below Market and Frozen", category: "Financial", likelihood: "Likely", impact: "Low", score: 4, mitigation: "Annual LHA review, negotiate for rent increases in lease", owner: "Investor" },
      { name: "Mortgage Rate Rise", category: "Financial", likelihood: "Possible", impact: "Medium", score: 6, mitigation: "Fix mortgage rate for 5-10 years to match lease stability", owner: "Investor" },
      { name: "Council Financial Instability", category: "Counterparty", likelihood: "Low", impact: "High", score: 8, mitigation: "Review council credit rating, diversify across multiple properties", owner: "Investor" },
      { name: "Tenant Damage to Property", category: "Operational", likelihood: "Low", impact: "Medium", score: 3, mitigation: "Inspect on handback, buildings insurance, lease damage clause", owner: "Investor" },
    ],
    topByExposure: [
      { label: "Property Maintenance Escalation", exposure: "1000-5000 GBP/yr", level: "Medium" },
      { label: "Mortgage Rate Risk", exposure: "600-1500 GBP/yr", level: "Medium" },
      { label: "Contract Break", exposure: "Full void period loss", level: "Low" },
    ],
    mitigationActions: [
      "Fix mortgage rate for 5-10 years to match lease term",
      "Annual planned maintenance to prevent emergency costs",
      "Negotiate 12-month notice period for any contract break",
      "Hold 6-month mortgage payment reserve",
    ],
  },
  aiQuestions: {
    suggestedQuestions: [
      { question: "What LHA rate applies to my property?", category: "Income", insight: "LHA rates by bedroom count and broad rental market area - varies significantly by location" },
      { question: "How do I find a council or HA to lease to?", category: "Deal Sourcing", insight: "Local authority private landlord schemes, NRLA resources, housing association partnership programmes" },
      { question: "What maintenance obligations will I have?", category: "Costs", insight: "Decent Homes Standard requirements, typical repair liabilities, structural vs internal split" },
      { question: "Is the income really guaranteed?", category: "Risk", insight: "Council payment security, HA financial strength, contract termination scenarios and protection clauses" },
      { question: "How does social housing compare to standard BTL after tax?", category: "Tax", insight: "Section 24 impact, guaranteed income tax treatment, mortgage interest relief comparison" },
    ],
    keyDrivers: ["LHA Monthly Rate", "Mortgage Rate", "Maintenance Obligation Scope", "Lease Length", "Council/HA Counterparty Quality"],
    quickStats: [
      { label: "Typical Lease Length", value: "3-10 years" },
      { label: "Void Rate", value: "Zero (guaranteed)" },
      { label: "Management Burden", value: "Minimal" },
      { label: "Annual Compliance Cost", value: "300-500 GBP" },
    ],
    recommendations: [
      "Fix mortgage for 5+ years to match guaranteed income stability",
      "Get Decent Homes survey before purchase to avoid costly upgrades",
      "Review LHA rates annually and negotiate increases in lease",
    ],
    confidenceScore: 83, confidenceLabel: "High Confidence",
  },
  quickActions: [
    { label: "Start Planning Set", sub: "Build your social housing plan", icon: "Play", action: "start-planning" },
    { label: "Compare Profile", sub: "vs Long-Term Let", icon: "BarChart2", action: "compare" },
    { label: "LHA Rate Check", sub: "Local housing allowance lookup", icon: "Zap", action: "quick-scenario" },
    { label: "Download Pack", sub: "PDF profile guide", icon: "Download", action: "download" },
  ],
  pros: ["Zero voids - guaranteed income regardless of occupancy", "Minimal management burden", "Long-term income security", "Social impact and ESG credentials", "Reliable council or HA payer"],
  cons: ["Below-market rent (LHA rates)", "Less control over tenants or use", "Property must meet higher standard (Decent Homes)", "Maintenance obligation often with landlord", "Limited upside if market rents rise above LHA"],
}

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE 9 — BUILD-TO-RENT
// ─────────────────────────────────────────────────────────────────────────────
export const BUILD_TO_RENT_CONFIG: ProfileConfig = {
  key: "build_to_rent", slug: "build-to-rent", name: "Build-to-Rent", number: 9,
  tagline: "Purpose-built rental communities with institutional operations and long-term hold",
  description: "Purpose-built or converted residential blocks operated as single managed rental assets. Institutional-grade product targeting young professionals with amenity-led value proposition.",
  icon: "Building2", accentColor: "#7C3AED", bgColor: "#F5F3FF",
  group: "commercial", groupLabel: "Residential Scale",
  tags: ["Institutional Scale", "Long-Term Hold", "Stabilised NOI", "Amenity-Led"],
  riskLevel: "Medium", managementIntensity: "High", complianceIntensity: "High", capitalIntensity: "High",
  primaryMetric: { label: "Stabilised NI Yield", value: "4.25-5.25%", sublabel: "Net income on GDV" },
  overviewKpis: [
    { label: "Stabilised Yield", value: "4.25-5.25%", sublabel: "On total development cost", trend: "up" },
    { label: "Lease-Up Period", value: "6-18 months", sublabel: "To stabilised occupancy", trend: "neutral" },
    { label: "Operating Margin", value: "35-45%", sublabel: "NOI / Gross Revenue", trend: "up" },
    { label: "DSCR Target", value: "1.35x+", sublabel: "Debt service coverage", trend: "up" },
  ],
  whoItSuits: ["Institutional investors", "Property developers with long-term hold strategy", "Family offices", "REIT-style operators", "High-capital portfolio builders"],
  idealAssets: [
    { icon: "Building2", label: "Purpose-Built Apartment Blocks", sub: "50-300 units" },
    { icon: "Landmark", label: "Office to Residential Conversion", sub: "Class E to C3" },
    { icon: "Building", label: "Urban Brownfield Sites", sub: "Regeneration locations" },
  ],
  advantages: ["Institutional-grade income stream", "Operating leverage at scale", "Amenity income diversification", "Strong exit to institutional buyers", "Professional management platform value"],
  constraints: ["Very high capital requirement", "Long development timeline", "Lease-up risk during ramp", "Planning complexity", "Specialist operational platform required"],
  bestMarket: ["Major UK cities (London, Manchester, Birmingham, Leeds)", "University cities with professional renter demand", "Regeneration zones with planning support", "Transport-connected urban locations"],
  riskPosture: [
    { label: "Lease-Up Risk", level: "Medium" },
    { label: "Construction Cost", level: "High" },
    { label: "Planning Risk", level: "Medium" },
    { label: "Interest Rate", level: "High" },
  ],
  timeline: [
    { label: "Site Acquisition", sub: "Land/building purchase and planning pre-app", duration: "3-6 months" },
    { label: "Planning", sub: "Application and determination", duration: "6-18 months" },
    { label: "Construction/Conversion", sub: "Build programme", duration: "12-36 months" },
    { label: "Lease-Up", sub: "Marketing and occupancy ramp", duration: "6-18 months" },
    { label: "Stabilised Operations", sub: "90%+ occupancy, full NOI", duration: "Ongoing" },
  ],
  modelSnapshot: {
    label: "Example - 50-unit BTR block, GDV 8m GBP",
    lines: [
      { label: "Gross Rent Roll (50 x 1200/mo)", value: "720000 GBP/yr" },
      { label: "Plus Amenity Income (gym/parking/storage)", value: "60000 GBP/yr" },
      { label: "Less Operating Costs (OpEx 55%)", value: "-429000 GBP/yr" },
      { label: "Net Operating Income (NOI)", value: "351000 GBP/yr", highlight: true },
      { label: "NI Yield on GDV (8m)", value: "4.39%" },
      { label: "DSCR (at 4.5% senior debt)", value: "1.42x" },
      { label: "Exit Cap Rate", value: "4.25-4.75%" },
    ],
  },
  incomeModel: {
    type: "Stabilised Rent Roll plus Amenity Income",
    kpis: [
      { label: "Gross Annual Rent Roll", value: "720000 GBP", sublabel: "50 units at 1200/mo", trend: "up" },
      { label: "Amenity Income", value: "60000 GBP/yr", sublabel: "8.3% of rent roll", trend: "up" },
      { label: "NOI", value: "351000 GBP/yr", sublabel: "After 55% OpEx ratio", trend: "up" },
      { label: "NI Yield on GDV", value: "4.39%", sublabel: "Target 4.25-5.25%", trend: "up" },
    ],
    structure: {
      label: "BTR Income Calculation",
      description: "Stabilised rent roll plus amenity income minus operating expenses gives NOI. NOI/GDV = stabilised yield.",
      lines: [
        { label: "Gross Rent Roll", formula: "Units x Avg Monthly Rent x 12", example: "50 x 1200 x 12 = 720000 GBP" },
        { label: "Plus Amenity Income", formula: "Gym + Parking + Storage + Events", example: "60000 GBP/yr" },
        { label: "Less Vacancy Allowance", formula: "Gross x 5%", example: "39000 GBP" },
        { label: "Less Operating Expenses", formula: "Management + Maintenance + Service", example: "390000 GBP (55% ratio)" },
        { label: "Net Operating Income", formula: "Sum above", example: "351000 GBP" },
        { label: "NI Yield", formula: "NOI / GDV", example: "351000 / 8000000 = 4.39%" },
      ],
    },
    assumptions: [
      { label: "Unit Count", default: "50", range: "30-300" },
      { label: "Average Monthly Rent", default: "1200 GBP", range: "900-2500 GBP" },
      { label: "Amenity Income", default: "8% of rent roll", range: "5-15% of rent roll" },
      { label: "Stabilised Occupancy", default: "95%", range: "90-97%" },
      { label: "Operating Expense Ratio", default: "55%", range: "50-65%" },
      { label: "GDV", default: "8000000 GBP", range: "3m-100m+ GBP" },
    ],
    exampleCalc: {
      inputs: [
        { label: "50 units at 1200/mo", value: "720000 GBP/yr gross rent" },
        { label: "Amenity Income", value: "60000 GBP/yr" },
        { label: "Total Development Cost", value: "8000000 GBP" },
      ],
      outputs: [
        { label: "Gross Revenue", value: "780000 GBP" },
        { label: "Less Vacancy (5%)", value: "-39000 GBP" },
        { label: "Less Operating Expenses (55%)", value: "-390000 GBP" },
        { label: "Net Operating Income", value: "351000 GBP", highlight: true },
        { label: "NI Yield on GDV", value: "4.39%" },
        { label: "DSCR (at 4.5% senior)", value: "1.42x" },
        { label: "Exit Valuation (4.5% cap rate)", value: "7800000 GBP" },
      ],
    },
    sensitivityNote: "BTR NOI is most sensitive to average rent level and operating expense ratio. A 5% rent uplift across 50 units adds 36000 GBP NOI. Improving OpEx ratio from 58% to 55% adds 23400 GBP NOI.",
    benchmarkRanges: [
      { label: "Stabilised NI Yield", low: "4.0%", mid: "4.75%", high: "5.5%" },
      { label: "Operating Margin", low: "35%", mid: "42%", high: "50%" },
      { label: "Amenity Income", low: "3%", mid: "8%", high: "15% of rent roll" },
    ],
  },
  costDrivers: {
    kpis: [
      { label: "Development Cost/Unit", value: "100000-200000 GBP", sublabel: "Varies by location/spec", trend: "neutral" },
      { label: "Operating Expense Ratio", value: "50-65%", sublabel: "Of gross revenue", trend: "neutral" },
      { label: "Finance Cost/Year", value: "250000-500000 GBP", sublabel: "Senior debt service", trend: "up" },
      { label: "Management Platform Cost", value: "8-12% of revenue", sublabel: "Professional operator fee", trend: "neutral" },
    ],
    categories: [
      {
        name: "Development Costs",
        items: [
          { label: "Land/Acquisition", typical: "Variable", frequency: "One-off", type: "fixed" },
          { label: "Construction/Conversion", typical: "1200-2500 GBP/sqm", frequency: "One-off", type: "fixed" },
          { label: "Planning and Professional Fees", typical: "5-8% of build cost", frequency: "One-off", type: "percentage" },
          { label: "Finance Costs (construction)", typical: "6-8%/yr on drawn", frequency: "During build", type: "variable" },
          { label: "Fit-Out and Amenities", typical: "10000-25000 GBP/unit", frequency: "One-off", type: "fixed" },
        ],
      },
      {
        name: "Operating Costs",
        items: [
          { label: "Property Management", typical: "8-12% of revenue", frequency: "Monthly", type: "percentage" },
          { label: "Maintenance and Repairs", typical: "3-5% of revenue", frequency: "Annual", type: "percentage" },
          { label: "Service Charge / Common Areas", typical: "2-4% of revenue", frequency: "Annual", type: "percentage" },
          { label: "Insurance (block)", typical: "0.3-0.5% of GDV/yr", frequency: "Annual", type: "fixed" },
          { label: "Amenity Running Costs", typical: "40-60% of amenity income", frequency: "Annual", type: "percentage" },
        ],
      },
      {
        name: "Finance",
        items: [
          { label: "Senior Debt Service", typical: "4-5.5%/yr on drawn", frequency: "Monthly", type: "variable" },
          { label: "Mezzanine Finance (if used)", typical: "8-12%/yr", frequency: "Monthly", type: "fixed" },
        ],
      },
    ],
    sensitivityNote: "Operating expense ratio is the critical performance metric. Schemes operating above 65% OpEx ratio often become cashflow negative once senior debt is serviced.",
    costControlTips: [
      "Target sub-55% OpEx ratio through technology and scale",
      "Amenity income partially offsets amenity running costs",
      "Centralised management platform reduces per-unit cost at scale",
      "Fixed senior debt rate for the hold period to match income predictability",
    ],
  },
  compliance: {
    score: 50, scoreLabel: "Complex", criticalCount: 8,
    requirements: [
      { area: "Planning", item: "Planning Permission and Conditions", priority: "High", required: true, renewal: "Per development", estimatedCost: "Planning fees plus professional costs", riskIfMissing: "Enforcement notice, stop works" },
      { area: "Safety", item: "Building Regulations Sign-Off", priority: "High", required: true, renewal: "On completion", estimatedCost: "Building control fees", riskIfMissing: "Cannot occupy" },
      { area: "Safety", item: "Fire Safety Act Compliance (HRB if 18m+)", priority: "High", required: true, renewal: "Ongoing", estimatedCost: "Variable", riskIfMissing: "Prohibition notice, evacuation" },
      { area: "Safety", item: "EWS1 Form (if applicable)", priority: "High", required: false, renewal: "5-yearly", estimatedCost: "1000-5000 GBP", riskIfMissing: "Mortgage lender refusal for buyers" },
      { area: "Safety", item: "Gas Safety per Unit", priority: "High", required: true, renewal: "Annual per unit", estimatedCost: "70-90 GBP/unit", riskIfMissing: "Criminal prosecution" },
      { area: "Safety", item: "EICR per Unit", priority: "High", required: true, renewal: "5-yearly per unit", estimatedCost: "80-150 GBP/unit", riskIfMissing: "30000 GBP fine per unit" },
      { area: "Safety", item: "Fire Risk Assessment (communal)", priority: "High", required: true, renewal: "Annual", estimatedCost: "500-2000 GBP", riskIfMissing: "Prosecution" },
      { area: "Leasing", item: "AST Agreements per Unit", priority: "High", required: true, renewal: "Per tenancy", estimatedCost: "Admin cost", riskIfMissing: "Unenforceable tenancies" },
    ],
    upcomingDeadlines: [
      { label: "Annual gas safety per unit", due: "Annual (staggered)", priority: "High" },
      { label: "Fire Risk Assessment review", due: "Annual", priority: "High" },
      { label: "Building Safety Case (18m+ blocks)", due: "Ongoing", priority: "High" },
    ],
    requiredDocs: ["Planning Permission", "Building Regs Completion Certificate", "Fire Safety Certificate", "EWS1 Form (if applicable)", "Gas Safety Certs (all units)", "EICR Reports (all units)", "Fire Risk Assessment", "AST Agreements"],
    aiInsight: "BTR compliance is institutional in scale and complexity. The Building Safety Act 2022 introduced mandatory registration for higher-risk buildings (18m+). Professional safety consultants and a dedicated compliance manager are essential, not optional.",
  },
  forecast: {
    scenarios: [
      {
        name: "Base Case", type: "base",
        kpis: [
          { label: "Gross Annual Revenue", value: "780000 GBP", trend: "neutral" },
          { label: "Annual Operating Costs", value: "429000 GBP", trend: "neutral" },
          { label: "Annual NOI", value: "351000 GBP", highlight: true },
          { label: "NI Yield on GDV", value: "4.39%", trend: "neutral" },
        ],
        monthly: [
          { month: "Jan", income: 52500, costs: 28750, net: 23750 },
          { month: "Feb", income: 52500, costs: 28750, net: 23750 },
          { month: "Mar", income: 58500, costs: 30500, net: 28000 },
          { month: "Apr", income: 62500, costs: 31500, net: 31000 },
          { month: "May", income: 65000, costs: 32500, net: 32500 },
          { month: "Jun", income: 67500, costs: 33500, net: 34000 },
          { month: "Jul", income: 69000, costs: 34000, net: 35000 },
          { month: "Aug", income: 69000, costs: 34000, net: 35000 },
          { month: "Sep", income: 67500, costs: 33500, net: 34000 },
          { month: "Oct", income: 62500, costs: 31500, net: 31000 },
          { month: "Nov", income: 55000, costs: 29500, net: 25500 },
          { month: "Dec", income: 48500, costs: 28500, net: 20000 },
        ],
      },
      {
        name: "Optimistic", type: "optimistic",
        kpis: [
          { label: "Gross Annual Revenue", value: "936000 GBP", trend: "up" },
          { label: "Annual Operating Costs", value: "468000 GBP", trend: "neutral" },
          { label: "Annual NOI", value: "468000 GBP", highlight: true },
          { label: "NI Yield on GDV", value: "5.85%", trend: "up" },
        ],
        monthly: [
          { month: "Jan", income: 78000, costs: 39000, net: 39000 },
          { month: "Feb", income: 78000, costs: 39000, net: 39000 },
          { month: "Mar", income: 78000, costs: 39000, net: 39000 },
          { month: "Apr", income: 78000, costs: 39000, net: 39000 },
          { month: "May", income: 78000, costs: 39000, net: 39000 },
          { month: "Jun", income: 78000, costs: 39000, net: 39000 },
          { month: "Jul", income: 78000, costs: 39000, net: 39000 },
          { month: "Aug", income: 78000, costs: 39000, net: 39000 },
          { month: "Sep", income: 78000, costs: 39000, net: 39000 },
          { month: "Oct", income: 78000, costs: 39000, net: 39000 },
          { month: "Nov", income: 78000, costs: 39000, net: 39000 },
          { month: "Dec", income: 78000, costs: 39000, net: 39000 },
        ],
      },
      {
        name: "Conservative", type: "conservative",
        kpis: [
          { label: "Gross Annual Revenue", value: "648000 GBP", trend: "down" },
          { label: "Annual Operating Costs", value: "421200 GBP", trend: "neutral" },
          { label: "Annual NOI", value: "226800 GBP", highlight: true },
          { label: "NI Yield on GDV", value: "2.84%", trend: "down" },
        ],
        monthly: [
          { month: "Jan", income: 45000, costs: 31000, net: 14000 },
          { month: "Feb", income: 45000, costs: 31000, net: 14000 },
          { month: "Mar", income: 48000, costs: 32000, net: 16000 },
          { month: "Apr", income: 51000, costs: 33500, net: 17500 },
          { month: "May", income: 54000, costs: 34000, net: 20000 },
          { month: "Jun", income: 60000, costs: 36000, net: 24000 },
          { month: "Jul", income: 63000, costs: 37000, net: 26000 },
          { month: "Aug", income: 63000, costs: 37000, net: 26000 },
          { month: "Sep", income: 57000, costs: 35000, net: 22000 },
          { month: "Oct", income: 54000, costs: 34000, net: 20000 },
          { month: "Nov", income: 48000, costs: 32000, net: 16000 },
          { month: "Dec", income: 60000, costs: 39700, net: 20300 },
        ],
      },
    ],
    baseKpis: [
      { label: "Gross Annual Revenue", value: "780000 GBP", trend: "neutral" },
      { label: "Annual NOI", value: "351000 GBP", highlight: true },
      { label: "NI Yield on GDV", value: "4.39%", trend: "neutral" },
      { label: "DSCR", value: "1.42x", sublabel: "At 4.5% senior debt" },
      { label: "Operating Margin", value: "45%", trend: "neutral" },
      { label: "Exit Cap Rate", value: "4.25-4.75%", sublabel: "Institutional exit" },
    ],
    assumptions: [
      { label: "Units", value: "50" },
      { label: "Average Monthly Rent", value: "1200 GBP" },
      { label: "Amenity Income", value: "60000 GBP/yr" },
      { label: "GDV", value: "8000000 GBP" },
      { label: "OpEx Ratio", value: "55%" },
      { label: "Senior Debt Rate", value: "4.5%" },
    ],
    sensitivityRows: [
      { variable: "Average Rent +/- 50 GBP/mo", base: "1200/mo", upside: "+30000/yr NOI", downside: "-30000/yr NOI" },
      { variable: "OpEx Ratio +/- 3%", base: "55%", upside: "+23400/yr NOI", downside: "-23400/yr NOI" },
      { variable: "Occupancy +/- 2%", base: "95%", upside: "+15600/yr NOI", downside: "-15600/yr NOI" },
      { variable: "Debt Rate +/- 0.5%", base: "4.5%", upside: "+56000/yr net", downside: "-56000/yr net" },
    ],
    forecastNote: "BTR income shows seasonality in lease-up phase but stabilises to near-flat after 18 months. Base assumes 24-month development, 12-month lease-up, then stabilised operations from Year 3.",
  },
  checklist: {
    phases: [
      {
        name: "Site Acquisition",
        tasks: [
          { label: "Planning pre-application with LPA", priority: "High", owner: "Planner", daysOffset: 0 },
          { label: "Financial appraisal and GDV analysis", priority: "High", owner: "Investor", daysOffset: 0 },
          { label: "Site acquisition and legal due diligence", priority: "High", owner: "Solicitor", daysOffset: 28 },
          { label: "Secure development finance commitment", priority: "High", owner: "Finance", daysOffset: 42 },
        ],
      },
      {
        name: "Planning",
        tasks: [
          { label: "Planning application submitted", priority: "High", owner: "Planner", daysOffset: 90 },
          { label: "S106 and affordable housing negotiations", priority: "High", owner: "Planner", daysOffset: 150 },
          { label: "Planning granted", priority: "High", owner: "LPA", daysOffset: 270 },
        ],
      },
      {
        name: "Construction",
        tasks: [
          { label: "Contractor appointed (design and build)", priority: "High", owner: "PM", daysOffset: 300 },
          { label: "Construction commencement", priority: "High", owner: "Contractor", daysOffset: 330 },
          { label: "Practical completion", priority: "High", owner: "Contractor", daysOffset: 730 },
          { label: "Building regs sign-off", priority: "High", owner: "BCO", daysOffset: 740 },
        ],
      },
      {
        name: "Lease-Up",
        tasks: [
          { label: "Property management platform selected", priority: "High", owner: "Investor", daysOffset: 600 },
          { label: "Marketing campaign launched", priority: "High", owner: "Manager", daysOffset: 700 },
          { label: "First tenants moved in", priority: "High", owner: "Manager", daysOffset: 750 },
          { label: "Reach 90% occupancy", priority: "High", owner: "Manager", daysOffset: 900 },
        ],
      },
    ],
    criticalPathItems: [
      "Planning permission before any works commence",
      "Building regs sign-off required for occupancy",
      "Fire Safety compliance for any building over 11 metres",
      "Senior debt facility must be secured before construction start",
    ],
  },
  risks: {
    overallRating: "Medium", totalExposureEstimate: "50000-500000 GBP/project",
    register: [
      { name: "Planning Refusal or Delay", category: "Regulatory", likelihood: "Possible", impact: "Severe", score: 12, mitigation: "Pre-application meetings, experienced planning consultant, phased approach", owner: "Planner" },
      { name: "Construction Cost Overrun", category: "Financial", likelihood: "Likely", impact: "High", score: 15, mitigation: "Fixed-price D+B contract, contingency 10-15%, independent monitoring surveyor", owner: "PM" },
      { name: "Interest Rate Rise During Build", category: "Financial", likelihood: "Possible", impact: "High", score: 9, mitigation: "Hedge rate on development facility, review cap options", owner: "Finance" },
      { name: "Slow Lease-Up", category: "Financial", likelihood: "Possible", impact: "Medium", score: 6, mitigation: "Pre-launch marketing, incentives (rent-free), flexible short-term lets", owner: "Manager" },
      { name: "Rental Market Softening", category: "Market", likelihood: "Possible", impact: "High", score: 9, mitigation: "Conservative rent assumptions, amenity differentiation, long-hold strategy", owner: "Investor" },
      { name: "Building Safety Act Compliance", category: "Regulatory", likelihood: "Low", impact: "Severe", score: 8, mitigation: "Dedicated safety case manager, specialist fire safety consultant", owner: "Safety Manager" },
    ],
    topByExposure: [
      { label: "Construction Cost Overrun", exposure: "500000-2000000 GBP", level: "High" },
      { label: "Planning Delay", exposure: "200000-800000 GBP finance cost", level: "High" },
      { label: "Slow Lease-Up", exposure: "50000-300000 GBP carrying cost", level: "Medium" },
    ],
    mitigationActions: [
      "Pre-application planning discussions before site purchase",
      "Fixed-price construction contract with completion guarantees",
      "Pre-launch waitlist marketing to accelerate lease-up",
      "DSCR stress test at 80% occupancy and +1% rate",
    ],
  },
  aiQuestions: {
    suggestedQuestions: [
      { question: "What is the viability of my BTR scheme at current construction costs?", category: "Viability", insight: "GDV analysis, construction cost benchmarks, NI yield at target completion" },
      { question: "What rent levels do I need to achieve a 4.5% NI yield?", category: "Pricing", insight: "Back-calculation from target yield through OpEx ratio to required rent per unit" },
      { question: "How do I model the lease-up period?", category: "Financial Modelling", insight: "Phased occupancy assumptions, incentive cost, carrying finance cost during ramp" },
      { question: "What is the exit market for BTR?", category: "Exit Strategy", insight: "Institutional buyer appetite, cap rate expectations, forward fund vs stabilised sale" },
      { question: "What OpEx ratio should I target?", category: "Operations", insight: "Industry benchmark OpEx ratios by scale, management model comparison, technology impact" },
    ],
    keyDrivers: ["Average Monthly Rent", "OpEx Ratio", "Stabilised Occupancy", "GDV", "Senior Debt Rate"],
    quickStats: [
      { label: "Typical OpEx Ratio", value: "50-65% of revenue" },
      { label: "Target DSCR", value: "1.35x minimum" },
      { label: "Lease-Up Period", value: "6-18 months" },
      { label: "Exit Cap Rate", value: "4.0-5.0%" },
    ],
    recommendations: [
      "Target sub-55% OpEx ratio from the outset - platform investment pays back at scale",
      "Model 12-month lease-up period with 3-month rent-free incentive budget",
      "DSCR stress test at 80% occupancy before committing to senior debt",
    ],
    confidenceScore: 71, confidenceLabel: "Good Confidence",
  },
  quickActions: [
    { label: "Start Planning Set", sub: "Build your BTR plan", icon: "Play", action: "start-planning" },
    { label: "Compare Profile", sub: "vs Commercial", icon: "BarChart2", action: "compare" },
    { label: "BTR Appraisal", sub: "GDV and NI yield model", icon: "Zap", action: "quick-scenario" },
    { label: "Download Pack", sub: "PDF profile guide", icon: "Download", action: "download" },
  ],
  pros: ["Institutional-grade income stream at scale", "Amenity income diversification", "Strong exit demand from institutional buyers", "Operating leverage improves with scale", "Long-term hold maximises compounding value"],
  cons: ["Very high capital requirement", "Long development and lease-up timeline", "Planning risk and complexity", "Interest rate sensitivity on large debt", "Specialist operational platform required"],
}

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE 10 — COMMERCIAL
// ─────────────────────────────────────────────────────────────────────────────
export const COMMERCIAL_CONFIG: ProfileConfig = {
  key: "commercial", slug: "commercial", name: "Commercial", number: 10,
  tagline: "Income-producing commercial assets with lease-backed revenue and WAULT analysis",
  description: "Office, retail or industrial properties let to business tenants on commercial leases. Lower management burden with lease-backed income, rent reviews and tenant covenant analysis.",
  icon: "Briefcase", accentColor: "#1D4ED8", bgColor: "#EFF6FF",
  group: "commercial", groupLabel: "Commercial Asset",
  tags: ["Commercial Lease", "WAULT", "Tenant Covenant", "Active Asset Management"],
  riskLevel: "Medium", managementIntensity: "Low", complianceIntensity: "Medium", capitalIntensity: "High",
  primaryMetric: { label: "Typical Yield", value: "6-11%", sublabel: "Passing rent on capital" },
  overviewKpis: [
    { label: "Typical Yield", value: "6-11%", sublabel: "Current passing rent", trend: "neutral" },
    { label: "WAULT", value: "3-7 years", sublabel: "Weighted avg unexpired lease", trend: "neutral" },
    { label: "Void Rate", value: "5-15%", sublabel: "Commercial market", trend: "neutral" },
    { label: "ERV Uplift", value: "5-20%", sublabel: "Review potential", trend: "up" },
  ],
  whoItSuits: ["Experienced investors", "Commercial property buyers", "Portfolio diversifiers", "SIPP and SSAS investors", "Investors seeking long leases and FRI"],
  idealAssets: [
    { icon: "Briefcase", label: "Retail Units", sub: "High street and local centres" },
    { icon: "Building", label: "Office Buildings", sub: "Regional and secondary" },
    { icon: "Landmark", label: "Light Industrial/Warehouse", sub: "Strong occupier demand" },
  ],
  advantages: ["Longer lease terms vs residential", "FRI leases pass repair costs to tenant", "Rent review uplifts", "Low day-to-day management", "Stronger income security with covenant analysis"],
  constraints: ["Capital intensive", "Void risk at lease expiry is severe", "ERV below passing rent if market falls", "Commercial lending more complex", "Asbestos and MEES compliance risk"],
  bestMarket: ["Established commercial locations", "Industrial and logistics corridors", "Town centre retail where void risk is managed", "Office markets with strong local employment"],
  riskPosture: [
    { label: "Lease Expiry Void", level: "High" },
    { label: "Tenant Covenant Failure", level: "Medium" },
    { label: "ERV Below Passing Rent", level: "Medium" },
    { label: "MEES Compliance", level: "Medium" },
  ],
  timeline: [
    { label: "Acquisition", sub: "Due diligence, WAULT analysis", duration: "6-12 weeks" },
    { label: "Legal and Finance", sub: "Commercial mortgage, solicitors", duration: "8-12 weeks" },
    { label: "Asset Review", sub: "Lease schedule, rent reviews", duration: "1-2 weeks" },
    { label: "First Income", sub: "Passing rent receipt", duration: "Month 1" },
    { label: "Rent Review / Regear", sub: "Active asset management", duration: "Ongoing" },
  ],
  modelSnapshot: {
    label: "Example Annual P&L - retail unit 450k at 7% yield",
    lines: [
      { label: "Passing Rent (annual)", value: "31500 GBP" },
      { label: "Less Commercial Mortgage", value: "-14400 GBP" },
      { label: "Less Management/Surveyors", value: "-2000 GBP" },
      { label: "Less Insurance and Service Charge", value: "-1500 GBP" },
      { label: "Net Annual Income", value: "13600 GBP", highlight: true },
      { label: "Gross Yield", value: "7.0%" },
      { label: "Net Yield", value: "3.0%" },
      { label: "WAULT", value: "5.5 years" },
    ],
  },
  incomeModel: {
    type: "Commercial Lease Passing Rent",
    kpis: [
      { label: "Annual Passing Rent", value: "31500 GBP", sublabel: "Contracted income", trend: "neutral" },
      { label: "Gross Yield", value: "7.0%", sublabel: "Passing rent on capital", trend: "neutral" },
      { label: "ERV", value: "33500 GBP/yr", sublabel: "Estimated rental value", trend: "up" },
      { label: "Reversionary Yield", value: "7.4%", sublabel: "ERV on capital", trend: "up" },
    ],
    structure: {
      label: "Commercial Income Calculation",
      description: "Annual passing rent from commercial lease minus finance costs, management and insurance",
      lines: [
        { label: "Annual Passing Rent", formula: "Contractual rent per lease", example: "31500 GBP/yr" },
        { label: "Less Commercial Mortgage", formula: "Monthly x 12", example: "14400 GBP/yr" },
        { label: "Less Management and Professional Fees", formula: "Annual surveyor and agent cost", example: "2000 GBP/yr" },
        { label: "Less Insurance", formula: "Buildings insurance annual", example: "1500 GBP/yr" },
        { label: "Net Annual Income", formula: "Sum above", example: "13600 GBP" },
      ],
    },
    assumptions: [
      { label: "Purchase Price", default: "450000 GBP", range: "100000-5000000+ GBP" },
      { label: "Passing Yield", default: "7.0%", range: "5-11%" },
      { label: "WAULT", default: "5.5 years", range: "1-20 years" },
      { label: "ERV vs Passing", default: "106%", range: "90-120%" },
      { label: "Mortgage LTV", default: "60%", range: "50-70%" },
      { label: "Commercial Mortgage Rate", default: "5.5%", range: "4-7%" },
    ],
    exampleCalc: {
      inputs: [
        { label: "Purchase Price", value: "450000 GBP" },
        { label: "Annual Passing Rent", value: "31500 GBP (7.0% yield)" },
        { label: "Mortgage (60% LTV at 5.5%)", value: "270000 GBP" },
      ],
      outputs: [
        { label: "Annual Passing Rent", value: "31500 GBP" },
        { label: "Less Mortgage Annual", value: "-14850 GBP" },
        { label: "Less Management/Professional", value: "-2000 GBP" },
        { label: "Less Insurance", value: "-1500 GBP" },
        { label: "Net Annual Income", value: "13150 GBP", highlight: true },
        { label: "Gross Yield", value: "7.0%" },
        { label: "Net Yield", value: "2.9%" },
        { label: "WAULT", value: "5.5 years" },
      ],
    },
    sensitivityNote: "Commercial income is lease-secured but rent review clause type determines upside. Upward-only RPI-linked reviews protect and grow income. Open market reviews can go down in soft markets.",
    benchmarkRanges: [
      { label: "Gross Yield (retail)", low: "7%", mid: "9%", high: "12%" },
      { label: "Gross Yield (office)", low: "6%", mid: "7.5%", high: "10%" },
      { label: "WAULT", low: "2 years", mid: "5 years", high: "10+ years" },
    ],
  },
  costDrivers: {
    kpis: [
      { label: "Commercial Mortgage", value: "5-7% pa", sublabel: "Dominant cost", trend: "up" },
      { label: "Professional Fees", value: "1500-4000 GBP/yr", sublabel: "Surveyor and agent", trend: "neutral" },
      { label: "Insurance", value: "0.2-0.4% of capital", sublabel: "Buildings and liability", trend: "neutral" },
      { label: "Compliance Costs", value: "500-2000 GBP/yr", sublabel: "Asbestos, fire, MEES", trend: "neutral" },
    ],
    categories: [
      {
        name: "Finance",
        items: [
          { label: "Commercial Mortgage", typical: "5-7% pa on drawn", frequency: "Monthly", type: "variable" },
          { label: "Arrangement Fee", typical: "1-2% of loan", frequency: "On drawdown", type: "fixed" },
        ],
      },
      {
        name: "Professional Fees",
        items: [
          { label: "Managing Agent/Surveyor", typical: "8-12% of rent pa", frequency: "Annual", type: "percentage" },
          { label: "Rent Review Surveyor", typical: "10-15% of uplift achieved", frequency: "On review", type: "variable" },
          { label: "Lease Renewal Legal Fees", typical: "1500-5000 GBP", frequency: "On renewal", type: "fixed" },
        ],
      },
      {
        name: "Insurance",
        items: [
          { label: "Buildings Insurance (commercial)", typical: "0.2-0.4% of reinstatement/yr", frequency: "Annual", type: "fixed" },
          { label: "Public Liability", typical: "Included in above", frequency: "Annual", type: "fixed" },
        ],
      },
      {
        name: "Compliance",
        items: [
          { label: "Asbestos Management Survey", typical: "300-600 GBP", frequency: "On purchase, 5-yearly", type: "fixed" },
          { label: "Fire Risk Assessment", typical: "300-600 GBP", frequency: "Annual review", type: "fixed" },
          { label: "EPC (MEES min E)", typical: "150-300 GBP", frequency: "On let/10-yearly", type: "fixed" },
          { label: "Legionella Assessment", typical: "100-300 GBP", frequency: "Periodically", type: "fixed" },
        ],
      },
    ],
    sensitivityNote: "Commercial net yield is eroded by mortgage cost and void risk at lease expiry. WAULT is the key risk metric - short WAULT means lease expiry and potential full void is imminent.",
    costControlTips: [
      "FRI lease structure means tenant pays repairs - verify in lease",
      "Regear leases before expiry to extend WAULT and protect income",
      "Annual service charge reconciliation - recover legitimate costs from tenants",
      "MEES compliance investment protects against future void",
    ],
  },
  compliance: {
    score: 65, scoreLabel: "Moderate", criticalCount: 4,
    requirements: [
      { area: "Safety", item: "Asbestos Management Survey", priority: "High", required: true, renewal: "On purchase, 5-yearly", estimatedCost: "300-600 GBP", riskIfMissing: "Health liability, criminal offence" },
      { area: "Safety", item: "Fire Risk Assessment", priority: "High", required: true, renewal: "Annual review", estimatedCost: "300-600 GBP", riskIfMissing: "Prosecution, injury liability" },
      { area: "Energy", item: "EPC (MEES min E from 2023)", priority: "High", required: true, renewal: "On let/10-yearly", estimatedCost: "150-300 GBP", riskIfMissing: "Cannot let commercially" },
      { area: "Health", item: "Legionella Risk Assessment", priority: "Medium", required: true, renewal: "Every 2 years", estimatedCost: "100-300 GBP", riskIfMissing: "Health liability" },
      { area: "Safety", item: "Electrical Testing (EICR equivalent)", priority: "Medium", required: true, renewal: "5-yearly", estimatedCost: "200-500 GBP", riskIfMissing: "Safety liability" },
      { area: "Planning", item: "Planning Use Class Compliance", priority: "High", required: true, renewal: "On change of use", estimatedCost: "Planning fee if needed", riskIfMissing: "Enforcement notice" },
    ],
    upcomingDeadlines: [
      { label: "MEES EPC compliance review", due: "Before any new or renewal lease", priority: "High" },
      { label: "Fire Risk Assessment review", due: "Annual", priority: "High" },
      { label: "Asbestos management plan review", due: "5-yearly", priority: "Medium" },
    ],
    requiredDocs: ["Commercial Lease (FRI terms)", "EPC Certificate", "Asbestos Management Survey", "Fire Risk Assessment", "Buildings Insurance Policy", "Title Register", "Planning Use Class Certificate"],
    aiInsight: "Commercial compliance is less intensive than HMO but MEES EPC requirements are escalating. From 2023, commercial properties must have EPC E minimum. Government proposals to require EPC B by 2030 could force capital investment in poorer-rated properties.",
  },
  forecast: {
    scenarios: [
      {
        name: "Base Case", type: "base",
        kpis: [
          { label: "Annual Passing Rent", value: "31500 GBP", trend: "neutral" },
          { label: "Annual Costs", value: "18350 GBP", trend: "neutral" },
          { label: "Net Annual Income", value: "13150 GBP", highlight: true },
          { label: "Net Yield", value: "2.9%", trend: "neutral" },
        ],
        monthly: [
          { month: "Jan", income: 2625, costs: 1529, net: 1096 },
          { month: "Feb", income: 2625, costs: 1529, net: 1096 },
          { month: "Mar", income: 2625, costs: 1529, net: 1096 },
          { month: "Apr", income: 2625, costs: 1529, net: 1096 },
          { month: "May", income: 2625, costs: 1529, net: 1096 },
          { month: "Jun", income: 2625, costs: 1529, net: 1096 },
          { month: "Jul", income: 2625, costs: 1529, net: 1096 },
          { month: "Aug", income: 2625, costs: 1529, net: 1096 },
          { month: "Sep", income: 2625, costs: 1529, net: 1096 },
          { month: "Oct", income: 2625, costs: 1529, net: 1096 },
          { month: "Nov", income: 2625, costs: 1529, net: 1096 },
          { month: "Dec", income: 2625, costs: 1529, net: 1096 },
        ],
      },
      {
        name: "Optimistic", type: "optimistic",
        kpis: [
          { label: "Annual Passing Rent (post review)", value: "36000 GBP", trend: "up" },
          { label: "Annual Costs", value: "17700 GBP", trend: "down" },
          { label: "Net Annual Income", value: "18300 GBP", highlight: true },
          { label: "Net Yield", value: "4.07%", trend: "up" },
        ],
        monthly: [
          { month: "Jan", income: 3000, costs: 1475, net: 1525 },
          { month: "Feb", income: 3000, costs: 1475, net: 1525 },
          { month: "Mar", income: 3000, costs: 1475, net: 1525 },
          { month: "Apr", income: 3000, costs: 1475, net: 1525 },
          { month: "May", income: 3000, costs: 1475, net: 1525 },
          { month: "Jun", income: 3000, costs: 1475, net: 1525 },
          { month: "Jul", income: 3000, costs: 1475, net: 1525 },
          { month: "Aug", income: 3000, costs: 1475, net: 1525 },
          { month: "Sep", income: 3000, costs: 1475, net: 1525 },
          { month: "Oct", income: 3000, costs: 1475, net: 1525 },
          { month: "Nov", income: 3000, costs: 1475, net: 1525 },
          { month: "Dec", income: 3000, costs: 1475, net: 1525 },
        ],
      },
      {
        name: "Conservative", type: "conservative",
        kpis: [
          { label: "Annual Rent (with void at expiry)", value: "23625 GBP", trend: "down" },
          { label: "Annual Costs", value: "20900 GBP", trend: "up" },
          { label: "Net Annual Income", value: "2725 GBP", highlight: true },
          { label: "Net Yield", value: "0.6%", trend: "down" },
        ],
        monthly: [
          { month: "Jan", income: 2625, costs: 1529, net: 1096 },
          { month: "Feb", income: 2625, costs: 1529, net: 1096 },
          { month: "Mar", income: 2625, costs: 1529, net: 1096 },
          { month: "Apr", income: 2625, costs: 1529, net: 1096 },
          { month: "May", income: 2625, costs: 1529, net: 1096 },
          { month: "Jun", income: 2625, costs: 1529, net: 1096 },
          { month: "Jul", income: 0, costs: 1900, net: -1900 },
          { month: "Aug", income: 0, costs: 1900, net: -1900 },
          { month: "Sep", income: 0, costs: 1900, net: -1900 },
          { month: "Oct", income: 2625, costs: 1529, net: 1096 },
          { month: "Nov", income: 2625, costs: 1529, net: 1096 },
          { month: "Dec", income: 2625, costs: 1529, net: 1096 },
        ],
      },
    ],
    baseKpis: [
      { label: "Annual Passing Rent", value: "31500 GBP", trend: "neutral" },
      { label: "Annual Costs", value: "18350 GBP", trend: "neutral" },
      { label: "Net Annual Income", value: "13150 GBP", highlight: true },
      { label: "Gross Yield", value: "7.0%", trend: "neutral" },
      { label: "Net Yield", value: "2.9%", trend: "neutral" },
      { label: "WAULT", value: "5.5 years", sublabel: "Key income security metric" },
    ],
    assumptions: [
      { label: "Purchase Price", value: "450000 GBP" },
      { label: "Passing Rent", value: "31500 GBP/yr" },
      { label: "Mortgage LTV", value: "60%" },
      { label: "Mortgage Rate", value: "5.5%" },
      { label: "WAULT", value: "5.5 years" },
      { label: "Tenant Covenant", value: "Good (SME with 5yr+ trading)" },
    ],
    sensitivityRows: [
      { variable: "Rent Review +/- 5%", base: "31500/yr", upside: "+1575/yr", downside: "-1575/yr" },
      { variable: "Void at Expiry +/- 3 months", base: "0 months void", upside: "No void", downside: "-7875 GBP" },
      { variable: "Mortgage Rate +/- 0.5%", base: "5.5%", upside: "+810/yr", downside: "-810/yr" },
      { variable: "ERV vs Passing +/- 10%", base: "106% ERV", upside: "Strong review upside", downside: "Open market review risk" },
    ],
    forecastNote: "Commercial income is flat and lease-secured but has a cliff edge at lease expiry. WAULT is the key metric to watch. Conservative scenario models 3-month void at lease break/expiry in month 7.",
  },
  checklist: {
    phases: [
      {
        name: "Due Diligence",
        tasks: [
          { label: "Review lease schedule and WAULT calculation", priority: "High", owner: "Surveyor", daysOffset: 0 },
          { label: "Tenant covenant strength assessment", priority: "High", owner: "Surveyor", daysOffset: 7 },
          { label: "ERV vs passing rent analysis", priority: "High", owner: "Surveyor", daysOffset: 7 },
          { label: "Asbestos survey commissioned", priority: "High", owner: "Assessor", daysOffset: 14 },
          { label: "EPC rating checked (MEES compliance)", priority: "High", owner: "Investor", daysOffset: 7 },
          { label: "Break clause dates identified", priority: "High", owner: "Solicitor", daysOffset: 7 },
        ],
      },
      {
        name: "Acquisition",
        tasks: [
          { label: "Commercial mortgage application", priority: "High", owner: "Broker", daysOffset: 21 },
          { label: "Legal searches and title review", priority: "High", owner: "Solicitor", daysOffset: 21 },
          { label: "Service charge review and reconciliation", priority: "Medium", owner: "Solicitor", daysOffset: 21 },
          { label: "Exchange and completion", priority: "High", owner: "Solicitor", daysOffset: 56 },
        ],
      },
      {
        name: "Post-Purchase",
        tasks: [
          { label: "Fire risk assessment commissioned", priority: "High", owner: "Assessor", daysOffset: 63 },
          { label: "Buildings insurance arranged", priority: "High", owner: "Investor", daysOffset: 56 },
          { label: "Managing agent appointed (if applicable)", priority: "Medium", owner: "Investor", daysOffset: 63 },
          { label: "Rent review diary created", priority: "High", owner: "Surveyor", daysOffset: 63 },
        ],
      },
      {
        name: "Asset Management",
        tasks: [
          { label: "Prepare for rent review (3 months before)", priority: "High", owner: "Surveyor", daysOffset: 540 },
          { label: "Regear discussion with tenant", priority: "Medium", owner: "Surveyor", daysOffset: 365 },
          { label: "MEES compliance review", priority: "High", owner: "Surveyor", daysOffset: 365 },
        ],
      },
    ],
    criticalPathItems: [
      "Review break clause dates - short WAULT creates immediate void risk",
      "EPC must meet MEES minimum E before any new lease",
      "Asbestos survey before any works on older buildings",
      "Tenant covenant analysis is critical for income security",
    ],
  },
  risks: {
    overallRating: "Medium", totalExposureEstimate: "5000-30000 GBP/year",
    register: [
      { name: "Void at Lease Expiry", category: "Financial", likelihood: "Possible", impact: "High", score: 9, mitigation: "Early regear discussions, lease extension incentives, strong WAULT management", owner: "Surveyor" },
      { name: "Tenant Insolvency", category: "Financial", likelihood: "Low", impact: "Severe", score: 8, mitigation: "Covenant analysis, rent guarantees, personal guarantees for SME tenants", owner: "Solicitor" },
      { name: "MEES Compliance Cost", category: "Regulatory", likelihood: "Possible", impact: "Medium", score: 6, mitigation: "EPC assessment and improvement plan, factor into acquisition price", owner: "Investor" },
      { name: "Market Rent Decline", category: "Market", likelihood: "Possible", impact: "High", score: 9, mitigation: "Upward-only rent review clause, diversified tenant base, location quality", owner: "Investor" },
      { name: "Planning Change/Permitted Use", category: "Regulatory", likelihood: "Low", impact: "High", score: 8, mitigation: "Broad use class, planning advice before purchase", owner: "Planner" },
      { name: "Asbestos Discovery", category: "Operational", likelihood: "Possible", impact: "Medium", score: 6, mitigation: "Pre-purchase asbestos survey, management plan, refurb contingency", owner: "Contractor" },
    ],
    topByExposure: [
      { label: "Void at Lease Expiry", exposure: "31500 GBP+ per void year", level: "High" },
      { label: "Tenant Insolvency", exposure: "Full rent loss plus re-letting cost", level: "High" },
      { label: "MEES Upgrade Cost", exposure: "5000-30000 GBP one-off", level: "Medium" },
    ],
    mitigationActions: [
      "Begin regear discussions minimum 18 months before lease expiry",
      "Credit check all commercial tenants and obtain personal guarantee",
      "EPC improvement plan for all sub-E rated properties",
      "Upward-only rent review clause in all new leases",
    ],
  },
  aiQuestions: {
    suggestedQuestions: [
      { question: "What is the tenant covenant quality on this property?", category: "Risk", insight: "Tenant financial health analysis, credit rating, sector exposure, multi-site operator vs single site" },
      { question: "What is the ERV vs passing rent and what does that mean for rent review?", category: "Asset Management", insight: "Open market rent review direction, upward-only vs RPI clause implications, review date timing" },
      { question: "How do I calculate WAULT?", category: "Analysis", insight: "WAULT calculation methodology, break clause impact, weighted vs simple WAULT comparison" },
      { question: "What MEES improvements will I need to make?", category: "Compliance", insight: "EPC improvement cost vs energy cost, compliance timeline, impact on rental income" },
      { question: "What is the exit yield for this property type?", category: "Exit Strategy", insight: "Commercial exit cap rates by sector and location, institutional appetite, reversionary yield analysis" },
    ],
    keyDrivers: ["WAULT", "Tenant Covenant", "Passing vs ERV", "Mortgage Rate", "Exit Cap Rate"],
    quickStats: [
      { label: "Typical Commercial LTV", value: "60-65%" },
      { label: "Commercial Mortgage Rate", value: "5-7% pa" },
      { label: "MEES Minimum (2023)", value: "EPC E (B by 2030 proposed)" },
      { label: "Typical WAULT Target", value: "5+ years at acquisition" },
    ],
    recommendations: [
      "Never acquire commercial with WAULT under 3 years without pricing in void risk",
      "Request personal guarantee from SME tenants on new leases",
      "Factor MEES improvement cost into acquisition price for sub-C rated properties",
    ],
    confidenceScore: 76, confidenceLabel: "Good Confidence",
  },
  quickActions: [
    { label: "Start Planning Set", sub: "Build your commercial plan", icon: "Play", action: "start-planning" },
    { label: "Compare Profile", sub: "vs Mixed Use", icon: "BarChart2", action: "compare" },
    { label: "WAULT Calculator", sub: "Lease expiry analysis", icon: "Zap", action: "quick-scenario" },
    { label: "Download Pack", sub: "PDF profile guide", icon: "Download", action: "download" },
  ],
  pros: ["Longer lease terms provide income security", "FRI leases pass repairs to tenant", "Low day-to-day management burden", "Rent review uplifts protect against inflation", "Strong income security with quality covenant"],
  cons: ["Void at lease expiry can be severe and prolonged", "Capital intensive with commercial LTV constraints", "MEES compliance creating forced investment", "Market rent risk on open market reviews", "Tenant insolvency creates full income loss"],
}

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE 11 — MIXED USE
// ─────────────────────────────────────────────────────────────────────────────
export const MIXED_USE_CONFIG: ProfileConfig = {
  key: "mixed_use", slug: "mixed-use", name: "Mixed Use", number: 11,
  tagline: "Blended residential and commercial income streams in a single asset",
  description: "Properties combining residential flats above commercial units. Diversified income from a single asset with planning use class requirements and mixed lease management.",
  icon: "LayoutGrid", accentColor: "#9333EA", bgColor: "#FAF5FF",
  group: "commercial", groupLabel: "Mixed Residential and Commercial",
  tags: ["Mixed Residential", "Commercial Unit", "Diversified Income", "Urban Asset"],
  riskLevel: "Medium", managementIntensity: "Medium", complianceIntensity: "High", capitalIntensity: "High",
  primaryMetric: { label: "Blended Yield", value: "6.25-7.75%", sublabel: "Combined income stream" },
  overviewKpis: [
    { label: "Blended Yield", value: "6.25-7.75%", sublabel: "Residential and commercial", trend: "neutral" },
    { label: "Commercial Yield", value: "7-11%", sublabel: "Ground floor", trend: "neutral" },
    { label: "Residential Yield", value: "4-7%", sublabel: "Upper floors", trend: "neutral" },
    { label: "Income Resilience", value: "High", sublabel: "Dual income stream", trend: "up" },
  ],
  whoItSuits: ["Experienced investors", "Commercial property buyers with residential exposure", "Portfolio diversifiers", "Urban asset investors", "Investors seeking income resilience"],
  idealAssets: [
    { icon: "LayoutGrid", label: "High Street Unit with Flats", sub: "Retail plus residential above" },
    { icon: "Building", label: "Office plus Residential", sub: "Mixed professional occupiers" },
    { icon: "Landmark", label: "Converted Warehouse", sub: "Mixed-use conversion" },
  ],
  advantages: ["Dual income stream from single asset", "Commercial void partially offset by residential income", "Potential value-add through conversion or extension", "Income resilience vs pure commercial", "Urban regeneration capital uplift potential"],
  constraints: ["Complex valuations and specialist lending", "Dual lease management required", "Building safety for mixed-use occupancy", "Service charge apportionment complexity", "Planning use class restrictions"],
  bestMarket: ["Secondary high streets with residential demand", "Town centres with mixed-use zones", "Urban regeneration areas", "Locations with strong residential demand above commercial"],
  riskPosture: [
    { label: "Commercial Void Risk", level: "High" },
    { label: "Valuation Complexity", level: "Medium" },
    { label: "Building Safety", level: "Medium" },
    { label: "Lending Restriction", level: "Medium" },
  ],
  timeline: [
    { label: "Due Diligence", sub: "Dual tenure analysis, planning check", duration: "6-10 weeks" },
    { label: "Finance", sub: "Specialist mixed-use mortgage", duration: "6-10 weeks" },
    { label: "Legal", sub: "Separate leases for each element", duration: "6-8 weeks" },
    { label: "Management Setup", sub: "Separate lease admin", duration: "2-4 weeks" },
    { label: "Ongoing", sub: "Dual income management", duration: "Ongoing" },
  ],
  modelSnapshot: {
    label: "Example Annual P&L - high street unit with 2 flats above, 550k",
    lines: [
      { label: "Commercial Ground Rent (annual)", value: "26000 GBP" },
      { label: "Residential Flat 1 (950/mo)", value: "11400 GBP" },
      { label: "Residential Flat 2 (900/mo)", value: "10800 GBP" },
      { label: "Total Income", value: "48200 GBP" },
      { label: "Less Finance and Costs", value: "-29800 GBP" },
      { label: "Net Annual Income", value: "18400 GBP", highlight: true },
      { label: "Blended Gross Yield", value: "8.76%" },
      { label: "Net Yield", value: "3.35%" },
    ],
  },
  incomeModel: {
    type: "Blended Commercial and Residential Rent",
    kpis: [
      { label: "Total Annual Income", value: "48200 GBP", sublabel: "Commercial plus residential", trend: "neutral" },
      { label: "Blended Gross Yield", value: "8.76%", sublabel: "On 550k purchase", trend: "neutral" },
      { label: "Income Resilience", value: "High", sublabel: "Dual stream diversification", trend: "up" },
      { label: "Net Annual Income", value: "18400 GBP", sublabel: "After all costs", trend: "neutral" },
    ],
    structure: {
      label: "Mixed Use Income Calculation",
      description: "Commercial lease income plus residential rent minus apportioned finance and costs",
      lines: [
        { label: "Commercial Passing Rent", formula: "Annual lease contracted", example: "26000 GBP/yr" },
        { label: "Residential Flat Rent", formula: "Monthly x 12 x flat count", example: "950 + 900 x 12 = 22200 GBP" },
        { label: "Total Gross Income", formula: "Commercial plus residential", example: "48200 GBP" },
        { label: "Less Finance Cost", formula: "Mixed-use mortgage annual", example: "20000 GBP" },
        { label: "Less Management and Insurance", formula: "Annual costs", example: "9800 GBP" },
        { label: "Net Annual Income", formula: "Sum above", example: "18400 GBP" },
      ],
    },
    assumptions: [
      { label: "Purchase Price", default: "550000 GBP", range: "200000-2000000 GBP" },
      { label: "Commercial Rent Yield", default: "4.7%", range: "4-8%" },
      { label: "Residential Flats", default: "2 flats", range: "1-6 flats" },
      { label: "Residential Monthly Rent", default: "925 GBP/mo avg", range: "600-1500 GBP/mo" },
      { label: "Mixed-Use Mortgage LTV", default: "65%", range: "55-70%" },
      { label: "Mortgage Rate", default: "5.5%", range: "4.5-7%" },
    ],
    exampleCalc: {
      inputs: [
        { label: "Purchase Price", value: "550000 GBP" },
        { label: "Commercial Rent", value: "26000 GBP/yr" },
        { label: "2 Residential Flats", value: "22200 GBP/yr" },
        { label: "Mortgage (65% LTV at 5.5%)", value: "357500 GBP" },
      ],
      outputs: [
        { label: "Total Annual Income", value: "48200 GBP" },
        { label: "Less Mortgage Annual", value: "-19663 GBP" },
        { label: "Less Management/Agent", value: "-4820 GBP" },
        { label: "Less Insurance and Rates", value: "-2500 GBP" },
        { label: "Less Maintenance Reserve", value: "-2817 GBP" },
        { label: "Net Annual Income", value: "18400 GBP", highlight: true },
        { label: "Blended Gross Yield", value: "8.76%" },
        { label: "Net Yield", value: "3.35%" },
      ],
    },
    sensitivityNote: "Mixed use blended yield is resilient because commercial void is partially offset by residential income. Loss of commercial tenant reduces income by 54% but residential income continues.",
    benchmarkRanges: [
      { label: "Blended Yield", low: "6%", mid: "7%", high: "9%" },
      { label: "Commercial Yield Component", low: "6%", mid: "8%", high: "11%" },
      { label: "Residential Yield Component", low: "4%", mid: "5.5%", high: "7%" },
    ],
  },
  costDrivers: {
    kpis: [
      { label: "Mixed-Use Mortgage", value: "5-7% pa", sublabel: "Specialist product", trend: "up" },
      { label: "Annual Management", value: "8-12% of rent", sublabel: "Dual tenure", trend: "neutral" },
      { label: "Service Charge Costs", value: "1500-4000 GBP/yr", sublabel: "Apportioned to tenants", trend: "neutral" },
      { label: "Annual Insurance", value: "800-1800 GBP/yr", sublabel: "Block buildings", trend: "neutral" },
    ],
    categories: [
      {
        name: "Finance",
        items: [
          { label: "Mixed-Use Mortgage", typical: "5-7% pa on drawn", frequency: "Monthly", type: "variable" },
          { label: "Arrangement Fee", typical: "1.5-2% of loan", frequency: "On drawdown", type: "fixed" },
        ],
      },
      {
        name: "Management",
        items: [
          { label: "Commercial Management/Surveyor", typical: "8-12% of commercial rent", frequency: "Annual", type: "percentage" },
          { label: "Residential Letting Agent", typical: "8-12% of residential rent", frequency: "Monthly", type: "percentage" },
        ],
      },
      {
        name: "Insurance",
        items: [
          { label: "Block Buildings Insurance", typical: "800-1800 GBP/yr", frequency: "Annual", type: "fixed" },
          { label: "Property Owners Liability", typical: "Included in above", frequency: "Annual", type: "fixed" },
        ],
      },
      {
        name: "Compliance",
        items: [
          { label: "Gas Safety (residential units)", typical: "70-90 GBP/unit/yr", frequency: "Annual", type: "fixed" },
          { label: "EICR (residential units)", typical: "150-250 GBP/unit", frequency: "5-yearly", type: "fixed" },
          { label: "Fire Risk Assessment (building)", typical: "400-800 GBP", frequency: "Annual review", type: "fixed" },
          { label: "EPC (commercial unit)", typical: "150-300 GBP", frequency: "On let", type: "fixed" },
          { label: "EPC (residential units)", typical: "80-120 GBP/unit", frequency: "10-yearly", type: "fixed" },
        ],
      },
    ],
    sensitivityNote: "Finance cost on mixed-use is typically 5-7% on the full loan. Net yield can be thin at high LTV. Income resilience is the key benefit over pure commercial.",
    costControlTips: [
      "Recover service charge costs from commercial tenant via FRI or service charge",
      "Use single managing agent for both commercial and residential where possible",
      "Block insurance reduces cost vs individual policies",
      "Annual compliance audit covers all elements in one visit",
    ],
  },
  compliance: {
    score: 60, scoreLabel: "Moderate-High", criticalCount: 6,
    requirements: [
      { area: "Safety", item: "Fire Risk Assessment (whole building)", priority: "High", required: true, renewal: "Annual review", estimatedCost: "400-800 GBP", riskIfMissing: "Prosecution, injury liability" },
      { area: "Safety", item: "Gas Safety (per residential unit)", priority: "High", required: true, renewal: "Annual per unit", estimatedCost: "70-90 GBP/unit", riskIfMissing: "Criminal prosecution" },
      { area: "Safety", item: "EICR (per residential unit)", priority: "High", required: true, renewal: "5-yearly", estimatedCost: "150-250 GBP/unit", riskIfMissing: "30000 GBP fine per unit" },
      { area: "Energy", item: "EPC (residential units, min E)", priority: "High", required: true, renewal: "On let", estimatedCost: "80-120 GBP/unit", riskIfMissing: "Cannot let" },
      { area: "Energy", item: "EPC (commercial unit, MEES min E)", priority: "High", required: true, renewal: "On let", estimatedCost: "150-300 GBP", riskIfMissing: "Cannot let commercially" },
      { area: "Planning", item: "Planning Use Class Compliance", priority: "High", required: true, renewal: "On change", estimatedCost: "Planning fee if needed", riskIfMissing: "Enforcement notice" },
      { area: "Safety", item: "Building Safety (fire separation commercial/residential)", priority: "High", required: true, renewal: "Ongoing", estimatedCost: "Variable", riskIfMissing: "Prosecution, evacuation" },
    ],
    upcomingDeadlines: [
      { label: "Annual gas safety (residential units)", due: "Annual", priority: "High" },
      { label: "Fire Risk Assessment review", due: "Annual", priority: "High" },
      { label: "MEES compliance review (commercial)", due: "Before lease renewal", priority: "High" },
    ],
    requiredDocs: ["Commercial Lease", "Residential ASTs", "Gas Safety Certs (residential)", "EICR Reports (residential)", "EPC (all units)", "Fire Risk Assessment", "Block Buildings Insurance", "Planning Use Class Evidence"],
    aiInsight: "Mixed use compliance requires managing residential and commercial obligations simultaneously. The fire separation between commercial and residential elements is critical - commercial kitchens and late-night uses create fire risk for residential occupiers above.",
  },
  forecast: {
    scenarios: [
      {
        name: "Base Case", type: "base",
        kpis: [
          { label: "Annual Total Income", value: "48200 GBP", trend: "neutral" },
          { label: "Annual Costs", value: "29800 GBP", trend: "neutral" },
          { label: "Net Annual Income", value: "18400 GBP", highlight: true },
          { label: "Blended Net Yield", value: "3.35%", trend: "neutral" },
        ],
        monthly: [
          { month: "Jan", income: 4017, costs: 2483, net: 1534 },
          { month: "Feb", income: 4017, costs: 2483, net: 1534 },
          { month: "Mar", income: 4017, costs: 2483, net: 1534 },
          { month: "Apr", income: 4017, costs: 2483, net: 1534 },
          { month: "May", income: 4017, costs: 2483, net: 1534 },
          { month: "Jun", income: 4017, costs: 2483, net: 1534 },
          { month: "Jul", income: 4017, costs: 2483, net: 1534 },
          { month: "Aug", income: 4017, costs: 2483, net: 1534 },
          { month: "Sep", income: 4017, costs: 2483, net: 1534 },
          { month: "Oct", income: 4017, costs: 2483, net: 1534 },
          { month: "Nov", income: 4017, costs: 2483, net: 1534 },
          { month: "Dec", income: 4017, costs: 2483, net: 1534 },
        ],
      },
      {
        name: "Optimistic", type: "optimistic",
        kpis: [
          { label: "Annual Total Income", value: "56400 GBP", trend: "up" },
          { label: "Annual Costs", value: "28800 GBP", trend: "down" },
          { label: "Net Annual Income", value: "27600 GBP", highlight: true },
          { label: "Blended Net Yield", value: "5.0%", trend: "up" },
        ],
        monthly: [
          { month: "Jan", income: 4700, costs: 2400, net: 2300 },
          { month: "Feb", income: 4700, costs: 2400, net: 2300 },
          { month: "Mar", income: 4700, costs: 2400, net: 2300 },
          { month: "Apr", income: 4700, costs: 2400, net: 2300 },
          { month: "May", income: 4700, costs: 2400, net: 2300 },
          { month: "Jun", income: 4700, costs: 2400, net: 2300 },
          { month: "Jul", income: 4700, costs: 2400, net: 2300 },
          { month: "Aug", income: 4700, costs: 2400, net: 2300 },
          { month: "Sep", income: 4700, costs: 2400, net: 2300 },
          { month: "Oct", income: 4700, costs: 2400, net: 2300 },
          { month: "Nov", income: 4700, costs: 2400, net: 2300 },
          { month: "Dec", income: 4700, costs: 2400, net: 2300 },
        ],
      },
      {
        name: "Conservative", type: "conservative",
        kpis: [
          { label: "Annual Total Income (commercial void 3 mo)", value: "35700 GBP", trend: "down" },
          { label: "Annual Costs", value: "31200 GBP", trend: "up" },
          { label: "Net Annual Income", value: "4500 GBP", highlight: true },
          { label: "Blended Net Yield", value: "0.8%", trend: "down" },
        ],
        monthly: [
          { month: "Jan", income: 1850, costs: 2600, net: -750 },
          { month: "Feb", income: 1850, costs: 2600, net: -750 },
          { month: "Mar", income: 1850, costs: 2600, net: -750 },
          { month: "Apr", income: 4017, costs: 2483, net: 1534 },
          { month: "May", income: 4017, costs: 2483, net: 1534 },
          { month: "Jun", income: 4017, costs: 2483, net: 1534 },
          { month: "Jul", income: 4017, costs: 2483, net: 1534 },
          { month: "Aug", income: 4017, costs: 2483, net: 1534 },
          { month: "Sep", income: 4017, costs: 2483, net: 1534 },
          { month: "Oct", income: 4017, costs: 2483, net: 1534 },
          { month: "Nov", income: 4017, costs: 2483, net: 1534 },
          { month: "Dec", income: 4017, costs: 2483, net: 1534 },
        ],
      },
    ],
    baseKpis: [
      { label: "Annual Total Income", value: "48200 GBP", trend: "neutral" },
      { label: "Annual Costs", value: "29800 GBP", trend: "neutral" },
      { label: "Net Annual Income", value: "18400 GBP", highlight: true },
      { label: "Blended Gross Yield", value: "8.76%", trend: "neutral" },
      { label: "Net Yield", value: "3.35%", trend: "neutral" },
      { label: "Income Resilience", value: "54% if commercial void", sublabel: "Residential income continues" },
    ],
    assumptions: [
      { label: "Purchase Price", value: "550000 GBP" },
      { label: "Commercial Rent", value: "26000 GBP/yr" },
      { label: "Residential Rent Total", value: "22200 GBP/yr" },
      { label: "Mortgage LTV", value: "65%" },
      { label: "Mortgage Rate", value: "5.5%" },
      { label: "WAULT (commercial)", value: "4.5 years" },
    ],
    sensitivityRows: [
      { variable: "Commercial void +/- 3 months", base: "Full occupancy", upside: "+6500/yr", downside: "-6500/yr" },
      { variable: "Commercial rent review +/- 5%", base: "26000/yr", upside: "+1300/yr", downside: "-1300/yr" },
      { variable: "Residential rent +/- 50/mo", base: "925/mo avg", upside: "+1200/yr", downside: "-1200/yr" },
      { variable: "Mortgage rate +/- 0.5%", base: "5.5%", upside: "+892/yr", downside: "-892/yr" },
    ],
    forecastNote: "Base is perfectly flat as both income streams are lease-secured. Conservative models 3-month commercial void in months 1-3. Residential income continues throughout providing partial income floor.",
  },
  checklist: {
    phases: [
      {
        name: "Due Diligence",
        tasks: [
          { label: "Review all leases (commercial and residential)", priority: "High", owner: "Solicitor", daysOffset: 0 },
          { label: "Commercial tenant covenant analysis", priority: "High", owner: "Surveyor", daysOffset: 7 },
          { label: "WAULT on commercial lease", priority: "High", owner: "Surveyor", daysOffset: 7 },
          { label: "Service charge apportionment review", priority: "Medium", owner: "Solicitor", daysOffset: 14 },
          { label: "Planning use class verification", priority: "High", owner: "Planner", daysOffset: 7 },
          { label: "Fire separation assessment", priority: "High", owner: "Assessor", daysOffset: 14 },
        ],
      },
      {
        name: "Finance",
        tasks: [
          { label: "Mixed-use specialist mortgage arranged", priority: "High", owner: "Broker", daysOffset: 21 },
          { label: "Block buildings insurance arranged", priority: "High", owner: "Investor", daysOffset: 42 },
          { label: "Legal searches and title", priority: "High", owner: "Solicitor", daysOffset: 21 },
          { label: "Exchange and completion", priority: "High", owner: "Solicitor", daysOffset: 56 },
        ],
      },
      {
        name: "Post-Purchase Compliance",
        tasks: [
          { label: "Gas safety (residential units)", priority: "High", owner: "Engineer", daysOffset: 63 },
          { label: "EICR (residential units)", priority: "High", owner: "Engineer", daysOffset: 63 },
          { label: "EPC all units verified", priority: "High", owner: "Assessor", daysOffset: 63 },
          { label: "Fire risk assessment (whole building)", priority: "High", owner: "Assessor", daysOffset: 63 },
        ],
      },
    ],
    criticalPathItems: [
      "Fire separation between commercial and residential must be verified",
      "Commercial tenant WAULT - short term means void risk imminent",
      "EPC for both commercial (MEES E min) and residential (E min)",
      "Planning use class for commercial element must be confirmed",
    ],
  },
  risks: {
    overallRating: "Medium", totalExposureEstimate: "5000-25000 GBP/year",
    register: [
      { name: "Commercial Void at Lease Expiry", category: "Financial", likelihood: "Possible", impact: "High", score: 9, mitigation: "Regear early, WAULT management, strong location", owner: "Surveyor" },
      { name: "Fire Safety (mixed use)", category: "Regulatory", likelihood: "Low", impact: "Severe", score: 8, mitigation: "Annual FRA, fire separation check, no high-risk commercial use", owner: "Assessor" },
      { name: "MEES Compliance (commercial)", category: "Regulatory", likelihood: "Possible", impact: "Medium", score: 6, mitigation: "EPC assessment and improvement plan", owner: "Investor" },
      { name: "Valuation Risk (mixed use)", category: "Financial", likelihood: "Possible", impact: "Medium", score: 6, mitigation: "Specialist mixed-use valuer, long WAULT improves valuation", owner: "Surveyor" },
      { name: "Residential Tenant Arrears", category: "Financial", likelihood: "Possible", impact: "Low", score: 3, mitigation: "Referencing, guarantors, rent guarantee insurance", owner: "Investor" },
      { name: "Planning Change (commercial use)", category: "Regulatory", likelihood: "Low", impact: "High", score: 8, mitigation: "Monitor local planning policy, broad use class preferred", owner: "Planner" },
    ],
    topByExposure: [
      { label: "Commercial Void", exposure: "26000 GBP/yr lost revenue", level: "High" },
      { label: "MEES Upgrade", exposure: "5000-20000 GBP one-off", level: "Medium" },
      { label: "Fire Safety Failure", exposure: "Prosecution and liability", level: "Medium" },
    ],
    mitigationActions: [
      "Begin commercial lease regear 18 months before expiry",
      "Annual fire safety inspection of whole building",
      "MEES improvement plan for commercial unit",
      "Maintain at least 3 months mortgage reserve for commercial void",
    ],
  },
  aiQuestions: {
    suggestedQuestions: [
      { question: "How should I value a mixed-use property?", category: "Valuation", insight: "Mixed-use valuation methodology, income capitalisation for commercial, comparison for residential, blended approach" },
      { question: "What is my income if the commercial unit voids?", category: "Risk", insight: "Income floor analysis with only residential income, mortgage coverage ratio, void contingency reserve sizing" },
      { question: "How do I manage service charges across the building?", category: "Management", insight: "Service charge apportionment methodology, recovery from commercial vs residential, statutory requirements" },
      { question: "What are my MEES obligations for the commercial element?", category: "Compliance", insight: "Commercial MEES timeline, improvement cost for EPC B by 2030, impact on lease renewals" },
      { question: "Should I convert the commercial unit to residential?", category: "Strategy", insight: "Planning permitted development Class MA, conversion value uplift, income comparison commercial vs residential" },
    ],
    keyDrivers: ["Commercial WAULT", "Tenant Covenant", "Blended Yield", "Mortgage Rate", "MEES Compliance Status"],
    quickStats: [
      { label: "Typical LTV Mixed Use", value: "60-65%" },
      { label: "Blended Yield Range", value: "6-9%" },
      { label: "Commercial MEES Minimum", value: "EPC E (B by 2030 proposed)" },
      { label: "Income Resilience If Commercial Void", value: "46% residential floor" },
    ],
    recommendations: [
      "Never acquire mixed use with commercial WAULT under 3 years without void pricing",
      "Annual fire safety inspection is non-negotiable for mixed occupancy",
      "MEES improvement for commercial unit should be built into acquisition costs",
    ],
    confidenceScore: 73, confidenceLabel: "Good Confidence",
  },
  quickActions: [
    { label: "Start Planning Set", sub: "Build your mixed use plan", icon: "Play", action: "start-planning" },
    { label: "Compare Profile", sub: "vs Commercial or LTL", icon: "BarChart2", action: "compare" },
    { label: "Blended Yield Calc", sub: "Dual income model", icon: "Zap", action: "quick-scenario" },
    { label: "Download Pack", sub: "PDF profile guide", icon: "Download", action: "download" },
  ],
  pros: ["Dual income stream provides resilience", "Commercial void partially offset by residential", "Potential conversion value uplift", "Urban location capital appreciation", "Single asset, diversified income"],
  cons: ["Complex valuations and specialist lending", "Fire safety for mixed occupancy is complex", "Commercial MEES compliance pressure", "Dual lease management required", "Void at commercial lease expiry is material"],
}

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE 12 — REFINANCING
// ─────────────────────────────────────────────────────────────────────────────
export const REFINANCING_CONFIG: ProfileConfig = {
  key: "refinancing", slug: "refinancing", name: "Refinancing", number: 12,
  tagline: "Optimise debt structure, release equity and improve monthly cashflow",
  description: "Refinance an existing property to release equity, reduce monthly payments or improve debt structure. Capital recycling strategy for portfolio growth.",
  icon: "RefreshCw", accentColor: "#0F766E", bgColor: "#F0FDFA",
  group: "capital-strategy", groupLabel: "Capital Strategy",
  tags: ["Debt Optimisation", "Equity Release", "DSCR", "Capital Recycling"],
  riskLevel: "Medium", managementIntensity: "Low", complianceIntensity: "Medium", capitalIntensity: "Low",
  primaryMetric: { label: "Target DSCR", value: "1.25-1.50x", sublabel: "Debt service coverage" },
  overviewKpis: [
    { label: "Target LTV", value: "65-75%", sublabel: "Post-refinance", trend: "neutral" },
    { label: "Target DSCR", value: "1.25-1.50x", sublabel: "NOI / debt service", trend: "up" },
    { label: "Equity Release Potential", value: "20k-150k+ GBP", sublabel: "Depends on growth/equity", trend: "up" },
    { label: "Rate Saving", value: "0.5-2.0%", sublabel: "vs existing rate", trend: "up" },
  ],
  whoItSuits: ["Existing landlords seeking capital recycling", "Investors who have grown property values", "Portfolio optimisers", "Investors on expiring fixed rates", "Equity-rich but cashflow-poor investors"],
  idealAssets: [
    { icon: "Home", label: "Capital-Appreciated Residential", sub: "Value grown since purchase" },
    { icon: "Building", label: "Paid-Down Investment Property", sub: "High equity position" },
    { icon: "Briefcase", label: "Commercial with Equity", sub: "Refinance to release capital" },
  ],
  advantages: ["Release equity without selling", "Reduce monthly payment if rate improves", "Capital recycled for further investment", "DSCR improvement strengthens portfolio", "Fixed rate certainty"],
  constraints: ["ERC on existing deal may apply", "Arrangement fees reduce benefit", "New valuation risk if market has fallen", "Higher LTV means higher rate", "Stress test requirements may limit amount"],
  bestMarket: ["Properties with material capital growth since purchase", "High-equity positions from historic purchases", "Mortgages on reversion/SVR with high rates", "Portfolio optimisation scenarios"],
  riskPosture: [
    { label: "Valuation Risk", level: "Medium" },
    { label: "New Rate Environment", level: "Medium" },
    { label: "ERC Break Cost", level: "Low" },
    { label: "Stress Test Failure", level: "Low" },
  ],
  timeline: [
    { label: "Decision", sub: "Rate comparison and equity analysis", duration: "1-2 weeks" },
    { label: "Broker", sub: "Product comparison and application", duration: "1-2 weeks" },
    { label: "Valuation", sub: "Lender instruction", duration: "1-2 weeks" },
    { label: "Offer", sub: "Mortgage offer issued", duration: "2-4 weeks" },
    { label: "Legal", sub: "Solicitor transfer", duration: "2-4 weeks" },
    { label: "Completion", sub: "New rate live, equity released", duration: "Day of completion" },
  ],
  modelSnapshot: {
    label: "Example Refinance - residential property valued at 300k",
    lines: [
      { label: "Current Property Value", value: "300000 GBP" },
      { label: "Current Mortgage Balance", value: "140000 GBP" },
      { label: "Current LTV", value: "46.7%" },
      { label: "New Mortgage (75% LTV)", value: "225000 GBP" },
      { label: "Equity Released", value: "85000 GBP", highlight: true },
      { label: "Old Monthly Payment (5.5%)", value: "642 GBP" },
      { label: "New Monthly Payment (4.75%, 225k)", value: "890 GBP" },
      { label: "Net Monthly Cost Increase", value: "248 GBP" },
      { label: "DSCR (at 950/mo rent)", value: "1.07x" },
    ],
  },
  incomeModel: {
    type: "Equity Release and Cashflow Optimisation",
    kpis: [
      { label: "Equity Released", value: "85000 GBP", sublabel: "Deployed to next deal", trend: "up" },
      { label: "New LTV", value: "75%", sublabel: "Post-refinance", trend: "neutral" },
      { label: "DSCR", value: "1.07x", sublabel: "Net rent / new debt service", trend: "neutral" },
      { label: "Rate Saving vs SVR", value: "0.75%", sublabel: "vs standard variable", trend: "up" },
    ],
    structure: {
      label: "Refinance Calculation",
      description: "New loan amount minus existing balance equals equity released. Compare old vs new monthly payments.",
      lines: [
        { label: "New Loan Amount", formula: "Property Value x New LTV %", example: "300000 x 75% = 225000 GBP" },
        { label: "Equity Released", formula: "New Loan minus Old Loan Balance", example: "225000 - 140000 = 85000 GBP" },
        { label: "New Monthly Payment", formula: "New loan x (rate / 12)", example: "225000 x (4.75% / 12) = 890 GBP" },
        { label: "DSCR", formula: "Monthly NOI / Monthly Debt Service", example: "950 / 890 = 1.07x" },
        { label: "Net Monthly Cashflow", formula: "Rent - New Payment - Costs", example: "950 - 890 - 150 = -90 GBP" },
      ],
    },
    assumptions: [
      { label: "Current Property Value", default: "300000 GBP", range: "100000-2000000 GBP" },
      { label: "Current Loan Balance", default: "140000 GBP", range: "Varies" },
      { label: "New LTV Target", default: "75%", range: "65-80%" },
      { label: "New Mortgage Rate", default: "4.75%", range: "3.5-6.5%" },
      { label: "Arrangement Fee", default: "1500 GBP", range: "995-2500 GBP" },
      { label: "Legal Fees", default: "1000 GBP", range: "500-1500 GBP" },
    ],
    exampleCalc: {
      inputs: [
        { label: "Current Property Value", value: "300000 GBP" },
        { label: "Current Mortgage Balance", value: "140000 GBP" },
        { label: "Target New LTV", value: "75%" },
        { label: "New Rate", value: "4.75% fixed 5yr" },
      ],
      outputs: [
        { label: "New Loan Amount", value: "225000 GBP" },
        { label: "Equity Released", value: "85000 GBP", highlight: true },
        { label: "New Monthly Payment", value: "890 GBP" },
        { label: "Old Monthly Payment", value: "642 GBP" },
        { label: "Monthly Cost Increase", value: "+248 GBP" },
        { label: "DSCR (rent 950)", value: "1.07x" },
        { label: "Net Refinance Cost", value: "2500 GBP (fees)" },
        { label: "Break-Even on Fees", value: "10 months" },
      ],
    },
    sensitivityNote: "Refinance viability depends on property value growth and current LTV. DSCR must remain above 1.00x (most lenders require 1.25x minimum). A higher rate environment erodes DSCR benefit.",
    benchmarkRanges: [
      { label: "DSCR Target", low: "1.05x", mid: "1.30x", high: "1.60x+" },
      { label: "New LTV", low: "65%", mid: "72%", high: "80%" },
      { label: "Rate Saving vs SVR", low: "0.25%", mid: "0.75%", high: "2.0%+" },
    ],
  },
  costDrivers: {
    kpis: [
      { label: "Arrangement Fee", value: "995-2500 GBP", sublabel: "One-off", trend: "neutral" },
      { label: "Valuation Fee", value: "250-600 GBP", sublabel: "Lender instruction", trend: "neutral" },
      { label: "Legal Fees", value: "500-1500 GBP", sublabel: "Remortgage solicitor", trend: "neutral" },
      { label: "ERC Break Cost", value: "0-5%+ of balance", sublabel: "If in fixed rate", trend: "neutral" },
    ],
    categories: [
      {
        name: "Upfront Costs",
        items: [
          { label: "Mortgage Arrangement Fee", typical: "995-2500 GBP", frequency: "One-off", type: "fixed" },
          { label: "Valuation Fee", typical: "250-600 GBP", frequency: "One-off", type: "fixed" },
          { label: "Legal/Solicitor Fee", typical: "500-1500 GBP", frequency: "One-off", type: "fixed" },
          { label: "Early Repayment Charge (if applicable)", typical: "1-5% of balance", frequency: "One-off", type: "percentage" },
        ],
      },
      {
        name: "Ongoing",
        items: [
          { label: "New Monthly Mortgage Payment", typical: "Higher if equity released", frequency: "Monthly", type: "variable" },
        ],
      },
    ],
    sensitivityNote: "ERC can make early refinance uneconomic. Always calculate ERC break cost vs rate saving benefit over fixed period. Net present value of saving must exceed ERC cost.",
    costControlTips: [
      "Refinance at end of fixed rate period to avoid ERC",
      "Compare whole-of-market via broker - best rates may not be from existing lender",
      "Fee-free products often have higher rate - model total cost of credit",
      "Some lenders allow product transfer (same lender remortgage) at lower cost",
    ],
  },
  compliance: {
    score: 75, scoreLabel: "Light", criticalCount: 2,
    requirements: [
      { area: "Safety", item: "EPC (lender may require min E)", priority: "High", required: false, renewal: "Lender requirement", estimatedCost: "80-120 GBP", riskIfMissing: "Lender decline" },
      { area: "Safety", item: "Gas Safety Certificate (lender may require)", priority: "Medium", required: false, renewal: "Annual", estimatedCost: "70-90 GBP", riskIfMissing: "Lender decline" },
      { area: "Safety", item: "EICR (some lenders require)", priority: "Medium", required: false, renewal: "5-yearly", estimatedCost: "150-250 GBP", riskIfMissing: "Lender decline" },
      { area: "Financial", item: "Stress Test (ICR typically 125% at 5.5%)", priority: "High", required: true, renewal: "Per application", estimatedCost: "No cost", riskIfMissing: "Lender decline on affordability" },
    ],
    upcomingDeadlines: [
      { label: "Fixed rate expiry (plan 3 months ahead)", due: "On expiry", priority: "High" },
      { label: "EPC renewal if sub-E rating", due: "Before application", priority: "Medium" },
    ],
    requiredDocs: ["Current Mortgage Statement", "Property Valuation Evidence", "EPC Certificate", "Gas Safety Certificate", "Income Evidence", "Bank Statements"],
    aiInsight: "Refinancing compliance is primarily lender-driven rather than regulatory. The key check is stress testing - most BTL lenders require the rent to cover 125% of the monthly interest at a stress rate of 5.5%. EPC sub-E rating will block some lenders entirely.",
  },
  forecast: {
    scenarios: [
      {
        name: "Base Case", type: "base",
        kpis: [
          { label: "Equity Released", value: "85000 GBP", highlight: true, trend: "up" },
          { label: "New Monthly Payment", value: "890 GBP", trend: "neutral" },
          { label: "DSCR", value: "1.07x", trend: "neutral" },
          { label: "Monthly Cashflow Change", value: "-248 GBP/mo", trend: "down" },
        ],
        monthly: [
          { month: "Jan", income: 950, costs: 1040, net: -90 },
          { month: "Feb", income: 950, costs: 1040, net: -90 },
          { month: "Mar", income: 950, costs: 1040, net: -90 },
          { month: "Apr", income: 950, costs: 1040, net: -90 },
          { month: "May", income: 950, costs: 1040, net: -90 },
          { month: "Jun", income: 950, costs: 1040, net: -90 },
          { month: "Jul", income: 950, costs: 1040, net: -90 },
          { month: "Aug", income: 950, costs: 1040, net: -90 },
          { month: "Sep", income: 950, costs: 1040, net: -90 },
          { month: "Oct", income: 950, costs: 1040, net: -90 },
          { month: "Nov", income: 950, costs: 1040, net: -90 },
          { month: "Dec", income: 950, costs: 1040, net: -90 },
        ],
      },
      {
        name: "Rate Reduction Scenario", type: "optimistic",
        kpis: [
          { label: "Equity Released", value: "85000 GBP", highlight: true, trend: "up" },
          { label: "New Monthly Payment", value: "710 GBP", trend: "down" },
          { label: "DSCR", value: "1.34x", trend: "up" },
          { label: "Monthly Cashflow Change", value: "-68 GBP/mo", trend: "up" },
        ],
        monthly: [
          { month: "Jan", income: 950, costs: 860, net: 90 },
          { month: "Feb", income: 950, costs: 860, net: 90 },
          { month: "Mar", income: 950, costs: 860, net: 90 },
          { month: "Apr", income: 950, costs: 860, net: 90 },
          { month: "May", income: 950, costs: 860, net: 90 },
          { month: "Jun", income: 950, costs: 860, net: 90 },
          { month: "Jul", income: 950, costs: 860, net: 90 },
          { month: "Aug", income: 950, costs: 860, net: 90 },
          { month: "Sep", income: 950, costs: 860, net: 90 },
          { month: "Oct", income: 950, costs: 860, net: 90 },
          { month: "Nov", income: 950, costs: 860, net: 90 },
          { month: "Dec", income: 950, costs: 860, net: 90 },
        ],
      },
      {
        name: "Valuation Downside", type: "stress",
        kpis: [
          { label: "Equity Released (5% val down)", value: "60250 GBP", highlight: true, trend: "down" },
          { label: "New LTV (remains 75%)", value: "75%", trend: "neutral" },
          { label: "DSCR", value: "1.07x", trend: "neutral" },
          { label: "Lost Equity vs Base", value: "-24750 GBP", trend: "down" },
        ],
        monthly: [
          { month: "Jan", income: 950, costs: 855, net: 95 },
          { month: "Feb", income: 950, costs: 855, net: 95 },
          { month: "Mar", income: 950, costs: 855, net: 95 },
          { month: "Apr", income: 950, costs: 855, net: 95 },
          { month: "May", income: 950, costs: 855, net: 95 },
          { month: "Jun", income: 950, costs: 855, net: 95 },
          { month: "Jul", income: 950, costs: 855, net: 95 },
          { month: "Aug", income: 950, costs: 855, net: 95 },
          { month: "Sep", income: 950, costs: 855, net: 95 },
          { month: "Oct", income: 950, costs: 855, net: 95 },
          { month: "Nov", income: 950, costs: 855, net: 95 },
          { month: "Dec", income: 950, costs: 855, net: 95 },
        ],
      },
    ],
    baseKpis: [
      { label: "Equity Released", value: "85000 GBP", highlight: true },
      { label: "New Monthly Payment", value: "890 GBP", trend: "neutral" },
      { label: "Old Monthly Payment", value: "642 GBP", trend: "neutral" },
      { label: "DSCR", value: "1.07x", trend: "neutral" },
      { label: "Fee Cost", value: "2500 GBP", trend: "neutral" },
      { label: "Break-Even on Fees", value: "10 months rate saving", sublabel: "Based on rate differential" },
    ],
    assumptions: [
      { label: "Property Value", value: "300000 GBP" },
      { label: "Current Loan Balance", value: "140000 GBP" },
      { label: "New LTV", value: "75%" },
      { label: "New Rate", value: "4.75%" },
      { label: "Monthly Rent", value: "950 GBP" },
      { label: "Total Fees", value: "2500 GBP" },
    ],
    sensitivityRows: [
      { variable: "Property Value +/- 5%", base: "300k", upside: "+11250 GBP equity", downside: "-11250 GBP equity" },
      { variable: "New Rate +/- 0.5%", base: "4.75%", upside: "+112/mo cashflow", downside: "-112/mo cashflow" },
      { variable: "LTV +/- 5%", base: "75%", upside: "+15k equity released", downside: "-15k equity released" },
      { variable: "ERC +/- 1%", base: "None", upside: "No ERC", downside: "-1400 GBP ERC cost" },
    ],
    forecastNote: "Refinancing is a one-time capital event rather than an ongoing income model. The key outputs are equity released and new monthly cashflow position. DSCR at new debt level must be modelled carefully.",
  },
  checklist: {
    phases: [
      {
        name: "Pre-Application",
        tasks: [
          { label: "Get current property valued (agent or RICS)", priority: "High", owner: "Investor", daysOffset: 0 },
          { label: "Calculate current LTV and equity position", priority: "High", owner: "Investor", daysOffset: 0 },
          { label: "Check for ERC on existing deal", priority: "High", owner: "Investor", daysOffset: 0 },
          { label: "Model old vs new monthly payment", priority: "High", owner: "Investor", daysOffset: 7 },
          { label: "Whole-of-market broker engaged", priority: "High", owner: "Broker", daysOffset: 7 },
        ],
      },
      {
        name: "Application",
        tasks: [
          { label: "Mortgage application submitted", priority: "High", owner: "Broker", daysOffset: 14 },
          { label: "Lender valuation completed", priority: "High", owner: "Lender", daysOffset: 21 },
          { label: "Mortgage offer received", priority: "High", owner: "Lender", daysOffset: 35 },
        ],
      },
      {
        name: "Legal",
        tasks: [
          { label: "Remortgage solicitor instructed", priority: "High", owner: "Solicitor", daysOffset: 35 },
          { label: "Title and searches completed", priority: "High", owner: "Solicitor", daysOffset: 42 },
          { label: "New mortgage completed", priority: "High", owner: "Solicitor", daysOffset: 56 },
          { label: "Equity released to client", priority: "High", owner: "Solicitor", daysOffset: 56 },
        ],
      },
    ],
    criticalPathItems: [
      "ERC calculation before committing to refinance",
      "ICR stress test at new loan amount before applying",
      "EPC must be E or above for most lenders",
      "Valuation must support target LTV for equity release",
    ],
  },
  risks: {
    overallRating: "Medium", totalExposureEstimate: "1000-15000 GBP",
    register: [
      { name: "Down Valuation", category: "Financial", likelihood: "Possible", impact: "Medium", score: 6, mitigation: "Use agent estimate before applying, build in 5% valuation buffer", owner: "Investor" },
      { name: "ICR Stress Test Failure", category: "Financial", likelihood: "Possible", impact: "Medium", score: 6, mitigation: "Model ICR at 125% stress rate before applying, use broker to find suitable lender", owner: "Broker" },
      { name: "ERC Break Cost", category: "Financial", likelihood: "Low", impact: "Medium", score: 3, mitigation: "Check ERC schedule, wait for product expiry where possible", owner: "Investor" },
      { name: "Rate Environment Rise", category: "Financial", likelihood: "Possible", impact: "Medium", score: 6, mitigation: "Fix new rate for 5 years, model worst case at +2% stress", owner: "Investor" },
      { name: "EPC Below E - Lender Decline", category: "Regulatory", likelihood: "Low", impact: "Medium", score: 3, mitigation: "EPC assessment before applying, upgrade if needed", owner: "Investor" },
    ],
    topByExposure: [
      { label: "Down Valuation", exposure: "Reduced equity by 5-10%", level: "Medium" },
      { label: "ERC Cost", exposure: "1-5% of outstanding balance", level: "Low" },
      { label: "Rate Rise After Refinance", exposure: "100-200 GBP/mo if not fixed", level: "Medium" },
    ],
    mitigationActions: [
      "Always get informal agent valuation before submitting formal application",
      "Use a whole-of-market broker to find lenders with most favourable stress test",
      "Fix new rate for 5 years to lock in current environment",
      "Model DSCR at new debt level before committing",
    ],
  },
  aiQuestions: {
    suggestedQuestions: [
      { question: "How much equity can I release from this property?", category: "Equity Analysis", insight: "Current value, outstanding balance, target LTV, gross equity available, net after fees" },
      { question: "Will I pass the ICR stress test?", category: "Viability", insight: "Interest coverage ratio calculation at standard stress rates, lender-by-lender comparison" },
      { question: "Should I refinance now or wait for my fixed rate to expire?", category: "Timing", insight: "ERC break cost vs rate saving analysis, net present value of early refinance" },
      { question: "What is the best use of the equity I release?", category: "Strategy", insight: "Capital deployment options, next deal modelling, portfolio growth strategy" },
      { question: "What will my DSCR be after refinancing?", category: "Risk", insight: "DSCR calculation at new debt level, comparison to lender minimum, cashflow impact" },
    ],
    keyDrivers: ["Current Property Value", "Existing Loan Balance", "Target LTV", "New Rate", "ICR Stress Test"],
    quickStats: [
      { label: "Typical Arrangement Fee", value: "995-2500 GBP" },
      { label: "ICR Stress Requirement", value: "125% at 5.5% (typical)" },
      { label: "Minimum EPC for Most Lenders", value: "E rating" },
      { label: "Timeline to Complete", value: "6-10 weeks" },
    ],
    recommendations: [
      "Always model DSCR at new debt level before applying - a declining DSCR can reduce portfolio growth options",
      "Use whole-of-market broker - product transfer with existing lender is rarely the best rate",
      "Deploy equity released immediately - idle capital reduces portfolio ROI",
    ],
    confidenceScore: 85, confidenceLabel: "High Confidence",
  },
  quickActions: [
    { label: "Start Planning Set", sub: "Build your refinance plan", icon: "Play", action: "start-planning" },
    { label: "Equity Calculator", sub: "LTV and equity model", icon: "BarChart2", action: "compare" },
    { label: "DSCR Check", sub: "Stress test your position", icon: "Zap", action: "quick-scenario" },
    { label: "Download Pack", sub: "PDF profile guide", icon: "Download", action: "download" },
  ],
  pros: ["Release equity without selling", "Reduce monthly cost if rate improves", "Capital recycled into next investment", "DSCR improvement if income has grown", "Fixed rate certainty for planning"],
  cons: ["Higher monthly payment if equity released", "ERC can make early refinance uneconomic", "New valuation risk if market has softened", "DSCR must remain above lender minimum", "Arrangement fees reduce short-term benefit"],
}

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE 13 — DEV / FLIP
// ─────────────────────────────────────────────────────────────────────────────
export const DEV_FLIP_CONFIG: ProfileConfig = {
  key: "dev_flip", slug: "dev-flip", name: "Dev/Flip", number: 13,
  tagline: "Acquire below market, renovate efficiently and exit at ARV for capital gain",
  description: "Purchase discounted or distressed property, add value through refurbishment, and sell at after-repair value (ARV) to realise a capital profit. Short-term project strategy.",
  icon: "Hammer", accentColor: "#EA580C", bgColor: "#FFF7ED",
  group: "capital-strategy", groupLabel: "Capital Strategy",
  tags: ["ARV", "BMV Purchase", "Bridging Finance", "Capital Gain"],
  riskLevel: "High", managementIntensity: "High", complianceIntensity: "Medium", capitalIntensity: "High",
  primaryMetric: { label: "Target Gross Margin", value: "20-35%", sublabel: "Profit on project cost" },
  overviewKpis: [
    { label: "BMV Acquisition Discount", value: "15-25%", sublabel: "Below market value", trend: "up" },
    { label: "Gross Margin Target", value: "20-35%", sublabel: "Gross profit / total cost", trend: "up" },
    { label: "Project IRR", value: "25-60%+", sublabel: "Annualised, 9-12 mo", trend: "up" },
    { label: "Bridging Finance Rate", value: "0.85-1.1%/mo", sublabel: "Gross monthly", trend: "neutral" },
  ],
  whoItSuits: ["Active investors with time to project manage", "Builders and contractors entering investment", "Cash-rich investors seeking capital growth", "Portfolio builders using BRRR strategy", "Experienced property investors scaling up"],
  idealAssets: [
    { icon: "Home", label: "Unmortgageable / Distressed Property", sub: "Below market due to condition" },
    { icon: "Building", label: "Probate / Repossession Stock", sub: "Motivated vendor discount" },
    { icon: "Hammer", label: "Conversion or Extension Opportunity", sub: "Planning-led value uplift" },
    { icon: "Zap", label: "Tired Rental Stock", sub: "Low price, strong ARV potential" },
  ],
  advantages: ["Large capital gain potential in short timeframe", "No ongoing management after exit", "BMV purchase creates built-in margin", "Can be repeated to compound capital", "Works in most market conditions if bought right"],
  constraints: ["High risk if ARV assumptions wrong", "Bridging finance expensive if project delays", "Requires active hands-on management", "SDLT and CGT significantly impact net return", "Finding BMV deals requires sourcing expertise"],
  bestMarket: ["Motivated seller or distressed property markets", "Areas with strong buyer demand at ARV", "Locations with refurb-to-value gap", "Auctions and off-market sourcing"],
  riskPosture: [
    { label: "ARV Risk (end value)", level: "High" },
    { label: "Cost Overrun", level: "High" },
    { label: "Bridging Finance Overrun", level: "Medium" },
    { label: "Sales Period / Void Risk", level: "Medium" },
  ],
  timeline: [
    { label: "Sourcing", sub: "Finding BMV deal, due diligence", duration: "1-4 weeks" },
    { label: "Acquisition", sub: "Offer, survey, legal, SDLT", duration: "4-8 weeks" },
    { label: "Renovation", sub: "Strip, structural, first-fix, second-fix, finish", duration: "6-14 weeks" },
    { label: "Marketing", sub: "Photos, listing, viewings", duration: "2-4 weeks" },
    { label: "Sale", sub: "Offer, survey, legal, completion", duration: "6-12 weeks" },
    { label: "Exit", sub: "Net proceeds, bridge repaid, profit realised", duration: "Day of sale" },
  ],
  modelSnapshot: {
    label: "Example Dev/Flip - Birmingham 2-bed terrace",
    lines: [
      { label: "BMV Purchase Price", value: "160000 GBP" },
      { label: "SDLT and Purchase Costs", value: "8000 GBP" },
      { label: "Bridging Finance (9mo x 0.95%/mo)", value: "13680 GBP" },
      { label: "Renovation Budget", value: "25000 GBP" },
      { label: "All Costs (fees, bridging, reno)", value: "46680 GBP" },
      { label: "Total Invested (purchase + all costs)", value: "206680 GBP" },
      { label: "ARV (After Repair Value)", value: "245000 GBP" },
      { label: "Agent Fee (1.5%) + Conveyancing", value: "5250 GBP" },
      { label: "Net Sale Proceeds", value: "239750 GBP" },
      { label: "Gross Profit", value: "33070 GBP", highlight: true },
      { label: "Gross Margin", value: "13.5% on sale / 20.7% on cost", highlight: true },
      { label: "Annualised IRR (9 months)", value: "~36%", highlight: true },
    ],
  },
  incomeModel: {
    type: "Capital Gain on Sale (ARV Model)",
    kpis: [
      { label: "Gross Profit", value: "33070 GBP", sublabel: "Pre-CGT", trend: "up" },
      { label: "Gross Margin", value: "16%", sublabel: "Profit / total invested", trend: "up" },
      { label: "Annualised IRR", value: "~36%", sublabel: "Annualised at 9 months", trend: "up" },
      { label: "BMV Discount", value: "~18%", sublabel: "vs ARV at purchase", trend: "up" },
    ],
    structure: {
      label: "ARV Profit Model",
      description: "Profit equals ARV minus total invested. Total invested equals purchase price plus SDLT, bridging finance, renovation, and sale costs.",
      lines: [
        { label: "ARV", formula: "Comparable sale evidence x floor area", example: "245000 GBP" },
        { label: "Total Invested", formula: "Purchase + SDLT + Bridge + Reno + Sale Costs", example: "160000 + 8000 + 13680 + 25000 + 5250 = 211930" },
        { label: "Gross Profit", formula: "ARV minus Total Invested", example: "245000 - 211930 = 33070 GBP" },
        { label: "Gross Margin", formula: "Gross Profit / Total Invested", example: "33070 / 211930 = 15.6%" },
        { label: "Annualised IRR", formula: "(1 + ROI)^(12/months) - 1", example: "(1.156)^(12/9) - 1 = ~22%" },
      ],
    },
    assumptions: [
      { label: "Purchase Price (BMV)", default: "160000 GBP", range: "80k-500k GBP" },
      { label: "BMV Discount vs ARV", default: "18-22%", range: "15-30%" },
      { label: "Renovation Budget", default: "25000 GBP", range: "10k-100k GBP" },
      { label: "Bridging Rate (monthly gross)", default: "0.95%", range: "0.85-1.1%" },
      { label: "Project Duration", default: "9 months", range: "6-18 months" },
      { label: "ARV", default: "245000 GBP", range: "Determined by comparables" },
      { label: "Agent Fee", default: "1.5%", range: "1.0-2.0%" },
    ],
    exampleCalc: {
      inputs: [
        { label: "BMV Purchase Price", value: "160000 GBP" },
        { label: "Renovation Budget", value: "25000 GBP" },
        { label: "Bridge Rate x 9 months", value: "8550 GBP" },
        { label: "SDLT and Fees", value: "8000 GBP" },
        { label: "ARV Comparable", value: "245000 GBP" },
      ],
      outputs: [
        { label: "Total Invested", value: "211930 GBP" },
        { label: "Gross Profit", value: "33070 GBP", highlight: true },
        { label: "Gross Margin on Cost", value: "15.6%" },
        { label: "Net Post-CGT Profit (20% CGT on gain)", value: "~24000 GBP" },
        { label: "Annualised IRR", value: "~22%" },
      ],
    },
    sensitivityNote: "Profit is highly sensitive to ARV accuracy and cost overruns. A 5% ARV miss equals -12250 GBP. A 10% renovation overrun equals -2500 GBP. Combined, these can wipe the margin entirely.",
    benchmarkRanges: [
      { label: "Target Gross Margin", low: "10%", mid: "20%", high: "35%+" },
      { label: "BMV Discount Required", low: "10%", mid: "18%", high: "25%+" },
      { label: "Renovation Cost per Sqft", low: "35 GBP", mid: "55 GBP", high: "90 GBP+" },
    ],
  },
  costDrivers: {
    kpis: [
      { label: "SDLT (3% surcharge)", value: "3-5% purchase price", sublabel: "Investor surcharge", trend: "neutral" },
      { label: "Renovation Budget", value: "25k-100k GBP", sublabel: "Depends on scope", trend: "neutral" },
      { label: "Bridging Finance", value: "0.85-1.1%/mo", sublabel: "Plus arrangement 2%", trend: "neutral" },
      { label: "CGT on Exit", value: "18% basic / 24% higher", sublabel: "Post Mar 2024 rates", trend: "neutral" },
    ],
    categories: [
      {
        name: "Acquisition Costs",
        items: [
          { label: "Purchase Price", typical: "BMV price", frequency: "One-off", type: "fixed" },
          { label: "SDLT (3% surcharge applies)", typical: "3-12% of price", frequency: "One-off", type: "percentage" },
          { label: "Bridging Arrangement Fee", typical: "1.5-2% of loan", frequency: "One-off", type: "percentage" },
          { label: "Legal Fees (purchase)", typical: "1200-2500 GBP", frequency: "One-off", type: "fixed" },
          { label: "Survey / Structural", typical: "400-800 GBP", frequency: "One-off", type: "fixed" },
        ],
      },
      {
        name: "Project Costs",
        items: [
          { label: "Renovation Works", typical: "25k-100k GBP", frequency: "Project duration", type: "variable" },
          { label: "Project Management", typical: "5-15% of build cost", frequency: "Project duration", type: "percentage" },
          { label: "Planning Fees (if applicable)", typical: "206-578 GBP", frequency: "One-off", type: "fixed" },
          { label: "Building Regs / Warranties", typical: "500-2000 GBP", frequency: "One-off", type: "fixed" },
        ],
      },
      {
        name: "Finance Costs",
        items: [
          { label: "Bridging Monthly Interest", typical: "0.85-1.1% per month", frequency: "Monthly", type: "percentage" },
          { label: "Loan Exit Fee", typical: "0.5-1% of loan", frequency: "On redemption", type: "percentage" },
        ],
      },
      {
        name: "Sale Costs",
        items: [
          { label: "Estate Agent Fee", typical: "1.0-2.0% of sale price", frequency: "On sale", type: "percentage" },
          { label: "Legal Fees (sale)", typical: "1000-2000 GBP", frequency: "One-off", type: "fixed" },
          { label: "Capital Gains Tax", typical: "18% / 24% on gain", frequency: "On sale", type: "percentage" },
        ],
      },
    ],
    sensitivityNote: "Bridging finance cost is duration-dependent. Each additional month of project delay costs approximately 0.95% of loan on a typical bridge. A 3-month overrun on a 160k bridge costs approx 4560 GBP extra.",
    costControlTips: [
      "Always get 3 contractor quotes - cheapest is rarely best, use fixed-price contracts where possible",
      "Include 10-15% contingency in renovation budget before calculating margin",
      "Model bridging cost at planned duration PLUS 3 months to stress test delay risk",
      "Negotiate BMV price hard - the discount built in at purchase protects margin on exit",
      "Use a JCT minor works contract for all build contracts over 10k",
    ],
  },
  compliance: {
    score: 70, scoreLabel: "Moderate", criticalCount: 3,
    requirements: [
      { area: "Planning", item: "Planning Permission (if changing use or extension)", priority: "High", required: false, renewal: "Per project", estimatedCost: "206-578 GBP application", riskIfMissing: "Enforcement, inability to sell" },
      { area: "Safety", item: "Building Regulations Approval", priority: "High", required: true, renewal: "Per project", estimatedCost: "500-2000 GBP", riskIfMissing: "Sale blocked, lender decline on buyer side" },
      { area: "Safety", item: "Gas Safe Certificate (if gas installed)", priority: "High", required: true, renewal: "Per installation", estimatedCost: "100-150 GBP", riskIfMissing: "Sale blocked, legal liability" },
      { area: "Safety", item: "Electrical Installation Condition Report (EICR)", priority: "High", required: true, renewal: "Per project", estimatedCost: "150-250 GBP", riskIfMissing: "Sale blocked, lender decline on buyer side" },
      { area: "Safety", item: "EPC (min E for mortgageable sale)", priority: "High", required: true, renewal: "10 years", estimatedCost: "80-120 GBP", riskIfMissing: "Buyer mortgage decline" },
      { area: "Safety", item: "Completion Certificate (Building Regs)", priority: "High", required: true, renewal: "Per project", estimatedCost: "Included in regs fee", riskIfMissing: "Sale blocked - solicitors require this" },
      { area: "Financial", item: "Capital Gains Tax Return", priority: "High", required: true, renewal: "Per sale", estimatedCost: "Accountant fee 300-600 GBP", riskIfMissing: "HMRC penalty, interest" },
      { area: "Financial", item: "SDLT Return within 14 days of completion", priority: "High", required: true, renewal: "Per purchase", estimatedCost: "Solicitor handles", riskIfMissing: "HMRC penalty" },
    ],
    upcomingDeadlines: [
      { label: "SDLT Return (14 days post-completion)", due: "14 days", priority: "High" },
      { label: "Building Regs sign-off before sale", due: "Before exchange", priority: "High" },
      { label: "CGT Return (60 days after sale)", due: "60 days post-sale", priority: "High" },
    ],
    requiredDocs: ["Planning Permission (if applicable)", "Building Regulations Completion Certificate", "Gas Safe Certificate", "EICR Certificate", "EPC Certificate", "Structural Engineer Sign-off (if applicable)", "NHBC or similar warranty (if new build)"],
    aiInsight: "The biggest compliance risk in a dev/flip is missing building regulations completion certificate. Solicitors on the buyer's side will always request this and its absence blocks exchange. Plan your build regs sign-off before marketing begins. CGT is also a major cost - model the exact post-tax profit before committing to the deal.",
  },
  forecast: {
    scenarios: [
      {
        name: "Base Case (9 months, target ARV)", type: "base",
        kpis: [
          { label: "ARV", value: "245000 GBP", highlight: true, trend: "up" },
          { label: "Total Invested", value: "211930 GBP", trend: "neutral" },
          { label: "Gross Profit", value: "33070 GBP", highlight: true, trend: "up" },
          { label: "Gross Margin", value: "15.6%", trend: "up" },
          { label: "Post-CGT Profit", value: "~24000 GBP", trend: "up" },
          { label: "Annualised IRR", value: "~22%", trend: "up" },
        ],
        monthly: [
          { month: "M1", income: 0, costs: 168000, net: -168000 },
          { month: "M2", income: 0, costs: 8000, net: -8000 },
          { month: "M3", income: 0, costs: 8000, net: -8000 },
          { month: "M4", income: 0, costs: 8000, net: -8000 },
          { month: "M5", income: 0, costs: 1500, net: -1500 },
          { month: "M6", income: 0, costs: 1500, net: -1500 },
          { month: "M7", income: 0, costs: 1500, net: -1500 },
          { month: "M8", income: 0, costs: 1500, net: -1500 },
          { month: "M9", income: 239750, costs: 5250, net: 234500 },
        ],
      },
      {
        name: "Optimistic (ARV +5%, on time)", type: "optimistic",
        kpis: [
          { label: "ARV", value: "257250 GBP", highlight: true, trend: "up" },
          { label: "Gross Profit", value: "45320 GBP", highlight: true, trend: "up" },
          { label: "Gross Margin", value: "21.4%", trend: "up" },
          { label: "Annualised IRR", value: "~33%", trend: "up" },
        ],
        monthly: [
          { month: "M1", income: 0, costs: 168000, net: -168000 },
          { month: "M2", income: 0, costs: 8000, net: -8000 },
          { month: "M3", income: 0, costs: 8000, net: -8000 },
          { month: "M4", income: 0, costs: 8000, net: -8000 },
          { month: "M5", income: 0, costs: 1500, net: -1500 },
          { month: "M6", income: 0, costs: 1500, net: -1500 },
          { month: "M7", income: 0, costs: 1500, net: -1500 },
          { month: "M8", income: 0, costs: 1500, net: -1500 },
          { month: "M9", income: 251750, costs: 5500, net: 246250 },
        ],
      },
      {
        name: "Stress (ARV -8%, 3-month delay, cost overrun 15%)", type: "stress",
        kpis: [
          { label: "ARV", value: "225400 GBP", highlight: true, trend: "down" },
          { label: "Total Invested", value: "221380 GBP", trend: "down" },
          { label: "Gross Profit", value: "4020 GBP", highlight: true, trend: "down" },
          { label: "Gross Margin", value: "1.8%", trend: "down" },
          { label: "IRR", value: "~2%", trend: "down" },
        ],
        monthly: [
          { month: "M1", income: 0, costs: 168000, net: -168000 },
          { month: "M2", income: 0, costs: 9200, net: -9200 },
          { month: "M3", income: 0, costs: 9200, net: -9200 },
          { month: "M4", income: 0, costs: 9200, net: -9200 },
          { month: "M5", income: 0, costs: 1500, net: -1500 },
          { month: "M6", income: 0, costs: 1500, net: -1500 },
          { month: "M7", income: 0, costs: 1500, net: -1500 },
          { month: "M8", income: 0, costs: 1500, net: -1500 },
          { month: "M9", income: 0, costs: 1500, net: -1500 },
          { month: "M10", income: 0, costs: 1500, net: -1500 },
          { month: "M11", income: 0, costs: 1500, net: -1500 },
          { month: "M12", income: 221000, costs: 5400, net: 215600 },
        ],
      },
    ],
    baseKpis: [
      { label: "BMV Purchase Price", value: "160000 GBP" },
      { label: "ARV", value: "245000 GBP", highlight: true },
      { label: "Renovation Budget", value: "25000 GBP" },
      { label: "Bridging Finance Cost", value: "13680 GBP" },
      { label: "Total Invested", value: "211930 GBP" },
      { label: "Gross Profit", value: "33070 GBP", highlight: true },
      { label: "Post-CGT Profit (est.)", value: "~24000 GBP" },
      { label: "Annualised IRR", value: "~22%" },
    ],
    assumptions: [
      { label: "Purchase Price", value: "160000 GBP BMV" },
      { label: "ARV", value: "245000 GBP" },
      { label: "Renovation Budget", value: "25000 GBP" },
      { label: "Bridge Rate", value: "0.95%/mo" },
      { label: "Project Duration", value: "9 months" },
      { label: "Agent Fee", value: "1.5%" },
    ],
    sensitivityRows: [
      { variable: "ARV +/- 5%", base: "245k", upside: "+12250 GBP", downside: "-12250 GBP" },
      { variable: "Reno Cost +/- 10%", base: "25k", upside: "+2500 GBP profit", downside: "-2500 GBP profit" },
      { variable: "Project +/- 3 months", base: "9 months", upside: "+4560 GBP saved", downside: "-4560 GBP bridge" },
      { variable: "Purchase Price +/- 5%", base: "160k", upside: "+8000 GBP profit", downside: "-8000 GBP profit" },
      { variable: "CGT Rate basic vs higher", base: "24%", upside: "18% rate = +2000 GBP", downside: "28% = -1600 GBP" },
    ],
    forecastNote: "Dev/flip is a capital gain play, not a monthly income model. IRR is highly sensitive to project duration - every extra month costs bridge finance and delays capital deployment. Always model a 3-month delay scenario before committing.",
  },
  checklist: {
    phases: [
      {
        name: "Sourcing and Due Diligence",
        tasks: [
          { label: "Identify BMV deal with minimum 15% discount to ARV", priority: "High", owner: "Investor", daysOffset: 0 },
          { label: "Comparable sales (comps) analysis for target ARV", priority: "High", owner: "Investor", daysOffset: 0 },
          { label: "Structural survey before exchange", priority: "High", owner: "Surveyor", daysOffset: 7 },
          { label: "Renovation cost estimate from builder", priority: "High", owner: "Builder", daysOffset: 7 },
          { label: "Full deal modelling including all costs and CGT", priority: "High", owner: "Investor", daysOffset: 7 },
          { label: "Bridging finance terms agreed in principle", priority: "High", owner: "Broker", daysOffset: 7 },
        ],
      },
      {
        name: "Acquisition",
        tasks: [
          { label: "Offer accepted and SSTC", priority: "High", owner: "Investor", daysOffset: 14 },
          { label: "Bridging finance instruction confirmed", priority: "High", owner: "Broker", daysOffset: 14 },
          { label: "Legal searches and title review", priority: "High", owner: "Solicitor", daysOffset: 21 },
          { label: "Exchange with completion date confirmed", priority: "High", owner: "Solicitor", daysOffset: 35 },
          { label: "SDLT return filed (14 days post-completion)", priority: "High", owner: "Solicitor", daysOffset: 49 },
        ],
      },
      {
        name: "Renovation",
        tasks: [
          { label: "JCT contract signed with main contractor", priority: "High", owner: "Investor", daysOffset: 42 },
          { label: "Building Regs application submitted", priority: "High", owner: "Architect/Builder", daysOffset: 42 },
          { label: "Strip-out and structural phase complete", priority: "High", owner: "Builder", daysOffset: 56 },
          { label: "First-fix complete (plumbing, electrics, plaster)", priority: "High", owner: "Builder", daysOffset: 70 },
          { label: "Second-fix complete (kitchen, bathroom, joinery)", priority: "High", owner: "Builder", daysOffset: 84 },
          { label: "Snagging list completed", priority: "Medium", owner: "Investor/PM", daysOffset: 98 },
          { label: "Building Regs Completion Certificate obtained", priority: "High", owner: "BCO", daysOffset: 98 },
          { label: "EPC commissioned", priority: "High", owner: "Investor", daysOffset: 100 },
          { label: "EICR and Gas Safe certificates obtained", priority: "High", owner: "Trades", daysOffset: 100 },
        ],
      },
      {
        name: "Sales and Exit",
        tasks: [
          { label: "Professional photography and floor plans", priority: "Medium", owner: "Investor", daysOffset: 105 },
          { label: "Listed on Rightmove via agent", priority: "High", owner: "Agent", daysOffset: 107 },
          { label: "Offer accepted", priority: "High", owner: "Investor/Agent", daysOffset: 119 },
          { label: "Memorandum of sale issued", priority: "High", owner: "Agent", daysOffset: 119 },
          { label: "Sale conveyancing progressed", priority: "High", owner: "Solicitor", daysOffset: 133 },
          { label: "Exchange and completion", priority: "High", owner: "Solicitor", daysOffset: 168 },
          { label: "Bridge repaid on completion", priority: "High", owner: "Solicitor", daysOffset: 168 },
          { label: "CGT return filed within 60 days of sale", priority: "High", owner: "Accountant", daysOffset: 228 },
        ],
      },
    ],
    criticalPathItems: [
      "ARV comps must be done before exchange - wrong ARV kills the margin",
      "Building Regs Completion Certificate must be obtained before marketing",
      "Bridge finance must be secured before exchange - do not exchange without confirmed finance",
      "Include 10-15% contingency in renovation budget in deal model",
      "SDLT filed within 14 days of purchase completion",
      "CGT filed within 60 days of sale completion",
    ],
  },
  risks: {
    overallRating: "High", totalExposureEstimate: "5000-60000 GBP",
    register: [
      { name: "ARV Overestimate", category: "Financial", likelihood: "Possible", impact: "Severe", score: 12, mitigation: "3+ comparable sales within 0.25 miles, same property type, sold within 6 months. Factor 5% downside.", owner: "Investor" },
      { name: "Renovation Cost Overrun", category: "Financial", likelihood: "Likely", impact: "Medium", score: 9, mitigation: "Fixed-price JCT contract, 15% contingency built into model, builder with portfolio track record", owner: "Investor/PM" },
      { name: "Project Delay", category: "Financial", likelihood: "Likely", impact: "Medium", score: 9, mitigation: "Detailed programme with contractor, penalty clauses in contract, monitor weekly", owner: "Investor/PM" },
      { name: "Bridging Finance Not Secured", category: "Financial", likelihood: "Low", impact: "Severe", score: 8, mitigation: "Secure DIP before exchange, do not exchange without confirmed bridge", owner: "Broker" },
      { name: "Planning/Building Regs Issue", category: "Regulatory", likelihood: "Low", impact: "Severe", score: 8, mitigation: "Architect advice before purchase, BCO pre-application meeting, avoid unconventional works without pre-approval", owner: "Architect" },
      { name: "Market Decline at Sale", category: "Financial", likelihood: "Low", impact: "High", score: 6, mitigation: "Build in 8-10% ARV margin buffer, keep project duration under 12 months", owner: "Investor" },
      { name: "CGT Liability Higher Than Modelled", category: "Financial", likelihood: "Possible", impact: "Medium", score: 6, mitigation: "Tax advice before deal; use annual CGT allowance where available; consider company structure for serial flippers", owner: "Accountant" },
      { name: "Structural Issue Found Post-Purchase", category: "Operational", likelihood: "Low", impact: "High", score: 6, mitigation: "Full structural survey before exchange, price in scope of works", owner: "Surveyor" },
    ],
    topByExposure: [
      { label: "ARV Miss -8%", exposure: "-19600 GBP on 245k ARV", level: "High" },
      { label: "10% Reno Overrun + 3mo delay", exposure: "-7060 GBP combined", level: "High" },
      { label: "Market Decline During Project", exposure: "Up to -20000 GBP on ARV", level: "Medium" },
      { label: "Building Regs Failure", exposure: "Delay + remediation 5-15k GBP", level: "Medium" },
    ],
    mitigationActions: [
      "Never exchange without at least 3 solid comparables supporting ARV",
      "Always include 15% contingency in renovation budget before modelling margin",
      "Model bridging cost at actual duration PLUS 3 months",
      "Get building regs application in early - do not wait for works to start",
      "Secure bridge finance DIP before exchange - never rely on commercial mortgage for auction purchase",
    ],
  },
  aiQuestions: {
    suggestedQuestions: [
      { question: "Is this deal worth doing?", category: "Deal Viability", insight: "Full P&L model: purchase, SDLT, bridge, reno, CGT, agent, net profit, gross margin, IRR. Go/no-go recommendation with threshold analysis." },
      { question: "What ARV do I need to break even?", category: "Sensitivity", insight: "Reverse-engineer minimum ARV from all-in cost including CGT to confirm margin safety on comps." },
      { question: "How much contingency should I budget for the renovation?", category: "Cost Planning", insight: "Standard 10-15% contingency recommendation with category breakdown. Flag high-risk scope items (structural, damp, electrics)." },
      { question: "What is the impact of a 3-month project delay?", category: "Risk", insight: "Additional bridging cost calculation, total cost increase, revised profit and IRR at extended duration." },
      { question: "Should I flip or hold (BRRR)?", category: "Strategy", insight: "Flip vs hold comparison: flip gives immediate capital, BRRR recycles capital into a long-term yield-producing asset. Models both paths." },
      { question: "What bridging finance options should I compare?", category: "Finance", insight: "Rate vs fee analysis, whole-of-market comparison, regulated vs unregulated, LTV limits for bridging lenders." },
      { question: "What is my CGT liability on this project?", category: "Tax", insight: "CGT calculation: gain, annual allowance, rate (basic vs higher), net liability, filing deadline." },
    ],
    keyDrivers: ["ARV Accuracy", "Renovation Budget and Scope", "Project Duration", "BMV Discount at Purchase", "CGT Rate"],
    quickStats: [
      { label: "Typical Gross Margin Target", value: "20-35%" },
      { label: "Typical BMV Discount Required", value: "15-25%" },
      { label: "Bridging Finance Rate", value: "0.85-1.1%/mo" },
      { label: "CGT Rate (basic/higher)", value: "18% / 24%" },
      { label: "CGT Filing Deadline", value: "60 days post-sale" },
      { label: "Typical Project Duration", value: "6-12 months" },
    ],
    recommendations: [
      "Run the deal model with a 5% ARV haircut and 15% reno contingency before committing - if the margin disappears, the deal is not robust enough",
      "The profit is made at purchase. BMV discount is the primary lever - buy right or do not buy",
      "Serial flippers should take specialist tax advice on whether trading income or CGT treatment applies",
    ],
    confidenceScore: 88, confidenceLabel: "High Confidence",
  },
  quickActions: [
    { label: "Start Planning Set", sub: "Build your flip deal model", icon: "Play", action: "start-planning" },
    { label: "ARV Calculator", sub: "Comparable analysis", icon: "BarChart2", action: "compare" },
    { label: "Reno Budget Builder", sub: "Cost schedule", icon: "Zap", action: "quick-scenario" },
    { label: "Download Pack", sub: "PDF profile guide", icon: "Download", action: "download" },
  ],
  pros: ["Large capital gain potential in short timeframe", "No ongoing tenancy management", "BMV discount creates built-in margin", "Capital can be recycled repeatedly", "Works in most market conditions if bought right"],
  cons: ["ARV risk if comparable evidence weak", "Renovation cost overrun can wipe margin", "Bridging finance expensive if delayed", "CGT significantly reduces gross profit", "High active management requirement throughout"],
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

export const PROFILE_CONFIGS: ProfileConfig[] = [
  LONG_TERM_LET_CONFIG,
  HMO_CONFIG,
  STUDENT_LET_CONFIG,
  CO_LIVING_CONFIG,
  SERVICED_ACCOMMODATION_CONFIG,
  HOLIDAY_LET_CONFIG,
  RENT_TO_RENT_CONFIG,
  SOCIAL_HOUSING_CONFIG,
  BUILD_TO_RENT_CONFIG,
  COMMERCIAL_CONFIG,
  MIXED_USE_CONFIG,
  REFINANCING_CONFIG,
  DEV_FLIP_CONFIG,
]

export const PROFILE_SLUG_MAP: Record<string, string> = {
  long_term_let: "long-term-let",
  hmo: "hmo",
  student_let: "student-let",
  co_living: "co-living",
  serviced_accommodation: "serviced-accommodation",
  holiday_let: "holiday-let",
  rent_to_rent: "rent-to-rent",
  social_housing: "social-housing",
  build_to_rent: "build-to-rent",
  commercial: "commercial",
  mixed_use: "mixed-use",
  refinancing: "refinancing",
  dev_flip: "dev-flip",
}

export const PROFILE_KEY_MAP: Record<string, string> = {
  "long-term-let": "long_term_let",
  "hmo": "hmo",
  "student-let": "student_let",
  "co-living": "co_living",
  "serviced-accommodation": "serviced_accommodation",
  "holiday-let": "holiday_let",
  "rent-to-rent": "rent_to_rent",
  "social-housing": "social_housing",
  "build-to-rent": "build_to_rent",
  "commercial": "commercial",
  "mixed-use": "mixed_use",
  "refinancing": "refinancing",
  "dev-flip": "dev_flip",
}

export function getProfileBySlug(slug: string): ProfileConfig | undefined {
  return PROFILE_CONFIGS.find((p) => p.slug === slug)
}

export function getProfileByKey(key: string): ProfileConfig | undefined {
  return PROFILE_CONFIGS.find((p) => p.key === key)
}

export function getProfilesByGroup(group: ProfileConfig["group"]): ProfileConfig[] {
  return PROFILE_CONFIGS.filter((p) => p.group === group)
}

export const PROFILE_TAB_SLUGS = [
  "overview",
  "income-model",
  "cost-drivers",
  "compliance",
  "example-forecast",
  "starter-checklist",
  "risks",
  "ai-questions",
] as const

export type ProfileTabSlug = typeof PROFILE_TAB_SLUGS[number]

export interface ProfileTab {
  slug: ProfileTabSlug
  label: string
  icon: string
}

export const PROFILE_TABS: ProfileTab[] = [
  { slug: "overview", label: "Overview", icon: "LayoutDashboard" },
  { slug: "income-model", label: "Income Model", icon: "TrendingUp" },
  { slug: "cost-drivers", label: "Cost Drivers", icon: "Receipt" },
  { slug: "compliance", label: "Compliance", icon: "ShieldCheck" },
  { slug: "example-forecast", label: "Example Forecast", icon: "BarChart3" },
  { slug: "starter-checklist", label: "Starter Checklist", icon: "CheckSquare" },
  { slug: "risks", label: "Risks", icon: "AlertTriangle" },
  { slug: "ai-questions", label: "AI Questions", icon: "Sparkles" },
]

export const PROFILE_GROUPS: { key: ProfileConfig["group"]; label: string; description: string }[] = [
  { key: "residential", label: "Residential", description: "Traditional and HMO residential lettings strategies" },
  { key: "lease-managed", label: "Lease Managed", description: "Rent-to-rent and social housing guaranteed-lease models" },
  { key: "commercial", label: "Commercial", description: "Commercial, mixed-use, and build-to-rent strategies" },
  { key: "capital-strategy", label: "Capital Strategy", description: "Equity release, refinancing, and development flip strategies" },
]
