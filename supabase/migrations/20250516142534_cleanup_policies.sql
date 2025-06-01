/*
  # Cleanup and Consolidate Policies
  
  1. Changes
    - Drop all existing policies on submissions table
    - Recreate policies with proper role-based access
    - Add debug logging for policy evaluation
*/

-- Drop all existing policies on submissions
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view their own submissions" ON submissions;
    DROP POLICY IF EXISTS "Users can insert their own submissions" ON submissions;
    DROP POLICY IF EXISTS "Admins can view all submissions" ON submissions;
EXCEPTION
    WHEN undefined_object THEN
        NULL;
END $$;

-- Create debug function to log policy evaluation
CREATE OR REPLACE FUNCTION log_policy_evaluation(
    p_table_name text,
    p_operation text,
    p_user_id uuid,
    p_is_admin boolean,
    p_reason text
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
        p_user_id,
        auth.email(),
        p_operation,
        p_table_name,
        NULL,
        p_is_admin,
        p_reason
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create policy evaluation function
CREATE OR REPLACE FUNCTION evaluate_admin_access()
RETURNS boolean AS $$
DECLARE
    is_admin boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.user_id = auth.uid()
        AND user_profiles.role = 'admin'
        AND user_profiles.deleted_at IS NULL
    ) INTO is_admin;
    
    -- Log the evaluation
    PERFORM log_policy_evaluation(
        'submissions',
        'SELECT',
        auth.uid(),
        is_admin,
        CASE 
            WHEN is_admin THEN 'Admin role found'
            ELSE 'No admin role found'
        END
    );
    
    RETURN is_admin;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate policies with proper role-based access
CREATE POLICY "Users can view their own submissions"
    ON submissions
    FOR SELECT
    TO authenticated
    USING (
        (user_id = auth.uid() AND deleted_at IS NULL)
        OR evaluate_admin_access()
    );

CREATE POLICY "Users can insert their own submissions"
    ON submissions
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all submissions"
    ON submissions
    FOR ALL
    TO authenticated
    USING (evaluate_admin_access());

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION log_policy_evaluation TO authenticated;
GRANT EXECUTE ON FUNCTION evaluate_admin_access TO authenticated; 