/* Propvora mobile component system — dedicated, purpose-built mobile UI that
   renders below the desktop `lg` breakpoint. Desktop chrome is untouched.

   See README usage in each file; adoption guide lives in the build report. */

export {
  useBreakpoint,
  useIsMobile,
  useIsBelowDesktop,
  useMediaQuery,
  useHasMounted,
  BREAKPOINTS,
  type Breakpoint,
} from "./useBreakpoint"

export { default as MobileSheet } from "./MobileSheet"
export { default as MobileTopBar, type MobileTopBarAction } from "./MobileTopBar"
export { default as MobileBottomNav } from "./MobileBottomNav"
export { default as MobileTabs, type MobileTabItem } from "./MobileTabs"
export { default as MobilePageHeader } from "./MobilePageHeader"
export {
  default as MobileFilterSheet,
  type FilterGroup,
  type FilterOption,
} from "./MobileFilterSheet"
export {
  ResponsiveTable,
  MobileCardList,
  type MobileCardMapping,
  type MobileCardField,
} from "./ResponsiveTable"
