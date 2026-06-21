"use client"

import React from "react"
import { AllGuestsTab } from "./AllGuestsTab"
import type { GuestCardData } from "./GuestCard"

interface LongTermGuestsTabProps {
  guests: GuestCardData[]
}

/** Renders only long-term and mixed guests (type !== "Short stay"). */
export function LongTermGuestsTab({ guests }: LongTermGuestsTabProps) {
  const filtered = guests.filter((g) => g.type !== "Short stay")
  return <AllGuestsTab guests={filtered} />
}
