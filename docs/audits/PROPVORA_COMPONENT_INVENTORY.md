# PROPVORA — COMPONENT INVENTORY

> **Auto-derived 2026-06-14** by crawling `src/components/**` (202 `.tsx` files).
> "Used-by" is best-effort (inferred from imports/naming). **Needs a human pass.**
> Note: section-specific view/tab components also live under `src/features/**` and inside
> route folders (`_components`); those are out of scope here (shared components only).

## Totals
- **Shared components:** 202 (`src/components/**`).

---

## UI primitives — `src/components/ui/`
| Name | Path | Purpose | Used-by |
|---|---|---|---|
| Button | ui/Button.tsx | Primary button (variants, sizes, leftIcon) | everywhere |
| Input | ui/Input.tsx | Labelled text input | forms, filters |
| Select | ui/Select.tsx | Select control | forms |
| Card | ui/Card.tsx | Surface container | everywhere |
| Badge | ui/Badge.tsx | Status chip | lists/detail |
| Dialog | ui/Dialog.tsx | Modal dialog | confirmations, modals |
| Dropdown | ui/Dropdown.tsx | Dropdown menu | action menus |
| Tabs | ui/Tabs.tsx | Tab control | detail pages |
| Toast | ui/Toast.tsx | Toast feedback | app-wide |
| Avatar | ui/Avatar.tsx | User/entity avatar | shells, contacts |
| StatCard | ui/StatCard.tsx | KPI stat card | dashboards |
| Skeleton | ui/Skeleton.tsx | Loading skeleton | loading states |
| LoadingState | ui/LoadingState.tsx | Full loading block | pages |
| EmptyState | ui/EmptyState.tsx | Empty-state block | lists |
| ErrorState | ui/ErrorState.tsx | Error block | pages |

## Shells — `src/components/shells/` and `src/components/shell/`
| Name | Path | Purpose | Notes |
|---|---|---|---|
| AppShell (live) | **shell/AppShell.tsx** | App chrome: side+top nav, ChatBubble/Panel, guided help, skip link. Imported by `(app)/layout.tsx`. | responsive: collapsible sidenav (localStorage), mobile Menu toggle |
| AppShell (alt) | shells/AppShell.tsx | ⚠ second AppShell — possible duplicate/legacy (see redundancy audit) | – |
| AdminShell | shells/AdminShell.tsx | Admin console chrome | – |
| AuthShell | shells/AuthShell.tsx | Auth pages layout | – |
| AffiliateShell | shells/AffiliateShell.tsx | Affiliate dashboard chrome | – |
| PortalShell | shells/PortalShell.tsx | External `(portal)` session chrome (brand-aware) | – |
| TenantShell | shells/TenantShell.tsx | Tenant persona portal nav | mobile Menu/X toggle, fixed nav list |
| LandlordShell | shells/LandlordShell.tsx | Landlord persona portal nav | mobile toggle |
| SupplierShell | shells/SupplierShell.tsx | Supplier persona portal nav | mobile toggle |

## Shell internals / navigation — `src/components/shell/`, `nav/`
| Name | Path | Purpose |
|---|---|---|
| SideNavigation | shell/SideNavigation.tsx | App left nav |
| TopNavigation | shell/TopNavigation.tsx | App top bar |
| ShellContent | shell/ShellContent.tsx | Main content region |
| NavItem / NavSection | shell/NavItem.tsx, NavSection.tsx | Nav primitives |
| ShellTabsRail | shell/ShellTabsRail.tsx | Section sub-tab rail |
| ShellLogo | shell/ShellLogo.tsx | Brand logo |
| AccountMenu | shell/AccountMenu.tsx | Profile dropdown |
| QuickCreateButton | shell/QuickCreateButton.tsx | Global "+ create" |
| GlobalSearch | shell/GlobalSearch.tsx | Global search input/palette |
| NotificationBell | shell/NotificationBell.tsx | Notifications (shell) |
| NotificationsBell | nav/NotificationsBell.tsx | ⚠ second notifications bell (possible dup of shell/NotificationBell) |

## Layout — `src/components/layout/`
| Name | Path | Purpose |
|---|---|---|
| PageContainer | layout/PageContainer.tsx | Page width/padding wrapper |
| SectionHeader | layout/SectionHeader.tsx | Section title + actions header |

