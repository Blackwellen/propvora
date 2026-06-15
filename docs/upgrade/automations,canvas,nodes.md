# PROPVORA AUTOMATIONS CANVAS — SMART RULES, NATURAL LANGUAGE BUILDER, NODE CANVAS, TEMPLATES, INTEGRATIONS, CAPS, TESTING, JSON EDITOR, ROUTES, PANELS AND ENTERPRISE WORKFLOW ENGINE

## 0. Strategic decision

Propvora should build an automation system in three layers:

1. **Smart Recipes**
   * Prebuilt templates.
   * Low-risk.
   * Fast for normal users.
   * “Turn on / configure / test / activate”.
2. **Natural Language Automation Builder**
   * User types: “When a guest checks out, create cleaning task and notify cleaner.”
   * AI converts into a draft automation.
   * User reviews, edits, tests and activates.
   * AI must not activate destructive/legal/payment workflows without approval.
3. **Canvas Builder**
   * Advanced drag-and-drop workflow editor.
   * Nodes, edges, panels, JSON view, test trigger, run history, logs and versioning.
   * Expandable full-screen canvas over menus.
   * Used for complex property-manager, supplier, booking, marketplace, finance and compliance workflows.

The automation system should not become a heavy Zapier clone on day one. It should be  **Propvora-specific** , with strong templates and a controlled canvas.

---

# 1. Automation side-nav structure

Add main side-nav item:

```text
Automations
```

Internal automation nav:

```text
Automations Home
Recipes
My Automations
Canvas Builder
Runs & Logs
Approvals
Errors
Integrations
Webhooks
AI Builder
Usage & Limits
Settings
Admin Controls
```

Alternative if keeping sidebar lean:

* Put `Automations` under `Workspace`
* Surface contextual automation buttons inside each section:
  * Portfolio
  * Work
  * Bookings
  * Marketplace
  * Money
  * Accounting
  * Compliance
  * Legal
  * Contacts
  * Messages

Recommended: **top-level Automations** once marketplace/booking/supplier layers exist.

---

# 2. Automation object model

## 2.1 Automation definition

```text
automation_id
workspace_id
name
description
status
version
created_by
updated_by
owner_role
scope
category
trigger_type
canvas_json
compiled_json
natural_language_prompt
ai_generated
template_id
feature_flag
plan_required
risk_level
requires_approval
last_tested_at
last_run_at
last_run_status
run_count
error_count
enabled_at
disabled_at
created_at
updated_at
```

Statuses:

```text
draft
needs_review
test_ready
active
paused
failed
archived
disabled_by_plan
disabled_by_admin
disabled_by_error
```

Scopes:

```text
workspace
property
unit
tenancy
booking
supplier_job
marketplace_transaction
customer
supplier
accounting
legal
compliance
admin
```

Risk levels:

```text
low
medium
high
critical
restricted
```

Examples:

* low: create task, send internal notification
* medium: send email to supplier/customer
* high: create invoice, request payment
* critical: release payment, refund, legal draft
* restricted: serve legal notice, delete records, suspend account

Restricted actions must either be blocked or require explicit human approval.

---

# 3. Automation execution model

## 3.1 Execution lifecycle

```text
trigger_received
context_loaded
permissions_checked
plan_checked
limits_checked
conditions_evaluated
approval_required_optional
actions_started
actions_completed
audit_logged
notifications_sent
run_completed
```

Failure lifecycle:

```text
trigger_received
context_loaded
node_failed
retry_scheduled
retry_failed
error_logged
owner_notified
automation_paused_if_threshold_exceeded
```

## 3.2 Run record

```text
automation_run_id
automation_id
workspace_id
version
trigger_event_id
trigger_type
trigger_payload
status
started_at
completed_at
duration_ms
nodes_total
nodes_succeeded
nodes_failed
actions_executed
actions_skipped
approval_status
error_summary
cost_units
ai_tokens_used
created_records
updated_records
audit_event_ids
```

## 3.3 Node run record

```text
node_run_id
automation_run_id
node_id
node_type
node_label
status
input_json
output_json
error_json
started_at
completed_at
duration_ms
retry_count
```

---

# 4. Node categories

The canvas should support the following node groups:

1. Trigger nodes
2. Condition nodes
3. Branch nodes
4. Delay/time nodes
5. Data lookup nodes
6. AI nodes
7. Action nodes
8. Communication nodes
9. Payment nodes
10. Approval nodes
11. Legal safety nodes
12. Integration nodes
13. Webhook/API nodes
14. Utility/transform nodes
15. Error handling nodes
16. End/result nodes

---

# 5. Trigger nodes

## 5.1 Core record triggers

```text
Record Created
Record Updated
Record Deleted
Field Changed
Status Changed
Tag Added
Comment Added
File Uploaded
Document Signed
Review Submitted
Message Received
Form Submitted
```

Config fields:

```text
table/entity
field filters
old value
new value
workspace scope
property scope
debounce window
duplicate prevention key
```

