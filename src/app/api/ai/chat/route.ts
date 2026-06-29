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
import { orderChainForRole } from "@/lib/ai/routing"
import { resolveNavigation } from "@/lib/ai/navigation"
import { extractFieldUpdate } from "@/lib/ai/field-extract"
import { debitCredits, creditsForTokens } from "@/lib/ai/credits"
import { recallMemory, renderMemory } from "@/lib/ai/memory"
import { retrieve, renderRetrieved } from "@/lib/ai/embeddings"
import { getKeyRecords } from "@/lib/ai/key-records"
import { renderSiteStructure } from "@/lib/ai/site-map"
import { commandToTool } from "@/lib/ai/tools"
import { describeCost } from "@/lib/ai/credits"
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
  /** JSON: { section, entityId|propertyId|tenancyId, ... } from the current page. */
  pageContext: z.string().max(2000).optional(),
  /** @-mentioned records the user referenced in the composer. */
  mentions: z.array(z.object({ type: z.string().max(32), id: z.string().max(64), label: z.string().max(160) })).max(10).optional(),
})

/**
 * Deterministic record-action parser — turns "mark @X done" / "set @X priority
 * high" / "close @X" into a permissioned record.update tool proposal, using the
 * real id from the @-mention. Reliable on ANY model (no native tool-calling
 * needed); Azure GPT-5.4 can later propose richer multi-step calls. Returns the
 * tool + exact args + a human summary, or null.
 */
function detectRecordAction(
  message: string,
  mentions?: { type: string; id: string; label: string }[]
): { tool: string; args: Record<string, unknown>; summary: string } | null {
  if (!mentions || mentions.length === 0) return null
  const m = mentions[0]
  const t = message.toLowerCase()
  const updatable = ["task", "job", "property", "unit", "compliance", "tenancy"]
  if (!updatable.includes(m.type)) return null

  if (/\b(mark|set|flag)\b.*\b(done|complete|completed|finished|resolved)\b/.test(t) || /\b(complete|done|finish)\b/.test(t)) {
    if (m.type === "task" || m.type === "job") {
      return { tool: "record.update", args: { recordType: m.type, recordId: m.id, status: "done" }, summary: `Mark “${m.label}” as done` }
    }
  }
  if (/\bclose\b/.test(t)) {
    return { tool: "record.update", args: { recordType: m.type, recordId: m.id, status: "closed" }, summary: `Close “${m.label}”` }
  }
  const pr = t.match(/\b(low|normal|medium|high|urgent)\b/)
  if (pr && /\bpriorit/.test(t)) {
    return { tool: "record.update", args: { recordType: m.type, recordId: m.id, priority: pr[1] }, summary: `Set “${m.label}” priority to ${pr[1]}` }
  }
  const setAs = t.match(/\b(?:mark|set|change)\b.*\bas\b\s+([a-z_]+)/)
  if (setAs) {
    return { tool: "record.update", args: { recordType: m.type, recordId: m.id, status: setAs[1] }, summary: `Set “${m.label}” to ${setAs[1]}` }
  }
  return null
}

