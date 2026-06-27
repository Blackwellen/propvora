"use client"

import { Bold, Italic, Underline, List, Link2, Smile, Paperclip, Send } from "lucide-react"

interface Props {
  draft: string
  onDraftChange: (v: string) => void
  onSend: () => void
  onQuickReply: (text: string) => void
}

const FORMAT_ACTIONS = [
  { Icon: Bold,       label: "Bold" },
  { Icon: Italic,     label: "Italic" },
  { Icon: Underline,  label: "Underline" },
  { Icon: List,       label: "Bulleted list" },
  { Icon: Link2,      label: "Insert link" },
  { Icon: Smile,      label: "Insert emoji" },
  { Icon: Paperclip,  label: "Attach file" },
] as const

export default function MessageComposer({ draft, onDraftChange, onSend, onQuickReply }: Props) {
  return (
    <div>
      <div className="px-4 pt-2 flex items-center gap-2">
        {["Thanks!", "Sounds good", "Can't wait", "See you soon"].map((q) => (
          <button
            key={q}
            onClick={() => onQuickReply(q)}
            className="rounded-full border border-slate-200 px-3 py-1 text-[12px] text-slate-600 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40"
          >
            {q}
          </button>
        ))}
      </div>
      <div className="p-3 border-t border-slate-100 mt-2">
        <div className="flex items-center gap-1 mb-2 text-slate-400" role="toolbar" aria-label="Text formatting">
          {FORMAT_ACTIONS.map(({ Icon, label }) => (
            <button
              key={label}
              aria-label={label}
              type="button"
              className="w-7 h-7 rounded hover:bg-slate-100 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40"
            >
              <Icon className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          ))}
        </div>
        <div className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            placeholder="Type your message…"
            aria-label="Message"
            rows={2}
            className="flex-1 bg-slate-50 rounded-xl px-3 py-2 text-[13px] outline-none resize-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:bg-white transition-colors"
          />
          <button
            onClick={onSend}
            aria-label="Send message"
            className="inline-flex items-center gap-1.5 bg-[#0D1B2A] text-white rounded-xl px-4 py-2.5 text-[13px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/40 focus-visible:ring-offset-2"
          >
            <Send className="w-4 h-4" aria-hidden="true" /> Send
          </button>
        </div>
      </div>
    </div>
  )
}