## 5.2 Portfolio triggers

```text
Property Created
Property Updated
Property Status Changed
Unit Created
Unit Vacant
Unit Occupied
Tenancy Created
Tenancy Ending Soon
Tenancy Ended
Rent Review Date Reached
Property Compliance Missing
Property Country Changed
Operation Profile Changed
```

## 5.3 Work triggers

```text
Task Created
Task Due Soon
Task Overdue
Task Completed
Job Created
Job Status Changed
Maintenance Issue Reported
Supplier Assigned
Evidence Uploaded
Work Order Approved
Work Order Rejected
Emergency Job Raised
Emergency Job Unanswered
```

## 5.4 Booking triggers

```text
Booking Created
Booking Confirmed
Booking Payment Failed
Booking Cancelled
Booking Modified
Check-in Due
Checkout Due
Guest Checked In
Guest Checked Out
Cleaning Required
Cleaning Completed
Review Due
Booking Dispute Opened
Channel Sync Conflict
Calendar Block Created
```

## 5.5 Marketplace triggers

```text
Marketplace Listing Published
Quote Request Created
Quote Received
Quote Accepted
Marketplace Transaction Created
Payment Authorised
Payment Captured
Payout Due
Refund Requested
Review Submitted
Dispute Opened
Risk Flag Created
```

## 5.6 Supplier triggers

```text
Supplier Invited
Supplier Registered
Supplier Verification Submitted
Supplier Approved
Supplier Insurance Expiring
Supplier Licence Expiring
Supplier Availability Changed
Supplier Quote Deadline Near
Supplier Job Accepted
Supplier Job Completed
Supplier Evidence Missing
Supplier Dispute Opened
```

## 5.7 Money/accounting triggers

```text
Invoice Created
Invoice Due Soon
Invoice Overdue
Payment Received
Payment Failed
Refund Issued
Deposit Due
Deposit Release Due
Journal Posted
Journal Reversed
Budget Exceeded
Property Margin Below Target
Accounting Period Closing
```

## 5.8 Compliance triggers

```text
Compliance Item Created
Compliance Due Soon
Compliance Overdue
Certificate Uploaded
Certificate Expiring
HMO Licence Expiring
EPC Expiring
Gas Safety Expiring
Electrical Safety Expiring
Fire Safety Review Due
Short-let Licence Missing
Country Compliance Rule Changed
```

## 5.9 Legal triggers

```text
Legal Matter Created
Possession Case Created
Evidence Added
Legal Draft Generated
Legal Review Required
Legal Deadline Due Soon
Legal Disclaimer Accepted
Legal Pack Version Changed
Country Legal Profile Changed
```

Legal triggers must be review-first.

## 5.10 AI triggers

```text
AI Insight Generated
AI Risk Detected
AI Summary Requested
AI Usage Limit Near
AI Usage Limit Exceeded
AI Model Failed
AI Provider Switched
```

AI cannot be allowed to silently trigger destructive actions.

## 5.11 Schedule triggers

```text
Every Day
Every Week
Every Month
Every Quarter
Every Year
Custom Cron
Specific Date
Relative Date
Business Day
Country Holiday Aware Schedule
```

Schedule config:

```text
timezone
country calendar
start date
end date
frequency
cron expression
skip weekends
skip holidays
run window
max runs
```

## 5.12 Webhook/API triggers

```text
Incoming Webhook
Stripe Webhook Event
Booking Channel Webhook
Supplier API Event
Calendar Import Event
Email Inbound Event
Form Embed Submission
Public Portal Event
```

Security fields:

```text
secret
signature verification
allowed IPs
rate limit
schema validation
replay prevention
timestamp tolerance
dedupe key
```

---

# 6. Condition nodes

## 6.1 Basic condition nodes

```text
If / Else
Equals
Not Equals
Contains
Does Not Contain
Greater Than
Less Than
Between
Is Empty
Is Not Empty
Is True
Is False
Date Before
Date After
Date Within
```

## 6.2 Entity condition nodes

```text
If Property Country Is
If Operation Profile Is
If Property Status Is
If Unit Status Is
If Tenancy Type Is
If Booking Status Is
If Supplier Verified
If Supplier Insurance Valid
If Licence Required
If Payment Status Is
If Compliance Status Is
If AI Risk Score Above
If User Role Is
If Plan Allows
If Feature Flag Enabled
```

## 6.3 Safety condition nodes

```text
If Legal Review Approved
If Human Approval Granted
If Payment Release Allowed
If Country Pack Approved
If Sanctions Clear
If Tenant/Guest Consent Present
If Supplier Insurance Current
If File Virus Scan Clear
If RLS Access Confirmed
```

## 6.4 Context condition nodes

```text
If Workspace Country
If Property Country
If Customer Country
If Supplier Country
If Booking Source
If Marketplace Transaction Type
If Occupied Property
If Emergency
If Out of Hours
If Multi-country Portfolio
If Manual Sales Country
```

---

# 7. Branch and router nodes

