/*
  # Create stripe_customers table
  
  1. New Tables
    - `stripe_customers` - stores relationship between users and their Stripe customer IDs
      - `id` (uuid, primary key) - unique identifier
      - `user_id` (uuid, not null) - references auth.users
      - `customer_id` (text, not null) - Stripe customer ID
      - `created_at` (timestamptz) - record creation timestamp
      - `updated_at` (timestamptz) - record update timestamp
      - `deleted_at` (timestamptz) - for soft deletion
  
  2. Security
    - Enable RLS on the `stripe_customers` table
    - Add policy for authenticated users to read their own data
    - Add policy for service role to read/write all data
*/

CREATE TABLE IF NOT EXISTS stripe_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read their own customer data"
  ON stripe_customers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can do all operations"
  ON stripe_customers
  FOR ALL
  TO service_role
  USING (true);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_stripe_customers_user_id ON stripe_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_customer_id ON stripe_customers(customer_id);