/*
  # Create User Profiles Table

  1. New Table
    - `user_profiles`: Stores additional user information
    - Links to auth.users via user_id
    - Stores social media, shipping address, and profile completion status
    
  2. Security
    - Enables Row Level Security (RLS)
    - Users can read and update their own profiles
    - Service role has full access
*/

CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  is_profile_completed boolean DEFAULT false,
  full_name text,
  email text,
  age integer,
  gender text,
  region text,
  club_affiliation text,
  social_media text,
  street_address text,
  apartment text,
  city text,
  state text,
  zip_code text,
  country text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

-- Add constraints for age and gender
ALTER TABLE user_profiles
ADD CONSTRAINT valid_age CHECK (age >= 0 AND age <= 120);

ALTER TABLE user_profiles
ADD CONSTRAINT valid_gender CHECK (gender IN ('male', 'female', 'other'));

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for access control
CREATE POLICY "Service role can do all operations" 
ON user_profiles
FOR ALL 
TO service_role
USING (true);

CREATE POLICY "Users can read their own profile" 
ON user_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON user_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON user_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);