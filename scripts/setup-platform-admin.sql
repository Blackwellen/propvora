-- ============================================================
-- Propvora Platform Admin Setup
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- Step 1: Ensure the platform_role column exists on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS platform_role TEXT DEFAULT NULL;

-- Step 2: Set jamahlthomas1996@gmail.com as platform admin
-- This finds the user in auth.users and updates their profile row
UPDATE public.profiles
SET platform_role = 'admin'
WHERE id = (
  SELECT id FROM auth.users
  WHERE email = 'jamahlthomas1996@gmail.com'
  LIMIT 1
);

-- Step 3: Verify it worked
SELECT
  p.id,
  p.platform_role,
  u.email,
  u.created_at
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'jamahlthomas1996@gmail.com';

-- ============================================================
-- IMPORTANT NOTES:
-- 1. You must have already registered as jamahlthomas1996@gmail.com
--    in the app before running this. The profile row is created
--    on first login via the auth trigger.
--
-- 2. If the UPDATE affects 0 rows, you haven't signed up yet.
--    Sign up at /register first, then re-run.
--
-- 3. After running, go to /admin/login and sign in with
--    jamahlthomas1996@gmail.com + your password.
-- ============================================================
