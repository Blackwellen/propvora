import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"
import { getFullWorkspaceContext, renderWorkspaceContext, capabilitiesFor } from "@/lib/ai/workspace-context"
import { parseSlashCommand } from "@/lib/ai/commands"
import { checkRate, recordUsage } from "@/lib/ai/metering"
import { checkCaps } from "@/lib/ai/caps"
import { resolveModelChain, gatewayStream, recordUsageEvent } from "@/lib/ai/gateway"
import { SAFETY_CLAUSES, fenceUntrusted } from "@/lib/ai/safety"
import { getWorkspaceJurisdiction } from "@/lib/international/workspace-jurisdiction"
import { aiJurisdictionClause } from "@/lib/international/guardrails"
import { gateAiCopilot } from "@/lib/billing/gates"
import { captureException, requestIdFrom } from "@/lib/observability"

// Authenticated, per-request streamed completion — never statically optimised.
export const dynamic = "force-dynamic"

const chatSchema = z.object({
  message: z.string().min(1, "message is required").max(4000, "message too long"),
  threadId: z.string().uuid().optional(),
  contextRoute: z.string().min(1).max(200).optional(),
  workspaceId: z.string().min(1).max(100).optional(),
  /** Inbox: when set, the last 10 messages in this thread are injected as context. */
  inboxThreadId: z.string().uuid().optional(),
})

