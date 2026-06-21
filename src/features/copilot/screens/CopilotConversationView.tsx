"use client"

import { useState, useRef, useEffect } from "react"
import { ArrowLeft, MoreHorizontal, ExternalLink, Send, Paperclip } from "lucide-react"
import PersonAvatar from "../components/PersonAvatar"
import { useCopilotPageContext } from "../context/useCopilotPageContext"

interface ConversationMessage {
  id: string
  role: "contact" | "ai"
  content: string
  time: string
  read?: boolean
  card?: "context" | "choice" | "task-result" | "quick-reply"
}

const MESSAGES: ConversationMessage[] = [
  {
    id: "m1",
    role: "contact",
    content: "Hi, the heating in my flat isn't working.",
    time: "09:41",
    read: true,
  },
  {
    id: "m2",
    role: "ai",
    content:
      "I'm sorry to hear that, Emma. I can help you get this sorted. Let me check the property and recent history.",
    time: "09:41",
    card: "context",
  },
  {
    id: "m3",
    role: "contact",
    content: "It stopped working this morning. The radiators are cold.",
    time: "09:42",
    read: true,
  },
  {
    id: "m4",
    role: "ai",
    content:
      "Thanks for the details. I'll raise a maintenance task with our heating contractor. What time works best for access?",
    time: "09:42",
    card: "choice",
  },
  {
    id: "m5",
    role: "contact",
    content: "Afternoon (12pm–4pm) works.",
    time: "09:43",
    read: true,
  },
  {
    id: "m6",
    role: "ai",
    content:
      "All set. I've raised the task and notified the contractor. They'll update you once they're on the way. Is there anything else I can help with?",
    time: "09:43",
    card: "task-result",
  },
]

