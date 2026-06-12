# Route and Button Audit

**Last Updated:** 2026-06-11

Every route, button, action and link tested. Status: ✅ Pass | 🔧 Fixed | ❌ Fail | ⬜ Pending

## /app — Main App

### Home (/app)
| Button | Status | Target |
|--------|--------|--------|
| Quick action: Add Property | ✅ | /app/portfolio/properties/new |
| Quick action: New Task | ✅ | /app/work/tasks/new |
| Quick action: New Invoice | ✅ | /app/money/invoices/new |
| Quick action: New Compliance | ✅ | /app/compliance/certificates/new |
| KPI tiles | ✅ | Live Supabase data |

### Portfolio
| Button | Status | Target |
|--------|--------|--------|
| Add Property | ✅ | /app/portfolio/properties/new |
| Property → detail | ✅ | /app/portfolio/properties/[id] |
| Add Unit | ✅ | /app/portfolio/units/new?propertyId |
| New Tenancy | ✅ | /app/portfolio/tenancies/new?propertyId |
| Leasing sub-tabs | ✅ | Vacancies/Prospects/Viewings/Agreements wired |

### Work
| Button | Status | Target |
|--------|--------|--------|
| New Task | ✅ | /app/work/tasks/new |
| New Job | ✅ | /app/work/jobs/new |
| Board Add Task | ✅ | /app/work/tasks/new |
| tasks/[id] View comments | ✅ | setActiveTab("Activity") prop-drilled |
| tasks/[id] View timeline | ✅ | setActiveTab("Activity") prop-drilled |

### Planning
| Button | Status | Target |
|--------|--------|--------|
| New Planning Set | ✅ | /app/planning/sets/new |
| Wizard View Planning Set | ✅ | /app/planning/sets/[createdId] |

### Money
| Button | Status | Target |
|--------|--------|--------|
| Create Invoice | ✅ | /app/money/invoices/new |
| Add Bill | ✅ | /app/money/bills/new |
| Invoice detail Send/PDF | ✅ | Toast (Resend pending) |
| Track Deposit | ✅ | Saves to money_deposits |
| Return Deposit | ✅ | Saves to money_deposits |
| Export CSV | ✅ | downloadCSV() all list views |

### Accounting
| Button | Status | Target |
|--------|--------|--------|
| New Account | ✅ | /app/accounting/accounts/new |
| Mark Reconciled | ✅ | UPDATE money_transactions |
| Submit MTD | ✅ | Toast — HMRC credentials needed |

### Calendar
| Button | Status | Target |
|--------|--------|--------|
| New Event | ✅ | /app/calendar/events/new |
| Edit Event | ✅ | /app/calendar/events/[id]/edit |
| Delete Event | ✅ | DELETE + router.back() |
| Create (wizard) | ✅ | INSERT calendar_events |
| Save (edit) | ✅ | UPDATE calendar_events |

### Compliance
| Button | Status | Target |
|--------|--------|--------|
| New Certificate | ✅ | /app/compliance/certificates/new |
| Certificate/new Save | ✅ | INSERT compliance_certificates + real file input |
| New Inspection | ✅ | /app/compliance/inspections/new |
| Inspection/new Save | ✅ | INSERT inspections |

### Workspace Settings — all 8 sub-pages
| Button | Status | Target |
|--------|--------|--------|
| Save Profile | ✅ | UPDATE workspaces |
| Invite Member | ✅ | INSERT invitations |
| Remove Member | ✅ | DELETE workspace_members |
| Open Billing Portal | ✅ | POST /api/billing/portal |
| Export Audit CSV | ✅ | Live data downloadCSV() |
| Delete Workspace | ✅ | DELETE + signOut + /login |

## /admin
| Button | Status | Target |
|--------|--------|--------|
| Users search/filter | ✅ | Live profiles |
| Workspaces filter | ✅ | Live workspaces |
| Health check | ✅ | Real env check + Supabase ping |

## /supplier-portal
| Button | Status | Target |
|--------|--------|--------|
| Accept/In Progress/Complete | ✅ | UPDATE supplier_jobs |
| Create Invoice | ✅ | INSERT supplier_invoices |

## /affiliate
| Button | Status | Target |
|--------|--------|--------|
| Copy Link | ✅ | Clipboard + live affiliate.code |
| Create/Delete Link | ✅ | INSERT/DELETE affiliate_links |

## /auth
| Button | Status | Target |
|--------|--------|--------|
| Sign In | ✅ | signInWithPassword |
| Register | ✅ | signUp + verify email screen |
| Forgot Password | ✅ | resetPasswordForEmail |
| Reset Password | ✅ | updateUser |

## Marketing
| Button | Status | Target |
|--------|--------|--------|
| Book a Demo | ✅ | /contact |
| Get Started | ✅ | /register |
| Contact form | ✅ | Success state |
