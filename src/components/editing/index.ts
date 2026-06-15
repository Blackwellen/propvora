/* ──────────────────────────────────────────────────────────────────────────
   Propvora GLOBAL INLINE-EDITING SYSTEM

   One always-visible, accessible, mobile/PWA-friendly inline editor for the
   whole app. Presentation + state only — callers own the Supabase mutation
   (workspace-scoped + RLS) via the `onSave` prop.

   Variants:
     InlineEditField               base (text / textarea / number / currency /
                                    date / select / url / email / phone)
     InlineEditCell                dense table-cell variant
     InlineEditSelect              dropdown (+ workflow-safe `transition`)
     InlineEditMoney               currency with non-negative guard
     InlineEditDate                native date input
     InlineEditTextarea            multi-line (mobile sheet)
     InlineEditRelationshipSelect  searchable FK picker (never raw UUIDs)
     InlineEditBoolean             toggle switch

   State engine: useInlineEdit (src/hooks/useInlineEdit.ts).
─────────────────────────────────────────────────────────────────────────── */

export {
  InlineEditField,
  default as InlineEditFieldDefault,
  type InlineEditFieldProps,
  type InlineEditType,
  type InlineEditOption,
} from "./InlineEditField"

export { InlineEditCell } from "./InlineEditCell"
export { InlineEditSelect, type InlineEditSelectProps } from "./InlineEditSelect"
export { InlineEditMoney, type InlineEditMoneyProps } from "./InlineEditMoney"
export { InlineEditDate, type InlineEditDateProps } from "./InlineEditDate"
export { InlineEditTextarea, type InlineEditTextareaProps } from "./InlineEditTextarea"
export {
  InlineEditRelationshipSelect,
  type InlineEditRelationshipSelectProps,
  type RelationshipOption,
} from "./InlineEditRelationshipSelect"
export { InlineEditBoolean, type InlineEditBooleanProps } from "./InlineEditBoolean"

export {
  useInlineEdit,
  type UseInlineEditOptions,
  type UseInlineEditReturn,
} from "@/hooks/useInlineEdit"
