import AdminManagementPage from "../../_components/AdminManagementPage"

export default function AdminAutomationUsageCapsPage() {
  return (
    <AdminManagementPage
      title="Automation usage caps"
      description="Platform controls for automation execution limits, workspace quotas, throttling, overage review and abuse prevention."
      items={[
        "Workspace caps",
        "Run quotas",
        "AI usage limits",
        "Webhook throttles",
        "Retry limits",
        "Overage alerts",
        "Abuse flags",
        "Limit audit trail",
      ]}
    />
  )
}
