"use client"

import { LeadsListView } from "../LeadsListView"

export function DeclinedLeadsTab() {
  return <LeadsListView initialStatus="declined" showStatusTabs={false} />
}
