"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import {
  Send,
  BookOpen,
  CheckSquare,
  Mail,
  AlertTriangle,
  Shield,
  Briefcase,
  Truck,
  Search,
  TrendingUp,
  Building2,
} from "lucide-react"
import { motion } from "framer-motion"

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */
interface CopilotMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
  actionCard?: ActionDraft
  requiresApproval?: boolean
}

interface ActionDraft {
  label: string
  content: string
}

interface SlashCommand {
  key: string
  label: string
  desc: string
  icon: string
  credits: number
}

/* ------------------------------------------------------------------ */
/* Demo messages                                                        */
/* ------------------------------------------------------------------ */
const DEMO_MESSAGES: CopilotMessage[] = [
  {
    id: "m1",
    role: "assistant",
    content:
      "Hello! I'm Propvora Copilot. I can help you manage your properties, chase arrears, review compliance, draft messages, and much more.\n\nWhat would you like to do today?",
    timestamp: "Just now",
  },
  {
    id: "m2",
    role: "user",
    content: "Which properties need attention today?",
    timestamp: "Just now",
  },
  {
    id: "m3",
    role: "assistant",
    content:
      "Based on your current portfolio, here are the items needing attention today:\n\n• **8 Clarence Rd** — Gas cert expired 5 days ago — renewal overdue\n• **16 Rose Gardens** — EICR expired — urgent renewal required\n• **22 Park Lane** — Move-out inspection overdue by 1 day\n• **5 Tower St** — Arrears chase due today — £850 outstanding\n• **INV-2045** — Invoice due today — £4,200 — Brookfield Properties\n\nWould you like me to draft chase messages or create renewal tasks for any of these?",
    timestamp: "Just now",
  },
]

/* ------------------------------------------------------------------ */
/* Slash commands                                                       */
/* ------------------------------------------------------------------ */
const SLASH_COMMANDS: SlashCommand[] = [
  { key: "summarise",           label: "/summarise",             desc: "Summarise current page or record",     icon: "BookOpen",      credits: 1 },
  { key: "create-task",         label: "/create-task",           desc: "Create a task from context",          icon: "CheckSquare",   credits: 1 },
  { key: "draft-email",         label: "/draft-email",           desc: "Draft an email to contact/supplier",  icon: "Mail",          credits: 2 },
  { key: "chase-arrears",       label: "/chase-arrears",         desc: "Find and draft arrears chase",        icon: "AlertTriangle", credits: 2 },
  { key: "review-compliance",   label: "/review-compliance",     desc: "Check compliance gaps",               icon: "Shield",        credits: 2 },
  { key: "create-job",          label: "/create-job",            desc: "Create a Work job",                   icon: "Briefcase",     credits: 1 },
  { key: "draft-supplier",      label: "/draft-supplier-message",desc: "Draft message to supplier",           icon: "Truck",         credits: 2 },
  { key: "find-missing",        label: "/find-missing-docs",     desc: "Find missing compliance docs",        icon: "Search",        credits: 2 },
  { key: "explain",             label: "/explain-cashflow",      desc: "Explain cashflow or forecast",        icon: "TrendingUp",    credits: 1 },
  { key: "review-property",     label: "/review-property",       desc: "Full property review",                icon: "Building2",     credits: 3 },
]

const CMD_ICONS: Record<string, React.ElementType> = {
  BookOpen,
  CheckSquare,
  Mail,
  AlertTriangle,
  Shield,
  Briefcase,
  Truck,
  Search,
  TrendingUp,
  Building2,
}

/* ------------------------------------------------------------------ */
/* Content renderer (markdown-style bold + line breaks)                */
/* ------------------------------------------------------------------ */
function renderContent(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    const lines = part.split("\n")
    return lines.map((line, j) => (
      <span key={`${i}-${j}`}>
        {line}
        {j < lines.length - 1 ? <br /> : null}
      </span>
    ))
  })
}

