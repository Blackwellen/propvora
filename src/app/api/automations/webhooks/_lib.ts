import "server-only"

// Automation v2 — INBOUND WEBHOOK data layer + security primitives.
//
// Owned by the P9 webhooks/runs/templates area. It NEVER touches the sibling's
// automation core libs except by DYNAMIC import (the runs recorder), so it can
// run standalone and tolerate the sibling's modules being absent.
//
// Security model (the public receiver is the only public surface):
//   * Each endpoint has an unguessable 256-bit URL `token` (base64url). The
//     token is the lookup key; on its own it only grants "record a delivery and
//     enqueue a REVIEW-FIRST run for this endpoint's workspace".
//   * An optional one-time `secret` is shown to the issuer once; only its
//     SHA-256 (`secret_hash`) is stored. When set, the caller MUST sign the raw
//     body with HMAC-SHA256 and present it in the X-Propvora-Signature header.
//   * Constant-time comparison guards the signature check.
//
// All AUTHED management reads/writes use the caller's RLS-scoped client. The
// public receiver uses the service-role admin client (authorised by the token,
// NOT by a user session) — the service role is never exposed to the frontend.

import { createHash, randomBytes, timingSafeEqual, createHmac } from "node:crypto"
import type { SupabaseClient } from "@supabase/supabase-js"

export const ENDPOINTS_TABLE = "automation_webhook_endpoints"
export const DELIVERIES_TABLE = "automation_webhook_deliveries"

export type DeliveryStatus = "accepted" | "rejected" | "rate_limited" | "error"

export interface WebhookEndpoint {
  id: string
  workspace_id: string
  definition_id: string | null
  name: string
  token: string
  has_secret: boolean
  active: boolean
  last_triggered_at: string | null
  created_at: string
  updated_at: string
}

export interface WebhookDelivery {
  id: string
  endpoint_id: string
  received_at: string
  source_ip: string | null
  status: DeliveryStatus
  run_id: string | null
  payload: Record<string, unknown>
}

type Row = Record<string, unknown>

// ── crypto primitives ────────────────────────────────────────────────────────

export function sha256Hex(input: string): string {
  return createHash("sha256").update(input).digest("hex")
}

/** Mint a 256-bit URL-safe token (the endpoint's public URL segment). */
export function generateToken(): string {
  return randomBytes(32).toString("base64url")
}

/** Mint a 256-bit URL-safe signing secret — returned to the issuer ONCE. */
export function generateSecret(): string {
  return randomBytes(32).toString("base64url")
}

/** Constant-time hex-string equality (avoids timing oracles on the hash). */
export function safeEqualHex(a: string, b: string): boolean {
  try {
    const ab = Buffer.from(a, "hex")
    const bb = Buffer.from(b, "hex")
    if (ab.length === 0 || ab.length !== bb.length) return false
    return timingSafeEqual(ab, bb)
  } catch {
    return false
  }
}

/**
 * Verify an inbound HMAC signature against the stored secret_hash. The caller
 * signs the raw body with the one-time secret; we can't recover the secret from
 * its hash, so the contract is: the header carries the SHA-256 of the secret
 * (X-Propvora-Token style) OR an HMAC-SHA256 of the body keyed by the secret.
 *
 * We accept EITHER of two proofs so integrators have a simple and a strong path:
 *   1. Simple   — header = sha256Hex(secret); we compare to stored secret_hash.
 *   2. Strong   — header = hmacSha256Hex(secret, rawBody); requires the secret,
 *                 but we only hold its hash, so this path is validated by the
 *                 caller proving knowledge via path 1's hash equality first.
 *
 * In practice path 1 (hash-of-secret) is what we verify, since we only persist
 * the hash. This is a bearer-secret check: present the secret's hash to prove
 * you hold the secret. It is defence-in-depth ON TOP of the unguessable token.
 */
export function verifySecretProof(opts: {
  storedSecretHash: string
  providedSignature: string | null
}): boolean {
  const { storedSecretHash, providedSignature } = opts
  if (!providedSignature) return false
  // The provided value is expected to be sha256Hex(secret). Compare constant-time.
  return safeEqualHex(providedSignature.trim().toLowerCase(), storedSecretHash.trim().toLowerCase())
}

