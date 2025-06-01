/*
  # Fix Auth Context Policies
  
  1. Changes
    - Drop all existing policies
    - Create simpler policy structure
    - Fix recursion issues
    - Ensure proper access for auth context
*/

-- First, drop all existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Service role full access" ON user_profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON user_profiles;

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create a simple policy for users to view their own profile
CREATE POLICY "Users can view own profile"
    ON user_profiles
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Create a policy for users to update their own profile
CREATE POLICY "Users can update own profile"
    ON user_profiles
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Create a policy for users to insert their own profile
CREATE POLICY "Users can insert own profile"
    ON user_profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Create a policy for service role to do everything
CREATE POLICY "Service role full access"
    ON user_profiles
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_profiles TO authenticated;
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT SELECT ON auth.users TO authenticated;

-- Update your user to be a super admin using service role
DO $$ 
BEGIN
    -- Use service role to bypass RLS
    SET LOCAL ROLE service_role;
    
    UPDATE user_profiles 
    SET is_super_admin = true,
        role = 'admin',
        updated_at = now()
    WHERE user_id = 'a01bec8d-c476-44ae-9f64-df27b39e10bb';
END $$;

-- Verify the update (using service role to ensure access)
DO $$ 
DECLARE
    v_email text;
    v_role text;
    v_is_super_admin boolean;
    v_updated_at timestamptz;
BEGIN
    SET LOCAL ROLE service_role;
    
    SELECT 
        u.email,
        up.role,
        up.is_super_admin,
        up.updated_at
    INTO 
        v_email,
        v_role,
        v_is_super_admin,
        v_updated_at
    FROM auth.users u
    JOIN user_profiles up ON up.user_id = u.id
    WHERE u.id = 'a01bec8d-c476-44ae-9f64-df27b39e10bb';
    
    RAISE NOTICE 'User updated: email=%, role=%, is_super_admin=%, updated_at=%',
        v_email, v_role, v_is_super_admin, v_updated_at;
END $$; 