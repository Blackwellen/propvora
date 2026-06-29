import { HomeDashboardPage } from "@/features/home/pages/HomeDashboardPage"

// Server wrapper for the home dashboard. `export const dynamic` is route-segment
// config and is IGNORED in a "use client" module — so the previous client page
// left this per-user, live-data dashboard eligible for prerendering, which tripped
// its Suspense boundary during server render (React #419, "switched to client
// rendering"). Keeping the page a Server Component makes force-dynamic effective
// and renders the client dashboard as a child (valid in the App Router).
export const dynamic = "force-dynamic"

export default function AppRootPage() {
  return <HomeDashboardPage />
}
