-- ─────────────────────────────────────────────────────────────────────────────
-- CUSTOMER / GUEST WORKSPACE DEPTH  (Phase: customer commercial depth)
--
-- This migration is ADDITIVE + IDEMPOTENT (safe to re-run). It gives the guest /
-- customer workspace its OWN first-class persistence for the three surfaces the
-- shared operator tables cannot serve a customer (their RLS is keyed on the
-- OPERATOR `workspace_members`, not on `customer_workspace_members`):
--
--   1. customer_message_threads / customer_messages — guest ↔ host conversations
--      scoped to the guest's customer workspace (and, optionally, a booking).
--   2. customer_notifications — the guest's own notification centre (booking
--      confirmed, payment due, check-in available, review due, new message …).
--   3. customer_saved_searches — saved stay searches the guest can re-run.
--
-- Isolation: every table is RLS-gated by `is_customer_workspace_member(...)`,
-- which already resolves a row in public.customer_workspace_members for the
-- signed-in user. A customer therefore sees ONLY their own workspace's rows; no
-- cross-customer leakage is possible. The operator/host side can read a thread
-- via the SECURITY-DEFINER membership of the host workspace_id column (kept for
-- a future operator inbox) but this migration does not touch operator tables.
--
-- Money: not stored here (receipts/payments read from the existing bookings /
-- marketplace_transactions tables in integer pence).
-- ─────────────────────────────────────────────────────────────────────────────

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. CUSTOMER MESSAGE THREADS  (one conversation, optionally about a booking)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.customer_message_threads (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- The guest's customer workspace (RLS anchor). NEVER another customer's id.
  customer_workspace_id uuid NOT NULL,
  -- The host/operator workspace the thread is with (for a future operator inbox).
  host_workspace_id     uuid,
  -- Optional booking this conversation is about.
  booking_id            uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  subject               text,
  -- Lightweight denormalised preview so the thread list renders without a join.
  last_message          text,
  last_sender           text,
  last_message_at       timestamptz,
  -- Unread counter for the guest (incremented when the host replies).
  unread_for_customer   integer NOT NULL DEFAULT 0,
  archived              boolean NOT NULL DEFAULT false,
  created_by            uuid,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cmt_customer_ws
  ON public.customer_message_threads (customer_workspace_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_cmt_booking
  ON public.customer_message_threads (booking_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. CUSTOMER MESSAGES  (rows in a thread)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.customer_messages (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id             uuid NOT NULL REFERENCES public.customer_message_threads(id) ON DELETE CASCADE,
  -- Denormalised RLS anchor (mirrors the thread's customer workspace).
  customer_workspace_id uuid NOT NULL,
  -- 'customer' (the guest) or 'host' (the operator side).
  sender_role           text NOT NULL DEFAULT 'customer'
                          CHECK (sender_role IN ('customer', 'host', 'system')),
  sender_id             uuid,
  sender_name           text,
  body                  text NOT NULL,
  read_by_customer      boolean NOT NULL DEFAULT false,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cm_thread
  ON public.customer_messages (thread_id, created_at);
CREATE INDEX IF NOT EXISTS idx_cm_customer_ws
  ON public.customer_messages (customer_workspace_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. CUSTOMER NOTIFICATIONS  (the guest's own notification centre)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.customer_notifications (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_workspace_id uuid NOT NULL,
  -- Optional: the auth user the notification belongs to (the workspace owner).
  user_id               uuid,
  -- e.g. booking_confirmed, payment_due, check_in_available, review_due, message.
  kind                  text NOT NULL DEFAULT 'general',
  title                 text NOT NULL,
  body                  text,
  -- In-app link (e.g. /user/bookings/<id>).
  href                  text,
  severity              text NOT NULL DEFAULT 'info'
                          CHECK (severity IN ('info', 'success', 'warning', 'critical')),
  -- Loose linkage for grouping (booking / payment / message / review …).
  entity_type           text,
  entity_id             uuid,
  read_at               timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cn_customer_ws
  ON public.customer_notifications (customer_workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cn_unread
  ON public.customer_notifications (customer_workspace_id) WHERE read_at IS NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. CUSTOMER SAVED SEARCHES  (saved stay searches the guest can re-run)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.customer_saved_searches (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_workspace_id uuid NOT NULL,
  label                 text NOT NULL,
  -- The search query/filters (location, dates, guests, price band …).
  query                 jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_css_customer_ws
  ON public.customer_saved_searches (customer_workspace_id, created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. ROW-LEVEL SECURITY  — every table scoped to the guest's own workspace
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.customer_message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_messages        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_notifications   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_saved_searches  ENABLE ROW LEVEL SECURITY;

-- Threads: a customer-workspace member may read + write their own threads.
DROP POLICY IF EXISTS customer_message_threads_member_all ON public.customer_message_threads;
CREATE POLICY customer_message_threads_member_all
  ON public.customer_message_threads
  FOR ALL
  USING (public.is_customer_workspace_member(customer_workspace_id))
  WITH CHECK (public.is_customer_workspace_member(customer_workspace_id));

-- Messages: same anchor (denormalised customer_workspace_id on each row).
DROP POLICY IF EXISTS customer_messages_member_all ON public.customer_messages;
CREATE POLICY customer_messages_member_all
  ON public.customer_messages
  FOR ALL
  USING (public.is_customer_workspace_member(customer_workspace_id))
  WITH CHECK (public.is_customer_workspace_member(customer_workspace_id));

-- Notifications: read + update (mark read) + delete own; insert via member.
DROP POLICY IF EXISTS customer_notifications_member_all ON public.customer_notifications;
CREATE POLICY customer_notifications_member_all
  ON public.customer_notifications
  FOR ALL
  USING (public.is_customer_workspace_member(customer_workspace_id))
  WITH CHECK (public.is_customer_workspace_member(customer_workspace_id));

-- Saved searches: member-scoped.
DROP POLICY IF EXISTS customer_saved_searches_member_all ON public.customer_saved_searches;
CREATE POLICY customer_saved_searches_member_all
  ON public.customer_saved_searches
  FOR ALL
  USING (public.is_customer_workspace_member(customer_workspace_id))
  WITH CHECK (public.is_customer_workspace_member(customer_workspace_id));

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. updated_at touch trigger for threads (keeps thread list ordering correct)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.touch_customer_thread_updated_at()
  RETURNS trigger
  LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_customer_thread ON public.customer_message_threads;
CREATE TRIGGER trg_touch_customer_thread
  BEFORE UPDATE ON public.customer_message_threads
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_customer_thread_updated_at();
