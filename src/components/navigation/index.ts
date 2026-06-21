/* Shared, breakpoint-aware tab presentation for /property-manager.

   ONE consistent tab system: a clean desktop strip + the shared scrollable
   `MobileTabs` below `lg`. Section pages pass the same `value` / `onChange`
   state they already use — only presentation changes, never routing.

   - AppSectionTabs  → top-level section tabs (under the page header).
   - DetailPageTabs  → in-page detail sub-tabs (inside a detail hero/card). */

export { default as AppSectionTabs, type SectionTabItem } from "./AppSectionTabs"
export { default as DetailPageTabs } from "./DetailPageTabs"
