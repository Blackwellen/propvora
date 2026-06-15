"use client"

import { cn } from "@/lib/utils"
import { InlineEditField, type InlineEditFieldProps } from "./InlineEditField"

/* Dense table-cell variant. Same engine, tighter chrome, sheet editor on
   mobile so editing inside a horizontally-scrolling table is comfortable. */
export function InlineEditCell({
  className,
  displayClassName,
  ...props
}: InlineEditFieldProps) {
  return (
    <InlineEditField
      {...props}
      dense
      useSheetOnMobile
      silentToast={props.silentToast ?? true}
      className={cn("w-full", className)}
      displayClassName={cn("text-[12.5px] truncate", displayClassName)}
    />
  )
}

export default InlineEditCell
