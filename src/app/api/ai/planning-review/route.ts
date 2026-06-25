import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"
import { checkRate, recordUsage } from "@/lib/ai/metering"
import { checkCaps } from "@/lib/ai/caps"
import { resolveModelChain, gatewayComplete, recordUsageEvent } from "@/lib/ai/gateway"
import { gateAiCopilot } from "@/lib/billing/gates"

const schema = z.object({
  planningSetId: z.string().uuid(),
  workspaceId: z.string().uuid(),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const raw = await request.json()
    const parse = schema.safeParse(raw)
    if (!parse.success) return NextResponse.json({ error: parse.error.issues }, { status: 400 })
    const { planningSetId, workspaceId } = parse.data

    // Workspace membership check
    const { data: member } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .single()
    if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    // Plan gate
    const gate = await gateAiCopilot(supabase, workspaceId)
    if (!gate.allowed) {
      return NextResponse.json({ error: gate.reason, upgrade: true }, { status: gate.status ?? 402 })
    }

    // Hard caps
    const capCheck = await checkCaps(supabase, workspaceId)
    if (!capCheck.allowed) {
      return NextResponse.json({ error: capCheck.reason, quotaExceeded: true }, { status: 429 })
    }

    // Burst rate limit
    const rate = await checkRate(supabase, workspaceId)
    if (!rate.allowed) {
      return NextResponse.json({ error: "Too many AI requests. Please wait a moment." }, { status: 429 })
    }

    // Fetch planning set + assumptions (RLS-scoped)
    const [{ data: set }, { data: assumptions }] = await Promise.all([
      supabase.from("planning_sets").select("*").eq("id", planningSetId).eq("workspace_id", workspaceId).single(),
      supabase.from("planning_assumptions").select("*").eq("planning_set_id", planningSetId).maybeSingle(),
    ])
    if (!set) return NextResponse.json({ error: "Planning set not found" }, { status: 404 })

    const setData = set as Record<string, unknown>
    const assumptionsData = (assumptions ?? {}) as Record<string, unknown>

    const planContext = `
PLANNING SET:
- Title: ${setData.title ?? "Untitled"}
- Operation Profile: ${setData.operation_profile ?? "unknown"}
- Status: ${setData.status ?? "draft"}
- Risk Score: ${setData.risk_score ?? 0}/100
- Gross Monthly Income: £${setData.gross_monthly_income ?? 0}
- Net Monthly Income: £${setData.net_monthly_income ?? 0}
- Total Monthly Expenses: £${setData.total_monthly_expenses ?? 0}
- Upfront Cash Required: £${setData.upfront_cash_required ?? 0}
- Net Yield: ${setData.net_yield ?? 0}%
- ROI: ${setData.roi ?? 0}%

ASSUMPTIONS:
- Property Purchase Price: £${assumptionsData.property_purchase_price ?? "not set"}
- Property Value: £${assumptionsData.property_value ?? "not set"}
- Monthly Mortgage: £${assumptionsData.monthly_mortgage ?? "not set"}
- Landlord Monthly Rent: £${assumptionsData.landlord_monthly_rent ?? "not set"}
- Contract Length: ${assumptionsData.contract_length_months ?? "not set"} months
- Void Allowance: ${assumptionsData.void_allowance_pct ?? "not set"}%
- Management Fee: ${assumptionsData.management_fee_pct ?? "not set"}%
- Occupancy Rate: ${assumptionsData.occupancy_rate_pct ?? "not set"}%
- Average Daily Rate: £${assumptionsData.average_daily_rate ?? "not set"}
`.trim()

    const prompt = `You are a UK property investment analyst. Review the following planning set and return a JSON object ONLY — no markdown, no explanation, just raw JSON.

${planContext}

Return exactly this JSON structure:
{
  "overall_score": <integer 0-100>,
  "financial_viability": <integer 0-100>,
  "risk_assessment": <integer 0-100>,
  "data_completeness": <integer 0-100>,
  "compliance_readiness": <integer 0-100>,
  "scenario_robustness": <integer 0-100>,
  "strengths": [<string>, ...],
  "weaknesses": [<string>, ...],
  "missing_data": [<string>, ...],
  "suggestions": [<string>, ...],
  "recommendation": "<one paragraph plain text summary>"
}

Scoring guide:
- overall_score: weighted average of the five dimensions
- financial_viability: is the net income positive and yield adequate (5%+ good)?
- risk_assessment: low risk score = high risk assessment score
- data_completeness: what % of key assumptions are filled in?
- compliance_readiness: are compliance indicators present?
- scenario_robustness: is upfront capital adequate, void allowance set, etc.?

Keep strengths/weaknesses/missing_data/suggestions to 3-5 items each.
Missing data items must be specific field names (e.g. "Property purchase price not set").`

    const chain = await resolveModelChain(supabase)
    const result = await gatewayComplete(chain, {
      maxTokens: 800,
      temperature: 0.3,
      messages: [
        { role: "system", content: "You are a UK property investment analyst. Respond with JSON only." },
        { role: "user", content: prompt },
      ],
    })

    // Parse structured response
    let reviewData: Record<string, unknown>
    try {
      const cleaned = (result.text ?? "").replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
      reviewData = JSON.parse(cleaned)
    } catch {
      return NextResponse.json({ error: "AI returned an unparseable response. Please try again." }, { status: 500 })
    }

    // Clamp all scores to 0–100
    const clamp = (v: unknown) => Math.min(100, Math.max(0, Number(v) || 0))
    const review = {
      workspace_id: workspaceId,
      planning_set_id: planningSetId,
      reviewed_by: user.id,
      overall_score: clamp(reviewData.overall_score),
      financial_viability: clamp(reviewData.financial_viability),
      risk_assessment: clamp(reviewData.risk_assessment),
      data_completeness: clamp(reviewData.data_completeness),
      compliance_readiness: clamp(reviewData.compliance_readiness),
      scenario_robustness: clamp(reviewData.scenario_robustness),
      strengths: Array.isArray(reviewData.strengths) ? reviewData.strengths.slice(0, 5) : [],
      weaknesses: Array.isArray(reviewData.weaknesses) ? reviewData.weaknesses.slice(0, 5) : [],
      missing_data: Array.isArray(reviewData.missing_data) ? reviewData.missing_data.slice(0, 5) : [],
      suggestions: Array.isArray(reviewData.suggestions) ? reviewData.suggestions.slice(0, 5) : [],
      recommendation: typeof reviewData.recommendation === "string" ? reviewData.recommendation.slice(0, 1000) : null,
      tokens_used: (result.tokensIn ?? 0) + (result.tokensOut ?? 0),
      model_used: result.model ?? null,
    }

    // Save to planning_ai_reviews
    const { data: saved, error: saveErr } = await supabase
      .from("planning_ai_reviews")
      .insert(review)
      .select()
      .single()
    if (saveErr) {
      return NextResponse.json({ error: "Failed to save review: " + saveErr.message }, { status: 500 })
    }

    // Audit log (best-effort)
    try {
      await supabase.from("ai_action_logs").insert({
        workspace_id: workspaceId,
        user_id: user.id,
        action_type: "planning_ai_review",
        context: { planning_set_id: planningSetId },
        result: {
          overall_score: review.overall_score,
          tokens_in: result.tokensIn,
          tokens_out: result.tokensOut,
          provider: result.provider,
          model: result.model,
        },
        approved: true,
      })
    } catch { /* non-fatal */ }

    // Meter usage
    await recordUsageEvent(supabase, {
      workspaceId,
      userId: user.id,
      route: "ai/planning-review",
      usage: {
        provider: result.provider,
        model: result.model,
        tokensIn: result.tokensIn,
        tokensOut: result.tokensOut,
        costPence: result.costPence,
      },
    })
    await recordUsage(supabase, {
      workspaceId,
      userId: user.id,
      actionType: "planning_ai_review",
      model: result.model,
      inputTokens: result.tokensIn,
      outputTokens: result.tokensOut,
      entityType: "planning_set",
      entityId: planningSetId,
    })

    return NextResponse.json({
      review: saved,
      tokensUsed: review.tokens_used,
      model: result.model,
      provider: result.provider,
    })
  } catch (err) {
    console.error("[AI Planning Review] Error:", err)
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 })
  }
}
