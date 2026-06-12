"use client"

import { useState, useRef, KeyboardEvent } from "react"
import { Paperclip, Send } from "lucide-react"
import SlashCommandPalette from "./SlashCommandPalette"
import type { CopilotPageContext } from "../context/useCopilotPageContext"

interface CopilotChatInputProps {
  context: CopilotPageContext
  onSend: (message: string) => void
  placeholder?: string
}

export default function CopilotChatInput({
  context,
  onSend,
  placeholder = "Ask Copilot about this page or type / for actions...",
}: CopilotChatInputProps) {
  const [value, setValue] = useState("")
  const [showPalette, setShowPalette] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const v = e.target.value
    setValue(v)
    if (v === "/" || v.startsWith("/")) {
      setShowPalette(true)
    } else {
      setShowPalette(false)
    }
  }

  function handleSend() {
    const msg = value.trim()
    if (!msg) return
    onSend(msg)
    setValue("")
    setShowPalette(false)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.shiftKey && e.metaKey && e.key === "Enter") || (e.ctrlKey && e.key === "Enter")) {
      e.preventDefault()
      handleSend()
      return
    }
    if (e.key === "Escape" && showPalette) {
      setShowPalette(false)
    }
  }

  function handleSlashSelect(cmd: string) {
    setValue(cmd + " ")
    setShowPalette(false)
    inputRef.current?.focus()
  }

  function handleSlashButton() {
    setValue("/")
    setShowPalette(true)
    inputRef.current?.focus()
  }

  return (
    <div className="relative">
      {/* Slash palette */}
      {showPalette && (
        <SlashCommandPalette
          query={value}
          context={context}
          onSelect={handleSlashSelect}
          onClose={() => setShowPalette(false)}
        />
      )}

      <div className="border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
        {/* Textarea */}
        <textarea
          ref={inputRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          className="w-full px-4 pt-3 pb-2 text-[13px] text-slate-800 placeholder-slate-400 resize-none outline-none bg-transparent"
          style={{ minHeight: 40, maxHeight: 120 }}
          onInput={(e) => {
            const el = e.currentTarget
            el.style.height = "auto"
            el.style.height = Math.min(el.scrollHeight, 120) + "px"
          }}
        />

        {/* Toolbar row */}
        <div className="flex items-center justify-between px-3 pb-2.5">
          <div className="flex items-center gap-1">
            {/* Slash button */}
            <button
              onClick={handleSlashButton}
              title="Slash commands"
              className="w-7 h-7 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center text-[13px] font-bold"
            >
              /
            </button>
            {/* Attach */}
            <button
              title="Attach file"
              className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all flex items-center justify-center"
            >
              <Paperclip className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 hidden sm:inline">
              ⇧⌘↩ to send
            </span>
            <button
              onClick={handleSend}
              disabled={!value.trim()}
              className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              title="Send message"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Hint */}
      <p className="text-[10px] text-slate-400 text-center mt-1.5">
        Context-aware replies only. Type / to run an action.
      </p>
    </div>
  )
}
