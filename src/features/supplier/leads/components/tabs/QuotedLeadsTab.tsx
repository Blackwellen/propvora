"use client"

import { LeadsListView } from "../LeadsListView"

export function QuotedLeadsTab() {
  return <LeadsListView initialStatus="quoted" showStatusTabs={false} />
}
