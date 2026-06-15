"use client"

import { InlineEditField, type InlineEditFieldProps } from "./InlineEditField"

export interface InlineEditMoneyProps
  extends Omit<InlineEditFieldProps, "type" | "prefix"> {
  /** Currency symbol prefix. Defaults to "£". */
  currencySymbol?: string
}

/**
 * Currency inline editor. Renders a numeric editor with a currency prefix and
 * a non-negative validation guard layered on top of any caller `validate`.
 */
export function InlineEditMoney({
  currencySymbol = "£",
  validate,
  ...props
}: InlineEditMoneyProps) {
  return (
    <InlineEditField
      {...props}
      type="currency"
      prefix={currencySymbol}
      validate={(v) => {
        const own = validate?.(v)
        if (own) return own
        if (v !== "" && Number.isNaN(Number(v))) return "Enter a valid amount"
        if (v !== "" && Number(v) < 0) return "Amount can't be negative"
        return null
      }}
    />
  )
}

export default InlineEditMoney
