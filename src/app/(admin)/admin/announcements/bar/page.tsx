import { redirect } from "next/navigation"

// Canonical URL is /admin/announcement-bar — redirect the legacy nested stub.
export default function AnnouncementsBarRedirect() {
  redirect("/admin/announcement-bar")
}
