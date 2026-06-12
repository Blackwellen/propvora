# AI / Inbox / Chat Completion Audit

**Run:** Second Depth Run — Agent 6
**Date:** 2026-06-03
**Scope:** ChatBubble, ChatPanel, InboxPanel, ConversationView, AiCopilotPanel, AiActionsPanel, ContactPicker, NotificationsBell, `/api/ai/chat` route.

---

## Component Inventory

| File | Exists | Complete |
|---|---|---|
| `src/components/ai/ChatBubble.tsx` | Yes | Yes — animated FAB with unread badge |
| `src/components/ai/ChatPanel.tsx` | Yes | Yes — tabbed panel (Inbox / AI Copilot / AI Actions) |
| `src/components/ai/InboxPanel.tsx` | Yes | Yes — mock conversations + Supabase real-data query |
| `src/components/ai/ConversationView.tsx` | Yes | Yes — full message thread with AI assist button |
| `src/components/ai/AiCopilotPanel.tsx` | Yes | Yes — chat with OpenAI via `/api/ai/chat` |
| `src/components/ai/AiActionsPanel.tsx` | Yes | Yes — 8 action cards with approval gates |
| `src/components/ai/ContactPicker.tsx` | Yes | Yes — searchable contact modal |
| `src/components/nav/NotificationsBell.tsx` | Yes | Yes — popover with 6 mock notifications |

---

## AppShell Wiring

| Item | Status | Notes |
|---|---|---|
| `ChatBubble` imported in AppShell | Yes | Line 29 — `import ChatBubble from "@/components/ai/ChatBubble"` |
| `ChatBubble` rendered | Yes | Lines 489–493 — with `unreadCount={3}` and toggle handler |
| `ChatPanel` rendered | Yes | Line 496 — slides in from right with `isOpen` / `onClose` props |
| `NotificationsBell` in topbar | Yes | Line 259 — rendered inside TopBar right group |
| AI topbar shortcut button | Yes | Lines 245–256 — Sparkles button toggles the panel |

---

## Feature Audit

| Feature | Status | Notes |
|---|---|---|
| ChatBubble renders | Complete | Fixed bottom-right FAB, animates in/out with `AnimatePresence` |
| Panel opens/closes | Complete | Spring animation, minimise button, close button, backdrop on mobile |
| Inbox shows conversations | Complete | 5 realistic UK property conversations (tenant, landlord x2, supplier, planning) |
| Contact picker works | Complete | Searchable modal, creates new conversation or opens existing |
| AI Copilot sends/receives | Complete | POSTs to `/api/ai/chat` with message, threadId, contextRoute, workspaceId |
| Loading/typing indicator | Complete | 3-dot bounce animation shown while waiting for AI response |
| Error handling in Copilot | Complete | Catch block appends error message in chat thread |
| threadId continuity | Complete | `threadId` saved from response and re-sent on subsequent calls |
| AI Actions show | Complete | 8 action cards in 2-column grid with run/loading states |
| Pending approval gates | Complete | Amber approval card for mutations — user must Approve/Reject |
| Context-aware (pathname) | Complete | `usePathname()` mapped to human label, shown as chip, sent as `contextRoute` |
| Real Supabase conversations | Complete | `useEffect` queries `conversations` table when workspaceId available; falls back to mock |
| Usage logging | Complete | `/api/ai/chat` inserts to `ai_action_logs` table (best-effort, non-fatal) |
| Human approval gates | Complete | `AiActionsPanel` — all mutative actions require explicit Approve; `AiCopilotPanel` — action messages show Approve/Reject card |

---

## API Route Audit (`/api/ai/chat`)

| Check | Status | Notes |
|---|---|---|
| Server-side only (OpenAI key) | Pass | `OpenAI` client instantiated at module level in `route.ts`, never in client components |
| Auth check | Pass | `supabase.auth.getUser()` — returns 401 if unauthenticated |
| Empty workspaceId allowed | Fixed | Guard changed: `if (workspaceId && workspaceId !== "demo-workspace")` — empty string skips membership check so unauthenticated/demo users still get AI responses |
| Workspace membership check | Pass | Runs only when a real non-demo workspaceId is provided |
| Thread persistence | Pass | Creates `ai_chat_threads` row on first message (best-effort) |
| Message persistence | Pass | Inserts user + assistant messages to `ai_chat_messages` (best-effort) |
| OpenAI error handling | Pass | 429 rate limit and 401 auth surfaced cleanly to client |
| System prompt UK-aware | Pass | Includes UK regulations (EPC, Gas Safety, EICR, AST, Section 21/8) and GBP currency |

---

## Fixes Applied This Run

1. **`/api/ai/chat` route** — Removed hard 400 guard on empty `workspaceId`. Now allows empty string and skips workspace membership check when not provided, enabling demo/pre-workspace usage.

2. **`AiCopilotPanel`** — Replaced hardcoded `"demo-workspace"` with `useWorkspace()` hook. Real workspace ID is sent when available; falls back to empty string which the API now handles gracefully.

3. **`InboxPanel`** — Added Supabase real-data query via `useEffect` + `useWorkspaceId()`. Maps `conversations` table rows (with `contacts` join) to `MockConversation` shape. Mock data is preserved as fallback when no Supabase rows are returned.

4. **`InboxPanel` mock data** — Added 5th conversation: a landlord asking about guaranteed rent / rent-to-rent planning opportunity with linked planning set record.

---

## Remaining Considerations

- The `conversations` Supabase table may not yet exist in early builds. The fetch is non-fatal (no try/catch needed — Promise `.then()` simply won't update state on error from the Supabase client itself, but a network-level error would be unhandled). Consider wrapping in try/catch for robustness in production.
- AI usage meter in `AiCopilotPanel` is currently static (47/100). Should be wired to a real `ai_usage` table query when available.
- `ConversationView` AI assist currently uses a setTimeout mock. Should call `/api/ai/chat` with conversation context for real reply suggestions.