```text
Switch
Multi-branch
Match Category
Match Country
Match Operation Profile
Match Urgency
Match Risk Level
Match Plan Tier
Match Role
Split Path
Parallel Paths
Merge Paths
Continue If
Stop If
Fallback Path
```

Example:

```text
Trigger: Emergency Job Created
Branch:
  Plumbing -> notify emergency plumbers
  Electrical -> notify electricians
  Locksmith -> notify locksmiths
  Gas -> require gas-certified supplier only
```

---

# 8. Delay and time nodes

```text
Wait
Wait Until
Delay for Business Hours
Delay Until Next Working Day
Delay Until Local Time
SLA Timer
Escalation Timer
Retry With Backoff
Run Window Gate
Stop After Deadline
```

Examples:

* wait 10 minutes for emergency supplier response
* wait until 48h before check-in before releasing instructions
* wait 3 days after checkout before deposit release
* retry failed webhook after 5 minutes, then 30 minutes, then 2 hours

---

# 9. Data lookup nodes

```text
Get Workspace
Get Property
Get Unit
Get Tenancy
Get Booking
Get Guest/Customer
Get Supplier
Get Supplier Availability
Get Preferred Suppliers
Get Compliance Items
Get Legal Matters
Get Documents
Get Files
Get Invoice
Get Payment
Get Journal Entries
Get Marketplace Transaction
Get AI Usage
Search Records
Aggregate Records
Count Records
Find Matching Supplier
Find Available Listing
Find Channel Conflict
```

Lookup rules:

* must be workspace-scoped
* must obey RLS
* must fail safely
* must not leak cross-workspace data
* must log access for sensitive records

---

# 10. AI nodes

AI nodes must be useful but controlled.

## 10.1 AI generation nodes

```text
AI Summarise Record
AI Draft Message
AI Draft Email
AI Draft Supplier Scope
AI Draft Booking Reply
AI Draft Legal Checklist
AI Draft Compliance Summary
AI Draft Invoice Note
AI Draft Dispute Summary
AI Draft Review Response
AI Generate Task List
AI Generate Property Risk Summary
AI Generate Quote Comparison
AI Generate Automation From Prompt
```

## 10.2 AI analysis nodes

```text
AI Risk Score
AI Margin Leakage Detector
AI Compliance Gap Detector
AI Booking Risk Detector
AI Supplier Risk Detector
AI Dispute Evidence Summary
AI Review Sentiment Analysis
AI Duplicate Contact Detector
AI Missing Evidence Detector
AI Pricing Suggestion
AI Next Best Action
```

## 10.3 AI control nodes

```text
AI Requires Approval
AI Confidence Gate
AI Legal Safety Gate
AI Cost Gate
AI Provider Fallback
AI Token Budget Check
AI Model Select
AI Human Review Required
```

## 10.4 AI node restrictions

AI nodes cannot:

* release payments
* issue refunds without approval
* serve legal notices
* verify legal compliance
* approve supplier licences
* approve identity verification
* delete records
* suspend accounts
* override sanctions blocks
* claim a legal/tax conclusion as certain

AI can:

* draft
* summarise
* recommend
* flag
* compare
* suggest
* create a draft task/action pending approval

---

# 11. Action nodes

## 11.1 Record action nodes

```text
Create Task
Update Task
Complete Task
Create Job
Update Job Status
Create Property Note
Create Contact
Update Contact
Create Document Record
Attach File
Create Calendar Event
Create Reminder
Create Notification
Add Tag
Remove Tag
Create Activity Log
Create Audit Event
```

## 11.2 Booking action nodes

```text
Create Booking Task
Update Booking Status
Send Booking Confirmation Draft
Release Check-in Instructions
Block Calendar Dates
Create Cleaning Task
Assign Cleaner
Create Checkout Inspection
Request Review
Create Booking Issue
Open Booking Dispute
Sync iCal
Flag Channel Conflict
```

High-risk booking actions requiring approval:

```text
Cancel Booking
Issue Refund
Charge Damage Fee
Release Deposit
Reject Guest
Suspend Booking Page
```

## 11.3 Supplier action nodes

```text
Create Supplier Job
Send Quote Request
Assign Supplier
Notify Preferred Suppliers
Notify Emergency Suppliers
Create Supplier Work Order
Request Supplier Evidence
Approve Supplier Evidence
Create Supplier Review Request
Open Supplier Dispute
Block Supplier From Job
```

High-risk supplier actions requiring approval:

```text
Release Supplier Payment
Refund Supplier Job
Suspend Supplier
Approve Supplier Verification
Reject Supplier Verification
```

## 11.4 Marketplace action nodes

```text
Publish Listing
Unpublish Listing
Create Marketplace Order
Create Marketplace Transaction
Calculate Platform Fee
Apply Marketplace Fee Rule
Create Payment Link
Create Payout Schedule
Create Review Request
Open Marketplace Dispute
Flag Marketplace Risk
```

High-risk marketplace actions:

```text
Hold Payout
Release Payout
Refund Transaction
Suspend Listing
Suspend User
```

