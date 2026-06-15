"use client"

/* ──────────────────────────────────────────────────────────────────────────
   Thin re-export shim → the global inline-editing system.

   The original work InlineEditField (a typed superset of portfolio's adding a
   "currency" type) was hover-only. It now forwards to
   `@/components/editing/InlineEditField`, which natively supports `currency`
   and every other type, with an always-visible pen + full mobile support.
   No caller change required.

   Prefer importing from `@/components/editing` directly in new code.
─────────────────────────────────────────────────────────────────────────── */

export {
  InlineEditField,
  default,
  type InlineEditFieldProps,
} from "@/components/editing/InlineEditField"