## Settings — `src/components/settings/`
| Name | Path | Purpose |
|---|---|---|
| SettingsShell | settings/SettingsShell.tsx | Settings layout wrapper |
| SettingsCard | settings/SettingsCard.tsx | Settings panel card |
| AccountSideNav | settings/AccountSideNav.tsx | Account settings nav |
| WorkspaceSideNav | settings/WorkspaceSideNav.tsx | Workspace settings nav |

## Dashboard widgets — `src/components/dashboard/`
| Name | Path | Purpose |
|---|---|---|
| KpiStrip | dashboard/KpiStrip.tsx | Top KPI row |
| WorkQueueWidget | dashboard/WorkQueueWidget.tsx | Work queue card |
| MoneySnapshotWidget | dashboard/MoneySnapshotWidget.tsx | Money snapshot |
| CalendarAgendaWidget | dashboard/CalendarAgendaWidget.tsx | Agenda card |
| PlanningOpportunitiesWidget | dashboard/PlanningOpportunitiesWidget.tsx | Planning ops card |
| RecentActivityWidget | dashboard/RecentActivityWidget.tsx | Activity feed card |
| AiInsightPanel | dashboard/AiInsightPanel.tsx | AI insight panel |

## AI / Copilot — `src/components/ai/`
| Name | Path | Purpose |
|---|---|---|
| ChatBubble | ai/ChatBubble.tsx | Floating Copilot launcher (mobile reposition target in P2) |
| ChatPanel | ai/ChatPanel.tsx | Copilot chat panel |
| AiCopilotPanel | ai/AiCopilotPanel.tsx | Copilot container |
| AiActionsPanel | ai/AiActionsPanel.tsx | Suggested-actions panel |
| ConversationView | ai/ConversationView.tsx | Conversation thread view |
| InboxPanel | ai/InboxPanel.tsx | Copilot inbox |
| ContactPicker | ai/ContactPicker.tsx | Contact selector for AI actions |

## Tables / lists — `list/`, plus per-section tables
| Name | Path | Purpose |
|---|---|---|
| SavedViewsMenu | list/SavedViewsMenu.tsx | Saved-view chips/menu |
| ContactTable | contacts/ContactTable.tsx | Contacts table |
| PropertyTable | portfolio/PropertyTable.tsx | Properties table |
| PropertyListView / PropertyMapView | portfolio/ | Property list/map switch views |
| TenancyListView / TenancyGanttView / TenancyDataView | portfolio/ | Tenancy view types |
| PropertyDataView / TenancyTimeline(+Card) | portfolio/ | Detail data views |

## Cards / badges — portfolio, contacts, money, work, compliance, legal, planning
| Category | Components |
|---|---|
| Portfolio cards | PropertyCard, UnitCard, TenancyCard, TenancyTimelineCard, OperationProfileBadge, CommercialHealthScore |
| Contacts | ContactCard, PersonCard, OrganisationCard, ContactBoardCard, ContactAvatar, ContactStatusDot, ContactTypeBadge, ContactRelHealthBadge, ContactsKpiCard, ContactsPageHeader |
| Money | MoneyKpiCard, MoneyPageHeader, MoneyCalendar |
| Work | WorkKpiCard, WorkKpiStrip, WorkStatusBadge, WorkPriorityBadge, TaskListItem, TaskBoard, WorkEmptyState |
| Compliance | ComplianceKpiCard, ComplianceStatusBadge, ComplianceRiskBadge |
| Legal | LegalKpiCard, LegalStatusBadge, LegalRiskBadge, LegalModuleHeader, LegalDisclaimerBanner |
| Planning | shared/KpiCard, StatusPill, RiskPill, ProfileTag; profiles/ProfileKpiCard, ProfileHero, ProfileStatusPill |

## Tab navs (section sub-navigation)
| Component | Section |
|---|---|
| ContactsTabNav | contacts |
| MoneyTabNav | money |
| CalendarTabNav | calendar |
| ComplianceTabNav | compliance |
| LeasingTabNav | leasing |
| LegalTabNav | legal |
| AccountingTabNav | accounting |
| PlanningTabNav | planning |
| PortalsTabNav | portals |
| WorkTabNav / PpmTabNav / SuppliersTabNav | work |
| CalendarViewsSwitcher | calendar view switch |
| ProfileTabs | planning profiles |

