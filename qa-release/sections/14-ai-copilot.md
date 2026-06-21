# Section 14 — AI Copilot

Last updated: 2026-06-21 (FIX-289)

Scoring: 5=perfect | 4=minor | 3=usable but inconsistent | 2=harms UX | 1=severe | 0=broken/not implemented | N/A=not applicable

## Score Matrix

| Area | Score | Notes |
|------|-------|-------|
| Chat panel opens | 5 | Via bubble, MobileBottomNav, OPEN_COPILOT_EVENT, "Use AI" buttons |
| Streaming response | 5 | ReadableStream → TextDecoder chunk accumulation |
| Slash command dispatch | 5 | parseSlashCommand() → 31 commands, packs, capabilities |
| System prompt injection hardening | 5 | fenceUntrusted on all untrusted blocks, 19 INJECTION_PATTERNS, strong SECURITY RULES |
| Workspace context (live counts) | 5 | 17 metrics including overdueTasks, complianceDue30Days, pendingApprovals |
| Entity-level context (property/tenancy) | 5 | UUID detection in path, fetchPropertyContext + fetchTenancyContext |
| Rate limiting | 5 | checkRate() burst limit before AI call |
| Hard caps | 5 | checkCaps() with quotaExceeded response |
| Plan gate | 5 | gateAiCopilot() Scale+ check |
| Audit log | 5 | ai_audit_log insert (best-effort, non-fatal) |
| Thread persistence | 5 | ai_chat_threads + ai_chat_messages |
| Jurisdiction clause | 5 | GB full-depth, non-GB generic + disclaimer |
| Typing indicator | 5 | TypingDots during streaming |
| Micro-actions (quick-action chips) | 5 | 5 command groups wired in CopilotChatScreen + CopilotMessageBubble |
| Custom instructions | 5 | copilot_instructions saved in workspace_settings, fenced into system prompt |
| Response style selector | 5 | concise/standard/detailed → 100/300/600 word limit |
| Use AI button wiring | 5 | All 8 previously-unconnected buttons now openCopilot() |
| Upgrade prompt (non-entitled) | 5 | CopilotUpgradePrompt shown when aiCopilotEnabled=false |
| Keyboard accessibility | 5 | Esc closes, Tab trapped, focus restored |
| Mobile layout | 5 | Full-screen sheet on mobile, bubble hidden (MobileBottomNav centre button) |

**Section overall score: 5/5**
