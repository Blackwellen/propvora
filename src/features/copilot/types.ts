export type CopilotTab = "copilot" | "inbox"
export type InboxScreen = "list" | "new-conversation" | "conversation"

export interface ConversationContact {
  id: string
  name: string
  role: string
  type: "tenant" | "landlord" | "supplier" | "business" | "team"
  company?: string
  property?: string
  unit?: string
  email?: string
  unread: number
  lastMessage: string
  lastMessageTime: string
  priority: "High" | "Medium" | "Low"
  status: "Open" | "Waiting" | "Closed"
  isUnread: boolean
}

export interface SuggestedContact {
  id: string
  name: string
  role: string
  company?: string
  property?: string
  unit?: string
  email?: string
  type: "tenant" | "landlord" | "supplier" | "business" | "team"
}

export interface ComplianceItem {
  icon: string
  title: string
  detail: string
  badge: "overdue" | "due-soon" | "compliant"
  action: string
}

export interface QuickAction {
  slug: string
  label: string
}

/** One step of an agent plan. */
export interface AgentAction { tool: string; args: Record<string, unknown>; label: string }
/** A multi-step agent plan (batch of proposed actions). */
export interface AgentPlanSpec { summary: string; actions: AgentAction[]; workspaceId?: string; chatId?: string }

/** A permissioned action the user can approve to execute (via /api/ai/tool). */
export interface ApprovalSpec {
  tool: string
  args: Record<string, unknown>
  workspaceId?: string
  chatId?: string
  estimateCredits: number
}

export interface ChatMessage {
  id: string
  role: "user" | "ai"
  content: string
  timestamp: string
  card?: "compliance-result" | "draft-message"
  /** When set, an approval card is shown under this message. */
  approval?: ApprovalSpec
  /** When set, a "navigate there" action is shown under this message. */
  navTarget?: { route: string; label: string }
  /** When set, a multi-step agent plan (batch of proposed actions) is shown. */
  agentPlan?: AgentPlanSpec
  /** Suggested follow-up commands shown as clickable chips below this message. */
  quickActions?: QuickAction[]
}
