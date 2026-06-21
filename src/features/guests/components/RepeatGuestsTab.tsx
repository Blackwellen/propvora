"use client"

import React from "react"
import { AllGuestsTab } from "./AllGuestsTab"
import type { GuestCardData } from "./GuestCard"

interface RepeatGuestsTabProps {
  guests: GuestCardData[]
}

/** Renders only guests with more than one booking. */
export function RepeatGuestsTab({ guests }: RepeatGuestsTabProps) {
  const filtered = guests.filter((g) => g.bookings > 1)
  return <AllGuestsTab guests={filtered} />
}
