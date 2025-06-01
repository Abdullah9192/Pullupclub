/*
  # Create Stripe Subscriptions Table and Add Foreign Key Constraints

  1. New Table
    - `stripe_subscriptions`: Stores subscription information from Stripe
      - Links to stripe_customers via customer_id
      - Stores subscription details like status, period dates, and payment method
  
  2. Changes
    - Add unique constraint to customer_id in stripe_customers
    - Add foreign key constraint from stripe_subscriptions to stripe_customers
    - Create view for easy access to subscription data joined with user info

  3. Security
    - Enable Row Level Security
    - Service role has full access
*/

-- First, create the stripe_subscriptions table if it doesn't exist
CREATE TABLE IF NOT EXISTS stripe_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id text NOT NULL,
  subscription_id text NOT NULL,
  price_id text,
  current_period_start bigint,
  current_period_end bigint,
  cancel_at_period_end boolean DEFAULT false,
  payment_method_brand text,
  payment_method_last4 text,
  subscription_status text DEFAULT 'inactive',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE(subscription_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_customer_id 
ON stripe_subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_subscription_id 
ON stripe_subscriptions(subscription_id);

-- Enable Row Level Security
ALTER TABLE stripe_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for access control
CREATE POLICY "Service role can do all operations" 
ON stripe_subscriptions
FOR ALL 
TO service_role
USING (true);

-- Add unique constraint to customer_id in stripe_customers if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'stripe_customers_customer_id_key'
  ) THEN
    -- Add unique constraint to customer_id
    ALTER TABLE stripe_customers 
    ADD CONSTRAINT stripe_customers_customer_id_key 
    UNIQUE (customer_id);
  END IF;
END $$;

-- Now add the foreign key constraint
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'stripe_subscriptions_customer_id_fkey'
  ) THEN
    -- Add foreign key constraint if it doesn't exist
    ALTER TABLE stripe_subscriptions 
    ADD CONSTRAINT stripe_subscriptions_customer_id_fkey 
    FOREIGN KEY (customer_id) 
    REFERENCES stripe_customers(customer_id) 
    ON DELETE CASCADE;
  END IF;
END $$;

-- Create a view to join users, customers, and subscriptions
CREATE OR REPLACE VIEW stripe_user_subscriptions AS
SELECT 
  u.id as user_id,
  u.email,
  sc.customer_id,
  ss.subscription_id,
  ss.price_id,
  ss.current_period_start,
  ss.current_period_end,
  ss.cancel_at_period_end,
  ss.payment_method_brand,
  ss.payment_method_last4,
  ss.subscription_status,
  ss.created_at,
  ss.updated_at
FROM 
  auth.users u
JOIN 
  stripe_customers sc ON u.id = sc.user_id
LEFT JOIN 
  stripe_subscriptions ss ON sc.customer_id = ss.customer_id
WHERE 
  sc.deleted_at IS NULL
  AND (ss.deleted_at IS NULL OR ss.deleted_at IS NULL);