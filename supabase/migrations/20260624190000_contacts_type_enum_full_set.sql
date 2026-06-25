-- Contacts: bring the `contact_type` enum in line with the application.
--
-- The app (src/types/database.ts ContactType, the Contacts list filters, type
-- badges, pie-chart colours, the Add Contact modal and the 8-step New Contact
-- wizard) was built around ~20 contact types, but the live enum only carried 7
-- (tenant, guarantor, supplier, owner, agent, accountant, other). As a result,
-- creating a Landlord / Applicant / Past Tenant / Solicitor / Insurer /
-- Investor failed with an invalid-enum error, and the Landlords / Applicants /
-- Past Tenants / Professionals filters could never return rows.
--
-- This migration adds the missing values. ADD VALUE IF NOT EXISTS is idempotent
-- and safe to re-run / reproduce on a fresh database.
--
-- NOTE: legacy rows using the `owner` value are treated as `landlord` at the
-- application layer (TYPE_BADGE / PIE_COLOURS / TYPE_FILTER_MAP). An optional
-- one-off normalisation `update public.contacts set type='landlord' where
-- type='owner';` can be run by an operator with write access — it is documented
-- in release-gated/user-fixes/contacts-overview.md. It is intentionally NOT run
-- here because a new enum value cannot be used in the same transaction in which
-- it is added.

ALTER TYPE public.contact_type ADD VALUE IF NOT EXISTS 'landlord';
ALTER TYPE public.contact_type ADD VALUE IF NOT EXISTS 'post_tenant';
ALTER TYPE public.contact_type ADD VALUE IF NOT EXISTS 'applicant';
ALTER TYPE public.contact_type ADD VALUE IF NOT EXISTS 'local_authority';
ALTER TYPE public.contact_type ADD VALUE IF NOT EXISTS 'housing_association';
ALTER TYPE public.contact_type ADD VALUE IF NOT EXISTS 'legal';
ALTER TYPE public.contact_type ADD VALUE IF NOT EXISTS 'insurer';
ALTER TYPE public.contact_type ADD VALUE IF NOT EXISTS 'utility_provider';
ALTER TYPE public.contact_type ADD VALUE IF NOT EXISTS 'broadband';
ALTER TYPE public.contact_type ADD VALUE IF NOT EXISTS 'cleaning';
ALTER TYPE public.contact_type ADD VALUE IF NOT EXISTS 'maintenance';
ALTER TYPE public.contact_type ADD VALUE IF NOT EXISTS 'emergency_contractor';
ALTER TYPE public.contact_type ADD VALUE IF NOT EXISTS 'investor';
ALTER TYPE public.contact_type ADD VALUE IF NOT EXISTS 'affiliate';