## Modals / drawers / dialogs
| Name | Path | Purpose |
|---|---|---|
| GrantPortalAccessModal | portals/GrantPortalAccessModal.tsx | Grant external portal access |
| ConfirmDialog | account/ConfirmDialog.tsx, portfolio/ConfirmDialog.tsx | ⚠ two ConfirmDialogs |
| ConfirmDeleteDialog | work/ConfirmDeleteDialog.tsx | Delete confirmation |
| StatusChangeDropdown | work/StatusChangeDropdown.tsx | Status change menu |
| ActionMenu | portfolio/ActionMenu.tsx | Row action menu |

## Forms / editing primitives
| Name | Path | Purpose |
|---|---|---|
| InlineEditField | portfolio/InlineEditField.tsx, work/InlineEditField.tsx | ⚠ two inline-edit fields |
| EvidenceUpload | work/EvidenceUpload.tsx | Evidence/file upload |

## Maps
| Name | Path | Purpose |
|---|---|---|
| PropertyMap / PropertyMapInner | maps/ | Property map (Leaflet) |
| LocationMap | maps/LocationMap.tsx | Single-location map |
| LeafletMap | portfolio/LeafletMap.tsx | ⚠ third map component |

## Planning wizard — `src/components/planning/wizard/`
| Name | Path | Purpose |
|---|---|---|
| WizardShell | wizard/WizardShell.tsx | 9-step wizard chrome |
| WizardContext | wizard/WizardContext.tsx | Wizard reducer/state + Supabase persist |
| WizardLiveSummary | wizard/WizardLiveSummary.tsx | Live forecast summary side panel |
| Step01–Step09 | wizard/steps/ | Profile, Basics, Income, Expenses/Bills, Upfront/Compliance, LL-Offer, Forecast, Risk/AI-Review, Review/Create |
| PossessionWizardShell | legal/PossessionWizardShell.tsx | Possession-case multi-step wizard |

## Comms / consent / a11y / pwa
| Name | Path | Purpose |
|---|---|---|
| AnnouncementBanner | comms/AnnouncementBanner.tsx | System announcement banner |
| CookieConsent / CookiePreferencesLink | consent/ | Cookie consent + prefs link |
| SkipLink | a11y/SkipLink.tsx | Accessibility skip-to-content |
| InstallPrompt / OfflineBanner / ServiceWorkerRegister | pwa/ | PWA install, offline, SW register |

## Suppliers
| Name | Path | Purpose |
|---|---|---|
| SupplierRatingPanel | suppliers/SupplierRatingPanel.tsx | Rate a supplier |
| SupplierPreferencePanel | suppliers/SupplierPreferencePanel.tsx | Preferred-supplier settings |

## States
| Name | Path | Purpose |
|---|---|---|
| StatePage | states/StatePage.tsx | Shared `(states)` info-screen template |

## Marketing — `src/components/marketing/`
| Group | Components |
|---|---|
| Shell | PublicNav, PublicFooter, LegalLayout, NewsletterSignup, RefCapture |
| Landing | landing/HeroSection, ToolsSection, BuiltForSection, WhyTeamsSection, PricingSection |
| Features | features/FeaturesHero, AiCopilotSection, ComplianceLegalSection, AccountingInvoicesSection, OperatingProfilesSection, PortalsSection, WorkManagementSection, WorkingWithTeamsSection, SaveContactsSection, SchedulingSection, SupplierMarketplaceSection |
| FAQ | faq/FaqAccordion + 12 section components (Ai, Accounting, Compliance, Connectors, Contacts, Legal, Money, Portfolios, Registration, Settings, Supplier, Work) |

## Cross-cutting observations (for P7 dedup)
- **Two AppShells** (`shell/AppShell.tsx` is live; `shells/AppShell.tsx` may be dead).
- **Two notification bells**, **two ConfirmDialogs**, **two InlineEditFields**, **three map components**, duplicate `ProfileTag` (planning/shared + planning/profiles).
