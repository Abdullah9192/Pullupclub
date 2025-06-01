/*
  # Add Test Functions
  
  1. Changes
    - Add function to test admin access
    - Add function to check user profile
    - Add function to manually set admin role
*/

-- Function to test admin access
CREATE OR REPLACE FUNCTION test_admin_access()
RETURNS TABLE (
    is_admin boolean,
    reason text,
    user_id uuid,
    email text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.role = 'admin'
            AND user_profiles.deleted_at IS NULL
        ) as is_admin,
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM user_profiles
                WHERE user_profiles.user_id = auth.uid()
                AND user_profiles.role = 'admin'
                AND user_profiles.deleted_at IS NULL
            ) THEN 'Admin role found'
            ELSE 'No admin role found'
        END as reason,
        auth.uid() as user_id,
        auth.email() as email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check user profile
CREATE OR REPLACE FUNCTION check_user_profile()
RETURNS TABLE (
    user_id uuid,
    email text,
    role text,
    created_at timestamptz,
    updated_at timestamptz,
    deleted_at timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.user_id,
        u.email,
        up.role,
        up.created_at,
        up.updated_at,
        up.deleted_at
    FROM user_profiles up
    JOIN auth.users u ON u.id = up.user_id
    WHERE up.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set admin role (only for superuser)
CREATE OR REPLACE FUNCTION set_admin_role(p_user_id uuid)
RETURNS void AS $$
BEGIN
    -- Only allow superuser to execute this function
    IF NOT (SELECT is_superuser FROM auth.users WHERE id = auth.uid()) THEN
        RAISE EXCEPTION 'Only superuser can set admin role';
    END IF;

    -- Update or insert admin role
    INSERT INTO user_profiles (user_id, role)
    VALUES (p_user_id, 'admin')
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        role = 'admin',
        updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION test_admin_access TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_profile TO authenticated;
GRANT EXECUTE ON FUNCTION set_admin_role TO service_role; 