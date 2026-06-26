"use server"

import { createClient } from "@/lib/supabase/server"
import { createHash } from "node:crypto"
import { headers } from "next/headers"
import { discountCodeFromHandle } from "@/lib/affiliate/levels"
import { COMPANY } from "@/lib/legal/company"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface AffiliateActionResult {
  ok: boolean
  error?: string
  referralCode?: string
  discountReferralCode?: string
}

function isMissingTable(code: string | undefined): boolean {
  return code === "42P01"
}

async function clientIpHash(): Promise<string | null> {
  try {
    const h = await headers()
    const fwd = h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? ""
    const ip = fwd.split(",")[0]?.trim()
    if (!ip) return null
    return createHash("sha256").update(ip).digest("hex").slice(0, 32)
  } catch {
    return null
  }
}

/** Deterministic-ish referral code from a seed + short random suffix. */
function makeReferralCode(seed: string): string {
  const base = seed
    .split("@")[0]
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase()
    .slice(0, 8) || "partner"
  const rand = Math.random().toString(36).slice(2, 6)
  return `${base}-${rand}`
}

// ── External door: public application ────────────────────────────────────────

export async function submitAffiliateApplication(input: {
  fullName: string
  email: string
  company?: string
  website?: string
  audienceType?: string
  promotionPlan: string
  estimatedAudience?: string
  country?: string
  existingCustomer?: boolean
  acceptedTerms: boolean
  /** Workspace ID of the affiliate who sent the recruit link (optional). */
  recruitedByWorkspaceId?: string | null
}): Promise<AffiliateActionResult> {
  const fullName = (input.fullName ?? "").trim()
  const email = (input.email ?? "").trim().toLowerCase()
  const promotionPlan = (input.promotionPlan ?? "").trim()

  if (!fullName || !email || !promotionPlan) {
    return { ok: false, error: "Please complete your name, email and how you plan to promote Propvora." }
  }
  if (fullName.length > 120) return { ok: false, error: "Your name is too long." }
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Please enter a valid email address." }
  if (promotionPlan.length < 10) {
    return { ok: false, error: "Please tell us a little more about how you'll promote Propvora." }
  }
  if (promotionPlan.length > 3000) return { ok: false, error: "That promotion plan is too long." }
  if (!input.acceptedTerms) {
    return { ok: false, error: "Please accept the Affiliate Terms to apply." }
  }

  const supabase = await createClient()
  const ipHash = await clientIpHash()
  const referralCode = makeReferralCode(email)

  // Validate recruitedBy workspace exists and is an approved affiliate
  let recruitedByWsId: string | null = null
  if (input.recruitedByWorkspaceId) {
    try {
      const { data: recruiter } = await supabase
        .from("affiliates")
        .select("workspace_id, approved, enrolled")
        .eq("workspace_id", input.recruitedByWorkspaceId)
        .maybeSingle()
      if (recruiter?.approved && recruiter?.enrolled) {
        recruitedByWsId = recruiter.workspace_id as string
      }
    } catch { /* non-fatal — skip if table missing */ }
  }

  const { error } = await supabase.from("affiliate_applications").insert({
    full_name: fullName,
    email,
    company: (input.company ?? "").trim() || null,
    website: (input.website ?? "").trim() || null,
    audience_type: input.audienceType ?? null,
    promotion_plan: promotionPlan,
    estimated_audience: (input.estimatedAudience ?? "").trim() || null,
    country: (input.country ?? "").trim() || null,
    existing_customer: !!input.existingCustomer,
    referral_code: referralCode,
    status: "pending_review",
    ip_hash: ipHash,
    recruited_by_affiliate_workspace_id: recruitedByWsId,
  })

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "It looks like you've already applied with this email. We'll be in touch." }
    }
    if (isMissingTable(error.code)) {
      return {
        ok: false,
        error: `We couldn't record your application right now. Please email ${COMPANY.emails.support} and we'll set you up.`,
      }
    }
    console.error("[submitAffiliateApplication]", error)
    return { ok: false, error: "Something went wrong submitting your application. Please try again shortly." }
  }

  return { ok: true, referralCode }
}

// ── Update affiliate profile (handle + payout email) ─────────────────────────

