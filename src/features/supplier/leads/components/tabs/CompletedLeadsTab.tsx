"use client"

import { LeadsListView } from "../LeadsListView"

export function CompletedLeadsTab() {
  return <LeadsListView initialStatus="completed" showStatusTabs={false} />
}
