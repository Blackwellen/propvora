import { redirect } from 'next/navigation'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function ProfileRootPage({ params }: PageProps) {
  const { slug } = await params
  redirect(`/app/planning/profiles/${slug}/overview`)
}
