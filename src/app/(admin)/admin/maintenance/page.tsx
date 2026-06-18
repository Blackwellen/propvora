import AdminManagementPage from "../_components/AdminManagementPage"

export default function AdminMaintenancePage() {
  return (
    <AdminManagementPage
      title="Maintenance mode"
      description="Platform maintenance controls for planned downtime, banner messaging, restricted access, health checks and rollback status."
      items={[
        "Global maintenance switch",
        "Workspace allowlist",
        "Announcement copy",
        "API readiness",
        "Scheduled windows",
        "Rollback status",
        "Customer comms",
        "Post-maintenance checks",
      ]}
    />
  )
}
