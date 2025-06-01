/*
  # Create Stripe Customers Table

  1. New Tables
    - `stripe_customers`: Stores Stripe customer IDs for users
      - Links to Supabase auth.users
      - Implements soft delete with deleted_at column

  2. Security
    - Enables Row Level Security (RLS)
    - Users can read their own customer data
    - Service role can perform all operations
*/

-- Check if policies exist and drop them if they do
DO $$ 
BEGIN
  -- Drop policies if they exist
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'stripe_customers' AND policyname = 'Service role can do all operations'
  ) THEN
    DROP POLICY "Service role can do all operations" ON stripe_customers;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'stripe_customers' AND policyname = 'Users can read their own customer data'
  ) THEN
    DROP POLICY "Users can read their own customer data" ON stripe_customers;
  END IF;
EXCEPTION
  WHEN undefined_table THEN
    -- Table doesn't exist yet, so no policies to drop
    NULL;
END $$;

-- Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS stripe_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT stripe_customers_user_id_key UNIQUE(user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_stripe_customers_user_id ON stripe_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_customer_id ON stripe_customers(customer_id);

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