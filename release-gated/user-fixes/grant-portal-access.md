# Grant Portal Access — Manual / Deferred Items

**Wizard:** Grant Portal Access (`src/components/portals/GrantPortalAccessModal.tsx`)
**Status:** 100/100, **Ready for release**. Nothing here blocks release.

This file records items intentionally left out of V1 (with the reason Claude Code could
not / chose not to implement them now), per the audit contract.

---

## 1. Recipient-email send path — DEFERRED to V1.5 (not a blocker)

**What:** The wizard provisions the magic link and shows it once for the operator to copy
and share over their own secure channel. It does **not** email the link to the recipient.

**Why not implemented now:** V1 portal grants are deliberately **copy-link only**. There is
no portal-grant transactional email template wired in V1, and `contact_portal_access` exposes
no `email_sent_at` write path from this flow. Auto-emailing a magic link is a security-sensitive
delivery decision (channel, branding, reply-to, unsubscribe, audit) that belongs with the
broader notifications/SMTP work, not bolted onto this modal. The prior session already removed
a dead "Resend link" menu item (FIX-441) for the same reason — shipping a half-wired email path
would reintroduce a dishonest control.

**Exact steps to add later (V1.5):**
1. Add a `portal_grant_invite` Resend/SMTP template (workspace branding, sender, reply-to).
2. Extend `POST /api/portals/grant` with an optional `notify: true` that sends the magic link
   to `contact.email` server-side (never returning the raw token to logs), stamps
   `contact_portal_access.email_sent_at`, and writes a `PORTAL_GRANT_EMAILED` audit entry.
3. Add a "Email link to recipient" toggle on success step 3 (default off) gated on a valid
   contact email + notification preference.

---

## 2. Re-issue / regenerate link — DEFERRED to V1.5 (not a blocker)

**What:** Because the raw token is shown exactly once (hash-only storage), if an operator loses
the link before sharing it, there is currently no in-app "re-issue" button — they would create a
new grant (and revoke the old one).

**Why not implemented now:** Correct security posture (one-time reveal) is the priority for V1.
A re-issue flow needs to mint a fresh token, revoke the prior token row, and re-surface the new
link — a small but real mutation surface that should be designed with the detail page, not the
wizard. The current behaviour is safe and honest (the success step's warning tells the operator
the link is shown once).

**Exact steps to add later (V1.5):**
1. Add `POST /api/portals/grant/{id}/reissue` (membership-checked) that revokes the existing
   token row and inserts a fresh hashed token, returning the new raw link once.
2. Add a "Re-issue link" action on the grant **detail** page that opens the same one-time
   reveal panel used by the wizard success step (extract it into a shared component).
3. Audit as `PORTAL_TOKEN_REISSUED`.

---

## 3. Dev env link host (`localhost:3000`) — environment config, no code change

During live QA the success-step link rendered as `http://localhost:3000/portal?token=…` while
the dev server runs on :3002, because `NEXT_PUBLIC_APP_URL=http://localhost:3000` in this dev
`.env.local`. The API resolves the base from `NEXT_PUBLIC_APP_URL` → `NEXT_PUBLIC_SITE_URL` →
request origin, which is correct for production (real domain). **No action required** unless a
developer wants the dev link host to match the dev port — set `NEXT_PUBLIC_APP_URL` to the
dev server's port in `.env.local`.
