/**
 * PWA install-prompt suppression logic — pure + unit-testable.
 *
 * Centralises the single-show rules so the rendering component (InstallPrompt)
 * stays a thin shell and the policy is covered by a fast Vitest suite (no DOM).
 *
 * Rules:
 *  - Never when already installed (display-mode: standalone / iOS standalone).
 *  - Never re-show for SUPPRESS_DAYS after a dismissal (timestamp stored).
 *  - Never on "blocked" routes — forms / wizards / checkout / onboarding.
 *  - Once accepted/installed, suppress effectively forever.
 */

export const DISMISS_KEY = "propvora.pwa.installDismissed.at"
export const INSTALLED_KEY = "propvora.pwa.installed"

/** Re-prompt cooldown after a dismissal. 21 days sits in the 14–30 day window. */
export const SUPPRESS_DAYS = 21
const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Path prefixes/segments where we must NEVER interrupt the user with the
 * install banner: anything form-heavy, multi-step, or money-on-the-line.
 */
const BLOCKED_PATH_PATTERNS: RegExp[] = [
  /\/onboarding(\/|$)/i,
  /\/welcome(\/|$)/i,
  /\/wizard(\/|$)/i,
  /\/checkout(\/|$)/i,
  /\/billing\/(upgrade|checkout)(\/|$)/i,
  /\/subscribe(\/|$)/i,
  /\/(login|signin|signup|register|sign-up|sign-in)(\/|$)/i,
  /\/auth(\/|$)/i,
  /\/reset-password(\/|$)/i,
  /\/verify(\/|$)/i,
  /\/apply(\/|$)/i, // affiliate / account application forms
  /\/new(\/|$)/i, // create flows: /properties/new, /jobs/new …
  /\/create(\/|$)/i,
  /\/planning\/.+\/(build|edit)(\/|$)/i,
]

/** True when the path is a form / wizard / checkout / onboarding context. */
export function isBlockedPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false
  return BLOCKED_PATH_PATTERNS.some((re) => re.test(pathname))
}

/**
 * Decide whether the prompt is eligible to show, given the persisted state and
 * the current path. `now` is injectable for tests.
 */
export function canShowInstallPrompt(opts: {
  standalone: boolean
  pathname: string | null | undefined
  dismissedAt: number | null
  installed: boolean
  now?: number
}): boolean {
  const { standalone, pathname, dismissedAt, installed } = opts
  const now = opts.now ?? Date.now()

  if (standalone) return false
  if (installed) return false
  if (isBlockedPath(pathname)) return false

  if (dismissedAt != null) {
    const elapsed = now - dismissedAt
    if (elapsed < SUPPRESS_DAYS * DAY_MS) return false
  }
  return true
}

// ── localStorage helpers (guarded; SSR/Safari-private safe) ──────────────────

export function readDismissedAt(): number | null {
  try {
    const raw = localStorage.getItem(DISMISS_KEY)
    if (!raw) return null
    const n = Number(raw)
    return Number.isFinite(n) ? n : null
  } catch {
    return null
  }
}

export function readInstalled(): boolean {
  try {
    return localStorage.getItem(INSTALLED_KEY) === "1"
  } catch {
    return false
  }
}

export function persistDismissed(now: number = Date.now()): void {
  try {
    localStorage.setItem(DISMISS_KEY, String(now))
  } catch {
    /* ignore */
  }
}

export function persistInstalled(): void {
  try {
    localStorage.setItem(INSTALLED_KEY, "1")
  } catch {
    /* ignore */
  }
}