/* ------------------------------------------------------------------ */
/* AiCopilotPanel                                                       */
/* ------------------------------------------------------------------ */
export default function AiCopilotPanel() {
  const [messages, setMessages] = useState<CopilotMessage[]>(DEMO_MESSAGES)
  const [input, setInput] = useState("")
  const [isThinking, setIsThinking] = useState(false)
  const [showSlashMenu, setShowSlashMenu] = useState(false)
  const [creditCount] = useState(75)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isThinking])

  async function handleSend() {
    if (!input.trim()) return
    const userMsg: CopilotMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: "Just now",
    }
    setMessages((m) => [...m, userMsg])
    setInput("")
    setShowSlashMenu(false)
    setIsThinking(true)
    await new Promise((r) => setTimeout(r, 1500))
    setIsThinking(false)
    const aiMsg: CopilotMessage = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content:
        "I've noted that. This is a demo — in production, I'll use your current page context and workspace data to give a relevant response.\n\nType / to see available commands, or ask me anything about your properties.",
      timestamp: "Just now",
    }
    setMessages((m) => [...m, aiMsg])
  }

  function handleSlashCommand(cmd: SlashCommand) {
    setInput(cmd.label + " ")
    setShowSlashMenu(false)
  }

  const filteredCommands = SLASH_COMMANDS.filter((c) =>
    c.label.includes(input.slice(1).toLowerCase())
  )

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        {messages.map((message) =>
          message.role === "user" ? (
            <div key={message.id} className="flex justify-end mb-3">
              <div className="max-w-[80%] bg-[#2563EB] text-white rounded-2xl rounded-br-sm px-4 py-3 text-[13px] leading-relaxed shadow-sm">
                {message.content}
                <span className="block text-[10px] text-white/60 mt-1 text-right">
                  {message.timestamp}
                </span>
              </div>
            </div>
          ) : (
            <div key={message.id} className="flex items-start gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-xl bg-white border border-slate-100 flex items-center justify-center shrink-0 shadow-sm mt-0.5 overflow-hidden">
                <Image src="/propvora-favicon.png" alt="Propvora" width={24} height={24} className="w-6 h-6 object-contain" />
              </div>
              <div className="max-w-[82%]">
                <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 text-[13px] text-slate-800 leading-relaxed">
                  {renderContent(message.content)}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 ml-1 block">
                  {message.timestamp}
                </span>
              </div>
            </div>
          )
        )}

        {/* Thinking indicator */}
        {isThinking && (
          <div className="flex items-start gap-2.5 mb-3">
            <div className="w-7 h-7 rounded-xl bg-white border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
              <Image src="/propvora-favicon.png" alt="Propvora" width={24} height={24} className="w-6 h-6 object-contain" />
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 bg-[#2563EB]/60 rounded-full"
                    animate={{ scale: [1, 1.4, 1] }}
                    transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.2 }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick suggestion chips */}
      <div className="px-4 py-2.5 border-t border-slate-100 flex items-center gap-2 flex-wrap shrink-0">
        {["Summarise today", "Chase arrears", "Review compliance"].map((s) => (
          <button
            key={s}
            onClick={() => setInput(s)}
            className="text-[11.5px] px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors border border-blue-100 font-medium"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Composer */}
      <div className="shrink-0 border-t border-slate-100 bg-white p-3">
        <div className="relative">
          {/* Slash command menu */}
          {showSlashMenu && filteredCommands.length > 0 && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-10 max-h-64 overflow-y-auto">
              <div className="px-3 py-2 border-b border-slate-100 bg-slate-50">
                <p className="text-[11px] font-semibold text-slate-500">Slash Commands</p>
              </div>
              {filteredCommands.map((cmd) => {
                const Icon = CMD_ICONS[cmd.icon] ?? Search
                return (
                  <button
                    key={cmd.key}
                    onClick={() => handleSlashCommand(cmd)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50 transition-colors text-left"
                  >
                    <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      <Icon className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-slate-800">{cmd.label}</p>
                      <p className="text-[11px] text-slate-400">{cmd.desc}</p>
                    </div>
                    <span className="text-[10px] text-violet-500 font-medium shrink-0">
                      {cmd.credits} cr
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 focus-within:border-[#2563EB] focus-within:bg-white transition-all">
            <textarea
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                setShowSlashMenu(e.target.value.startsWith("/"))
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder="Ask Propvora Copilot or type /"
              className="flex-1 bg-transparent text-[13px] text-slate-800 placeholder:text-slate-400 resize-none outline-none min-h-[20px] max-h-[100px]"
              rows={1}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isThinking}
              className="w-8 h-8 rounded-xl bg-[#2563EB] text-white flex items-center justify-center disabled:opacity-40 transition-all hover:bg-[#1d4ed8] shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Credit meter */}
        <div className="flex items-center justify-between mt-2 px-1">
          <p className="text-[10px] text-slate-400">
            AI credits: {100 - creditCount} remaining
          </p>
          <p className="text-[10px] text-slate-400">Shift+Enter for new line</p>
        </div>
      </div>
    </div>
  )
}
