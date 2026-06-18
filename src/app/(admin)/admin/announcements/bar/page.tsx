import AdminManagementPage from "../../_components/AdminManagementPage"

export default function AdminAnnouncementBarPage() {
  return (
    <AdminManagementPage
      title="Announcement bar"
      description="Dedicated controls for global and targeted top-of-app announcement bars, severity, scheduling and workspace targeting."
      items={[
        "Global banner",
        "Workspace targeting",
        "Severity",
        "Start/end schedule",
        "Dismissibility",
        "Maintenance copy",
        "Audit history",
        "Preview states",
      ]}
    />
  )
}
