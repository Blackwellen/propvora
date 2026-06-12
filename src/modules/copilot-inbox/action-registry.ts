export type RiskLevel = "low" | "medium" | "high" | "critical"

export interface CopilotAction {
  key: string
  label: string
  description: string
  sections: string[]
  requiredPermissions: string[]
  requiredPlan?: string
  requiredInputs: string[]
  riskLevel: RiskLevel
  requiresConfirmation: boolean
  requiresHumanApproval: boolean
  creditCost: number
  auditEventType: string
}

export const ACTION_REGISTRY: CopilotAction[] = [
  // Work
  {
    key: "work.create_task",
    label: "Create Task",
    description: "Create a task from current context",
    sections: ["portfolio", "work", "contacts", "money", "planning", "compliance", "calendar"],
    requiredPermissions: ["tasks:create"],
    requiredInputs: ["title", "due_date"],
    riskLevel: "medium",
    requiresConfirmation: true,
    requiresHumanApproval: false,
    creditCost: 1,
    auditEventType: "task_created",
  },
  {
    key: "work.create_job",
    label: "Create Job",
    description: "Create a Work job",
    sections: ["portfolio", "work", "contacts", "compliance"],
    requiredPermissions: ["jobs:create"],
    requiredInputs: ["title", "property_id"],
    riskLevel: "medium",
    requiresConfirmation: true,
    requiresHumanApproval: false,
    creditCost: 1,
    auditEventType: "job_created",
  },

  // Communication
  {
    key: "comms.draft_email",
    label: "Draft Email",
    description: "Draft an email to a contact or supplier",
    sections: ["contacts", "work", "planning", "compliance", "money"],
    requiredPermissions: ["messages:create"],
    requiredInputs: ["contact_id", "subject"],
    riskLevel: "medium",
    requiresConfirmation: true,
    requiresHumanApproval: true,
    creditCost: 2,
    auditEventType: "email_drafted",
  },
  {
    key: "comms.chase_arrears",
    label: "Chase Arrears",
    description: "Draft arrears chase message",
    sections: ["money", "contacts", "portfolio"],
    requiredPermissions: ["messages:create"],
    requiredInputs: [],
    riskLevel: "high",
    requiresConfirmation: true,
    requiresHumanApproval: true,
    creditCost: 2,
    auditEventType: "arrears_chase_drafted",
  },
  {
    key: "comms.draft_supplier",
    label: "Draft Supplier Message",
    description: "Draft message to supplier/contractor",
    sections: ["work", "contacts", "compliance"],
    requiredPermissions: ["messages:create"],
    requiredInputs: ["supplier_id"],
    riskLevel: "medium",
    requiresConfirmation: true,
    requiresHumanApproval: true,
    creditCost: 2,
    auditEventType: "supplier_message_drafted",
  },

  // Analysis
  {
    key: "analysis.summarise",
    label: "Summarise",
    description: "Summarise current page context",
    sections: ["*"],
    requiredPermissions: [],
    requiredInputs: [],
    riskLevel: "low",
    requiresConfirmation: false,
    requiresHumanApproval: false,
    creditCost: 1,
    auditEventType: "summary_generated",
  },
  {
    key: "analysis.review_risk",
    label: "Review Risk",
    description: "Review risk for current record",
    sections: ["portfolio", "compliance", "money", "planning"],
    requiredPermissions: [],
    requiredInputs: [],
    riskLevel: "low",
    requiresConfirmation: false,
    requiresHumanApproval: false,
    creditCost: 1,
    auditEventType: "risk_reviewed",
  },
  {
    key: "analysis.explain_cashflow",
    label: "Explain Cashflow",
    description: "Explain cashflow and forecast",
    sections: ["money", "portfolio", "planning"],
    requiredPermissions: [],
    requiredInputs: [],
    riskLevel: "low",
    requiresConfirmation: false,
    requiresHumanApproval: false,
    creditCost: 1,
    auditEventType: "cashflow_explained",
  },
  {
    key: "analysis.review_property",
    label: "Review Property",
    description: "Full property health review",
    sections: ["portfolio"],
    requiredPermissions: [],
    requiredInputs: ["property_id"],
    riskLevel: "low",
    requiresConfirmation: false,
    requiresHumanApproval: false,
    creditCost: 3,
    auditEventType: "property_reviewed",
  },

  // Compliance
  {
    key: "compliance.review_gaps",
    label: "Review Compliance Gaps",
    description: "Find missing/expiring compliance items",
    sections: ["compliance", "portfolio"],
    requiredPermissions: [],
    requiredInputs: [],
    riskLevel: "low",
    requiresConfirmation: false,
    requiresHumanApproval: false,
    creditCost: 2,
    auditEventType: "compliance_reviewed",
  },
  {
    key: "compliance.create_tasks",
    label: "Create Renewal Tasks",
    description: "Create tasks for expiring certificates",
    sections: ["compliance"],
    requiredPermissions: ["tasks:create"],
    requiredInputs: [],
    riskLevel: "medium",
    requiresConfirmation: true,
    requiresHumanApproval: false,
    creditCost: 2,
    auditEventType: "compliance_tasks_created",
  },
  {
    key: "compliance.find_missing",
    label: "Find Missing Docs",
    description: "Scan for missing compliance documents",
    sections: ["compliance", "portfolio"],
    requiredPermissions: [],
    requiredInputs: [],
    riskLevel: "low",
    requiresConfirmation: false,
    requiresHumanApproval: false,
    creditCost: 2,
    auditEventType: "missing_docs_found",
  },

  // Planning
  {
    key: "planning.review",
    label: "Review Planning Set",
    description: "Review margin and risk of planning set",
    sections: ["planning"],
    requiredPermissions: [],
    requiredInputs: ["planning_set_id"],
    riskLevel: "low",
    requiresConfirmation: false,
    requiresHumanApproval: false,
    creditCost: 2,
    auditEventType: "planning_reviewed",
  },
  {
    key: "planning.draft_offer",
    label: "Draft Landlord Offer",
    description: "Draft offer letter for landlord",
    sections: ["planning", "contacts"],
    requiredPermissions: ["planning:write"],
    requiredInputs: ["planning_set_id", "landlord_id"],
    riskLevel: "high",
    requiresConfirmation: true,
    requiresHumanApproval: true,
    creditCost: 3,
    auditEventType: "offer_drafted",
  },

  // Money
  {
    key: "money.find_overdue",
    label: "Find Overdue Invoices",
    description: "List all overdue invoices",
    sections: ["money", "portfolio", "contacts"],
    requiredPermissions: [],
    requiredInputs: [],
    riskLevel: "low",
    requiresConfirmation: false,
    requiresHumanApproval: false,
    creditCost: 1,
    auditEventType: "overdue_found",
  },
  {
    key: "money.generate_report",
    label: "Generate Report",
    description: "Generate money summary report",
    sections: ["money"],
    requiredPermissions: ["reports:read"],
    requiredInputs: ["date_range"],
    riskLevel: "low",
    requiresConfirmation: false,
    requiresHumanApproval: false,
    creditCost: 3,
    auditEventType: "report_generated",
  },
]

export function getActionsBySection(section: string): CopilotAction[] {
  return ACTION_REGISTRY.filter(
    (a) => a.sections.includes(section) || a.sections.includes("*")
  )
}

export function getAction(key: string): CopilotAction | undefined {
  return ACTION_REGISTRY.find((a) => a.key === key)
}
