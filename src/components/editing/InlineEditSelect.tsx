"use client"

import { InlineEditField, type InlineEditFieldProps } from "./InlineEditField"

export interface InlineEditSelectProps
  extends Omit<InlineEditFieldProps, "type"> {
  options: InlineEditFieldProps["options"]
  /**
   * Workflow-safe status transition handler. When provided, the chosen value
   * is routed through this rather than persisted as free text — callers can
   * reject invalid transitions. Falls back to the chosen value.
   */
  transition?: (next: string) => Promise<void>
}

/** Dropdown/select inline editor. */
export function InlineEditSelect({
  transition,
  onSave,
  ...props
}: InlineEditSelectProps) {
  return (
    <InlineEditField
      {...props}
      type="select"
      onSave={transition ?? onSave}
    />
  )
}

export default InlineEditSelect
