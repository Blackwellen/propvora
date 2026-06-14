import AnnouncementBanner from "@/components/comms/AnnouncementBanner"

/**
 * In-app content layout. Mounts the global/workspace AnnouncementBanner above
 * every /app page. This nests INSIDE the AppShell provided by the parent
 * (app)/layout.tsx, so it is self-contained and does not modify the shared
 * shell. The banner is a "use client" component that self-fetches its data
 * (RLS-scoped) and renders nothing when there are no active announcements.
 */
export default function AppContentLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AnnouncementBanner />
      {children}
    </>
  )
}
