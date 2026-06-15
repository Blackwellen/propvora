"use client"

import { InlineEditField, type InlineEditFieldProps } from "./InlineEditField"

export type InlineEditTextareaProps = Omit<InlineEditFieldProps, "type">

/** Multi-line text inline editor. Uses the mobile sheet for comfortable typing. */
export function InlineEditTextarea(props: InlineEditTextareaProps) {
  return <InlineEditField useSheetOnMobile {...props} type="textarea" />
}

export default InlineEditTextarea
