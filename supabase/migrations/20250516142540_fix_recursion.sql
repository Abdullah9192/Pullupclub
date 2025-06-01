/*
  # Fix Infinite Recursion in RLS Policy
  
  1. Changes
    - Drop existing policies
    - Create new policies without recursion
    - Add proper access controls
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;

-- Create new policies without recursion
CREATE POLICY "Users can view their own profile"
    ON user_profiles
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Create policy for service role to manage all profiles
CREATE POLICY "Service role can manage all profiles"
    ON user_profiles
    FOR ALL
    TO service_role
    USING (true);

-- Create policy for authenticated users to update their own profile
CREATE POLICY "Users can update their own profile"
    ON user_profiles
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

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

-- Verify the update
SELECT 
    u.email,
    up.role,
    up.is_super_admin,
    up.updated_at
FROM auth.users u
JOIN user_profiles up ON up.user_id = u.id
WHERE u.id = 'a01bec8d-c476-44ae-9f64-df27b39e10bb'; 