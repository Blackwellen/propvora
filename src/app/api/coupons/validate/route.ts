import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

/**
 * POST /api/coupons/validate
 * Body: { code: string; planType?: string }
 *
 * Returns:
 *   { valid: true, discount_type, discount_value, description, code }
 *   { valid: false, error: string }
 *
 * 42P01 guard: if coupon_codes table doesn't exist, returns { valid: false, error: "Coupon system not yet available." }
 */
export async function POST(request: NextRequest) {
  let body: { code?: string; planType?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ valid: false, error: "Invalid request body" }, { status: 400 })
  }

  const code = (body.code ?? "").trim().toUpperCase()
  if (!code) {
    return NextResponse.json({ valid: false, error: "Code is required" }, { status: 400 })
  }

  try {
    const supabase = await createClient()

    // Require authentication — anonymous users cannot redeem coupons
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ valid: false, error: "You must be signed in to apply a coupon." }, { status: 401 })
    }

    const { data, error } = await supabase
      .from("coupon_codes")
      .select("id, code, description, discount_type, discount_value, plan_restriction, max_uses, uses_count, valid_until, is_active")
      .eq("code", code)
      .eq("is_active", true)
      .maybeSingle()

    if (error) {
      // 42P01: table not yet available
      if ((error as { code?: string }).code === "42P01") {
        return NextResponse.json({ valid: false, error: "Coupon system not yet available." })
      }
      return NextResponse.json({ valid: false, error: "Could not look up coupon." }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ valid: false, error: "Code not found or expired." })
    }

    // Check expiry
    if (data.valid_until && new Date(data.valid_until) < new Date()) {
      return NextResponse.json({ valid: false, error: "This coupon has expired." })
    }

    // Check uses cap
    if (data.max_uses != null && data.uses_count >= data.max_uses) {
      return NextResponse.json({ valid: false, error: "This coupon has reached its maximum number of uses." })
    }

    // Check plan restriction
    const planType = (body.planType ?? "").toLowerCase()
    if (data.plan_restriction && planType && data.plan_restriction !== planType) {
      return NextResponse.json({
        valid: false,
        error: `This code is only valid for the ${data.plan_restriction} plan.`,
      })
    }

    // Build human-readable discount summary
    let summary = ""
    if (data.discount_type === "percent") {
      summary = `${data.discount_value}% off`
    } else if (data.discount_type === "fixed_pence") {
      summary = `£${(data.discount_value / 100).toFixed(2)} off`
    } else {
      summary = `${data.discount_value} month${data.discount_value !== 1 ? "s" : ""} free`
    }
    if (data.plan_restriction) {
      summary += ` on ${data.plan_restriction}`
    }

    return NextResponse.json({
      valid: true,
      code: data.code,
      coupon_id: data.id,
      discount_type: data.discount_type,
      discount_value: data.discount_value,
      description: data.description,
      plan_restriction: data.plan_restriction,
      summary,
    })
  } catch (e) {
    if ((e as { code?: string })?.code === "42P01") {
      return NextResponse.json({ valid: false, error: "Coupon system not yet available." })
    }
    console.error("[coupons/validate]", e)
    return NextResponse.json({ valid: false, error: "Internal server error." }, { status: 500 })
  }
}
