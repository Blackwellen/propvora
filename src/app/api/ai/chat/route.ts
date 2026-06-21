// RESPONSE QUALITY FLOW:
// 1. User sends message → parseSlashCommand() checks for /command
// 2. If command: use command.prompt as userTurn, add commandClause to system
// 3. Build system prompt: IDENTITY + WORKSPACE_CONTEXT + PAGE_DATA + ENTITY_DATA + SECURITY + SAFETY + JURISDICTION + FORMATTING
// 4. FORMATTING rules: no markdown asterisks, numbered lists only, max 300 words (customisable)
// 5. Stream response via NVIDIA NIM → chunk to client
// 6. Client CopilotMessageBubble renders with whitespace-pre-wrap (plain text)
// 7. Thread persisted: ai_chat_threads + ai_chat_messages
// 8. Cap checked: caps.aiMessagesUsed < caps.aiMessagesLimit (checkCaps)
// 9. Audit log: every message pair logged to ai_audit_log (best-effort)

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"
import {
  getFullWorkspaceContext,
  renderWorkspaceContext,
  capabilitiesFor,
  fetchPropertyContext,
  fetchTenancyContext,
  safeParsePageContext,
} from "@/lib/ai/workspace-context"
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
  workspaceType: z.enum(["operator", "supplier", "customer"]).optional(),
  pageContext: z.string().max(2000).optional(),
})

/** Rough token estimator (4 chars ≈ 1 token) — used for audit log only. */
function estimatedTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

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
    const { message, threadId, contextRoute, workspaceId, workspaceType: clientWorkspaceType, pageContext } = parsed.data

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

    // The client-supplied workspace type (operator/supplier/customer) can be used
    // to double-check the server-resolved profile type. Prefer server-side value.
    void clientWorkspaceType

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

    // 5c. Read workspace copilot customisation settings (best-effort).
    // Supports: copilot_instructions (custom text), copilot_response_style (concise/standard/detailed)
    let customInstructions = ""
    let wordLimit = 300
    if (workspaceId) {
      try {
        const { data: wsSettings } = await supabase
          .from("workspace_settings")
          .select("settings")
          .eq("workspace_id", workspaceId)
          .maybeSingle()
        const s = (wsSettings as any)?.settings as Record<string, unknown> | null | undefined
        if (s?.copilot_instructions && typeof s.copilot_instructions === "string") {
          customInstructions = fenceUntrusted("USER CUSTOM INSTRUCTIONS", s.copilot_instructions)
        }
        if (s?.copilot_response_style === "concise") wordLimit = 100
        else if (s?.copilot_response_style === "detailed") wordLimit = 600
      } catch { /* non-fatal */ }
    }

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

    // 8. System prompt with REAL, TYPE-AWARE workspace context. The live context
    // block is untrusted-ish (may contain user-entered text) so it's fenced +
    // injection sanitised; the safety clauses override anything inside it.
    const fencedContext = fenceUntrusted(
      "WORKSPACE CONTEXT",
      renderWorkspaceContext(profile, caps, snapshot)
    )

    // Page-level context: structured data visible on screen when the copilot was opened.
    // Fenced + injection-sanitised the same way as the workspace context.
    const pageContextBlock = pageContext
      ? fenceUntrusted("CURRENT PAGE DATA", pageContext)
      : ""

    // Entity-level context: if pageContext contains a propertyId or tenancyId,
    // fetch that entity's live data from the DB and fence it into the prompt.
    let entityContextBlock = ""
    if (pageContext && workspaceId) {
      try {
        const pageParsed = safeParsePageContext(pageContext)
        if (pageParsed.propertyId) {
          const propData = await fetchPropertyContext(supabase, pageParsed.propertyId, workspaceId)
          if (propData) {
            entityContextBlock = fenceUntrusted("CURRENT PROPERTY", JSON.stringify(propData))
          }
        } else if (pageParsed.tenancyId) {
          const tenancyData = await fetchTenancyContext(supabase, pageParsed.tenancyId, workspaceId)
          if (tenancyData) {
            entityContextBlock = fenceUntrusted("CURRENT TENANCY", JSON.stringify(tenancyData))
          }
        }
      } catch { /* non-fatal */ }
    }

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

${pageContextBlock}

${entityContextBlock}

${customInstructions}

CROSS-CONTEXT INTELLIGENCE:
- When the user asks about something on screen, reference the CURRENT PAGE DATA or CURRENT PROPERTY/TENANCY above first.
- When page data is missing a detail, check WORKSPACE CONTEXT for workspace-level totals.
- You can reason across sections: if on the Money section and the user asks about a property, relate financial data to portfolio context.
- If you see an entity (property name, tenancy ref, job ID) in the conversation, remember it for the rest of the thread.
- When answering about counts or KPIs, always cite the source: "Based on your current page, you have..." or "Your workspace shows..."
- If the user asks something you don't have data for, say "I don't have that specific data visible — you can find it in [section]."

${SAFETY_CLAUSES}

${jurisdictionClause}

FORMATTING RULES (strictly follow):
- Never use markdown asterisks (* or **) for bold or bullet points
- Never use ## or # headings
- Use plain numbered lists (1. 2. 3.) for ordered items
- Use plain dashes (- ) for unordered list items
- Use short paragraphs separated by blank lines
- Responses must be conversational and direct, not formatted like documents
- Maximum response length: ${wordLimit} words unless the user explicitly asks for more
- For lists use: "1. First item" on its own line, NOT "* First item"
- Never wrap words in asterisks for emphasis — just write the words plainly

Guidelines:
- Use the live workspace counts above when relevant; if a figure isn't shown, say you don't have it rather than inventing one.
- Tailor advice to the workspace TYPE and AVAILABLE MODULES above. Do not suggest actions for modules this workspace doesn't have.
- Follow the JURISDICTION rules above: only make jurisdiction-specific legal/tax/compliance statements when the jurisdiction is fully reviewed (the United Kingdom); otherwise keep legal/tax topics generic and direct the user to a local professional.
- Be concise (under ${wordLimit} words unless asked for detail). Use plain numbered or dashed lists for structure.${commandClause}`

    // The actual user turn: for a command, send its instruction + any trailing
    // args the user typed; otherwise the raw message.
    const userTurn = activeCommand
      ? `${activeCommand.prompt}${slash && slash.args ? `\n\nAdditional context from the user: ${slash.args}` : ""}`
      : message.trim()

    // 9. Audit log (best-effort, non-fatal) — logged before stream to capture every request.
    try {
      await supabase.from("ai_audit_log").insert({
        workspace_id: workspaceId ?? null,
        user_id: user.id,
        thread_id: thread,
        prompt_tokens: estimatedTokens(userTurn),
        command_slug: activeCommand?.slug ?? null,
        context_route: contextRoute ?? null,
        timestamp: new Date().toISOString(),
      })
    } catch { /* non-fatal — table may not be migrated */ }

    // 10. Resolve the provider/model chain and open a streamed completion.
    const chain = await resolveModelChain(supabase)
    const gw = await gatewayStream(chain, {
      maxTokens: wordLimit > 300 ? 1000 : 700,
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

        // 11. Persist + meter after stream closes (best-effort)
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