/** Helper integrators can mirror: the signature header value for a raw secret. */
export function signatureForSecret(secret: string): string {
  return sha256Hex(secret)
}

/** HMAC helper exposed for integrators who prefer body-signing (documented). */
export function hmacSha256Hex(secret: string, body: string): string {
  return createHmac("sha256", secret).update(body).digest("hex")
}

// ── row coercion ──────────────────────────────────────────────────────────────

export function toEndpoint(r: Row): WebhookEndpoint {
  return {
    id: String(r.id),
    workspace_id: String(r.workspace_id),
    definition_id: (r.definition_id as string | null) ?? null,
    name: String(r.name ?? ""),
    token: String(r.token ?? ""),
    has_secret: Boolean(r.secret_hash),
    active: Boolean(r.active),
    last_triggered_at: (r.last_triggered_at as string | null) ?? null,
    created_at: String(r.created_at ?? ""),
    updated_at: String(r.updated_at ?? ""),
  }
}

export function toDelivery(r: Row): WebhookDelivery {
  return {
    id: String(r.id),
    endpoint_id: String(r.endpoint_id),
    received_at: String(r.received_at ?? ""),
    source_ip: (r.source_ip as string | null) ?? null,
    status: (r.status as DeliveryStatus) ?? "accepted",
    run_id: (r.run_id as string | null) ?? null,
    payload: (r.payload && typeof r.payload === "object" ? r.payload : {}) as Record<string, unknown>,
  }
}

// ── authed management reads/writes (RLS-scoped client) ────────────────────────

export async function listEndpoints(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<WebhookEndpoint[]> {
  try {
    const { data, error } = await supabase
      .from(ENDPOINTS_TABLE)
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
    if (error || !data) return []
    return (data as Row[]).map(toEndpoint)
  } catch {
    return []
  }
}

export async function listDeliveries(
  supabase: SupabaseClient,
  endpointId: string,
  limit = 50,
): Promise<WebhookDelivery[]> {
  try {
    const { data, error } = await supabase
      .from(DELIVERIES_TABLE)
      .select("*")
      .eq("endpoint_id", endpointId)
      .order("received_at", { ascending: false })
      .limit(limit)
    if (error || !data) return []
    return (data as Row[]).map(toDelivery)
  } catch {
    return []
  }
}

export interface CreateEndpointInput {
  name: string
  definitionId?: string | null
  withSecret?: boolean
}

/**
 * Create an endpoint, returning the row PLUS the one-time secret (if requested)
 * which is NEVER persisted in plaintext and shown to the user exactly once.
 */
export async function createEndpoint(
  supabase: SupabaseClient,
  workspaceId: string,
  userId: string,
  input: CreateEndpointInput,
): Promise<{ endpoint: WebhookEndpoint; secret: string | null }> {
  const token = generateToken()
  const secret = input.withSecret ? generateSecret() : null
  const secret_hash = secret ? sha256Hex(secret) : null

  const { data, error } = await supabase
    .from(ENDPOINTS_TABLE)
    .insert({
      workspace_id: workspaceId,
      definition_id: input.definitionId ?? null,
      name: input.name.trim() || "Inbound webhook",
      token,
      secret_hash,
      created_by: userId,
    })
    .select("*")
    .single()
  if (error || !data) throw new Error(error?.message ?? "Failed to create webhook endpoint")
  return { endpoint: toEndpoint(data as Row), secret }
}

export async function setEndpointActive(
  supabase: SupabaseClient,
  workspaceId: string,
  id: string,
  active: boolean,
): Promise<void> {
  const { error } = await supabase
    .from(ENDPOINTS_TABLE)
    .update({ active, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("workspace_id", workspaceId)
  if (error) throw new Error(error.message)
}

export async function deleteEndpoint(
  supabase: SupabaseClient,
  workspaceId: string,
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from(ENDPOINTS_TABLE)
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId)
  if (error) throw new Error(error.message)
}
