/*
  # Add Test Log Function
  
  1. Changes
    - Create a function to insert test log entries
    - Allow admins to manually log access attempts
    - Add proper type casting for parameters
*/

-- Create function to insert test log entry
CREATE OR REPLACE FUNCTION insert_test_admin_log(
    p_action text,
    p_table_name text,
    p_record_id bigint
)
RETURNS void AS $$
BEGIN
    INSERT INTO admin_access_logs (
        user_id,
        email,
        action,
        table_name,
        record_id,
        access_granted,
        access_reason
    )
    VALUES (
        auth.uid(),
        auth.email(),
        p_action::text,
        p_table_name::text,
        p_record_id::bigint,
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.role = 'admin'
            AND user_profiles.deleted_at IS NULL
        ),
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM user_profiles
                WHERE user_profiles.user_id = auth.uid()
                AND user_profiles.role = 'admin'
                AND user_profiles.deleted_at IS NULL
            ) THEN 'Admin role found'
            ELSE 'No admin role found'
        END
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION insert_test_admin_log TO authenticated;

-- Create a function to test admin access
CREATE OR REPLACE FUNCTION test_admin_access()
RETURNS TABLE (
    is_admin boolean,
    reason text
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
        END as reason;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION test_admin_access TO authenticated; 