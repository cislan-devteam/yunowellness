-- =============================================
-- YuNoWellness PH — Commerce Schema (Private/Invite-Only)
-- Run this in Supabase SQL Editor AFTER the peptide schema
-- =============================================

-- 1. INVITE CODES
CREATE TABLE invite_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  max_uses INTEGER DEFAULT 1,
  times_used INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. MEMBERS (linked to Supabase Auth)
CREATE TABLE members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  invite_code_used TEXT REFERENCES invite_codes(code),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. PRODUCTS
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL DEFAULT 0,
  compare_at_price_cents INTEGER,
  peptide_id UUID REFERENCES peptides(id),
  image_url TEXT,
  stock_qty INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. CART ITEMS
CREATE TABLE cart_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(member_id, product_id)
);

-- 5. ORDERS
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES members(id),
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled')),
  total_cents INTEGER NOT NULL DEFAULT 0,
  shipping_address JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. ORDER ITEMS
CREATE TABLE order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price_cents INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. STRIPE CUSTOMERS (maps Supabase user to Stripe customer)
CREATE TABLE stripe_customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. INDEXES
CREATE INDEX idx_invite_codes_code ON invite_codes(code);
CREATE INDEX idx_members_user_id ON members(user_id);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_cart_member ON cart_items(member_id);
CREATE INDEX idx_orders_member ON orders(member_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order ON order_items(order_id);

-- 9. AUTO-UPDATE updated_at triggers
CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 10. ROW LEVEL SECURITY

-- Invite codes: public can validate, only admins create
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can check invite codes" ON invite_codes FOR SELECT USING (true);

-- Members: users can read their own profile
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own member profile" ON members FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can update own member profile" ON members FOR UPDATE
  USING (auth.uid() = user_id);

-- Products: members can view active products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view active products" ON products FOR SELECT
  USING (is_active = true AND auth.role() = 'authenticated');

-- Cart: members manage their own cart
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members manage own cart" ON cart_items FOR ALL
  USING (member_id IN (SELECT id FROM members WHERE user_id = auth.uid()));

-- Orders: members view their own orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view own orders" ON orders FOR SELECT
  USING (member_id IN (SELECT id FROM members WHERE user_id = auth.uid()));

-- Order items: members view their own order items
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view own order items" ON order_items FOR SELECT
  USING (order_id IN (
    SELECT id FROM orders WHERE member_id IN (
      SELECT id FROM members WHERE user_id = auth.uid()
    )
  ));

-- Stripe customers: users see their own
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own stripe mapping" ON stripe_customers FOR SELECT
  USING (auth.uid() = user_id);