export async function POST(request: NextRequest) {
  const requestId = requestIdFrom(request.headers)
  try {
    // 1. Authenticate user
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // 2. Validate body
    const parsed = chatSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues }, { status: 400 })
    }
    const { message, threadId, contextRoute, workspaceId, inboxThreadId } = parsed.data

    // 3. Verify workspace membership (only when a real workspace is provided)
    if (workspaceId && workspaceId !== "demo-workspace") {
      const { data: member } = await supabase
        .from("workspace_members")
        .select("role")
        .eq("workspace_id", workspaceId)
        .eq("user_id", user.id)
        .single()
      if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

      // 3b. Plan gate — AI Copilot is a Scale+ feature.
      const gate = await gateAiCopilot(supabase, workspaceId)
      if (!gate.allowed) {
        return NextResponse.json(
          { error: gate.reason, upgrade: true, tier: gate.tier },
          { status: gate.status ?? 402 }
        )
      }

      // 3c. HARD CAPS — fail closed. Refuse with a clear quota error if over any
      // rolling-window request/token limit or the monthly cost budget.
      const caps = await checkCaps(supabase, workspaceId)
      if (!caps.allowed) {
        return NextResponse.json(
          { error: caps.reason, quotaExceeded: true, limit: caps.exceeded, tier: caps.tier },
          { status: 429 }
        )
      }
    }

    // 4. Burst rate limit (per workspace, best-effort)
    if (workspaceId) {
      const rate = await checkRate(supabase, workspaceId)
      if (!rate.allowed) {
        return NextResponse.json(
          { error: "You're sending messages too quickly. Please wait a moment and try again." },
          { status: 429 }
        )
      }
    }

    // 4b. Slash-command dispatch. If the message starts with a known command we
    // run the command's structured instruction (with the user's trailing args)
    // instead of the raw "/foo …" text, and flag draft commands so the client can
    // gate them behind explicit approval. Unknown "/x" text falls through to chat.
    const slash = parseSlashCommand(message)

    // 5. Live, TYPE-AWARE workspace context (RLS-scoped, 42P01-safe → real data,
    // never leaks cross-workspace). Resolves operator/supplier/customer + modules.
    const { profile, caps, snapshot } = workspaceId
      ? await getFullWorkspaceContext(supabase, workspaceId)
      : {
          profile: { type: "operator" as const, subType: null, businessType: null, name: null, plan: null },
          caps: capabilitiesFor("operator"),
          snapshot: {},
        }

    // 5b. Resolve the workspace jurisdiction + country-pack status (GB-safe default).
    // Drives the jurisdiction clause: GB keeps full review-only depth; non-reviewed
    // jurisdictions get a stronger disclaimer + generic-only legal/tax framing.
    const jurisdiction = await getWorkspaceJurisdiction(supabase, workspaceId)
    const jurisdictionClause = aiJurisdictionClause({
      countryCode: jurisdiction.countryCode,
      countryName: jurisdiction.countryName,
      status: jurisdiction.effectiveStatus,
      currency: jurisdiction.currency,
      locale: jurisdiction.locale,
    })

    // 6. Get or create thread
    let thread = threadId ?? null
    if (!thread) {
      try {
        const { data: newThread } = await supabase
          .from("ai_chat_threads")
          .insert({
            workspace_id: workspaceId,
            user_id: user.id,
            context_route: contextRoute ?? null,
            title: message.trim().slice(0, 80),
          })
          .select("id")
          .single()
        if (newThread) thread = newThread.id
      } catch {
        /* table may be unmigrated — proceed without persistence */
      }
    }

    // 7. Recent thread history for continuity (last 10 turns)
    let history: { role: "user" | "assistant" | "system"; content: string }[] = []
    if (thread) {
      try {
        const { data: msgs } = await supabase
          .from("ai_chat_messages")
          .select("role, content")
          .eq("thread_id", thread)
          .order("created_at", { ascending: true })
          .limit(10)
        if (msgs) history = msgs as typeof history
      } catch {
        /* non-fatal */
      }
    }

    // 7b. Inbox thread context: when the user asks AI to help with a specific
    // message conversation, pull the last 10 messages from that thread (scoped to
    // the workspace so RLS guarantees cross-workspace isolation). The content is
    // fenced as untrusted so injection is sanitised. We cap at 1200 chars total
    // to stay within the token budget.
    let inboxContextBlock = ""
    if (inboxThreadId && workspaceId) {
      try {
        const { data: inboxMsgs } = await supabase
          .from("messages")
          .select("content, sender_id, created_at")
          .eq("workspace_id", workspaceId)
          .eq("thread_id", inboxThreadId)
          .order("created_at", { ascending: false })
          .limit(10)
        if (inboxMsgs && inboxMsgs.length > 0) {
          const { data: authRow } = await supabase.auth.getUser()
          const meId = authRow.user?.id
          const lines = (inboxMsgs as Array<Record<string, unknown>>)
            .slice()
            .reverse()
            .map((m) => {
              const role = meId && m.sender_id === meId ? "Agent" : "Contact"
              const ts = new Date(m.created_at as string).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
              const body = String(m.content ?? "").slice(0, 200).replace(/[<>"'`]/g, " ")
              return `[${ts}] ${role}: ${body}`
            })
          const raw = lines.join("\n").slice(0, 1200)
          inboxContextBlock = fenceUntrusted("CONVERSATION THREAD (last 10 messages)", raw)
        }
      } catch {
        /* non-fatal — inbox context is best-effort */
      }
    }

    // 8. System prompt with REAL, TYPE-AWARE workspace context. The live context
    // block is untrusted-ish (may contain user-entered text) so it's fenced +
    // injection sanitised; the safety clauses override anything inside it.
    const fencedContext = fenceUntrusted(
      "WORKSPACE CONTEXT",
      renderWorkspaceContext(profile, caps, snapshot)
    )

    // If this is a recognised slash command the running workspace type can use,
    // run the command's structured instruction; otherwise treat it as plain chat.
    const activeCommand =
      slash && (slash.command.capability === "always" || caps[slash.command.capability as keyof typeof caps])
        ? slash.command
        : null

    const commandClause = activeCommand
      ? `\nThe user invoked the /${activeCommand.slug.replace(/^\//, "")} command. ${
          activeCommand.requiresApproval
            ? "Produce the requested DRAFT only — do not claim anything was created, sent or executed; the user reviews and approves it."
            : "Answer it using the live workspace context above."
        }`
      : ""

    const systemPrompt = `You are the Propvora AI Copilot, an expert assistant for property operations. You serve operators, suppliers and customers — adapt to the WORKSPACE PROFILE below and only offer actions relevant to that workspace type and its available modules.

Across the platform Propvora covers: portfolio (properties, units, tenancies), work & maintenance (tasks, jobs, suppliers), a Marketplace OS (listings, orders, disputes), Bookings & accommodation (listings, reservations, availability, pricing, calendar), a Supplier workspace (jobs, quotes, verification), Payments/holds/disputes/payouts, an Automations engine, internationalisation (country packs) and compliance/legal readiness.

Current page context: ${contextRoute ?? "Main dashboard"}

${fencedContext}
${inboxContextBlock ? `\n${inboxContextBlock}\n` : ""}
${SAFETY_CLAUSES}

${jurisdictionClause}

Guidelines:
- Use the live workspace counts above when relevant; if a figure isn't shown, say you don't have it rather than inventing one.
- Tailor advice to the workspace TYPE and AVAILABLE MODULES above. Do not suggest actions for modules this workspace doesn't have.
- Follow the JURISDICTION rules above: only make jurisdiction-specific legal/tax/compliance statements when the jurisdiction is fully reviewed (the United Kingdom); otherwise keep legal/tax topics generic and direct the user to a local professional.
- Be concise (under 300 words unless asked for detail). Use clear structure for lists.
- When a CONVERSATION THREAD is provided above, base your answer on those real messages — do not invent messages, names or events that are not in the thread.
- If the user asks to draft a reply, produce the draft text only; state clearly it is a draft and the user must review it before sending.${commandClause}`

    // The actual user turn: for a command, send its instruction + any trailing
    // args the user typed; otherwise the raw message.
    const userTurn = activeCommand
      ? `${activeCommand.prompt}${slash && slash.args ? `\n\nAdditional context from the user: ${slash.args}` : ""}`
      : message.trim()

    // 9. Resolve the provider/model chain and open a streamed completion.
    const chain = await resolveModelChain(supabase)
    const gw = await gatewayStream(chain, {
      maxTokens: 700,
      temperature: 0.6,
      messages: [
        { role: "system", content: systemPrompt },
        ...history.map((h) => ({ role: h.role, content: h.content })),
        { role: "user", content: userTurn },
      ],
    })

    const encoder = new TextEncoder()
    let full = ""

    const readable = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const delta of gw.textStream) {
            full += delta
            controller.enqueue(encoder.encode(delta))
          }
        } catch (streamErr) {
          captureException(streamErr, { source: "api/ai/chat:stream", requestId })
          controller.enqueue(encoder.encode("\n\n[The response was interrupted. Please try again.]"))
        } finally {
          controller.close()
        }

        // 10. Persist + meter after stream closes (best-effort)
        if (thread) {
          try {
            await supabase.from("ai_chat_messages").insert([
              { thread_id: thread, workspace_id: workspaceId, role: "user", content: message.trim() },
              { thread_id: thread, workspace_id: workspaceId, role: "assistant", content: full },
            ])
            await supabase
              .from("ai_chat_threads")
              .update({ updated_at: new Date().toISOString() })
              .eq("id", thread)
          } catch {
            /* non-fatal */
          }
        }
        if (workspaceId) {
          const usage = gw.getUsage()
          // New per-call ledger (powers hard caps + admin usage view).
          await recordUsageEvent(supabase, {
            workspaceId,
            userId: user.id,
            route: "ai/chat",
            usage,
          })
          // Keep the legacy metering tables in sync for existing dashboards.
          await recordUsage(supabase, {
            workspaceId,
            userId: user.id,
            actionType: activeCommand ? `command:${activeCommand.slug}` : "chat",
            model: usage.model,
            inputTokens: usage.tokensIn,
            outputTokens: usage.tokensOut,
          })
        }
      },
    })

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Thread-Id": thread ?? "",
        "X-AI-Provider": gw.model.provider,
        "X-AI-Model": gw.model.modelId,
        "X-AI-Command": activeCommand?.slug ?? "",
        // Draft commands must be approved before anything is created/sent.
        "X-AI-Requires-Approval": activeCommand?.requiresApproval ? "1" : "0",
        "X-Workspace-Type": profile.type,
      },
    })
  } catch (err: unknown) {
    captureException(err, { source: "api/ai/chat", requestId })
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again.", requestId },
      { status: 500 }
    )
  }
}
