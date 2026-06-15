"use client"

import { InlineEditField, type InlineEditFieldProps } from "./InlineEditField"

export type InlineEditDateProps = Omit<InlineEditFieldProps, "type">

/** Date inline editor (native date input). */
export function InlineEditDate(props: InlineEditDateProps) {
  return <InlineEditField {...props} type="date" />
}

export default InlineEditDate
