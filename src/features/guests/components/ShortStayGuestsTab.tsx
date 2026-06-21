"use client"

import React from "react"
import { AllGuestsTab } from "./AllGuestsTab"
import type { GuestCardData } from "./GuestCard"

interface ShortStayGuestsTabProps {
  guests: GuestCardData[]
}

/** Renders only short-stay guests (type === "Short stay"). */
export function ShortStayGuestsTab({ guests }: ShortStayGuestsTabProps) {
  const filtered = guests.filter((g) => g.type === "Short stay")
  return <AllGuestsTab guests={filtered} />
}