## 11.5 Money/action nodes

```text
Create Invoice Draft
Send Invoice Draft For Approval
Mark Invoice Reminder
Create Payment Request
Create Refund Draft
Record Payment
Create Deposit Reminder
Create Expense Draft
Flag Arrears
Flag Margin Risk
```

## 11.6 Accounting action nodes

```text
Create Journal Draft
Post Journal Only After Approval
Create Reversal Draft
Allocate Payment
Create Accrual Draft
Create Revenue Recognition Draft
Create Supplier Expense Draft
Create Tax Line Draft
Create Owner Statement Item
```

Accounting action rules:

* unbalanced journals blocked
* posted journals immutable
* high-risk accounting actions require finance/admin role
* AI can create draft, not post automatically unless low-risk and enabled

## 11.7 Compliance action nodes

```text
Create Compliance Task
Update Compliance Status
Request Certificate
Notify Expiry
Create Evidence Request
Block Listing Publish
Block Supplier Job
Create Local Authority Check
Create Compliance Report
```

## 11.8 Legal action nodes

```text
Create Legal Matter
Create Legal Evidence Request
Create Legal Draft
Request Legal Review
Add Disclaimer
Create Legal Timeline Event
Create Legal Pack Export Draft
```

Blocked from automation:

```text
Auto-Serve Notice
Auto-File Claim
Auto-Send Legal Letter
Auto-Confirm Legal Compliance
```

These must be unavailable or admin-disabled.

---

# 12. Communication nodes

```text
Send Internal Notification
Send Email
Send SMS
Send WhatsApp Draft
Send In-App Message
Send Portal Message
Send Supplier Message
Send Guest Message
Send Tenant Message
Send Slack/Teams Webhook
Send Digest
Create Message Draft
Request Approval Before Sending
```

Communication safety:

* legal/payment/refund/cancellation messages require approval
* templates versioned
* unsubscribe/consent respected
* sensitive data redacted
* country language/locale applied

---

# 13. Payment nodes

```text
Create Payment Link
Create Payment Intent
Authorise Payment
Capture Payment
Create Refund Draft
Issue Refund After Approval
Create Payout Draft
Release Payout After Approval
Hold Payout
Calculate Platform Fee
Calculate Provider Fee
Record Payment Event
Create Stripe Checkout Session
Create Stripe Billing Portal Link
```

Payment rules:

* never fail open
* require role gate
* require plan gate
* require sanctions clear
* require no open dispute
* require payment provider status
* audit every action

---

# 14. Approval nodes

```text
Request Human Approval
Request Owner Approval
Request Finance Approval
Request Admin Approval
Request Legal Review
Request Compliance Review
Request Supplier Approval
Request Customer Confirmation
Wait For Approval
Approval Timeout
Escalate Approval
```

Approval object fields:

```text
approval_id
automation_run_id
node_id
requested_by
requested_from_role
approval_type
risk_level
summary
payload_snapshot
expires_at
status
approved_by
approved_at
rejected_by
rejected_at
decision_note
```

---

# 15. Integration nodes

## 15.1 First-party integrations

```text
Supabase
Stripe
Resend
OpenAI / AI Gateway
R2 / S3 Storage
Calendar
Email Inbox
Propvora Portal
Propvora Marketplace
Propvora Accounting
Propvora Legal
```

## 15.2 Booking integrations

```text
iCal Import
iCal Export
Google Calendar
Outlook Calendar
Airbnb iCal
Booking.com iCal
Vrbo iCal
Channel Manager Webhook
```

## 15.3 Marketplace/supplier integrations

```text
Stripe Connect
Identity Verification Provider
Insurance Verification Manual Upload
Licence Verification Manual Upload
Maps / Geocoding
Email
SMS
WhatsApp Later
```

## 15.4 Generic integration nodes

```text
HTTP Request
Incoming Webhook
Outgoing Webhook
Parse JSON
Transform JSON
Map Fields
Sign Request
Verify Signature
Retry Request
Handle API Error
```

Security rules:

* webhooks require secrets
* HTTP request node disabled by default on lower plans
* no arbitrary external requests on Starter/Operator
* allowlist domains for security
* admin must approve external webhook destinations
* log payload redaction
* prevent secrets in client JSON

---

# 16. Utility nodes

```text
Format Date
Format Currency
Format Address
Format Phone
Convert Currency
Calculate Margin
Calculate Nights
Calculate Cleaning Window
Calculate SLA
Calculate Risk Score
Generate Reference
Generate Slug
Deduplicate
Merge Data
Split Text
Extract Fields
Validate Schema
Redact Sensitive Data
Build Email Payload
Build PDF Payload
```

---

# 17. Error handling nodes

```text
Try / Catch
On Error
Retry
Retry With Backoff
Fallback Action
Notify Owner
Pause Automation
Open Error Ticket
Log Error
Stop Run
Continue On Error
```

Error policies:

