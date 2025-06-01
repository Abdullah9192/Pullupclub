/*
  # Fix Stripe Customers Table

  1. Changes
    - Drop the conflicting table if it exists
    - Create the correct stripe_customers table referencing auth.users
    - Add proper indexes and RLS policies

  2. Security
    - Enable Row Level Security
    - Users can read only their own customer data
    - Service role has full access
*/

-- Drop the table if it exists to avoid conflicts
DROP TABLE IF EXISTS stripe_customers;

-- Create the table with the correct structure
CREATE TABLE stripe_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT stripe_customers_user_id_key UNIQUE(user_id)
);

-- Create indexes for performance
CREATE INDEX idx_stripe_customers_user_id ON stripe_customers(user_id);
CREATE INDEX idx_stripe_customers_customer_id ON stripe_customers(customer_id);

-- Enable Row Level Security
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;

-- Create policies for access control
CREATE POLICY "Service role can do all operations" 
ON stripe_customers
FOR ALL 
TO service_role
USING (true);

CREATE POLICY "Users can read their own customer data" 
ON stripe_customers
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);