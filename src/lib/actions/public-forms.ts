"use server"

import { createClient } from "@/lib/supabase/server"
import { createHash } from "node:crypto"
import { headers } from "next/headers"
import { checkRateLimit } from "@/lib/security/rateLimit"
import { sendEmail } from "@/lib/email"

// ── Validation ──────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface PublicFormResult {
  ok: boolean
  error?: string
}

// Postgres "undefined table" error — table not yet migrated.
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

const CONTACT_CATEGORIES = [
  "General enquiry",
  "Product demo request",
  "Billing & pricing",
  "Technical support",
  "Partnership or integration",
  "Security or data concern",
  "Other",
] as const
type ContactCategory = typeof CONTACT_CATEGORIES[number]

// ── Contact form ────────────────────────────────────────────────────────────

export async function submitContactRequest(input: {
  name: string
  email: string
  message: string
  category?: string
}): Promise<PublicFormResult> {
  const name = (input.name ?? "").trim()
  const email = (input.email ?? "").trim().toLowerCase()
  const message = (input.message ?? "").trim()
  const category = ((input.category ?? "General enquiry").trim() || "General enquiry") as ContactCategory

  if (!name || !email || !message) {
    return { ok: false, error: "Please fill in all fields before sending." }
  }
  if (name.length > 120) return { ok: false, error: "Your name is too long." }
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "Please enter a valid email address." }
  }
  if (message.length < 5) {
    return { ok: false, error: "Please add a little more detail to your message." }
  }
  if (message.length > 5000) {
    return { ok: false, error: "Your message is too long (5000 characters max)." }
  }

  // Rate limit: max 3 contact submissions per IP per hour.
  const ipHash = await clientIpHash()
  if (ipHash) {
    const { allowed } = checkRateLimit(ipHash, "contact_form", 3, 60 * 60 * 1000)
    if (!allowed) {
      return {
        ok: false,
        error: "You have sent too many messages. Please wait a while before trying again, or email hello@propvora.com directly.",
      }
    }
  }

  const supabase = await createClient()

  const { data: inserted, error } = await supabase
    .from("contact_requests")
    .insert({
      name,
      email,
      message,
      category,
      source: "contact_form",
      ip_hash: ipHash,
      metadata: {},
    })
    .select("id")
    .single()

  if (error) {
    if (isMissingTable(error.code)) {
      return {
        ok: false,
        error:
          "We could not record your message right now. Please email hello@propvora.com and we'll get back to you.",
      }
    }
    console.error("[submitContactRequest]", error)
    return {
      ok: false,
      error: "Something went wrong sending your message. Please try again shortly.",
    }
  }

  const refId = (inserted as { id?: string } | null)?.id?.slice(0, 8).toUpperCase() ?? "N/A"

  // Fire both emails in parallel; neither failure blocks the user success response.
  await Promise.allSettled([
    // 1. Internal alert to support team.
    sendEmail({
      to: "support@propvora.com",
      subject: `[Propvora Contact] ${category} — ${name}`,
      replyTo: email,
      html: internalAlertHtml({ name, email, category, message, refId }),
    }),
    // 2. Confirmation to submitter.
    sendEmail({
      to: email,
      subject: "We received your message — Propvora",
      replyTo: "support@propvora.com",
      html: submitterConfirmationHtml({ name, category, message, refId }),
    }),
  ])

  return { ok: true }
}

// ── Email templates ──────────────────────────────────────────────────────────

