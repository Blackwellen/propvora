"use client"

import { LeadsListView } from "../LeadsListView"

export function AllLeadsTab() {
  return <LeadsListView initialStatus="all" showStatusTabs={false} />
}