```text
stop_on_error
continue_on_error
retry_then_stop
retry_then_fallback
pause_automation_after_threshold
```

---

# 18. End/result nodes

```text
End Success
End No Action
End Skipped
End Failed
End Waiting Approval
End Waiting External Event
End Paused
```

---

# 19. Canvas UX

## 19.1 Canvas route

```text
/app/automations/canvas/[automationId]
```

## 19.2 Full-screen expanding canvas

Default page layout:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ App Shell Top Bar                                                           │
├───────────────┬─────────────────────────────────────────────────────────────┤
│ Side Nav      │ Automation Header                                           │
│               │ [Name] [Status] [Test] [Publish] [More]                    │
│               ├───────────────┬───────────────────────────────┬────────────┤
│               │ Node Library  │ Canvas                        │ Inspector  │
│               │               │                               │            │
│               │ Triggers      │  [Trigger] → [Condition]      │ Node JSON  │
│               │ Actions       │       ↓                       │ Config     │
│               │ AI            │  [Action] → [End]             │ Test       │
│               │ Integrations  │                               │ Logs       │
│               └───────────────┴───────────────────────────────┴────────────┘
└─────────────────────────────────────────────────────────────────────────────┘
```

Expanded mode:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ Automation Canvas Fullscreen                                                │
│ [Back] [Automation Name] [Draft/Active] [Zoom] [Test] [JSON] [Publish]      │
├───────────────┬──────────────────────────────────────────────┬──────────────┤
│ Node Library  │                                              │ Inspector    │
│ Search nodes  │                                              │              │
│ Categories    │              Infinite Canvas                 │ Config       │
│ Templates     │                                              │ JSON         │
│ Recent nodes  │                                              │ Test         │
│               │                                              │ Logs         │
├───────────────┴──────────────────────────────────────────────┴──────────────┤
│ Bottom Run Console: latest test, errors, node timings, payload preview       │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 19.3 Canvas behaviours

Required:

* drag node from library
* drop on canvas
* connect handles
* auto-layout
* zoom in/out
* minimap
* pan
* keyboard shortcuts
* duplicate node
* group nodes
* comment nodes
* disabled nodes
* copy/paste
* undo/redo
* snap to grid
* node validation
* edge validation
* branch labels
* collapsible node groups
* run path highlight
* failed node red highlight
* successful node green highlight
* skipped node grey highlight

## 19.4 Node inspector panels

Tabs:

```text
Config
Inputs
Outputs
JSON
Test
Runs
Docs
```

Config tab:

* friendly form
* field mapping
* dropdowns
* entity selectors
* validation messages

Inputs tab:

* incoming payload schema
* sample input
* mapped fields

Outputs tab:

* output schema
* sample output
* variables exposed to later nodes

JSON tab:

* view node JSON
* edit node JSON if allowed
* validate JSON
* reset to form values
* copy JSON
* import JSON

Test tab:

* test this node
* test from trigger to this node
* test entire automation
* mock payload selector
* real record selector
* dry run toggle
* destructive action blocked in test

Runs tab:

* last 10 node runs
* duration
* errors
* output
* retry count

Docs tab:

* what node does
* permissions required
* plan required
* examples
* safety notes

---

# 20. JSON editing

## 20.1 JSON view levels

1. Read-only JSON for normal users
2. Editable JSON for admin/advanced users
3. Raw compiled JSON for platform admins only

## 20.2 JSON editor rules

Allow:

* view node config
* edit labels
* edit mappings
* edit conditions
* edit safe config
* import/export automation JSON
* copy as template

Block:

* editing hidden system fields
* injecting arbitrary code
* changing workspace_id
* changing creator role
* bypassing plan limits
* bypassing approval gates
* bypassing legal/payment restrictions
* adding unapproved HTTP endpoints
* exposing secrets

## 20.3 Automation JSON structure

```json
{
  "version": "1.0",
  "automationId": "uuid",
  "name": "Emergency plumber dispatch",
  "nodes": [
    {
      "id": "trigger_1",
      "type": "trigger.emergency_job_created",
      "position": { "x": 100, "y": 100 },
      "config": {}
    }
  ],
  "edges": [
    {
      "from": "trigger_1",
      "to": "condition_1",
      "label": "continue"
    }
  ],
  "settings": {
    "riskLevel": "high",
    "requiresApproval": false,
    "maxRunsPerDay": 50
  }
}
```

## 20.4 JSON validation

Every save must validate:

* schema
* node types exist
* required fields present
* edges valid
* no orphan critical paths
* trigger exists
* end node exists
* no forbidden actions
* no plan-banned nodes
* no role-banned nodes
* no country-banned nodes
* no unsafe external endpoint
* no circular loops unless explicitly allowed with max iterations

---

# 21. Testing triggers and dry runs

## 21.1 Test modes

```text
Test with mock payload
Test with real record
Test selected node
Test branch path
Test full automation
Dry run
Safe run
Live run
Replay previous run
```

## 21.2 Test trigger panel

Fields:

* trigger type
* sample event
* workspace
* property
* booking
* supplier job
* customer
* payload JSON
* run as role
* dry run toggle
* skip external sends toggle
* skip payment actions toggle
* skip legal sends toggle

## 21.3 Dry run behaviour

Dry run must:

* evaluate conditions
* show selected branch
* show actions that would run
* validate permissions
* validate plan limits
* validate country rules
* validate payment/legal restrictions
* not send messages
* not charge/refund/release payments
* not create live records unless test sandbox selected

## 21.4 Test output

Show:

* run timeline
* node-by-node status
* input/output payload
* skipped nodes
* validation warnings
* required approvals
* estimated cost
* estimated AI tokens
* plan usage impact
* external API calls that would happen

---

# 22. Subscription limits and hard caps

Automation must be plan-gated.

## 22.1 Suggested plan limits

### Starter

```text
Active automations: 3
Runs/month: 250
Canvas builder: no
Natural language builder: no or limited trial
Webhook triggers: no
HTTP request node: no
AI nodes: no
Payment nodes: no
Max nodes per automation: 5
Run history retention: 7 days
```

### Operator

```text
Active automations: 10
Runs/month: 2,500
Canvas builder: basic
Natural language builder: limited
Webhook triggers: 2
HTTP request node: no
AI nodes: limited
Payment nodes: draft only
Max nodes per automation: 15
Run history retention: 30 days
```

### Scale

```text
Active automations: 50
Runs/month: 25,000
Canvas builder: yes
Natural language builder: yes
Webhook triggers: 10
HTTP request node: allowlisted
AI nodes: yes
Payment nodes: approval-only
Max nodes per automation: 50
Run history retention: 90 days
```

### Pro / Agency

```text
Active automations: 200
Runs/month: 250,000
Canvas builder: advanced
Natural language builder: advanced
Webhook triggers: 50
HTTP request node: yes with allowlist
AI nodes: advanced
Payment nodes: approval-only
Marketplace nodes: yes
Supplier/booking nodes: yes
Max nodes per automation: 150
Run history retention: 1 year
```

### Enterprise

```text
Active automations: custom
Runs/month: custom
Canvas builder: advanced
Custom nodes: yes
Custom integrations: yes
SLA queue: yes
Dedicated rate limits
Long run retention
Audit export
SSO/SAML
Custom approval rules
```

## 22.2 Hard caps

Global safety caps:

```text
max runs per minute per workspace
max runs per hour per workspace
max runs per day per workspace
max external API calls per run
max AI tokens per run
max AI spend per day
max payment actions per day
max emails/messages per day
max loop iterations
max retries
max execution duration
max webhook payload size
max JSON config size
```

## 22.3 Abuse protection

* dedupe keys
* cooldowns
* rate limits
* run queues
* circuit breaker
* external endpoint allowlist
* payment action approval
* legal action blocklist
* AI cost budget
* admin kill switch
* auto-pause after repeated errors

---

# 23. Automation settings

Workspace settings page:

```text
/app/automations/settings
```

Settings sections:

1. General
2. Plans & Limits
3. Approvals
4. Notifications
5. Integrations
6. Webhooks
7. AI Builder
8. Safety
9. Logs & Retention
10. Admin Controls

## General

* automations enabled
* default timezone
* country calendar
* business hours
* run queue mode
* default owner
* default error recipient

## Approvals

* payment actions require approval
* legal actions require approval
* external messages require approval
* AI-generated actions require approval
* approval timeout
* escalation role
* approval audit

## Notifications

* run failures
* approval requests
* quota warnings
* automation paused
* integration failures
* daily digest

## Integrations

* Stripe
* email
* calendar
* iCal
* marketplace
* supplier workspace
* booking workspace
* webhook secrets
* external endpoints

## AI Builder

* allow natural language builder
* require review before activation
* model selection
* AI budget
* prompt safety
* AI action restrictions

## Safety

* kill switch
* block destructive actions
* block legal sends
* block payment release
* external domain allowlist
* maximum run frequency
* sensitive field redaction

---

# 24. Integration web / webhook system

## 24.1 Incoming webhook setup

Route:

```text
/app/automations/webhooks
```

Features:

* create webhook endpoint
* generate secret
* rotate secret
* view endpoint URL
* copy curl example
* schema validation
* sample payload
* test webhook
* replay event
* disable endpoint
* logs

Webhook URL pattern:

```text
/api/automations/webhooks/[webhookId]
```

Security:

* HMAC signature
* timestamp tolerance
* replay protection
* max payload size
* IP allowlist optional
* JSON schema validation
* rate limit
* secret rotation

## 24.2 Outgoing webhook node

Config:

* URL
* method
* headers
* body template
* auth mode
* retry policy
* timeout
* redaction
* allowed domain check
* test request

Auth modes:

```text
none
bearer token
basic
api key header
hmac signature
oauth later
```

## 24.3 Webhook event registry

Events:

```text
property.created
property.updated
booking.confirmed
booking.cancelled
supplier.job.created
supplier.job.completed
marketplace.transaction.created
payment.failed
compliance.expiring
legal.review.required
automation.run.failed
```

---

# 25. Recipe templates

## 25.1 Portfolio recipes

```text
When property is created → create compliance checklist
When operation profile changes → update planning/compliance checklist
When unit becomes vacant → create marketing/reletting task
When tenancy ending in 60 days → create renewal workflow
When property country changes → request country profile review
When property margin below target → notify owner and create review task
```

## 25.2 Rent-to-rent recipes

```text
When guaranteed rent due in 7 days → notify operator
When bills exceed forecast → flag margin leakage
When landlord agreement expires in 90 days → create renewal task
When operator margin below threshold → create renegotiation task
When right-to-sublet evidence missing → block compliance complete status
When HMO/SA risk detected → create legal/compliance review task
```

## 25.3 Serviced accommodation recipes

```text
When booking confirmed → create cleaning task
When checkout tomorrow and no cleaner assigned → urgent alert
When occupancy below target for 14 days → create pricing review
When guest reports issue → create work order and notify manager
When check-in 48h away and payment clear → release instructions
When channel sync conflict → block dates and notify manager
When cleaning completed → mark listing ready
```

## 25.4 HMO/shared housing recipes

```text
When room vacant > 14 days → notify manager
When licence expires in 90 days → create renewal task
When fire safety evidence missing → create compliance task
When occupancy exceeds licence limit → critical alert
When tenant moves in → create room checklist
When communal cleaning missed → notify supplier
```

## 25.5 Supplier recipes

```text
When emergency job created → notify top verified suppliers
When supplier accepts job → notify tenant/guest
When job completed without evidence → block payment release
When supplier insurance expires in 14 days → warn supplier and manager
When quote exceeds budget → request approval
When supplier completes 5 jobs with 5-star reviews → suggest preferred supplier
```

## 25.6 Marketplace recipes

```text
When transaction paid → calculate platform fee
When dispute opened → hold payout
When review submitted → update supplier/listing score
When listing verification expires → unpublish listing
When payout failed → notify admin and supplier
When suspicious review detected → send to moderation queue
```

## 25.7 Money recipes

```text
When invoice overdue → send reminder draft
When payment received → update money dashboard
When deposit release due → request manager approval
When refund approved → create refund action
When property spend exceeds budget → alert owner
```

## 25.8 Accounting recipes

```text
When booking completed → create revenue journal draft
When supplier job approved → create expense journal draft
When refund issued → create reversal journal draft
When accounting period closing → lock draft changes after approval
When unbalanced journal detected → block posting
```

## 25.9 Compliance recipes

```text
When certificate expires in 30 days → request renewal
When compliance evidence uploaded → update checklist
When country pack changes → review affected compliance items
When short-let licence missing → block booking listing publish
When supplier licence missing → block high-risk job assignment
```

## 25.10 Legal recipes

```text
When legal matter created → create evidence checklist
When legal draft generated → request legal review
When country legal profile unreviewed → disable legal templates
When possession evidence missing → notify manager
When legal disclaimer not accepted → block legal tools
```

## 25.11 Customer/portal recipes

```text
When guest checks in → send welcome message
When tenant reports issue → create work order
When customer uploads document → notify manager
When booking review due → send review request
When customer payment fails → send payment retry message
```

## 25.12 Admin recipes

```text
When automation fails 5 times → pause and notify admin
When AI spend reaches 80% cap → notify owner
When webhook signature fails repeatedly → disable webhook
When supplier dispute rate exceeds threshold → admin review
When blocked country signup attempted → log and notify compliance
```

---

# 26. Natural language builder

Route:

```text
/app/automations/ai-builder
```

UX:

1. User types automation idea.
2. AI asks clarifying questions if needed.
3. AI creates draft workflow.
4. User sees plain-English summary.
5. User sees node canvas.
6. User tests dry run.
7. User activates.

Examples:

```text
“When a serviced accommodation guest checks out, create a cleaning job, notify the cleaner, wait for evidence, then release the room as ready.”

