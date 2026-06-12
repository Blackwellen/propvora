-- Add shell_preferences JSONB column to profiles
-- Stores per-user shell style and layout preferences
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS shell_preferences JSONB NOT NULL DEFAULT
    '{"shell_style":"dark-luxe","shell_layout":"side-and-top","side_nav_collapsed":false,"top_nav_compact":false}';

-- No new RLS policies needed: the existing
-- "Users update own profile" policy already covers all columns on the profiles row.
