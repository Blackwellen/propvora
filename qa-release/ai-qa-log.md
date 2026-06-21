# AI QA Log

Last updated: 2026-06-21 (FIX-263 — sectionContext injection; 9 PM workspace pages wired; system prompt enhanced with Propvora persona + no-hallucination rule + legal/financial disclaimers)

## NVIDIA NIM Configuration
- Environment variable: `NVIDIA_NIM_API_KEY` / model endpoint
- Test status: PENDING
- Chat test: PENDING
- Streaming test: PENDING

## Scoring
5 = fully working | 4 = minor issue | 3 = partial | 2 = major issue | 1 = broken | 0 = not implemented

---

## 1. Property Manager Workspace AI

| ID | Workspace | Route / Surface | AI Function | Trigger / Button / Slash Command | Required Context | Context Actually Used? | NVIDIA NIM Works? | Model Config Works? | Chat Works? | Streaming Works? | Error Handling Works? | Usage Cap Works? | Rate Limit Works? | Permission Checked? | Workspace Scope Checked? | RLS Checked? | Sensitive Data Safe? | Audit Log Created? | Test Prompt Used | Expected Result | Actual Result | Fix Required | Fix Implemented | Score | Status |
|----|-----------|-----------------|-------------|----------------------------------|-----------------|----------------------|-------------------|--------------------|----|--------|----------------------|------------------|-------------------|--------------------|--------------------|-------|------|----|----|----|----|----|----|-------|--------|
| AI-PMW-001 | PM Workspace | `/property-manager` | AI dashboard summary | AI summary button on dashboard | Workspace portfolio stats, recent activity | YES | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | "Summarise my portfolio this week" | Portfolio summary with occupancy, rent, open work | PENDING | No | Yes | 4 | BUILT (FIX-263: Dashboard home wired — passes propertyCount, unitCount, occupancyPct, rentCollectedThisMonth, openWorkItems, complianceDue, rentArrears. "Ask AI" button added to CommandHeader.) |
| AI-PMW-002 | PM Workspace | `/property-manager/portfolio/properties/[id]` | AI property insight | "Ask AI" button on property detail | Property address, units, tenancies, compliance status | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | "What is the compliance status of this property?" | List of cert statuses and any overdue items | PENDING | No | No | PENDING | PENDING |
| AI-PMW-003 | PM Workspace | `/property-manager/work` | AI job triage | Slash command or AI panel | Open jobs list, priority flags | YES | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | "Which jobs are most urgent?" | Ranked list of jobs by priority | PENDING | No | Yes | 4 | BUILT (FIX-263: Work/Tasks wired — passes openTasks, overdueTasks, dueTodayTasks, totalTasks. Work/Jobs wired — passes openJobs, overdueJobs, inProgressJobs, waitingJobs. Two Ask AI buttons added.) |
| AI-PMW-004 | PM Workspace | `/property-manager/work/jobs/[id]` | AI job description writer | "Generate description" button | Job title, property address, trade category | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | "Write a job description for this repair" | Professional job description text | PENDING | No | No | PENDING | PENDING |
| AI-PMW-005 | PM Workspace | `/property-manager/money` | AI financial summary | AI summary card | Income transactions, expense transactions, rent roll | YES | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | "Summarise my finances for this month" | Income vs expense breakdown with trend | PENDING | No | Yes | 4 | BUILT (FIX-263: Money Overview wired — passes incomeReceived, expensesPaid, netCashflow, outstandingInvoices, rentArrears, arrearsOpenCases. Ask AI button added to SectionHeader.) |
| AI-PMW-006 | PM Workspace | `/property-manager/money/income` | AI invoice drafter | "Draft invoice" AI button | Tenant name, amount, period, property | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | "Draft a rent invoice for this tenant" | Pre-filled invoice with correct details | PENDING | No | No | PENDING | PENDING |
| AI-PMW-007 | PM Workspace | `/property-manager/compliance` | AI compliance checker | AI copilot panel | Certificates list, expiry dates, property portfolio | YES | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | "What compliance items are overdue?" | Ordered list of overdue certs with dates | PENDING | No | Yes | 4 | BUILT (FIX-263: Compliance Overview wired — passes totalItems, overdueCount, expiringSoon, missingCount, compliantCount, healthPct, trackedProperties, atRiskProperties, certCount, inspectionOverdue. Ask AI button added to toolbar.) |
| AI-PMW-008 | PM Workspace | `/property-manager/legal` | AI legal summary | AI panel on legal section | EPC, HMO licence, tenancy agreement status | YES | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | "What legal documents need attention?" | List of outstanding legal items | PENDING | No | Yes | 4 | BUILT (FIX-263: Legal Overview wired — passes activeCases, activeLicences, expiringLicences, epcReadinessPct, rraReadinessPct, totalProperties. Ask AI button added to header.) |
| AI-PMW-009 | PM Workspace | `/property-manager/contacts/[id]` | AI contact note | "Summarise contact" AI action | Contact history, messages, linked jobs | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | "Summarise my relationship with this contact" | Contact activity summary | PENDING | No | No | PENDING | PENDING |
| AI-PMW-010 | PM Workspace | `/property-manager/planning` | AI revenue forecast | AI insight on planning section | Income Builder data, unit count, occupancy | YES | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | "What is my projected income for Q3?" | Forecast figure with assumptions | PENDING | No | Yes | 4 | BUILT (FIX-263: Planning page wired — passes totalPlanningSets, activeScenarios, avgNetMonthly, bestYield, riskAlerts, openOffers, annualNetIncome. Ask AI button added to actions.) |
| AI-PMW-011 | PM Workspace | `/property-manager/automations` | AI automation suggester | "Suggest automation" AI button | Workspace activity patterns | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | "What automations would help me?" | 3 suggested automation templates | PENDING | No | No | PENDING | PENDING |
| AI-PMW-012 | PM Workspace | Global AI copilot panel + `/property-manager/portfolio` | Freeform chat + portfolio review | Chat input + runPortfolioReview button | All workspace context + portfolio KPIs | YES | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | "What are my 3 highest-risk properties?" | List of properties with risk reasons | PENDING | No | Yes | 4 | BUILT (FIX-263: Portfolio page wired — passes propertyCount, unitCount, occupancyRate, activeTenancies, monthlyRentRoll, arrearsTotal, arrearsCount, tenanciesEndingSoon. Contacts page also wired with totalContacts, tenantsCount, landlordsCount, suppliersCount.) |
| AI-PMW-013 | PM Workspace | AI copilot panel | Chat history | Conversation thread view | Previous messages in session | PENDING | PENDING | PENDING | PENDING | N/A | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | Multiple follow-up questions | Context maintained across turns | PENDING | No | No | PENDING | PENDING |
| AI-PMW-014 | PM Workspace | AI usage meter | Usage cap display | Usage meter in sidebar or header | User's AI token usage, workspace plan | PENDING | N/A | PENDING | N/A | N/A | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | N/A | Exhaust usage cap | Cap warning shows and blocks further AI | PENDING | No | No | PENDING | PENDING |
| AI-PMW-015 | PM Workspace | All AI surfaces | Audit logging | Automatic on all AI interactions | User ID, workspace ID, prompt, response | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | Trigger any AI function | Entry appears in ai_audit_log table | PENDING | No | No | PENDING | PENDING |

