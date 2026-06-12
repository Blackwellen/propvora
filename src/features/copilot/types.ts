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

export interface ChatMessage {
  id: string
  role: "user" | "ai"
  content: string
  timestamp: string
  card?: "compliance-result" | "draft-message"
}