function AiIcon() {
  return (
    <div
      style={{
        width: 28,
        height: 28,
        borderRadius: 8,
        background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <span className="text-white" style={{ fontSize: 12, lineHeight: 1 }}>✦</span>
    </div>
  )
}

function ContextCard() {
  return (
    <div className="mt-2 rounded-xl border border-slate-200 bg-white p-3 text-[11px]">
      <div className="flex items-center gap-1.5 text-green-600 font-semibold mb-1">
        <span>✅</span> No open heating issues
      </div>
      <p className="text-slate-500">No similar issues reported in the last 30 days.</p>
      <button className="text-blue-600 font-semibold mt-1.5 hover:underline">
        View property equipment →
      </button>
    </div>
  )
}

function ChoiceCard() {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {["Morning (9am–12pm)", "Afternoon (12pm–4pm)", "Anytime"].map((opt) => (
        <button
          key={opt}
          className="px-3 py-1.5 rounded-xl border border-slate-200 text-[11px] font-semibold text-slate-700 hover:bg-blue-50 hover:border-blue-200 transition-all"
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

function TaskResultCard() {
  return (
    <div className="mt-2 rounded-xl border border-blue-100 bg-blue-50 p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11.5px] font-bold text-slate-800">Heating issue — No heat in flat</p>
        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white">
          Scheduled
        </span>
      </div>
      <div className="text-[10.5px] text-slate-600 space-y-0.5">
        <p>Task #T-48291</p>
        <p>Contractor: Warm &amp; Co. Heating Ltd</p>
        <p>When: Today, 12pm–4pm</p>
        <p>Status: Assigned</p>
      </div>
      <button className="text-blue-600 text-[11px] font-semibold mt-2 hover:underline">
        View task details →
      </button>
    </div>
  )
}

function QuickReplies() {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {["What causes this?", "How do I reset the thermostat?", "Report another issue"].map((r) => (
        <button
          key={r}
          className="px-2.5 py-1 rounded-full border border-blue-200 text-blue-600 text-[10.5px] font-semibold hover:bg-blue-50 transition-colors"
        >
          {r}
        </button>
      ))}
    </div>
  )
}

interface CopilotConversationViewProps {
  onBack: () => void
  isExpanded: boolean
  /** ID of the conversation to load. Currently unused — shell passes it for future wiring. */
  conversationId?: string | null
}

export default function CopilotConversationView({
  onBack,
  isExpanded,
}: CopilotConversationViewProps) {
  const [inputValue, setInputValue] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const context = useCopilotPageContext()

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [])

  function handleSend() {
    setInputValue("")
  }

  return (
    <div className="flex h-full min-h-0">
      {/* Main conversation */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        {/* Header */}
        <div className="flex items-start justify-between px-4 py-3 border-b border-slate-100 shrink-0">
          <div className="flex items-start gap-3">
            <button
              onClick={onBack}
              className="w-7 h-7 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all flex items-center justify-center mt-1 shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-start gap-3">
              <PersonAvatar name="Emma Reynolds" size={48} />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-bold text-slate-900">Emma Reynolds</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700">
                    Tenant
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">16 Rose Gardens, London SW1A 1AA</p>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="text-[10px] text-slate-500">✉ emma.reynolds@email.com</span>
                  <span className="text-[10px] text-slate-500">📞 +44 7700 900123</span>
                  <span className="text-[10px] text-slate-500">🏠 Tenant since Apr 2023</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors">
              View tenant profile
              <ExternalLink className="w-3 h-3" />
            </button>
            <button className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all flex items-center justify-center">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4 min-h-0">
          {MESSAGES.map((msg) => {
            const isContact = msg.role === "contact"
            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${isContact ? "flex-row-reverse" : "flex-row"} items-end`}
              >
                <div className="shrink-0 mb-0.5">
                  {isContact ? (
                    <PersonAvatar name="Emma Reynolds" size={26} />
                  ) : (
                    <AiIcon />
                  )}
                </div>
                <div className={`flex flex-col gap-1 max-w-[80%] ${isContact ? "items-end" : "items-start"}`}>
                  <div
                    className={`px-3.5 py-2.5 rounded-2xl text-[12.5px] leading-relaxed ${
                      isContact
                        ? "bg-slate-100 text-slate-800 rounded-br-md"
                        : "bg-white border border-slate-200 text-slate-800 rounded-bl-md shadow-sm"
                    }`}
                  >
                    {msg.content}
                    {isContact && msg.read && (
                      <span className="text-[9px] text-blue-500 ml-1.5">✓✓</span>
                    )}
                  </div>
                  {msg.card === "context" && <ContextCard />}
                  {msg.card === "choice" && <ChoiceCard />}
                  {msg.card === "task-result" && (
                    <>
                      <TaskResultCard />
                      <QuickReplies />
                    </>
                  )}
                  <span className="text-[10px] text-slate-400 px-1">{msg.time}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Input */}
        <div className="px-4 pb-4 pt-2 shrink-0">
          <div className="border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask Copilot or type / for actions..."
              rows={1}
              className="w-full px-4 pt-3 pb-2 text-[13px] text-slate-800 placeholder-slate-400 resize-none outline-none bg-transparent"
              style={{ minHeight: 40, maxHeight: 100 }}
              onInput={(e) => {
                const el = e.currentTarget
                el.style.height = "auto"
                el.style.height = Math.min(el.scrollHeight, 100) + "px"
              }}
            />
            <div className="flex items-center justify-between px-3 pb-2.5">
              <div className="flex items-center gap-1">
                <button className="w-7 h-7 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center text-[13px] font-bold">
                  /
                </button>
                <button className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all flex items-center justify-center">
                  <Paperclip className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 hidden sm:inline">⇧⌘↩ to send</span>
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim()}
                  className="w-7 h-7 rounded-lg bg-violet-600 text-white flex items-center justify-center hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right context rail — expanded only. Hidden below lg so the expanded
          panel on phones keeps the conversation full-width instead of being
          crushed by a fixed 260px rail. */}
      {isExpanded && (
        <div className="hidden lg:block w-[260px] shrink-0 border-l border-slate-100 overflow-y-auto">
          <div className="p-4 flex flex-col gap-4">
            {/* Contact overview */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">
                Contact overview
              </p>
              <div className="rounded-xl border border-slate-100 bg-white p-3">
                <div className="flex items-center gap-2 mb-2">
                  <PersonAvatar name="Emma Reynolds" size={36} />
                  <div>
                    <p className="text-[12px] font-bold text-slate-800">Emma Reynolds</p>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">
                      Active
                    </span>
                  </div>
                </div>
                <div className="text-[10.5px] text-slate-500 space-y-1">
                  <p>✉ emma.reynolds@email.com</p>
                  <p>📞 +44 7700 900123</p>
                  <p>📅 Tenant since Apr 2023</p>
                </div>
                <button className="text-blue-600 text-[10px] font-semibold mt-2 hover:underline">
                  View full profile ↗
                </button>
              </div>
            </div>

            {/* Linked property */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">
                Linked property
              </p>
              <div className="rounded-xl border border-slate-100 overflow-hidden">
                <div
                  className="h-16"
                  style={{
                    background: "linear-gradient(135deg, #1E40AF 0%, #7C3AED 100%)",
                  }}
                />
                <div className="p-3">
                  <p className="text-[12px] font-bold text-slate-800">16 Rose Gardens</p>
                  <p className="text-[10.5px] text-slate-500">London SW1A 1AA</p>
                  <p className="text-[10.5px] text-slate-500">2 bed flat · Ground floor</p>
                  <button className="text-blue-600 text-[10px] font-semibold mt-1.5 hover:underline">
                    View property ↗
                  </button>
                </div>
              </div>
            </div>

            {/* Account snapshot */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">
                Account snapshot
              </p>
              <div className="rounded-xl border border-slate-100 bg-white p-3">
                <div className="space-y-1.5 text-[10.5px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Monthly rent</span>
                    <span className="font-semibold text-slate-800">£1,850.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Next payment</span>
                    <span className="font-semibold text-slate-800">1 Jun 2025</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Deposit held</span>
                    <span className="font-semibold text-slate-800">£1,850.00</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Balance</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">
                      Up to date
                    </span>
                  </div>
                </div>
                <button className="text-blue-600 text-[10px] font-semibold mt-2 hover:underline">
                  View account ↗
                </button>
              </div>
            </div>

            {/* Recent activity */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">
                Recent activity
              </p>
              <div className="rounded-xl border border-slate-100 bg-white p-3">
                <div className="space-y-2 text-[10.5px]">
                  <div className="flex gap-2">
                    <span>✅</span>
                    <div>
                      <p className="font-medium text-slate-700">Rent payment received</p>
                      <p className="text-slate-400">1 May 2025</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span>✅</span>
                    <div>
                      <p className="font-medium text-slate-700">Safety certificate up to date</p>
                      <p className="text-slate-400">14 Mar 2025</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span>🔧</span>
                    <div>
                      <p className="font-medium text-slate-700">Maintenance task completed</p>
                      <p className="text-slate-400">12 Feb 2025 · Boiler service</p>
                    </div>
                  </div>
                </div>
                <button className="text-blue-600 text-[10px] font-semibold mt-2 hover:underline">
                  View all activity ↗
                </button>
              </div>
            </div>

            {/* Suggested next steps */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">
                Suggested next steps
              </p>
              <div className="flex flex-col gap-1.5">
                {[
                  { icon: "✉", label: "Send heating guidance", desc: "Quick tips for tenants" },
                  { icon: "⚙", label: "Check heating system", desc: "View equipment & servicing" },
                  { icon: "🕐", label: "Follow up in 24 hours", desc: "Set a reminder to check in" },
                ].map((step) => (
                  <button
                    key={step.label}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors text-left"
                  >
                    <span className="text-[14px] shrink-0">{step.icon}</span>
                    <div>
                      <p className="text-[11px] font-semibold text-slate-700">{step.label}</p>
                      <p className="text-[10px] text-slate-400">{step.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
