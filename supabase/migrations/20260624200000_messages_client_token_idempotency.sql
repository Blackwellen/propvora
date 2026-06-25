-- Messaging send idempotency.
--
-- The compose/reply path can retry (double-click, network retry, optimistic
-- re-fire). Without a server-side guard a retried send inserts a duplicate
-- message. We add a nullable `client_token` (a uuid generated once per composed
-- message on the client) and a PARTIAL unique index scoped per thread, so a
-- second insert with the same (thread_id, client_token) raises 23505 and the
-- app treats it as "already sent" (fetches + returns the existing row).
--
-- Nullable + partial (WHERE client_token IS NOT NULL) so historical rows and
-- any non-token writer are unaffected.

alter table public.messages
  add column if not exists client_token uuid;

create unique index if not exists messages_thread_client_token_uidx
  on public.messages (thread_id, client_token)
  where client_token is not null;
