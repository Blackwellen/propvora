# Detail Page Follow-Through Audit
_Second Depth Run — Agent 5_

| Page | Exists? | Tabs complete? | Actions wired? | Follow-through? | Status |
|------|---------|----------------|----------------|-----------------|--------|
| `/app/portfolio/properties/[id]` | Yes (578 lines) | Yes — all 9 tabs (Overview, Units, Tenancies, Contacts, Work, Money, Planning, Documents, Activity) | Edit button links to edit page; Create task button present | Money tab has Recharts BarChart; Planning tab links to new planning set | Complete |
| `/app/portfolio/properties/new` | Yes | 9-step wizard | Submit now calls Supabase insert into `properties` + `units`; redirects to `/app/portfolio/properties/[newId]`; shows error on failure | Real save wired | Complete |
| `/app/work/tasks/[id]` | Yes (320 lines) | 4 tabs (Activity, Notes, Documents, Linked Records) | Mark complete toggles status; "Create job from task" now links to `/app/work/jobs/new`; property chip links to property detail | Right rail shows all fields including due date, priority, assignee, cost | Complete |
| `/app/work/tasks/new` | Yes | 3-step wizard | Submit now calls Supabase insert into `tasks`; redirects to `/app/work/tasks/[newId]`; shows error on failure | Real save wired | Complete |
| `/app/work/jobs/[id]` | Yes | 6 tabs (Overview, Supplier, Costs, Documents, Messages, Activity) | Status pipeline clickable; Mark complete button; "Create invoice" now links to `/app/money/invoices/new` | Supplier tab shows supplier details; Messages tab has compose UI | Complete |
| `/app/work/jobs/new` | Yes | 5-step wizard | Submit now calls Supabase insert into `jobs`; redirects to `/app/work/jobs/[newId]`; shows error on failure | Real save wired | Complete |
| `/app/planning/sets/[id]` | Yes (504 lines) | 15 tabs present | Edit and Send Offer buttons present; AI Review panel present | Forecasts tab has Recharts LineChart 12-month projection; Risk tab has score gauge + factor list; Landlord Offer tab shows offer or CTA; AI Review tab shows analysis | Complete |
| `/app/planning/sets/new` | Yes | 12-step wizard | Submit now calls Supabase insert into `planning_sets`, `planning_room_lines`, `planning_expense_lines`, `planning_bill_lines`, `planning_upfront_costs`; redirects to `/app/planning/sets/[newId]` | Real save wired | Complete |
| `/app/contacts/[id]` | Yes | 11 tabs with type-based filtering | Quick action buttons (Message, Task, Invoice, AI); Tasks tab now has inline "Add task" form | Tasks tab: title + due date + save; creates task linked to contact | Complete |
| `/app/contacts/new` | Yes | 3-step wizard with react-hook-form + zod | Submit now calls Supabase insert into `contacts`; redirects to `/app/contacts/[newId]`; shows error on failure | Real save wired | Complete |
