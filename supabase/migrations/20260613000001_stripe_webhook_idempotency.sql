-- Stripe webhook idempotency backstop.
--
-- Stripe guarantees at-least-once delivery and may re-send the same event.
-- We dedupe by stripe_event_id in the webhook handler; this unique index is the
-- hard backstop so a concurrent re-delivery can never create two processed
-- rows (and thus never double-accrue affiliate commission on invoice.paid).
CREATE UNIQUE INDEX IF NOT EXISTS stripe_webhook_events_event_id_uniq
  ON public.stripe_webhook_events (stripe_event_id);