/** Pull a (type,id) entity to pin a NEW chat to, from the page context JSON. */
function pinnedEntityFrom(pageContext?: string): { type: string; id: string } | null {
  if (!pageContext) return null
  try {
    const p = JSON.parse(pageContext) as Record<string, unknown>
    const section = typeof p.section === "string" ? p.section : "standard"
    for (const k of ["entityId", "propertyId", "tenancyId", "contactId", "jobId", "invoiceId"]) {
      if (typeof p[k] === "string" && p[k]) {
        const type = k.replace(/Id$/, "")
        return { type: type === "entity" ? section : type, id: p[k] as string }
      }
    }
  } catch { /* ignore */ }
  return null
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
    const { message, threadId, contextRoute, workspaceId, pageContext, mentions } = parsed.data

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

    // 4b-i. DETERMINISTIC NAVIGATION — "/go-to X", or natural "take me to / open /
    // show me X" → resolve a real destination and tell the client to navigate.
    // No model call (instant), and it self-limits: only fires on an explicit nav
    // verb or the /go-to command, and only when a real destination matches.
    {
      const isGoTo = slash?.command.slug === "/go-to"
      const navVerb = /^\s*(take me|go|open|show me|navigate|jump|bring me|nav)\b/i.test(message)
      if (isGoTo || navVerb) {
        const intent = isGoTo ? slash!.args : message
        const target = resolveNavigation(intent)
        if (target) {
          const enc = new TextEncoder()
          const filters = target.filters ? "?" + new URLSearchParams(target.filters).toString() : ""
          const body = `Opening ${target.label} for you.`
          return new Response(
            new ReadableStream<Uint8Array>({
              start(c) { c.enqueue(enc.encode(body)); c.close() },
            }),
            {
              headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Cache-Control": "no-cache, no-transform",
                "X-AI-Navigate": `${target.route}${filters}|${target.label}`,
              },
            }
          )
        }
      }
    }

    // 4b-ii. RECORD ACTION — "mark @X done", "set @X priority high", "close @X".
    // Deterministic + permission-safe: emits the exact tool + args (with the real
    // id from the @-mention) so the approval card can execute record.update.
    {
      let action = detectRecordAction(message, mentions)
      // If the fast detector missed but the user @-mentioned a record and used an
      // edit verb, ask the model to map the phrasing to the exact field(s) — the
      // natural-language surface for ANY editable field (e.g. "set @X current
      // value to 425k", "change rent to 1,250").
      if (!action && mentions && mentions.length > 0 && workspaceId && workspaceId !== "demo-workspace" && /\b(set|update|change|edit|make|increase|decrease|raise|lower|adjust|rename)\b/i.test(message)) {
        const extracted = await extractFieldUpdate(supabase, message, mentions[0])
        if (extracted) action = extracted
      }
      if (action && workspaceId && workspaceId !== "demo-workspace") {
        const enc = new TextEncoder()
        const body = `${action.summary} — approve to apply.`
        return new Response(
          new ReadableStream<Uint8Array>({ start(c) { c.enqueue(enc.encode(body)); c.close() } }),
          {
            headers: {
              "Content-Type": "text/plain; charset=utf-8",
              "Cache-Control": "no-cache, no-transform",
              "X-AI-Tool": action.tool,
              "X-AI-Tool-Args": JSON.stringify(action.args),
              "X-AI-Requires-Approval": "1",
              "X-AI-Tool-Cost": String(describeCost(action.tool).credits),
            },
          }
        )
      }
    }

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
        // Pin a new chat to the entity it was opened on (property/tenancy/…),
        // so the chat history shows its context and future turns default to it.
        const pin = pinnedEntityFrom(pageContext)
        const { data: newThread } = await supabase
          .from("ai_chat_threads")
          .insert({
            workspace_id: workspaceId,
            user_id: user.id,
            context_route: contextRoute ?? null,
            title: message.trim().slice(0, 80),
            ...(pin
              ? {
                  pinned_entity_type: pin.type,
                  pinned_entity_id: pin.id,
                  // chat_type must satisfy the CHECK (standard|property|portfolio|tenant|automation|project)
                  chat_type: pin.type === "property" ? "property" : pin.type === "tenancy" || pin.type === "tenant" ? "tenant" : "standard",
                }
              : {}),
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

    // 7b. Recall memory tiers (thread summary + durable workspace facts + this
    // user's preferences). RLS-scoped, fail-open. Injected as trusted system
    // knowledge (it is engine-curated, not raw user input) but still kept brief.
    // 7b/c/d. Recall memory, RAG-retrieve, and fetch KEY RECORDS — all in
    // PARALLEL (they're independent) so the pre-model work doesn't add up
    // sequentially. Key records (real named tasks/tenancies/compliance/units)
    // are what let commands give full-depth, specific answers instead of generic
    // advice. All fail-open.
    const [memory, retrieved, keyRecordsBlock] = await Promise.all([
      workspaceId
        ? recallMemory(supabase, { workspaceId, userId: user.id, threadId: thread })
        : Promise.resolve({ workspace: [], user: [], threadSummary: null }),
      workspaceId ? retrieve(supabase, workspaceId, slash?.args || message, 6) : Promise.resolve([]),
      workspaceId ? getKeyRecords(supabase, workspaceId, caps) : Promise.resolve(""),
    ])
    const memoryBlock = renderMemory(memory)
    const retrievalBlock = renderRetrieved(retrieved)

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

${renderSiteStructure()}

${fencedContext}
${keyRecordsBlock ? `\n${keyRecordsBlock}\n` : ""}
${memoryBlock ? `\nMEMORY (engine-curated continuity — use silently, never echo verbatim):\n${memoryBlock}\n` : ""}
${retrievalBlock ? `\n${retrievalBlock}\n` : ""}
${SAFETY_CLAUSES}

${jurisdictionClause}

OPERATING STANDARD (enterprise grade — responses are capped, so every token must earn its place):
- LEAD WITH THE ANSWER. No preamble, no "Great question", no restating the question. First sentence resolves the ask; supporting detail follows only if it adds value.
- Be specific and actionable: when KEY RECORDS are provided, NAME the exact properties, units, tenants, tasks and compliance items (with their real dates and amounts) — e.g. "22 Park Road: EICR overdue 37 days" not "review your compliance". NEVER give a generic checklist or generic advice when the user's real records are listed above. Prefer a concrete recommendation over options; if you must list options, give your recommended one first and say why.
- Precision over volume: a tight, correct, complete answer beats a long one. The output limit is not a reason to truncate substance — it is a reason to cut filler. If a task genuinely needs more room, deliver the most important part fully and offer to continue.
- ACCURACY IS NON-NEGOTIABLE: never invent data, figures, names, prices, dates, legal/tax facts or capabilities. Use the live workspace figures above when relevant; if a figure or fact isn't available, say so plainly rather than guessing.
- When asked to draft (letter, message, notice, report, listing, reply, etc.), return a complete, polished, ready-to-use draft. NEVER output template tokens like {TENANT_NAME}, {PROPERTY_ADDRESS}, {AMOUNT} or [placeholder]. Use the REAL names, addresses, rent amounts and dates from the WORKSPACE CONTEXT and RELEVANT RECORDS above. If one specific detail is genuinely not in the context, write a short natural phrase (e.g. "your rented property") rather than a {TOKEN}, and never invent a value.
- Format with GitHub-flavoured Markdown so the client renders it cleanly: short paragraphs separated by a blank line; \`**bold**\` for the single key term only; \`-\` for bullet lists; \`1.\` for ordered steps; \`###\` sub-headings for longer multi-part answers; and Markdown tables for genuinely tabular data. Formatting must aid scanning, never pad length. Use British English; money in the workspace currency; dates in the workspace locale. Do NOT wrap the whole reply in a code block, and never output raw HTML.

Guidelines:
- NEVER echo, repeat, or display the workspace context data block. It is your internal knowledge only — use it silently.
- NEVER open by listing properties, units, tasks or counts unless explicitly asked.
- For casual greetings ("hi", "hello", "hey") reply with a brief, warm 1–2 sentence greeting and offer to help — no data dump, no unprompted actions.
- Tailor advice to the workspace TYPE and AVAILABLE MODULES above. Never suggest actions for modules this workspace doesn't have.
- Follow the JURISDICTION rules above: make jurisdiction-specific legal/tax/compliance statements only when the jurisdiction is fully reviewed (the United Kingdom); otherwise keep legal/tax topics generic and point the user to a local professional.

SUGGESTED ACTIONS (optional — turns your answer into one-tap buttons the user can click):
When your reply naturally leads to concrete next steps the user can take in Propvora, append ONE machine-readable block at the VERY END, after all prose, in EXACTLY this format (and nothing after it):
[[ACTIONS]]
[{"label":"Create task: chase EICR at 22 Park Road","kind":"create","prompt":"/create-task Chase the overdue EICR at 22 Park Road"}]
[[/ACTIONS]]
Rules for the block:
- It is strict JSON: an array of 1–4 objects, each with "label" (≤80 chars — what the button reads), "kind" (one of: create, edit, update, draft, view, ask) and "prompt" (the exact message sent back to you when the button is tapped).
- For actions that create, draft or generate something, START the prompt with the matching slash command (e.g. /create-task, /chase-arrears, /summarise) so the user gets the approval step. For edits or updates to a named record, write a concrete instruction (use @Name when you know it). For "view", write a short navigation request (e.g. "Open the compliance calendar").
- Only offer actions that are REAL and available in THIS workspace's modules and that follow logically from your answer. Never invent records, prompts or capabilities.
- OMIT the block entirely for greetings, casual chat, or pure-information answers with no sensible next step. Never emit an empty block.
- NEVER mention, describe or explain the block in your prose — the user only ever sees the resulting buttons, not the markers.
- Do not duplicate an action the ACTIVE ACTION below is already producing.${commandClause}`

    // The actual user turn: for a command, send its instruction + any trailing
    // args the user typed; otherwise the raw message.
    const userTurn = activeCommand
      ? `${activeCommand.prompt}${slash && slash.args ? `\n\nAdditional context from the user: ${slash.args}` : ""}`
      : message.trim()

    // 9. Resolve the provider/model chain and open a streamed completion.
    //
    // Platform absolute ceilings (no single request may exceed these regardless
    // of plan or model — protects against runaway context costs on Azure):
    //   Input:  8,000 tokens  (~32,000 chars — enough for a full tenancy agreement)
    //   Output: 4,000 tokens  (~16,000 chars — detailed reports, full draft letters)
    //
    // Per-plan limits in PLAN_LIMITS (gates.ts) set the LOWER bound that users
    // actually see. Enterprise reaches the absolute ceiling; Scale/Pro are
    // constrained below it. Plans may never exceed these absolute values.
    const COPILOT_MAX_INPUT_TOKENS = 8_000
    const COPILOT_MAX_OUTPUT_TOKENS = 4_000

    // Output token cap: start from the plan limit, never exceed the platform ceiling.
    let planMaxTokens = 1_500  // safe default (Scale-tier floor)
    if (workspaceId && workspaceId !== "demo-workspace") {
      try {
        const planLimits = await getPlanLimits(supabase, workspaceId)
        if (planLimits.aiOutputTokensPerMessage > 0) {
          planMaxTokens = Math.min(planLimits.aiOutputTokensPerMessage, COPILOT_MAX_OUTPUT_TOKENS)
        }
      } catch {
        /* fall back to the safe default */
      }
    } else {
      // Demo workspace: give a useful output budget without an account.
      planMaxTokens = 1_500
    }

    // Input truncation: enforce the plan's per-message input limit, capped at the
    // platform ceiling. Rough heuristic: 1 token ≈ 4 characters.
    let effectiveUserTurn = userTurn
    {
      let inputTokenCap = 2_000  // safe default (Scale-tier floor)
      if (workspaceId && workspaceId !== "demo-workspace") {
        try {
          const planLimits = await getPlanLimits(supabase, workspaceId)
          if (planLimits.aiInputTokensPerMessage > 0) {
            inputTokenCap = Math.min(planLimits.aiInputTokensPerMessage, COPILOT_MAX_INPUT_TOKENS)
          }
        } catch {
          /* keep the safe default */
        }
      }
      const maxInputChars = inputTokenCap * 4
      if (maxInputChars > 0 && effectiveUserTurn.length > maxInputChars) {
        effectiveUserTurn = effectiveUserTurn.slice(0, maxInputChars) + "…[truncated]"
      }
    }

    // Cheapest-compliant model for the task. Tenant context is always present,
    // so the router unconditionally excludes China-direct providers (GDPR/UK).
    // Drafting commands get the slightly stronger "agentic" tier (still cheap —
    // Kimi on NVIDIA NIM); plain chat uses the "workhorse" tier.
    const baseChain = await resolveModelChain(supabase)
    const role = activeCommand?.requiresApproval ? "agentic" : "workhorse"
    const chain = orderChainForRole(baseChain, role)
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
          // Pass the real gateway cost so metering never re-estimates with stale rates.
          await recordUsage(supabase, {
            workspaceId,
            userId: user.id,
            actionType: activeCommand ? `command:${activeCommand.slug}` : "chat",
            model: usage.model,
            inputTokens: usage.tokensIn,
            outputTokens: usage.tokensOut,
            costPence: usage.costPence,
          })
          // Credit-class ledger: a chat turn is metered as Conversation (1 credit
          // per 1k tokens). Best-effort; never blocks the response.
          await debitCredits(supabase, {
            workspaceId,
            userId: user.id,
            operationKey: "chat.turn",
            credits: creditsForTokens(usage.tokensIn, usage.tokensOut),
            refType: "chat_thread",
            refId: thread,
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
        // The executor the client should POST to /api/ai/tool once the user
        // approves the draft (empty when this command has no safe executor),
        // plus the pre-flight credit estimate for the approval card.
        "X-AI-Tool": activeCommand ? (commandToTool(activeCommand.mutationType) ?? "") : "",
        "X-AI-Tool-Cost": (() => {
          const t = activeCommand ? commandToTool(activeCommand.mutationType) : null
          return t ? String(describeCost(t).credits) : ""
        })(),
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
