import { notFound } from 'next/navigation'
import { getProfileBySlug } from '@/lib/planning/profile-config'
import { ProfilePageShell } from '@/components/planning/profiles'
import { ComplianceTab } from '@/components/planning/profiles/tabs'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function ProfileCompliancePage({ params }: PageProps) {
  const { slug } = await params
  const profile = getProfileBySlug(slug)
  if (!profile) notFound()

  return (
    <ProfilePageShell profile={profile} activeTab="compliance">
      <ComplianceTab profile={profile} />
    </ProfilePageShell>
  )
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const profile = getProfileBySlug(slug)
  return {
    title: profile ? `${profile.name} — Compliance | Propvora` : 'Planning Profile',
  }
}
