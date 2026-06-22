import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"
import { getFullWorkspaceContext, renderWorkspaceContext, capabilitiesFor } from "@/lib/ai/workspace-context"
import { parseSlashCommand } from "@/lib/ai/commands"
import { checkRate, recordUsage } from "@/lib/ai/metering"
import { checkCaps, checkAiCap, checkAiRateLimit } from "@/lib/ai/caps"
import { getPlanLimits } from "@/lib/billing/gates"
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
    const { message, threadId, contextRoute, workspaceId } = parsed.data

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

      // 3c. Monthly message cap — fail closed against known-exceeded limit.
      const monthlyCap = await checkAiCap(supabase, workspaceId)
      if (!monthlyCap.allowed) {
        return NextResponse.json(
          { error: monthlyCap.reason, quotaExceeded: true, tier: gate.tier },
          { status: 402 }
        )
      }

      // 3d. Per-hour rate limit — fail with 429 + Retry-After header.
      const rateLimit = await checkAiRateLimit(supabase, workspaceId)
      if (!rateLimit.allowed) {
        const headers: Record<string, string> = rateLimit.retryAfterSeconds
          ? { "Retry-After": String(rateLimit.retryAfterSeconds) }
          : {}
        return new Response(JSON.stringify({ error: rateLimit.reason }), {
          status: 429,
          headers: { "Content-Type": "application/json", ...headers },
        })
      }

      // 3e. HARD CAPS — rolling-window request/token limits + monthly cost budget.
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
      ? `\n\nACTIVE ACTION: /${activeCommand.slug.replace(/^\//, "")}. ${
          activeCommand.requiresApproval
            ? "Deliver the requested artefact as a COMPLETE, polished, ready-to-use DRAFT the user can act on immediately — correct structure, professional tone, all sections filled from the live context (no placeholders or TODOs). Do NOT claim anything was created, sent, executed or scheduled; the user reviews and approves it. End with one short line noting it's a draft for their approval."
            : "Resolve this action precisely using the live workspace context above: lead with the result, be concrete, and surface the single most useful next step."
        }`
      : ""

    const systemPrompt = `You are the Propvora AI Copilot — an enterprise-grade operations assistant for property professionals. You think like a seasoned property operator, lettings/agency manager, and trades coordinator, and you give the precise, decision-ready answer a senior operator would. You serve operators, suppliers and customers — adapt to the WORKSPACE PROFILE below and only offer actions relevant to that workspace type and its available modules.

Across the platform Propvora covers: portfolio (properties, units, tenancies), work & maintenance (tasks, jobs, suppliers), a Marketplace OS (listings, orders, disputes), Bookings & accommodation (listings, reservations, availability, pricing, calendar), a Supplier workspace (jobs, quotes, verification), Payments/holds/disputes/payouts, an Automations engine, internationalisation (country packs) and compliance/legal readiness.

Current page context: ${contextRoute ?? "Main dashboard"}

${fencedContext}

${SAFETY_CLAUSES}

${jurisdictionClause}

OPERATING STANDARD (enterprise grade — responses are capped, so every token must earn its place):
- LEAD WITH THE ANSWER. No preamble, no "Great question", no restating the question. First sentence resolves the ask; supporting detail follows only if it adds value.
- Be specific and actionable: name the exact screen, field, status, next step or figure. Prefer a concrete recommendation over a list of options; if you must list options, give your recommended one first and say why.
- Precision over volume: a tight, correct, complete answer beats a long one. The output limit is not a reason to truncate substance — it is a reason to cut filler. If a task genuinely needs more room, deliver the most important part fully and offer to continue.
- ACCURACY IS NON-NEGOTIABLE: never invent data, figures, names, prices, dates, legal/tax facts or capabilities. Use the live workspace figures above when relevant; if a figure or fact isn't available, say so plainly rather than guessing.
- When asked to draft (message, listing, description, reply, policy text, etc.), return a complete, polished, ready-to-use draft — not a sketch or placeholder.
- Structure for scanning: short paragraphs, tight bullets, bold only the key term. Use British English. Money via the workspace currency; dates in the workspace locale.

Guidelines:
- NEVER echo, repeat, or display the workspace context data block. It is your internal knowledge only — use it silently.
- NEVER open by listing properties, units, tasks or counts unless explicitly asked.
- For casual greetings ("hi", "hello", "hey") reply with a brief, warm 1–2 sentence greeting and offer to help — no data dump, no unprompted actions.
- Tailor advice to the workspace TYPE and AVAILABLE MODULES above. Never suggest actions for modules this workspace doesn't have.
- Follow the JURISDICTION rules above: make jurisdiction-specific legal/tax/compliance statements only when the jurisdiction is fully reviewed (the United Kingdom); otherwise keep legal/tax topics generic and point the user to a local professional.${commandClause}`

    // The actual user turn: for a command, send its instruction + any trailing
    // args the user typed; otherwise the raw message.
    const userTurn = activeCommand
      ? `${activeCommand.prompt}${slash && slash.args ? `\n\nAdditional context from the user: ${slash.args}` : ""}`
      : message.trim()

    // 9. Resolve the provider/model chain and open a streamed completion.
    // Copilot is hard-bounded at 500 input / 1000 output tokens (a request can
    // never exceed these regardless of plan). Plans may set a LOWER cap.
    const COPILOT_MAX_INPUT_TOKENS = 500
    const COPILOT_MAX_OUTPUT_TOKENS = 1000
    let planMaxTokens = COPILOT_MAX_OUTPUT_TOKENS
    if (workspaceId && workspaceId !== "demo-workspace") {
      try {
        const planLimits = await getPlanLimits(supabase, workspaceId)
        if (planLimits.aiOutputTokensPerMessage > 0) {
          planMaxTokens = planLimits.aiOutputTokensPerMessage
        }
      } catch {
        /* fall back to the copilot ceiling */
      }
    }

    // Truncate input to the copilot's 500-token ceiling (plans may set lower).
    // Rough heuristic: 1 token ≈ 4 characters. Applied for all real workspaces.
    let effectiveUserTurn = userTurn
    {
      let inputTokenCap = COPILOT_MAX_INPUT_TOKENS
      if (workspaceId && workspaceId !== "demo-workspace") {
        try {
          const planLimits = await getPlanLimits(supabase, workspaceId)
          if (planLimits.aiInputTokensPerMessage > 0) {
            inputTokenCap = Math.min(planLimits.aiInputTokensPerMessage, COPILOT_MAX_INPUT_TOKENS)
          }
        } catch {
          /* keep the copilot ceiling */
        }
      }
      const maxInputChars = inputTokenCap * 4
      if (maxInputChars > 0 && effectiveUserTurn.length > maxInputChars) {
        effectiveUserTurn = effectiveUserTurn.slice(0, maxInputChars) + "…[truncated]"
      }
    }

    const chain = await resolveModelChain(supabase)
    const gw = await gatewayStream(chain, {
      maxTokens: Math.min(planMaxTokens, COPILOT_MAX_OUTPUT_TOKENS),
      temperature: 0.6,
      messages: [
        { role: "system", content: systemPrompt },
        ...history.map((h) => ({ role: h.role, content: h.content })),
        { role: "user", content: effectiveUserTurn },
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
