/**
 * P5+ — Money lib barrel (TYPES only).
 *
 * The data-layer modules (fee-rules, fx, sections) are "server-only" and are
 * imported directly by the server routes/actions that use them — we deliberately
 * do NOT re-export them here so importing a money TYPE from "@/lib/money" never
 * drags server code into a client bundle.
 */
export * from "./types"
