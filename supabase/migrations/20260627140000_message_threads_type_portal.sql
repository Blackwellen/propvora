-- Portal "start conversation" was fully broken (FIX-653).
-- The portal send API inserts message_threads.type for a portal-originated thread,
-- but message_threads_type_check only allowed
-- ('team','supplier','tenant','landlord','internal'). A tenant/landlord/etc.
-- portal user starting a new conversation hit a 23514 check violation, surfaced
-- in the UI as "Could not start conversation." (found in live E2E QA).
--
-- Extend the allowed set to include every portal vertical (and a generic
-- 'portal' value) so portal-originated threads validate. Existing rows
-- (tenant/landlord) remain valid.

alter table public.message_threads
  drop constraint if exists message_threads_type_check;

alter table public.message_threads
  add constraint message_threads_type_check
  check (type = any (array[
    'team'::text,
    'supplier'::text,
    'tenant'::text,
    'landlord'::text,
    'internal'::text,
    'portal'::text,
    'customer'::text,
    'applicant'::text,
    'accountant'::text,
    'solicitor'::text,
    'generic'::text
  ]));
