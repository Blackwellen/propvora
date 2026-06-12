import { notFound } from 'next/navigation'
import { getProfileBySlug } from '@/lib/planning/profile-config'
import { ProfilePageShell } from '@/components/planning/profiles'
import { ExampleForecastTab } from '@/components/planning/profiles/tabs'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function ProfileExampleForecastPage({ params }: PageProps) {
  const { slug } = await params
  const profile = getProfileBySlug(slug)
  if (!profile) notFound()

  return (
    <ProfilePageShell profile={profile} activeTab="example-forecast">
      <ExampleForecastTab profile={profile} />
    </ProfilePageShell>
  )
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const profile = getProfileBySlug(slug)
  return {
    title: profile ? `${profile.name} — Example Forecast | Propvora` : 'Planning Profile',
  }
}
