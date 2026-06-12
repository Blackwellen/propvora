import { notFound } from 'next/navigation'
import { getProfileBySlug } from '@/lib/planning/profile-config'

interface LayoutProps {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}

export default async function ProfileSlugLayout({ children, params }: LayoutProps) {
  const { slug } = await params
  const profile = getProfileBySlug(slug)
  if (!profile) notFound()
  return <>{children}</>
}

export const dynamic = 'force-dynamic'