“When a supplier job is marked complete, require before/after photos before payment can be released.”

“When rent-to-rent margin drops below 15%, notify me and create a renegotiation task.”
```

AI output must include:

* trigger
* conditions
* actions
* approval gates
* risk level
* plan requirement
* estimated runs/month
* test payload
* missing fields
* warnings

---

# 27. Automation admin controls

Admin route:

```text
/admin/automations
```

Admin tabs:

1. Overview
2. All Automations
3. Runs
4. Errors
5. Abuse
6. Integrations
7. Templates
8. Node Registry
9. Plan Limits
10. Kill Switches
11. Audit

Admin can:

* disable automation globally
* disable node type globally
* disable external webhooks
* pause workspace automations
* view high-error automations
* view high-cost AI automations
* view payment/legal action attempts
* approve new templates
* manage plan limits
* export logs
* inspect run payloads with redaction
* force-replay failed run if safe

---

# 28. Database schema

Required tables:

```text
automation_definitions
automation_versions
automation_nodes
automation_edges
automation_runs
automation_node_runs
automation_run_events
automation_approvals
automation_templates
automation_template_categories
automation_webhooks
automation_webhook_events
automation_integrations
automation_secrets
automation_usage
automation_limits
automation_errors
automation_audit_events
automation_test_runs
automation_drafts
automation_ai_generations
automation_node_registry
automation_plan_limits
```

RLS rules:

* workspace members can see workspace automations according to role
* only owner/admin can activate high-risk automation
* finance role needed for money/accounting payment actions
* legal/compliance role needed for legal/compliance automation approval
* supplier can only see supplier-side automations in their workspace
* customer cannot see internal automations
* platform admin access audited

---

# 29. API routes

```text
/api/automations
/api/automations/[id]
/api/automations/[id]/versions
/api/automations/[id]/test
/api/automations/[id]/activate
/api/automations/[id]/pause
/api/automations/[id]/runs
/api/automations/[id]/approvals
/api/automations/templates
/api/automations/templates/[id]
/api/automations/ai-builder
/api/automations/webhooks
/api/automations/webhooks/[id]
/api/automations/webhooks/[id]/test
/api/automations/runs/[runId]
/api/automations/runs/[runId]/replay
/api/automations/node-registry
/api/automations/integrations
/api/automations/settings
```

Every API route must include:

* auth
* workspace membership
* role/permission gate
* plan gate
* zod validation
* RLS-safe query
* rate limit
* audit log
* safe errors
* no raw secret exposure

---

# 30. Worker/queue architecture

Do not run heavy automations inside normal web request lifecycle.

Architecture:

```text
trigger source
event table
automation dispatcher
run queue
node executor
integration executor
approval waiter
retry scheduler
audit logger
notification dispatcher
```

Implementation options:

1. Supabase Edge Functions
2. Vercel background jobs / cron where available
3. external worker later
4. queue table with polling worker
5. Upstash/QStash later if needed

Minimum v1:

* event table
* scheduled cron processor
* run queue table
* edge function or server job processor
* retry logic
* idempotency keys

---

# 31. Safety model

## 31.1 Blocked automatic actions

Never allow fully automatic:

* serve legal notice
* file court/legal claim
* delete workspace
* delete property
* release large payout without approval
* refund large payment without approval
* suspend customer/supplier without admin approval
* verify supplier ID/licence purely by AI
* override sanctions block
* change country legal profile silently

## 31.2 Approval-required actions

Require approval for:

* send legal draft
* send cancellation/refund message
* release payment
* issue refund
* charge damage fee
* publish marketplace listing in unreviewed country
* approve supplier verification
* unpublish/suspend supplier
* post accounting journal if high value
* create external webhook to new domain

## 31.3 Safe automatic actions

Can auto-run:

* create task
* create reminder
* notify internal user
* create draft message
* create compliance checklist
* update low-risk status
* create audit event
* create cleaning task
* send non-sensitive internal digest

---

# 32. Testing requirements

Create:

```text
scripts/test/automation-engine.mjs
scripts/test/automation-canvas-json.mjs
scripts/test/automation-limits.mjs
scripts/test/automation-safety.mjs
scripts/test/automation-webhooks.mjs
tests/e2e/automations.spec.ts
tests/e2e/automation-canvas.spec.ts
tests/e2e/automation-recipes.spec.ts
```

Tests:

* create recipe automation
* create canvas automation
* edit node config
* edit JSON safely
* invalid JSON blocked
* forbidden node blocked by plan
* webhook signature required
* dry run creates no live records
* payment action requires approval
* legal action requires approval
* AI action does not auto-send
* run logs created
* failure retries
* repeated failures pause automation
* usage limits enforced
* cross-workspace automation access blocked
* supplier cannot access manager automation
* customer cannot access internal automation
* admin kill switch works

---

# 33. Final build order

## Phase 1 — Smart recipes

* automation tables
* recipe templates
* recipe configuration forms
* runs/logs
* limits
* audit
* simple triggers/actions

## Phase 2 — Natural language builder

* prompt to draft workflow
* review screen
* safe activation
* generated JSON
* dry run

## Phase 3 — Canvas builder

* node library
* drag/drop
* inspector
* JSON view
* test mode
* logs
* versioning

## Phase 4 — Integrations/webhooks

* incoming webhooks
* outgoing webhooks
* Stripe/booking/supplier events
* channel sync events

## Phase 5 — Advanced automations

* marketplace automations
* supplier automations
* booking automations
* payment approvals
* AI scoring
* canvas-lite to advanced canvas

---

# 34. Final positioning

The automation layer should be described as:

> Propvora Automations lets property operators build smart, safe workflows across portfolios, bookings, suppliers, compliance, legal, money, accounting and marketplace operations — using ready-made recipes, natural language or an expandable node canvas with testing, approvals, limits and audit logs.

This becomes a major enterprise feature, but only if it is safe, testable and controlled.
