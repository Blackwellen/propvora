# Messaging — Deferred Features (not blockers)

These are **absent features**, not broken stubs — no dead button or placeholder UI ships
for either. They are documented here so the decision is explicit and traceable.

---

## 1. Message attachments (file upload in a message)

**Status:** Not shipped. `messages.attachments` (jsonb) column exists but is unused; **no
composer in any surface renders an attach button**, so there is no dead/stub UI.

**Why Claude Code did not build it this session:** Attachments require a full secure-upload
pipeline (R2/storage bucket scoped by workspace+conversation, signed-URL download,
file-type/size validation, virus-scan status, audit-log on view/download/delete, portal
boundary on internal-only files). That is a multi-surface feature in its own right and was
out of scope for a hardening pass. Building a half-wired attach button would itself violate
the no-stub release rule.

**Exact gate to ship later:**
1. Create storage bucket `message-attachments` (private) with RLS path `workspace_id/conversation_id/...`.
2. Add an `EvidenceUpload`-style picker to each composer (operator, portal, supplier, customer).
3. Server: validate type/size/count, write signed-URL refs into `messages.attachments`.
4. Permission-gate download (portal users must never receive internal-only files).
5. Audit-log view/download/delete.
6. Put the whole feature behind a feature flag until all 5 are done.

**Decision:** Acceptable for V1 release without attachments (text messaging is complete).

---

## 2. Email / SMTP notification on new message

**Status:** Not shipped. New messages create **in-app** notifications only
(`notifyMessageReceived` → `notifications` table). No email is sent.

**Why deferred:** Per-message transactional email needs: a verified sending domain
(Resend/SMTP), per-recipient notification-preference checks, workspace/portal branding in
the template, unsubscribe handling, and rate-limited batching to avoid spamming
tenants/landlords/suppliers. The Resend domain + template wiring is an external
configuration step (domain verification is a dashboard action), so this cannot be fully
completed by Claude Code alone.

**Exact gate to ship later:**
1. Verify the sending domain in Resend (external dashboard action — **user**).
2. Build the message-notification email template (branding + reply-to).
3. In `notifyMessageReceived`, after the in-app notification, enqueue an email respecting
   the recipient's notification preferences and a per-conversation rate limit.
4. Demo/test mode must NOT send real customer emails.

**Decision:** Acceptable for V1 — in-app notifications + side-nav/bubble unread badges cover
the awareness need. Email is an enhancement.
