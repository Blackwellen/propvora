/**
 * P6 — Identity / KYC barrel.
 *
 * DB recorders + pure helpers for the identity-verification trail. These run
 * SERVER-SIDE only. They record DB rows and BUILD Stripe Identity params; they
 * NEVER execute a Stripe call. Status mutation (`setVerificationStatus*`) is
 * webhook/admin-driven only — KYC is never auto-approved here.
 *
 * This layer LAYERS ON TOP OF Stripe Connect (which already proves seller
 * identity for payouts) — see verification.ts for how "verified for selling" is
 * resolved across both paths.
 */

export * from "./types"
export * from "./verification"
export * from "./documents"
export * from "./screening"
