import { notFound } from 'next/navigation'
import { getProfileBySlug } from '@/lib/planning/profile-config'
import { ProfilePageShell } from '@/components/planning/profiles'
import { AiQuestionsTab } from '@/components/planning/profiles/tabs'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function ProfileAiQuestionsPage({ params }: PageProps) {
  const { slug } = await params
  const profile = getProfileBySlug(slug)
  if (!profile) notFound()

  return (
    <ProfilePageShell profile={profile} activeTab="ai-questions">
      <AiQuestionsTab profile={profile} />
    </ProfilePageShell>
  )
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const profile = getProfileBySlug(slug)
  return {
    title: profile ? `${profile.name} — AI Questions | Propvora` : 'Planning Profile',
  }
}
