-- Add missing foreign-key constraints on bills.unit_id and bills.job_id.
--
-- The bills table already carried unit_id and job_id columns but had no FK
-- constraints registered for them. This (a) left a referential-integrity gap and
-- (b) prevented PostgREST from embedding units/jobs on the bill detail page
-- (the embed 400'd with PGRST200 "Could not find a relationship").
--
-- Verified 0 orphan rows before applying (every non-null unit_id/job_id resolves
-- to an existing units/jobs row), so these constraints are safe to add.
-- ON DELETE SET NULL: a bill is an accounting record that must survive deletion
-- of the (optional) linked unit or job.

alter table public.bills
  add constraint bills_unit_id_fkey
  foreign key (unit_id) references public.units(id) on delete set null;

alter table public.bills
  add constraint bills_job_id_fkey
  foreign key (job_id) references public.jobs(id) on delete set null;

-- Refresh the PostgREST schema cache so the new relationships are embeddable.
notify pgrst, 'reload schema';
