/**
 * SkipLink — "Skip to main content" accessibility helper (WCAG 2.4.1).
 *
 * Visually hidden until it receives keyboard focus (see `.skip-link` in
 * globals.css), at which point it slides into view at the top-left. Activating
 * it moves focus to the `#main-content` landmark, which each shell marks with
 * `id="main-content" tabIndex={-1}`.
 *
 * Render it as the very first focusable element inside a shell.
 */
export default function SkipLink({
  targetId = "main-content",
  children = "Skip to main content",
}: {
  targetId?: string
  children?: React.ReactNode
}) {
  return (
    <a href={`#${targetId}`} className="skip-link">
      {children}
    </a>
  )
}
