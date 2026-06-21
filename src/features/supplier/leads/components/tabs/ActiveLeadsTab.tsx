"use client"

import { LeadsListView } from "../LeadsListView"

export function ActiveLeadsTab() {
  return <LeadsListView initialStatus="active" showStatusTabs={false} />
}
