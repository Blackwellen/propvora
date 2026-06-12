"use server"

import { createClient } from "@/lib/supabase/server"
import { createHash } from "node:crypto"
import { headers } from "next/headers"

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

// ── Contact form ────────────────────────────────────────────────────────────

export async function submitContactRequest(input: {
  name: string
  email: string
  message: string
}): Promise<PublicFormResult> {
  const name = (input.name ?? "").trim()
  const email = (input.email ?? "").trim().toLowerCase()
  const message = (input.message ?? "").trim()

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

  const supabase = await createClient()
  const ipHash = await clientIpHash()

  const { error } = await supabase.from("contact_requests").insert({
    name,
    email,
    message,
    source: "contact_form",
    ip_hash: ipHash,
  })

  if (error) {
    if (isMissingTable(error.code)) {
      // Persistence layer not yet provisioned — fail honestly, do not fake success.
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

  return { ok: true }
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
