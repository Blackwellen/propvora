import AdminManagementPage from "../_components/AdminManagementPage"

export default function AdminCronPage() {
  return (
    <AdminManagementPage
      title="Cron management"
      description="Visibility and controls for scheduled jobs, reconciliation tasks, automation runners, daily maintenance and stuck-job recovery."
      items={[
        "Daily cron",
        "Automation runner",
        "Payment reconciliation",
        "Expired holds",
        "Failed jobs",
        "Manual reruns",
        "Last run status",
        "Operational alerts",
      ]}
    />
  )
}
