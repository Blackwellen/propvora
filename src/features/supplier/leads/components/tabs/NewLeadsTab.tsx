"use client"

import { LeadsListView } from "../LeadsListView"

export function NewLeadsTab() {
  return <LeadsListView initialStatus="new" showStatusTabs={false} />
}
