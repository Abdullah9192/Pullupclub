/*
  # Fix Verification Query
  
  1. Changes
    - Fix the verification query in DO block
    - Use PERFORM instead of SELECT
    - Keep all other permissions and policies
*/

-- Grant usage on auth schema to service role
GRANT USAGE ON SCHEMA auth TO service_role;

-- Grant select on auth.users to service role
GRANT SELECT ON auth.users TO service_role;

-- Ensure RLS is enabled on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Service role full access" ON user_profiles;

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

-- Create a policy for service role to do everything
CREATE POLICY "Service role full access"
    ON user_profiles
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

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