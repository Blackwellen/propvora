import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import OpenAI from "openai"
import { z } from "zod"
import { getWorkspaceSnapshot, renderSnapshot } from "@/lib/ai/workspace-context"
import { checkRate, recordUsage } from "@/lib/ai/metering"

const chatSchema = z.object({
  message: z.string().min(1, "message is required").max(4000, "message too long"),
  threadId: z.string().uuid().optional(),
  contextRoute: z.string().min(1).max(200).optional(),
  workspaceId: z.string().min(1).max(100).optional(),
})

// OpenAI client initialised server-side only — API key never reaches the client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini"

export async function POST(request: NextRequest) {
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
    }

    // 4. Rate limit (per workspace, best-effort)
    if (workspaceId) {
      const rate = await checkRate(supabase, workspaceId)
      if (!rate.allowed) {
        return NextResponse.json(
          { error: "You're sending messages too quickly. Please wait a moment and try again." },
          { status: 429 }
        )
      }
    }

    // 5. Live workspace snapshot (RLS-scoped, 42P01-safe → real data, never leaks cross-workspace)
    const snapshot = workspaceId ? await getWorkspaceSnapshot(supabase, workspaceId) : {}

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

    // 8. System prompt with REAL workspace context
    const systemPrompt = `You are the Propvora AI Copilot, an expert assistant for UK property operations management.

You help property operators with portfolio (properties, units, tenancies), work & maintenance (tasks, jobs, suppliers), money (income, expenses, invoices, arrears), compliance (EPC, Gas Safety, EICR), legal readiness (Section 21/8, HMO), planning and contacts.

Current page context: ${contextRoute ?? "Main dashboard"}

${renderSnapshot(snapshot)}

Guidelines:
- Use the live workspace counts above when relevant; if a figure isn't shown, say you don't have it rather than inventing one.
- Reference UK-specific regulations (EPC, Gas Safety, EICR, AST, Section 21/8) where relevant. Use GBP (£).
- When a request would CHANGE data (create/edit/delete a record, send a message, etc.), do NOT claim to have done it. Describe the action you would propose; the user approves and executes it through Propvora's action controls.
- Be concise (under 300 words unless asked for detail). Use clear structure for lists.`

    // 9. Stream the completion
    const stream = await openai.chat.completions.create({
      model: MODEL,
      stream: true,
      stream_options: { include_usage: true },
      max_tokens: 700,
      temperature: 0.6,
      messages: [
        { role: "system", content: systemPrompt },
        ...history.map((h) => ({ role: h.role, content: h.content })),
        { role: "user", content: message.trim() },
      ],
    })

    const encoder = new TextEncoder()
    let full = ""
    let promptTokens = 0
    let completionTokens = 0

    const readable = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content ?? ""
            if (delta) {
              full += delta
              controller.enqueue(encoder.encode(delta))
            }
            if (chunk.usage) {
              promptTokens = chunk.usage.prompt_tokens ?? 0
              completionTokens = chunk.usage.completion_tokens ?? 0
            }
          }
        } catch (streamErr) {
          console.error("[AI Chat] stream error:", streamErr)
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
          await recordUsage(supabase, {
            workspaceId,
            userId: user.id,
            actionType: "chat",
            model: MODEL,
            inputTokens: promptTokens,
            outputTokens: completionTokens,
          })
        }
      },
    })

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Thread-Id": thread ?? "",
      },
    })
  } catch (err: unknown) {
    console.error("[AI Chat] Error:", err)
    if (err instanceof OpenAI.APIError) {
      if (err.status === 429) {
        return NextResponse.json(
          { error: "AI rate limit reached. Please try again in a moment." },
          { status: 429 }
        )
      }
      if (err.status === 401) {
        return NextResponse.json(
          { error: "AI service configuration error. Please contact support." },
          { status: 500 }
        )
      }
    }
    return NextResponse.json({ error: "An unexpected error occurred. Please try again." }, { status: 500 })
  }
}
