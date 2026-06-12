"use client"

import type { ConversationContact } from "../types"
import PersonAvatar from "./PersonAvatar"
import BusinessLogoAvatar from "./BusinessLogoAvatar"

interface InboxConversationRowProps {
  conversation: ConversationContact
  onOpen: (id: string) => void
}

function PriorityBadge({ priority }: { priority: ConversationContact["priority"] }) {
  const styles = {
    High: "bg-red-100 text-red-700 border-red-200",
    Medium: "bg-amber-100 text-amber-700 border-amber-200",
    Low: "bg-slate-100 text-slate-500 border-slate-200",
  }
  return (
    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 ${styles[priority]}`}>
      {priority}
    </span>
  )
}

function StatusBadge({ status }: { status: ConversationContact["status"] }) {
  const styles = {
    Open: "border-blue-300 text-blue-600",
    Waiting: "border-amber-300 text-amber-600",
    Closed: "border-slate-300 text-slate-500",
  }
  return (
    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 ${styles[status]}`}>
      {status}
    </span>
  )
}

function TypeBadge({ type }: { type: ConversationContact["type"] }) {
  const labels: Record<ConversationContact["type"], string> = {
    tenant: "Tenant",
    landlord: "Landlord",
    supplier: "Supplier",
    business: "Business",
    team: "Team",
  }
  const styles: Record<ConversationContact["type"], string> = {
    tenant: "bg-violet-100 text-violet-700",
    landlord: "bg-emerald-100 text-emerald-700",
    supplier: "bg-orange-100 text-orange-700",
    business: "bg-blue-100 text-blue-700",
    team: "bg-slate-100 text-slate-600",
  }
  return (
    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${styles[type]}`}>
      {labels[type]}
    </span>
  )
}

export default function InboxConversationRow({
  conversation,
  onOpen,
}: InboxConversationRowProps) {
  const isBusiness = conversation.type === "business" || conversation.type === "supplier"

  return (
    <button
      onClick={() => onOpen(conversation.id)}
      className="w-full flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left border-b border-slate-50 last:border-0"
    >
      {/* Avatar with unread dot */}
      <div className="relative shrink-0 mt-0.5">
        {conversation.isUnread && (
          <span
            className="absolute -left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-500"
            aria-label="Unread"
          />
        )}
        {isBusiness ? (
          <BusinessLogoAvatar name={conversation.name} size={44} />
        ) : (
          <PersonAvatar name={conversation.name} size={44} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
          <span className={`text-[13px] font-semibold truncate ${conversation.isUnread ? "text-slate-900" : "text-slate-700"}`}>
            {conversation.name}
          </span>
          <TypeBadge type={conversation.type} />
        </div>
        <p className="text-[11.5px] text-slate-500 truncate leading-snug">
          {conversation.lastMessage}
        </p>
        {conversation.property && (
          <p className="text-[10px] text-slate-400 mt-0.5 truncate">
            📍 {conversation.property}{conversation.unit ? `, ${conversation.unit}` : ""}
          </p>
        )}
      </div>

      {/* Right meta */}
      <div className="flex flex-col items-end gap-1 shrink-0 ml-1">
        <span className="text-[10px] text-slate-400">{conversation.lastMessageTime}</span>
        <div className="flex items-center gap-1">
          <PriorityBadge priority={conversation.priority} />
          <StatusBadge status={conversation.status} />
        </div>
        {conversation.unread > 0 && (
          <span className="w-5 h-5 rounded-full bg-violet-600 text-white text-[9px] font-bold flex items-center justify-center">
            {conversation.unread}
          </span>
        )}
      </div>
    </button>
  )
}
