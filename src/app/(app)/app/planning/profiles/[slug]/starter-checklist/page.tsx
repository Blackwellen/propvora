import { notFound } from 'next/navigation'
import { getProfileBySlug } from '@/lib/planning/profile-config'
import { ProfilePageShell } from '@/components/planning/profiles'
import { StarterChecklistTab } from '@/components/planning/profiles/tabs'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function ProfileStarterChecklistPage({ params }: PageProps) {
  const { slug } = await params
  const profile = getProfileBySlug(slug)
  if (!profile) notFound()

  return (
    <ProfilePageShell profile={profile} activeTab="starter-checklist">
      <StarterChecklistTab profile={profile} />
    </ProfilePageShell>
  )
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const profile = getProfileBySlug(slug)
  return {
    title: profile ? `${profile.name} — Starter Checklist | Propvora` : 'Planning Profile',
  }
}
