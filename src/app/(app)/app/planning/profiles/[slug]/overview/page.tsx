import { notFound } from 'next/navigation'
import { getProfileBySlug } from '@/lib/planning/profile-config'
import { ProfilePageShell } from '@/components/planning/profiles'
import { OverviewTab } from '@/components/planning/profiles/tabs'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function ProfileOverviewPage({ params }: PageProps) {
  const { slug } = await params
  const profile = getProfileBySlug(slug)
  if (!profile) notFound()

  return (
    <ProfilePageShell profile={profile} activeTab="overview">
      <OverviewTab profile={profile} />
    </ProfilePageShell>
  )
}