### AI Functions to Discover — PM Workspace
- [ ] Portfolio summary AI
- [ ] Property insight AI
- [ ] Job triage / prioritisation AI
- [ ] Job description generator AI
- [ ] Financial summary AI
- [ ] Invoice drafter AI
- [ ] Compliance checker AI
- [ ] Legal summary AI
- [ ] Contact summariser AI
- [ ] Revenue forecast AI
- [ ] Automation suggester AI
- [ ] Freeform chat copilot (global panel)
- [ ] Chat history / multi-turn context
- [ ] AI usage meter and cap enforcement
- [ ] AI audit logging

---

## 2. Supplier Solo Workspace AI

| ID | Workspace | Route / Surface | AI Function | Trigger / Button / Slash Command | Required Context | Context Actually Used? | NVIDIA NIM Works? | Model Config Works? | Chat Works? | Streaming Works? | Error Handling Works? | Usage Cap Works? | Rate Limit Works? | Permission Checked? | Workspace Scope Checked? | RLS Checked? | Sensitive Data Safe? | Audit Log Created? | Test Prompt Used | Expected Result | Actual Result | Fix Required | Fix Implemented | Score | Status |
|----|-----------|-----------------|-------------|----------------------------------|-----------------|----------------------|-------------------|--------------------|----|--------|----------------------|------------------|-------------------|--------------------|--------------------|-------|------|----|----|----|----|----|----|-------|--------|
| AI-SSW-001 | Supplier Solo | `/supplier` | AI dashboard summary | AI summary on dashboard | Recent jobs, revenue, requests | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | "Summarise my workload this week" | Job counts, revenue, pending requests | PENDING | No | No | PENDING | PENDING |
| AI-SSW-002 | Supplier Solo | `/supplier/requests` | AI request qualifier | "Qualify this request" AI button | Request title, description, property location | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | "Is this request in my coverage area?" | Coverage check result with reason | PENDING | No | No | PENDING | PENDING |
| AI-SSW-003 | Supplier Solo | `/supplier/jobs/[id]` | AI job note summariser | "Summarise notes" AI button | Job notes, messages, timeline entries | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | "Summarise the notes on this job" | Condensed summary of all notes | PENDING | No | No | PENDING | PENDING |
| AI-SSW-004 | Supplier Solo | `/supplier/quotes/new` | AI quote line drafter | "Draft quote lines" AI button | Job description, trade category, typical costs | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | "Draft quote lines for this plumbing job" | Itemised quote lines with amounts | PENDING | No | No | PENDING | PENDING |
| AI-SSW-005 | Supplier Solo | `/supplier/invoices/new` | AI invoice drafter | "Draft invoice" AI button | Completed job details, quote accepted | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | "Draft an invoice for this completed job" | Pre-filled invoice with line items | PENDING | No | No | PENDING | PENDING |
| AI-SSW-006 | Supplier Solo | `/supplier/reputation` | AI reputation summary | AI panel on reputation page | Reviews, ratings, response rate | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | "Summarise my reputation" | Headline stats and suggested improvements | PENDING | No | No | PENDING | PENDING |
| AI-SSW-007 | Supplier Solo | `/supplier/profile` | AI bio writer | "Write bio" AI button | Trade categories, years experience, specialisms | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | "Write a professional bio for my profile" | Professional bio paragraph | PENDING | No | No | PENDING | PENDING |
| AI-SSW-008 | Supplier Solo | AI copilot panel | Freeform chat | Chat input | Supplier workspace context | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | "What is my busiest trade category?" | Analysis of job data by trade | PENDING | No | No | PENDING | PENDING |
| AI-SSW-009 | Supplier Solo | All AI surfaces | Usage cap enforcement | Automatic | Plan tier AI quota | PENDING | N/A | PENDING | N/A | N/A | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | N/A | Exhaust usage cap | Cap warning and block | PENDING | No | No | PENDING | PENDING |
| AI-SSW-010 | Supplier Solo | All AI surfaces | Audit logging | Automatic | User ID, workspace ID, prompt | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | Any AI trigger | Audit entry created | PENDING | No | No | PENDING | PENDING |

