/**
 * Shared jsdom test harness for the component-level suites (inline-edit system,
 * mobile bottom nav). Imported at the top of each `@vitest-environment jsdom`
 * test file.
 *
 * - Polyfills `window.matchMedia` (jsdom omits it) so the breakpoint hooks
 *   (`useIsMobile` / `useMediaQuery`) resolve to a deterministic device class.
 *   Default: desktop (all queries false), matching the SSR/first-paint snapshot.
 * - Registers Testing Library `cleanup` after every test to unmount and reset
 *   the DOM between cases (no cross-test leakage).
 *
 * Set `__setMobile(true)` inside a test to force the mobile branch before render.
 */
import { afterEach, beforeEach } from "vitest"
import { cleanup } from "@testing-library/react"

let mobile = false

/** Force the mobile (<768px / below-lg) branch for the next render. */
export function __setMobile(value: boolean) {
  mobile = value
}

function installMatchMedia() {
  // The mobile component system treats `max-width` queries as "mobile".
  window.matchMedia = (query: string): MediaQueryList => {
    const isMaxWidth = query.includes("max-width")
    const matches = mobile ? isMaxWidth : false
    return {
      matches,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    } as unknown as MediaQueryList
  }
}

beforeEach(() => {
  mobile = false
  installMatchMedia()
})

afterEach(() => {
  cleanup()
})
