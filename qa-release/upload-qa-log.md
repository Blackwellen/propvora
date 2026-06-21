# Upload QA Log

Last updated: 2026-06-20

> Tests file upload flows across all workspaces. Supabase Storage is the backend.

## Upload Test Matrix

| ID | Workspace | Route | Upload Type | File Tested | Result | Notes |
|---|---|---|---|---|---|---|
| UPL-001 | PM | `/property-manager/portfolio/properties/[id]` | Property image | — | PENDING | — |
| UPL-002 | PM | `/property-manager/compliance` | Certificate PDF | — | PENDING | — |
| UPL-003 | PM | `/property-manager/portfolio/tenancies/[id]` | Tenancy agreement PDF | — | PENDING | — |
| UPL-004 | PM | `/property-manager/contacts/[id]` | Contact document | — | PENDING | — |
| UPL-005 | Supplier | `/supplier/jobs/[id]/evidence` | Job evidence photo | — | PENDING | — |
| UPL-006 | Supplier | `/supplier/compliance` | Compliance certificate | — | PENDING | — |
| UPL-007 | Supplier | `/supplier/profile` | Business logo | — | PENDING | — |
| UPL-008 | Customer | `/customer/profile` | ID document | — | PENDING | — |
| UPL-009 | Any | — | File > 10MB | — | PENDING | Should show error |
| UPL-010 | Any | — | Wrong file type | — | PENDING | Should show error |
| UPL-011 | Any (mobile) | Various | Image via mobile picker | — | PENDING | 430×932 |

## Supabase Storage Buckets

Verify the following buckets exist in Supabase dashboard:
- `property-images`
- `compliance-documents`
- `tenancy-documents`
- `contact-documents`
- `supplier-evidence`
- `supplier-compliance`
- `supplier-logos`
- `user-documents`

## Issues Found

None yet — all tests pending.