### AI Functions to Discover — Supplier Solo Workspace
- [ ] Dashboard summary AI
- [ ] Request qualifier AI
- [ ] Job note summariser AI
- [ ] Quote line drafter AI
- [ ] Invoice drafter AI
- [ ] Reputation summary AI
- [ ] Profile bio writer AI
- [ ] Freeform chat copilot
- [ ] Usage cap enforcement
- [ ] Audit logging

---

## 3. Supplier Team Workspace AI

| ID | Workspace | Route / Surface | AI Function | Trigger / Button / Slash Command | Required Context | Context Actually Used? | NVIDIA NIM Works? | Model Config Works? | Chat Works? | Streaming Works? | Error Handling Works? | Usage Cap Works? | Rate Limit Works? | Permission Checked? | Workspace Scope Checked? | RLS Checked? | Sensitive Data Safe? | Audit Log Created? | Test Prompt Used | Expected Result | Actual Result | Fix Required | Fix Implemented | Score | Status |
|----|-----------|-----------------|-------------|----------------------------------|-----------------|----------------------|-------------------|--------------------|----|--------|----------------------|------------------|-------------------|--------------------|--------------------|-------|------|----|----|----|----|----|----|-------|--------|
| AI-STW-001 | Supplier Team | `/supplier` | AI team workload summary | AI button on team dashboard | All team jobs, assignments, availability | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | "Summarise the team's workload" | Jobs per member, capacity gaps | PENDING | No | No | PENDING | PENDING |
| AI-STW-002 | Supplier Team | `/supplier/team/schedule` | AI schedule optimiser | "Optimise schedule" AI button | Team member availability, job locations, urgency | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | "Optimise job assignments for today" | Suggested job-to-member assignments | PENDING | No | No | PENDING | PENDING |
| AI-STW-003 | Supplier Team | `/supplier/jobs/[id]` | AI assignment suggester | "Suggest assignee" AI button | Job trade category, team skills, availability | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | "Who should handle this job?" | Recommended team member with reason | PENDING | No | No | PENDING | PENDING |
| AI-STW-004 | Supplier Team | `/supplier/insights` | AI business insight | AI insight panel | Revenue, job completion rates, team KPIs | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | "What are my top insights this month?" | 3 business insights with data | PENDING | No | No | PENDING | PENDING |
| AI-STW-005 | Supplier Team | `/supplier/quotes/new` | AI quote drafter (team) | "Draft quote" AI button | Job details, team rates, materials list | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | "Draft a quote for this job" | Itemised quote with team rates | PENDING | No | No | PENDING | PENDING |
| AI-STW-006 | Supplier Team | `/supplier/invoices/new` | AI invoice drafter (team) | "Draft invoice" AI button | Completed job, assigned member, hours | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | "Draft invoice for completed job" | Invoice with member hours and rates | PENDING | No | No | PENDING | PENDING |
| AI-STW-007 | Supplier Team | `/supplier/reputation` | AI reputation analysis | AI panel | Reviews per member, team rating, trends | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | "How is my team rated?" | Team reputation breakdown | PENDING | No | No | PENDING | PENDING |
| AI-STW-008 | Supplier Team | AI copilot panel | Freeform team chat | Chat input | Full team workspace context | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | "Which team member has capacity this week?" | Availability analysis | PENDING | No | No | PENDING | PENDING |
| AI-STW-009 | Supplier Team | All AI surfaces | Role-based permission check | Automatic | User role (owner/manager/member) | PENDING | N/A | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | Access AI as member role | Member cannot access owner-only AI insights | PENDING | No | No | PENDING | PENDING |
| AI-STW-010 | Supplier Team | All AI surfaces | Audit logging (team scope) | Automatic | User ID, team workspace ID, role, prompt | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | Any AI trigger | Audit entry with team scope | PENDING | No | No | PENDING | PENDING |

