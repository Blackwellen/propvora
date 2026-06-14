import { Megaphone } from "lucide-react"
import { adminListAnnouncements, adminListWorkspaceOptions } from "@/lib/comms/data"
import AnnouncementsEditor from "./AnnouncementsEditor"

export const dynamic = "force-dynamic"

export default async function AdminAnnouncementsPage() {
  const [announcements, workspaces] = await Promise.all([
    adminListAnnouncements(200),
    adminListWorkspaceOptions(500),
  ])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-[#2563EB]" />
            Announcements
          </h1>
          <p className="text-sm text-slate-500">
            Publish in-app banners — global (all workspaces) or targeted to a single workspace, with severity and scheduling.
          </p>
        </div>
      </div>

      <AnnouncementsEditor initialAnnouncements={announcements} workspaces={workspaces} />
    </div>
  )
}