function internalAlertHtml(p: {
  name: string; email: string; category: string; message: string; refId: string
}): string {
  const safeMsg = p.message.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>")
  return `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;color:#1e293b;max-width:600px;margin:0 auto;padding:24px">
<div style="background:#0D1B2A;padding:16px 24px;border-radius:12px 12px 0 0">
  <span style="color:#fff;font-weight:700;font-size:18px">Propvora</span>
  <span style="color:#94a3b8;font-size:14px;margin-left:8px">Contact form submission</span>
</div>
<div style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 12px 12px">
  <table style="width:100%;border-collapse:collapse;font-size:14px">
    <tr><td style="padding:6px 0;color:#64748b;width:120px">Reference</td><td style="padding:6px 0;font-weight:600">#${p.refId}</td></tr>
    <tr><td style="padding:6px 0;color:#64748b">Category</td><td style="padding:6px 0;font-weight:600">${p.category}</td></tr>
    <tr><td style="padding:6px 0;color:#64748b">Name</td><td style="padding:6px 0">${p.name}</td></tr>
    <tr><td style="padding:6px 0;color:#64748b">Email</td><td style="padding:6px 0"><a href="mailto:${p.email}" style="color:#2563eb">${p.email}</a></td></tr>
  </table>
  <div style="margin-top:16px;background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:16px;font-size:14px;line-height:1.6">
    ${safeMsg}
  </div>
  <p style="margin-top:16px;font-size:12px;color:#94a3b8">Reply directly to this email to respond to ${p.name}.</p>
</div></body></html>`
}

function submitterConfirmationHtml(p: {
  name: string; category: string; message: string; refId: string
}): string {
  const safeMsg = p.message.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>")
  return `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;color:#1e293b;max-width:600px;margin:0 auto;padding:24px">
<div style="background:#0D1B2A;padding:16px 24px;border-radius:12px 12px 0 0">
  <span style="color:#fff;font-weight:700;font-size:18px">Propvora</span>
</div>
<div style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 12px 12px">
  <h2 style="margin:0 0 8px;font-size:20px">Thanks, ${p.name}!</h2>
  <p style="color:#475569;margin:0 0 16px">We've received your message and will get back to you within one business day.</p>
  <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px 16px;font-size:14px;margin-bottom:16px">
    <span style="color:#1d4ed8;font-weight:600">Reference: #${p.refId}</span>
    <span style="color:#64748b;margin-left:12px">Topic: ${p.category}</span>
  </div>
  <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:16px;font-size:14px;color:#64748b;line-height:1.6">
    <strong style="color:#1e293b">Your message:</strong><br><br>${safeMsg}
  </div>
  <p style="margin-top:16px;font-size:13px;color:#64748b">In the meantime, browse our <a href="https://propvora.com/help" style="color:#2563eb">Help Centre</a> — you may find an instant answer there.</p>
  <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0">
  <p style="font-size:12px;color:#94a3b8;margin:0">Propvora · <a href="https://propvora.com" style="color:#94a3b8">propvora.com</a> · <a href="mailto:support@propvora.com" style="color:#94a3b8">support@propvora.com</a><br>Blackwellen Ltd, 61 Bridge Street, Kington HR5 3DJ · Registered in England &amp; Wales No. 16482166</p>
</div></body></html>`
}

// ── Waitlist ────────────────────────────────────────────────────────────────

export async function submitWaitlistEntry(input: {
  email: string
  name?: string
  company?: string
}): Promise<PublicFormResult> {
  const email = (input.email ?? "").trim().toLowerCase()
  const name = (input.name ?? "").trim() || null
  const company = (input.company ?? "").trim() || null

  if (!email) return { ok: false, error: "Please enter your email address." }
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "Please enter a valid email address." }
  }

  const supabase = await createClient()
  const ipHash = await clientIpHash()

  const { error } = await supabase.from("waitlist_entries").insert({
    email,
    name,
    company,
    source: "waitlist",
    ip_hash: ipHash,
  })

  if (error) {
    // Duplicate email — treat as success (they're already on the list).
    if (error.code === "23505") return { ok: true }
    if (isMissingTable(error.code)) {
      return {
        ok: false,
        error:
          "We could not add you to the waitlist right now. Please email hello@propvora.com to be added.",
      }
    }
    console.error("[submitWaitlistEntry]", error)
    return { ok: false, error: "Something went wrong. Please try again shortly." }
  }

  return { ok: true }
}
