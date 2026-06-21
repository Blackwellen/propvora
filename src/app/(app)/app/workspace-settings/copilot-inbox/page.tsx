"use client"

import React, { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { MessageCircle, Sparkles, Check, Loader2, Info } from "lucide-react"
import { getWorkspaceSettings, saveWorkspaceSettings } from "@/lib/actions/settings"

interface CopilotSettings {
  copilotEnabled: boolean
  floatingBubble: boolean
  suggestionDropdown: boolean
  slashCommands: boolean
  approvalQueue: boolean
  canCreateDrafts: boolean
}

interface InboxSettings {
  inboxEnabled: boolean
  supplierPortalMessaging: boolean
  contactDirectMessaging: boolean
  groupChats: boolean
  fileAttachments: boolean
  emojiReactions: boolean
  aiDraftReplies: boolean
  unreadBadge: boolean
}

type BubblePosition = "bottom-right" | "bottom-left"
type AttachmentSize = "5MB" | "10MB" | "25MB"
type MessageRetention = "90 days" | "1 year" | "Forever"
type ResponseStyle = "concise" | "standard" | "detailed"

const RESPONSE_STYLE_OPTIONS: { value: ResponseStyle; label: string; desc: string }[] = [
  { value: "concise", label: "Concise", desc: "Up to ~100 words per reply" },
  { value: "standard", label: "Standard", desc: "Up to ~300 words per reply (default)" },
  { value: "detailed", label: "Detailed", desc: "Up to ~600 words per reply" },
]

function ToggleRow({
  label,
  desc,
  enabled,
  onToggle,
  disabled = false,
}: {
  label: string
  desc: string
  enabled: boolean
  onToggle: () => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-slate-100 last:border-0">
      <div className="flex-1 pr-4">
        <p className={cn("text-[13px] font-medium", disabled ? "text-slate-400" : "text-slate-800")}>{label}</p>
        <p className="text-[11.5px] text-slate-400 mt-0.5">{desc}</p>
      </div>
      <button
        onClick={disabled ? undefined : onToggle}
        disabled={disabled}
        className={cn(
          "w-10 h-6 rounded-full transition-colors shrink-0 relative",
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
          enabled ? "bg-[#2563EB]" : "bg-slate-200"
        )}
      >
        <span
          className={cn(
            "absolute top-1 block w-4 h-4 rounded-full bg-white shadow-sm transition-transform",
            enabled ? "translate-x-5" : "translate-x-1"
          )}
        />
      </button>
    </div>
  )
}

function SelectRow<T extends string>({
  label,
  desc,
  value,
  options,
  onChange,
}: {
  label: string
  desc: string
  value: T
  options: T[]
  onChange: (v: T) => void
}) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-slate-100 last:border-0">
      <div className="flex-1 pr-4">
        <p className="text-[13px] font-medium text-slate-800">{label}</p>
        <p className="text-[11.5px] text-slate-400 mt-0.5">{desc}</p>
      </div>
      <select
        value={value}
        onChange={e => onChange(e.target.value as T)}
        className="px-3 py-1.5 rounded-xl border border-slate-200 text-[12.5px] text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all"
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

export default function CopilotInboxPage() {
  const [copilot, setCopilot] = useState<CopilotSettings>({
    copilotEnabled: true,
    floatingBubble: true,
    suggestionDropdown: true,
    slashCommands: true,
    approvalQueue: true,
    canCreateDrafts: true,
  })

  const [inbox, setInbox] = useState<InboxSettings>({
    inboxEnabled: true,
    supplierPortalMessaging: true,
    contactDirectMessaging: true,
    groupChats: false,
    fileAttachments: true,
    emojiReactions: true,
    aiDraftReplies: true,
    unreadBadge: true,
  })

  const [bubblePos, setBubblePos] = useState<BubblePosition>("bottom-right")
  const [maxCredits, setMaxCredits] = useState<number>(50)
  const [attachmentSize, setAttachmentSize] = useState<AttachmentSize>("10MB")
  const [retention, setRetention] = useState<MessageRetention>("1 year")
  const [customInstructions, setCustomInstructions] = useState<string>("")
  const [responseStyle, setResponseStyle] = useState<ResponseStyle>("standard")
  const [isDirty, setIsDirty] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [unavailable, setUnavailable] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Hydrate from workspace_settings
  useEffect(() => {
    getWorkspaceSettings().then(({ settings: s, unavailable }) => {
      if (unavailable) setUnavailable(true)
      if (s) {
        const b = (k: string, d: boolean) => (typeof s[k] === "boolean" ? (s[k] as boolean) : d)
        setCopilot({
          copilotEnabled:     b("copilot_enabled", true),
          floatingBubble:     b("copilot_floating_bubble", true),
          suggestionDropdown: b("copilot_suggestions", true),
          slashCommands:      b("copilot_slash_commands", true),
          approvalQueue:      b("copilot_approval_queue", true),
          canCreateDrafts:    b("copilot_drafts_only", true),
        })
        setInbox({
          inboxEnabled:            b("inbox_enabled", true),
          supplierPortalMessaging: b("portal_supplier_messaging", true),
          contactDirectMessaging:  b("inbox_contact_dm", true),
          groupChats:              b("inbox_group_chats", false),
          fileAttachments:         b("portal_allow_uploads", true),
          emojiReactions:          b("inbox_emoji", true),
          aiDraftReplies:          b("inbox_ai_drafts", true),
          unreadBadge:             b("inbox_unread_badge", true),
        })
        if (typeof s.copilot_bubble_position === "string") setBubblePos(s.copilot_bubble_position as BubblePosition)
        if (typeof s.copilot_max_credits === "number") setMaxCredits(s.copilot_max_credits as number)
        if (typeof s.inbox_attachment_size === "string") setAttachmentSize(s.inbox_attachment_size as AttachmentSize)
        if (typeof s.inbox_retention === "string") setRetention(s.inbox_retention as MessageRetention)
        if (typeof s.copilot_instructions === "string") setCustomInstructions(s.copilot_instructions as string)
        if (typeof s.copilot_response_style === "string") setResponseStyle(s.copilot_response_style as ResponseStyle)
      }
      setLoading(false)
    })
  }, [])

  const toggleCopilot = (key: keyof CopilotSettings) => {
    setCopilot(prev => ({ ...prev, [key]: !prev[key] }))
    setIsDirty(true)
    setSaved(false)
    setSaveError(null)
  }

  const toggleInbox = (key: keyof InboxSettings) => {
    setInbox(prev => ({ ...prev, [key]: !prev[key] }))
    setIsDirty(true)
    setSaved(false)
    setSaveError(null)
  }

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    const res = await saveWorkspaceSettings({
      copilot_enabled:         copilot.copilotEnabled, // stored in default "ai" bucket
      copilot_floating_bubble: copilot.floatingBubble,
      copilot_suggestions:     copilot.suggestionDropdown,
      copilot_slash_commands:  copilot.slashCommands,
      copilot_approval_queue:  copilot.approvalQueue,
      copilot_drafts_only:     copilot.canCreateDrafts,
      copilot_bubble_position:  bubblePos,
      copilot_max_credits:      maxCredits,
      copilot_instructions:     customInstructions,
      copilot_response_style:   responseStyle,
      inbox_enabled:             inbox.inboxEnabled,
      portal_supplier_messaging: inbox.supplierPortalMessaging,
      inbox_contact_dm:          inbox.contactDirectMessaging,
      inbox_group_chats:         inbox.groupChats,
      portal_allow_uploads:      inbox.fileAttachments,
      inbox_emoji:               inbox.emojiReactions,
      inbox_ai_drafts:           inbox.aiDraftReplies,
      inbox_unread_badge:        inbox.unreadBadge,
      inbox_attachment_size:     attachmentSize,
      inbox_retention:           retention,
    })
    setSaving(false)
    if (res.unavailable) {
      setUnavailable(true)
      setSaveError("Settings storage is not configured yet — changes can't be persisted.")
      return
    }
    if (!res.ok) {
      setSaveError(res.error ?? "Failed to save settings.")
      return
    }
    setSaved(true)
    setIsDirty(false)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="pb-20">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-slate-900">Copilot, Inbox & Portals</h1>
        <p className="text-[13.5px] text-slate-500 mt-1">Configure the AI Copilot, workspace messaging and portal communication. These switches gate live behaviour.</p>
      </div>

      {unavailable && (
        <div className="mb-5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12.5px] text-amber-700">
          <Info className="w-4 h-4 mt-0.5 shrink-0" />
          Settings storage is not provisioned in this environment yet. Toggles show defaults and can&apos;t be persisted until the <code className="font-mono">workspace_settings</code> table exists.
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
        </div>
      )}

      {/* Copilot settings */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center">
            <div style={{ color: "var(--accent)" }}><Sparkles className="w-4.5 h-4.5" /></div>
          </div>
          <div>
            <h3 className="text-[14px] font-bold text-slate-900">Copilot Settings</h3>
            <p className="text-[12px] text-slate-500">Control how the AI Copilot behaves workspace-wide</p>
          </div>
        </div>

        <ToggleRow
          label="Copilot enabled"
          desc="Master switch for all Copilot features"
          enabled={copilot.copilotEnabled}
          onToggle={() => toggleCopilot("copilotEnabled")}
        />
        <ToggleRow
          label="Floating bubble enabled"
          desc="Show the Copilot bubble in the bottom corner of the app"
          enabled={copilot.floatingBubble}
          onToggle={() => toggleCopilot("floatingBubble")}
          disabled={!copilot.copilotEnabled}
        />
        <ToggleRow
          label="Suggestion dropdown in header"
          desc="Show AI suggestions in the top navigation bar"
          enabled={copilot.suggestionDropdown}
          onToggle={() => toggleCopilot("suggestionDropdown")}
          disabled={!copilot.copilotEnabled}
        />
        <ToggleRow
          label="Slash commands enabled"
          desc="Allow /ai and /ask shortcuts in text inputs"
          enabled={copilot.slashCommands}
          onToggle={() => toggleCopilot("slashCommands")}
          disabled={!copilot.copilotEnabled}
        />
        <ToggleRow
          label="AI approval queue enabled"
          desc="Actions go to approval queue before executing"
          enabled={copilot.approvalQueue}
          onToggle={() => toggleCopilot("approvalQueue")}
          disabled={!copilot.copilotEnabled}
        />
        <ToggleRow
          label="AI can create drafts (not execute)"
          desc="AI prepares content for human review before any action"
          enabled={copilot.canCreateDrafts}
          onToggle={() => toggleCopilot("canCreateDrafts")}
          disabled={!copilot.copilotEnabled}
        />

        {/* Bubble position */}
        <div className="flex items-center justify-between py-3.5 border-b border-slate-100">
          <div className="flex-1 pr-4">
            <p className={cn("text-[13px] font-medium", !copilot.copilotEnabled || !copilot.floatingBubble ? "text-slate-400" : "text-slate-800")}>
              Bubble default position
            </p>
            <p className="text-[11.5px] text-slate-400 mt-0.5">Where the Copilot bubble appears by default</p>
          </div>
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
            {(["bottom-right", "bottom-left"] as BubblePosition[]).map(pos => (
              <button
                key={pos}
                onClick={() => { setBubblePos(pos); setIsDirty(true) }}
                disabled={!copilot.copilotEnabled || !copilot.floatingBubble}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[11.5px] font-semibold transition-all",
                  bubblePos === pos ? "bg-white text-[#2563EB] shadow-sm" : "text-slate-500",
                  (!copilot.copilotEnabled || !copilot.floatingBubble) ? "opacity-50 cursor-not-allowed" : ""
                )}
              >
                {pos === "bottom-right" ? "Bottom right" : "Bottom left"}
              </button>
            ))}
          </div>
        </div>

        {/* Max credits per session */}
        <div className="flex items-center justify-between py-3.5 border-b border-slate-100">
          <div className="flex-1 pr-4">
            <p className={cn("text-[13px] font-medium", !copilot.copilotEnabled ? "text-slate-400" : "text-slate-800")}>
              Max credits per session
            </p>
            <p className="text-[11.5px] text-slate-400 mt-0.5">Maximum AI credits a single session can consume</p>
          </div>
          <input
            type="number"
            value={maxCredits}
            min={1}
            max={500}
            onChange={e => { setMaxCredits(parseInt(e.target.value) || 1); setIsDirty(true) }}
            disabled={!copilot.copilotEnabled}
            className={cn(
              "w-20 px-2.5 py-1.5 rounded-lg border border-slate-200 text-[12.5px] text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all text-center",
              !copilot.copilotEnabled ? "opacity-50 cursor-not-allowed" : ""
            )}
          />
        </div>

        {/* Response style */}
        <div className="py-3.5 border-b border-slate-100">
          <p className={cn("text-[13px] font-medium mb-1", !copilot.copilotEnabled ? "text-slate-400" : "text-slate-800")}>
            Preferred response style
          </p>
          <p className="text-[11.5px] text-slate-400 mb-3">Controls how long Copilot replies are by default</p>
          <div className="flex gap-2 flex-wrap">
            {RESPONSE_STYLE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setResponseStyle(opt.value); setIsDirty(true) }}
                disabled={!copilot.copilotEnabled}
                className={cn(
                  "flex flex-col items-start px-3.5 py-2.5 rounded-xl border text-left transition-all",
                  responseStyle === opt.value
                    ? "border-[#2563EB] bg-blue-50 text-[#2563EB]"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                  !copilot.copilotEnabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                )}
              >
                <span className="text-[12.5px] font-semibold">{opt.label}</span>
                <span className="text-[11px] text-slate-400 mt-0.5">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom instructions */}
        <div className="py-3.5">
          <p className={cn("text-[13px] font-medium mb-1", !copilot.copilotEnabled ? "text-slate-400" : "text-slate-800")}>
            Custom instructions
          </p>
          <p className="text-[11.5px] text-slate-400 mb-2">
            Tell the Copilot how to refer to your business, preferred terminology, or any standing instructions.
            These are injected into every conversation in this workspace.
          </p>
          <textarea
            value={customInstructions}
            onChange={e => { setCustomInstructions(e.target.value); setIsDirty(true) }}
            disabled={!copilot.copilotEnabled}
            placeholder="e.g. Always refer to our properties by reference code, not address. Use formal English."
            maxLength={500}
            rows={3}
            className={cn(
              "w-full px-3 py-2 rounded-xl border border-slate-200 text-[12.5px] text-slate-800 bg-slate-50 resize-none focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all placeholder-slate-400",
              !copilot.copilotEnabled ? "opacity-50 cursor-not-allowed" : ""
            )}
          />
          <p className="text-[10.5px] text-slate-400 mt-1 text-right">{customInstructions.length}/500</p>
        </div>
      </div>

      {/* Inbox settings */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
            <div style={{ color: "var(--brand)" }}><MessageCircle className="w-4.5 h-4.5" /></div>
          </div>
          <div>
            <h3 className="text-[14px] font-bold text-slate-900">Inbox Settings</h3>
            <p className="text-[12px] text-slate-500">Configure workspace messaging and communication features</p>
          </div>
        </div>

        <ToggleRow
          label="Inbox enabled"
          desc="Master switch for the workspace messaging inbox"
          enabled={inbox.inboxEnabled}
          onToggle={() => toggleInbox("inboxEnabled")}
        />
        <ToggleRow
          label="Supplier portal messaging"
          desc="Suppliers can message your team through the portal"
          enabled={inbox.supplierPortalMessaging}
          onToggle={() => toggleInbox("supplierPortalMessaging")}
          disabled={!inbox.inboxEnabled}
        />
        <ToggleRow
          label="Contact direct messaging"
          desc="Send and receive messages directly with contacts"
          enabled={inbox.contactDirectMessaging}
          onToggle={() => toggleInbox("contactDirectMessaging")}
          disabled={!inbox.inboxEnabled}
        />
        <ToggleRow
          label="Group chats"
          desc="Allow creation of group messaging threads"
          enabled={inbox.groupChats}
          onToggle={() => toggleInbox("groupChats")}
          disabled={!inbox.inboxEnabled}
        />
        <ToggleRow
          label="File attachments"
          desc="Allow files to be sent in messages"
          enabled={inbox.fileAttachments}
          onToggle={() => toggleInbox("fileAttachments")}
          disabled={!inbox.inboxEnabled}
        />
        <ToggleRow
          label="Emoji reactions"
          desc="Allow emoji reactions on messages"
          enabled={inbox.emojiReactions}
          onToggle={() => toggleInbox("emojiReactions")}
          disabled={!inbox.inboxEnabled}
        />
        <ToggleRow
          label="AI draft replies"
          desc="Show AI-suggested replies in the message composer"
          enabled={inbox.aiDraftReplies}
          onToggle={() => toggleInbox("aiDraftReplies")}
          disabled={!inbox.inboxEnabled}
        />
        <ToggleRow
          label="Unread badge enabled"
          desc="Show unread count badge on the Inbox nav item"
          enabled={inbox.unreadBadge}
          onToggle={() => toggleInbox("unreadBadge")}
          disabled={!inbox.inboxEnabled}
        />

        <SelectRow<AttachmentSize>
          label="Max attachment size"
          desc="Maximum file size per attachment"
          value={attachmentSize}
          options={["5MB", "10MB", "25MB"]}
          onChange={v => { setAttachmentSize(v); setIsDirty(true) }}
        />
        <SelectRow<MessageRetention>
          label="Message retention"
          desc="How long messages are kept before deletion"
          value={retention}
          options={["90 days", "1 year", "Forever"]}
          onChange={v => { setRetention(v); setIsDirty(true) }}
        />
      </div>

      {/* Sticky save bar */}
      {isDirty && !unavailable && (
        <div className="app-save-bar fixed left-0 right-0 bg-white border-t border-slate-200 px-4 sm:px-8 py-3 sm:py-4 flex items-center justify-between gap-3 shadow-lg">
          <div>
            <p className="text-[13px] text-slate-600">You have unsaved changes</p>
            {saveError && <p className="text-[12px] text-red-500 mt-0.5">{saveError}</p>}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setIsDirty(false); setSaveError(null) }}
              className="px-4 py-2 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Discard
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#2563EB] text-white text-[13px] font-semibold hover:bg-[#1d4ed8] transition-colors disabled:opacity-70"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : null}
              {saving ? "Saving…" : saved ? "Saved!" : "Save changes"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
