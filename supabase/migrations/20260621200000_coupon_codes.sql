-- Coupon codes for early access and promotional pricing
CREATE TABLE IF NOT EXISTS coupon_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed_pence', 'free_months')),
  discount_value INTEGER NOT NULL, -- percent (0-100), pence, or months
  plan_restriction TEXT, -- null = any plan, or 'basic', 'pro', 'enterprise'
  max_uses INTEGER, -- null = unlimited
  uses_count INTEGER NOT NULL DEFAULT 0,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_until TIMESTAMPTZ, -- null = no expiry
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Coupon redemptions log
CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES coupon_codes(id),
  workspace_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  stripe_coupon_id TEXT, -- Stripe promotion code ID if applied via Stripe
  UNIQUE(coupon_id, workspace_id) -- one redemption per workspace per coupon
);

-- RLS: only admins can manage coupon_codes; any authed user can read active ones
ALTER TABLE coupon_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_coupon_codes" ON coupon_codes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

CREATE POLICY "authed_read_active_coupons" ON coupon_codes
  FOR SELECT USING (is_active = true AND (valid_until IS NULL OR valid_until > now()));

CREATE POLICY "admin_all_redemptions" ON coupon_redemptions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

CREATE POLICY "own_workspace_redemptions" ON coupon_redemptions
  FOR SELECT USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));

-- Seed data: Worm codes (100 codes, 1 month free on Basic)
INSERT INTO coupon_codes (code, description, discount_type, discount_value, plan_restriction, max_uses, valid_until)
VALUES
  ('WORM2026', '100 Early Worm codes - 1 month free on Basic plan', 'free_months', 1, 'basic', 100, '2026-12-31 23:59:59+00');

-- Seed data: First 50 users (50% off for 2 months)
INSERT INTO coupon_codes (code, description, discount_type, discount_value, plan_restriction, max_uses, valid_until)
VALUES
  ('EARLY50', 'First 50 users - 50% off first 2 months', 'percent', 50, NULL, 50, '2026-12-31 23:59:59+00');
