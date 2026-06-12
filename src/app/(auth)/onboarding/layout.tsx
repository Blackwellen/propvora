/**
 * Onboarding uses a full-page layout (handled by the parent (auth)/layout.tsx
 * which checks x-pathname header set by middleware). This layout is a
 * pass-through so we don't double-wrap.
 */
export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
