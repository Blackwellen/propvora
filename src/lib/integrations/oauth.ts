/**
 * Shared OAuth utilities for Propvora integration connectors.
 *
 * State signing prevents CSRF on OAuth callbacks: the state parameter carries
 * the workspace_id and a nonce, signed with HMAC-SHA256 using the service role
 * key. The callback verifies the signature before trusting the workspace_id.
 *
 * Token storage: tokens are upserted into automation_integrations.config as
 * { type: "oauth", access_token, refresh_token, expires_at, scope, account_label }.
 * Status is set to "connected" on success, "error" on failure.
 */

import { createHmac } from "crypto"
import { createClient } from "@/lib/supabase/server"

// ── State signing ──────────────────────────────────────────────────────────────

const STATE_SECRET = () => process.env.SUPABASE_SERVICE_ROLE_KEY ?? "propvora-oauth-state-fallback"

export function createOAuthState(workspaceId: string): string {
  const nonce = crypto.randomUUID()
  const payload = `${workspaceId}:${nonce}`
  const sig = createHmac("sha256", STATE_SECRET()).update(payload).digest("hex").slice(0, 20)
  return Buffer.from(`${payload}:${sig}`).toString("base64url")
}

export function parseOAuthState(state: string): { workspaceId: string } | null {
  try {
    const decoded = Buffer.from(state, "base64url").toString("utf8")
    const parts = decoded.split(":")
    if (parts.length < 3) return null
    const sig = parts[parts.length - 1]
    const payload = parts.slice(0, -1).join(":")
    const workspaceId = parts[0]
    const expected = createHmac("sha256", STATE_SECRET()).update(payload).digest("hex").slice(0, 20)
    if (sig !== expected) return null
    return { workspaceId }
  } catch {
    return null
  }
}

// ── Workspace resolver ─────────────────────────────────────────────────────────

export async function resolveWorkspaceId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from("profiles")
    .select("current_workspace_id")
    .eq("id", user.id)
    .maybeSingle()
  return (profile?.current_workspace_id as string | null) ?? null
}

// ── Token exchange helpers ─────────────────────────────────────────────────────

export interface TokenResponse {
  access_token: string
  refresh_token?: string
  expires_in?: number
  token_type?: string
  scope?: string
  /** Provider-specific extras (e.g. Stripe account_id, Xero tenant_id) */
  extra?: Record<string, unknown>
}

export async function exchangeCodeBasicAuth(params: {
  tokenUrl: string
  code: string
  redirectUri: string
  clientId: string
  clientSecret: string
  extraBody?: Record<string, string>
}): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: params.code,
    redirect_uri: params.redirectUri,
    ...params.extraBody,
  })
  const credentials = Buffer.from(`${params.clientId}:${params.clientSecret}`).toString("base64")
  const res = await fetch(params.tokenUrl, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: body.toString(),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Token exchange failed (${res.status}): ${text}`)
  }
  return res.json() as Promise<TokenResponse>
}

export async function exchangeCodeBodyAuth(params: {
  tokenUrl: string
  code: string
  redirectUri: string
  clientId: string
  clientSecret: string
  extraBody?: Record<string, string>
}): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: params.code,
    redirect_uri: params.redirectUri,
    client_id: params.clientId,
    client_secret: params.clientSecret,
    ...params.extraBody,
  })
  const res = await fetch(params.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: body.toString(),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Token exchange failed (${res.status}): ${text}`)
  }
  return res.json() as Promise<TokenResponse>
}

// ── Token storage ──────────────────────────────────────────────────────────────

export interface StoreTokensParams {
  workspaceId: string
  provider: string
  category: string
  name: string
  tokens: TokenResponse
  accountLabel?: string
}

export async function storeTokens(params: StoreTokensParams): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const expiresAt = params.tokens.expires_in
    ? new Date(Date.now() + params.tokens.expires_in * 1000).toISOString()
    : null

  const config = {
    type: "oauth" as const,
    access_token: params.tokens.access_token,
    refresh_token: params.tokens.refresh_token ?? null,
    expires_at: expiresAt,
    token_type: params.tokens.token_type ?? "Bearer",
    scope: params.tokens.scope ?? null,
    account_label: params.accountLabel ?? null,
    extra: params.tokens.extra ?? null,
  }

  const { error } = await supabase
    .from("automation_integrations")
    .upsert(
      {
        workspace_id: params.workspaceId,
        provider: params.provider,
        name: params.name,
        category: params.category,
        status: "connected",
        health: "healthy",
        config,
        enabled: true,
        last_sync: new Date().toISOString(),
        created_by: user?.id ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "workspace_id,provider" },
    )
  if (error) throw new Error(`Failed to store tokens: ${error.message}`)
}

// ── Error redirect ─────────────────────────────────────────────────────────────

export function oauthErrorRedirect(appUrl: string, provider: string, message: string): Response {
  const params = new URLSearchParams({ integration: provider, error: message })
  return Response.redirect(`${appUrl}/property-manager/automations/integrations?${params.toString()}`)
}

export function oauthSuccessRedirect(appUrl: string, provider: string): Response {
  const params = new URLSearchParams({ integration: provider, connected: "1" })
  return Response.redirect(`${appUrl}/property-manager/automations/integrations?${params.toString()}`)
}
