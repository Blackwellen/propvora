# Propvora — Full Navigation Inventory

_Generated 2026-06-17 · Branch: Propvora-release-version.2.0_

---

## 1. Unauthenticated Public Top Nav (`PublicNav.tsx`)

Logo → `/`

| Label | Route |
|-------|-------|
| Stays | `/stays` |
| Suppliers | `/suppliers` |
| Services | `/services` |
| Emergency | `/emergency` |
| Features | `/features` |
| Pricing | `/pricing` |
| About | `/about` |
| Legal ▾ (dropdown) | Terms · Privacy · Cookies · Acceptable Use · Data Processing · Affiliate Terms · AI Disclaimer |
| Log in | `/login` |
| Get started | `/register` |

---

## 2. Public Footer (`PublicFooter.tsx`)

### Product
Stays · Suppliers · Services · Emergency · Features · Pricing · Partner Programme · Help Centre

### Company
About · Contact · Help Centre · Legal

### Legal
Terms of Service · Privacy Policy · Cookie Policy · Acceptable Use · Data Processing · Affiliate Terms · AI Disclaimer · Cookie Preferences

---

## 3. New Public Marketplace Nav (`PublicMarketplaceNav.tsx`)
_For stays/services/providers/emergency pages — replaces PublicNav on marketplace routes_

Logo → `/`

| Label | Route |
|-------|-------|
| Stays | `/stays` |
| Services | `/services` |
| Providers | `/providers` |
| Emergency | `/emergency` |
| How it works | `/how-it-works` |
| Sign in | `/login` |
| Get started | `/register` |

Right CTA varies by page:
- Stays pages → "List a property" `/list-a-property`
- Services pages → "List a service" `/list-a-service`
- Providers pages → "List your business" `/list-your-business`

---

## 4. Operator / Property Manager Workspace Side Nav (`SideNavigation.tsx`)
_`/property-manager/*`_

### OVERVIEW
| Label | Route |
|-------|-------|
| Home | `/property-manager` |

### CORE
| Label | Route |
|-------|-------|
| Portfolio | `/property-manager/portfolio` |
| Work | `/property-manager/work` |
| Bookings | `/property-manager/bookings` |
| Marketplace | `/property-manager/marketplace` |
| Supplier Market | `/property-manager/marketplace/suppliers` |
| Marketplace Orders | `/property-manager/marketplace/orders` |
| Planning | `/property-manager/planning` |
| Contacts | `/property-manager/contacts` |
| Portals | `/property-manager/portals` |
| Messages | `/property-manager/messages` |

### FINANCE
| Label | Route |
|-------|-------|
| Money | `/property-manager/money` |
| Accounting | `/property-manager/accounting` |
| Affiliates | `/property-manager/affiliates` |

### OPERATIONS
| Label | Route |
|-------|-------|
| Calendar | `/property-manager/calendar` |
| Compliance | `/property-manager/compliance` |
| Legal | `/property-manager/legal` |
| Automations | `/property-manager/automations` |

### SYSTEM
| Label | Route |
|-------|-------|
| Workspace | `/property-manager/settings` |

---

## 5. Supplier V2 Workspace Side Nav (`src/components/supplier-workspace/nav.ts`)
_`/supplier/*`_

### Work
Dashboard · Leads & Requests · Jobs · Calendar · Availability

### Catalogue
Services · Packages · Quotes · Coverage Areas

### Delivery
Messages · Notifications · Evidence · Automations · Disputes

### Insights
Earnings

### Money
Invoices · Payouts

### Trust
Reviews · Verification · Insurance & Licences

### Account
Marketplace · Profile · Settings · Team _(if >1 member)_

---

## 6. Customer / User Workspace Side Nav
_`/user/*`_
Home · Bookings · Stays · Favourites · Reviews · Messages · Settings

---

## 7. Tenant Portal Side Nav (`TenantShell.tsx`)
_`/tenant-portal/*`_

| Label | Route |
|-------|-------|
| Home | `/tenant-portal` |
| Tenancy | `/tenant-portal/tenancy` |
| Rent & Payments | `/tenant-portal/payments` |
| Maintenance | `/tenant-portal/maintenance` |
| Documents | `/tenant-portal/documents` |
| Viewings | `/tenant-portal/viewings` |
| Messages | `/tenant-portal/messages` |
| Settings | `/tenant-portal/settings` |

---

## 8. Landlord Portal Side Nav (`LandlordShell.tsx`)
_`/landlord-portal/*`_

| Label | Route |
|-------|-------|
| Home | `/landlord-portal` |
| Properties | `/landlord-portal/properties` |
| Statements | `/landlord-portal/statements` |
| Work Updates | `/landlord-portal/work` |
| Documents | `/landlord-portal/documents` |
| Messages | `/landlord-portal/messages` |
| Settings | `/landlord-portal/settings` |

---

## 9. Supplier V1 Portal Side Nav (`SupplierShell.tsx`)
_`/supplier-portal/*`_

| Label | Route |
|-------|-------|
| Dashboard | `/supplier-portal` |
| Jobs | `/supplier-portal/jobs` |
| Invoices | `/supplier-portal/invoices` |
| Verification | `/supplier-portal/verification` |
| Settings | `/supplier-portal/settings` |

---

## 10. Workspace Settings Side Nav (`WorkspaceSideNav.tsx`)
_`/property-manager/settings/*`_

### General
Overview · Workspace Profile · Team · Roles & Permissions

### Billing
Subscription · Add-ons · Billing & Payment · Invoices

### AI
AI Credits · Copilot & Inbox

### Configuration
Notifications · Branding · White Label · Menu Builder · Integrations · Email & SMTP · Storage

### Security
Security · SAML/SSO · Audit Logs

### Advanced
Data & Exports · Demo Data · Danger Zone

---

## 11. Account Settings Side Nav (`AccountSideNav.tsx`)
_Available in all workspace types_

Overview · Profile · Security · Login Methods · Notifications · Preferences · Sessions & Devices · Activity · Connected Accounts · Data & Privacy

---

## 12. Workspace Top Nav (`TopNavigation.tsx`)
_Applies to all authenticated workspace types_

| Element | Behaviour |
|---------|-----------|
| Workspace Switcher | Groups by type: operator / supplier / customer; routes to `TYPE_HOME` |
| Global Search | Opens search modal |
| Quick Create | Creates new record based on context |
| Notification Bell | Opens notification panel |
| Tutorial Launcher | Opens guided help |
| Calendar shortcut | `/property-manager/calendar` (operator) |
| Account Menu | Profile, preferences, sign out |

`TYPE_HOME` mapping:
- `operator` → `/property-manager`
- `supplier` → `/supplier`
- `customer` → `/user`
