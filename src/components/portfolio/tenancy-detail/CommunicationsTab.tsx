"use client"

import React, { useState } from "react"
import { useWorkspace } from "@/providers/AuthProvider"
import { useTenancyMessages, useSendTenancyMessage } from "@/hooks/useTenancyThread"
import { cn } from "@/lib/utils"
import { Mail, Phone, MessageCircle, Send } from "lucide-react"
import { SectionCard, fmtTime, dayLabel, nameInitials, type TenancyDisplay } from "./shared"

export function CommunicationsTab({ t, tenancyId }: { t: TenancyDisplay; tenancyId: string }) {
  const { workspace } = useWorkspace()
  const hasContact = !!(t.tenantEmail || t.tenantPhone)
  const { data: messages = [], isLoading } = useTenancyMessages(workspace?.id, tenancyId)
  const sendMessage = useSendTenancyMessage()
  const [draft, setDraft] = useState("")
  const threadRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight
  }, [messages])

  async function handleSend() {
    const body = draft.trim()
    if (!body || !workspace?.id || sendMessage.isPending) return
    try {
      await sendMessage.mutateAsync({
        workspaceId: workspace.id,
        tenancyId,
        title: `${t.tenantName} — ${t.property}`,
        body,
      })
      setDraft("")
    } catch { /* mutation surfaces error state below */ }
  }

  return (
    <div className="mt-4 flex flex-col gap-4">
      <SectionCard className="p-5">
        <h3 className="text-[14px] font-bold text-slate-900 mb-3">Contact Tenant</h3>
        {hasContact ? (
          <div className="flex flex-wrap gap-3">
            {t.tenantEmail && (
              <a href={`mailto:${t.tenantEmail}`} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:border-[var(--color-brand-300)] hover:bg-[var(--brand-soft)] transition-colors">
                <Mail className="w-4 h-4 text-[var(--brand)]" />
                <div>
                  <div className="text-[13px] font-semibold text-slate-800">{t.tenantEmail}</div>
                  <div className="text-[11px] text-slate-500">Send email</div>
                </div>
              </a>
            )}
            {t.tenantPhone && (
              <a href={`tel:${t.tenantPhone}`} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:border-[var(--color-brand-300)] hover:bg-[var(--brand-soft)] transition-colors">
                <Phone className="w-4 h-4 text-[var(--brand)]" />
                <div>
                  <div className="text-[13px] font-semibold text-slate-800">{t.tenantPhone}</div>
                  <div className="text-[11px] text-slate-500">Call tenant</div>
                </div>
              </a>
            )}
          </div>
        ) : (
          <div className="py-8 text-center">
            <MessageCircle className="w-7 h-7 text-slate-200 mx-auto mb-2" />
            <p className="text-[13px] text-slate-500">No contact details for this tenant</p>
            <p className="text-[12px] text-slate-500 mt-1">Add a phone or email to the tenant contact to enable communication.</p>
          </div>
        )}
      </SectionCard>

      <SectionCard className="flex flex-col overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-[var(--brand)]" />
          <h3 className="text-[14px] font-bold text-slate-900">Message Thread</h3>
          {messages.length > 0 && (
            <span className="text-[11px] font-semibold text-slate-500">{messages.length} message{messages.length === 1 ? "" : "s"}</span>
          )}
        </div>

        <div ref={threadRef} className="max-h-[440px] overflow-y-auto px-4 sm:px-5 py-4 flex flex-col gap-1.5 bg-slate-50/40">
          {isLoading ? (
            <div className="flex flex-col gap-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className={cn("h-12 rounded-2xl bg-slate-100 animate-pulse", i % 2 ? "self-end w-1/2" : "self-start w-2/3")} />
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <MessageCircle className="w-7 h-7 text-slate-300" />
              </div>
              <p className="text-[13px] font-semibold text-slate-600">No messages yet</p>
              <p className="text-[12px] text-slate-500 mt-1">Start the conversation with a message below.</p>
            </div>
          ) : (
            messages.map((m, i) => {
              const prev = messages[i - 1]
              const showDay = !prev || dayLabel(prev.created_at) !== dayLabel(m.created_at)
              const grouped = !!prev && prev.mine === m.mine && !showDay
              const senderLabel = m.mine ? "You" : m.sender_name
              return (
                <React.Fragment key={m.id}>
                  {showDay && (
                    <div className="flex items-center gap-3 my-3">
                      <div className="flex-1 h-px bg-slate-200/70" />
                      <span className="text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 rounded-full px-2.5 py-0.5">{dayLabel(m.created_at)}</span>
                      <div className="flex-1 h-px bg-slate-200/70" />
                    </div>
                  )}
                  <div className={cn("flex items-end gap-2 max-w-[82%]", m.mine ? "self-end flex-row-reverse" : "self-start", grouped ? "mt-0.5" : "mt-2")}>
                    {!m.mine && (
                      grouped
                        ? <div className="w-7 shrink-0" />
                        : <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-[var(--brand)] flex items-center justify-center text-[9px] font-bold text-white shrink-0">{nameInitials(senderLabel)}</div>
                    )}
                    <div className={cn("flex flex-col min-w-0", m.mine ? "items-end" : "items-start")}>
                      {!grouped && (
                        <span className="text-[10px] font-medium text-slate-500 mb-0.5 px-1">{senderLabel}</span>
                      )}
                      <div className={cn(
                        "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words shadow-sm",
                        m.mine
                          ? cn("bg-[var(--brand)] text-white", grouped ? "rounded-br-md" : "rounded-br-sm")
                          : cn("bg-white border border-slate-200 text-slate-800", grouped ? "rounded-bl-md" : "rounded-bl-sm")
                      )}>
                        {m.content}
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1 px-1 tabular-nums">{fmtTime(m.created_at)}</span>
                    </div>
                  </div>
                </React.Fragment>
              )
            })
          )}
        </div>

        <div className="sticky bottom-0 border-t border-slate-100 p-3 bg-white">
          {sendMessage.isError && (
            <p className="text-[11px] text-red-500 mb-2 px-1">Couldn&apos;t send your message. Please try again.</p>
          )}
          <div className="flex items-end gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handleSend() }
              }}
              rows={2}
              placeholder="Write a message…  (Ctrl/⌘ + Enter to send)"
              className="flex-1 resize-none border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)]/50"
            />
            <button
              onClick={handleSend}
              disabled={!draft.trim() || sendMessage.isPending || !workspace?.id}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[var(--brand)] text-white text-sm font-semibold hover:bg-[var(--brand-strong)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">{sendMessage.isPending ? "Sending…" : "Send"}</span>
            </button>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 px-1">Internal thread for this tenancy. Tenant-facing delivery is handled by the portal where enabled.</p>
        </div>
      </SectionCard>
    </div>
  )
}
