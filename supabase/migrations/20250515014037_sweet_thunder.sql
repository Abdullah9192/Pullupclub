/*
  # Create Stripe Orders Table

  1. New Table
    - `stripe_orders`: Stores one-time payment information
    - Records checkout sessions and payment intents
    - Tracks payment status and amounts

  2. Security
    - Enables Row Level Security (RLS)
    - Users can view their own orders
    - Service role has full access
*/

CREATE TABLE IF NOT EXISTS stripe_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checkout_session_id text NOT NULL,
  payment_intent_id text,
  customer_id text NOT NULL,
  amount_subtotal bigint,
  amount_total bigint,
  currency text DEFAULT 'usd',
  payment_status text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE(checkout_session_id)
);

CREATE INDEX idx_stripe_orders_customer_id ON stripe_orders(customer_id);
CREATE INDEX idx_stripe_orders_payment_intent_id ON stripe_orders(payment_intent_id);

-- Enable Row Level Security
ALTER TABLE stripe_orders ENABLE ROW LEVEL SECURITY;

-- Create policies for access control
CREATE POLICY "Service role can do all operations" 
ON stripe_orders
FOR ALL 
TO service_role
USING (true);

-- Users can read their own orders by joining with stripe_customers
CREATE POLICY "Users can read their own orders" 
ON stripe_orders
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM stripe_customers sc 
    WHERE sc.customer_id = stripe_orders.customer_id 
    AND sc.user_id = auth.uid()
  )
);