export async function updateAffiliateProfile(
  workspaceId: string,
  input: { publicHandle: string | null; payoutEmail: string | null; leaderboardVisible?: boolean }
): Promise<AffiliateActionResult> {
  if (!workspaceId) return { ok: false, error: "No workspace selected." }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "Please sign in." }

  const { data: member } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .maybeSingle()
  if (!member || !["owner", "admin"].includes((member.role as string) ?? "")) {
    return { ok: false, error: "Only a workspace owner or admin can update affiliate settings." }
  }

  const handle = (input.publicHandle ?? "").trim() || null
  const payoutEmail = (input.payoutEmail ?? "").trim() || null

  if (handle && !/^[a-z0-9_-]{3,32}$/i.test(handle)) {
    return { ok: false, error: "Handle must be 3–32 characters (letters, numbers, - _)." }
  }
  if (payoutEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payoutEmail)) {
    return { ok: false, error: "Please enter a valid payout email address." }
  }

  const update: Record<string, unknown> = {
    public_handle: handle,
    payout_email: payoutEmail,
    updated_at: new Date().toISOString(),
  }
  if (typeof input.leaderboardVisible === "boolean") {
    update.leaderboard_visible = input.leaderboardVisible
  }

  const { error } = await supabase
    .from("affiliates")
    .update(update)
    .eq("workspace_id", workspaceId)

  if (error) {
    if (isMissingTable(error.code)) {
      return { ok: false, error: "Affiliate programme not yet available." }
    }
    console.error("[updateAffiliateProfile]", error)
    return { ok: false, error: "Could not save settings." }
  }

  return { ok: true }
}

// ── Internal door: one-click enrol for an existing workspace ──────────────────

export async function enrolWorkspaceAffiliate(
  workspaceId: string,
  options?: { recruitedByWorkspaceId?: string | null }
): Promise<AffiliateActionResult> {
  if (!workspaceId) return { ok: false, error: "No workspace selected." }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "Please sign in to join the programme." }

  const { data: member } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .maybeSingle()
  if (!member || !["owner", "admin"].includes((member.role as string) ?? "")) {
    return { ok: false, error: "Only a workspace owner or admin can enrol in the affiliate programme." }
  }

  // Already enrolled?
  const { data: existing } = await supabase
    .from("affiliates")
    .select("referral_code, discount_referral_code, enrolled")
    .eq("workspace_id", workspaceId)
    .maybeSingle()
  if (existing?.enrolled && existing.referral_code) {
    return {
      ok: true,
      referralCode: existing.referral_code as string,
      discountReferralCode: (existing.discount_referral_code as string | null) ?? discountCodeFromHandle(existing.referral_code as string),
    }
  }

  const referralCode = (existing as { referral_code?: string } | null)?.referral_code ?? makeReferralCode(user.email ?? workspaceId)
  const discountCode = discountCodeFromHandle(referralCode)

  // Validate recruiter if provided
  let recruitedByWsId: string | null = options?.recruitedByWorkspaceId ?? null
  if (recruitedByWsId) {
    // Prevent self-recruitment
    if (recruitedByWsId === workspaceId) recruitedByWsId = null
    else {
      try {
        const { data: recruiter } = await supabase
          .from("affiliates")
          .select("workspace_id, approved, enrolled")
          .eq("workspace_id", recruitedByWsId)
          .maybeSingle()
        if (!recruiter?.approved || !recruiter?.enrolled) recruitedByWsId = null
      } catch {
        recruitedByWsId = null
      }
    }
  }

  const { error } = await supabase.from("affiliates").upsert(
    {
      workspace_id: workspaceId,
      enrolled: true,
      approved: true, // internal customers are auto-approved
      origin: "internal",
      referral_code: referralCode,
      discount_referral_code: discountCode,
      payout_email: user.email ?? null,
      recruited_by_affiliate_workspace_id: recruitedByWsId,
      applied_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "workspace_id" }
  )

  if (error) {
    if (isMissingTable(error.code)) {
      return { ok: false, error: "The affiliate programme isn't available yet. Please check back soon." }
    }
    console.error("[enrolWorkspaceAffiliate]", error)
    return { ok: false, error: "We couldn't enrol you right now. Please try again shortly." }
  }

  // Increment recruiter's sub_affiliate_count
  if (recruitedByWsId) {
    try {
      const { data: recruiterAff } = await supabase
        .from("affiliates")
        .select("sub_affiliate_count")
        .eq("workspace_id", recruitedByWsId)
        .maybeSingle()
      if (recruiterAff) {
        await supabase
          .from("affiliates")
          .update({
            sub_affiliate_count: Number(recruiterAff.sub_affiliate_count ?? 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq("workspace_id", recruitedByWsId)
      }
    } catch { /* non-fatal */ }
  }

  return { ok: true, referralCode, discountReferralCode: discountCode }
}