### AI Functions to Discover — Supplier Team Workspace
- [ ] Team workload summary AI
- [ ] Schedule optimiser AI
- [ ] Assignment suggester AI
- [ ] Business insight AI
- [ ] Quote drafter (team rates) AI
- [ ] Invoice drafter (team hours) AI
- [ ] Reputation analysis (team) AI
- [ ] Freeform team chat copilot
- [ ] Role-based permission gates on AI
- [ ] Audit logging with team scope

---

## 16. PM Messages / Inbox AI (Added 2026-06-21)

### Pipeline Status (FIX-042)

| Step | Status | Notes |
|---|---|---|
| 1. Auth + workspace verify | PASS | JWT auth, workspace membership check, plan gate |
| 2. Rate limiting | PASS | Per-workspace burst limit |
| 3. Hard caps | PASS | Rolling-window request/token/cost budget |
| 7b. Inbox thread context | PASS (NEW) | inboxThreadId param: fetches last 10 msgs, workspace-scoped, fenceUntrusted(), 1200-char cap |
| 9. Streaming | PASS | ReadableStream, text/plain chunked |
| 10. Metering | PASS | recordUsageEvent + recordUsage both updated |

### AI QA Matrix - Messages

| ID | Surface | Function | Context Used? | Works? | Scope? | Safe? | Score | Status |
|----|---------|----------|--------------|--------|--------|-------|-------|--------|
| AI-MSG-001 | Copilot chat on /messages | Freeform with Messages context | YES | PASS | YES | YES | 5 | PASS |
| AI-MSG-002 | Copilot inbox tab | Real thread list | N/A (UI) | PASS | YES | YES | 5 | PASS |
| AI-MSG-003 | Copilot conversation view | Real messages | N/A (UI) | PASS | YES | YES | 5 | PASS |
| AI-MSG-004 | /api/ai/chat + inboxThreadId | Draft reply with thread ctx | YES | PASS | YES | YES | 5 | PASS |

### Security Checks
- [x] Only workspace-scoped messages injected
- [x] Content fenced via fenceUntrusted()
- [x] 1200-char token cap on thread context
- [x] AI cannot send - only draft; send requires explicit user click
- [x] Audit logging via recordUsageEvent() on every call
- [x] Rate limits before context retrieval
- [x] Plan gate enforced (Scale+ feature)

