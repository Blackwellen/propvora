"use client"

import React from "react"
import type { ContactSaveFn } from "./types"

export const ContactSaveContext = React.createContext<{ save: ContactSaveFn; editable: boolean }>({
  save: async () => {},
  editable: false,
})

export function useContactSave() {
  return React.useContext(ContactSaveContext)
}
