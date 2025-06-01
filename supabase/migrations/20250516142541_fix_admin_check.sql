/*
  # Fix Admin Access Check
  
  1. Changes
    - Update admin access check to avoid recursion
    - Simplify the check logic
*/

-- Create or replace the admin access check function
CREATE OR REPLACE FUNCTION evaluate_admin_access()
RETURNS boolean AS $$
DECLARE
    user_role text;
    is_super boolean;
BEGIN
    -- Get user role and super admin status in a single query
    SELECT 
        role,
        is_super_admin
    INTO 
        user_role,
        is_super
    FROM user_profiles
    WHERE user_id = auth.uid()
    AND deleted_at IS NULL;
    
    -- Return true if user is admin or super admin
    RETURN user_role = 'admin' OR is_super = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION evaluate_admin_access TO authenticated;

-- Test the function
SELECT evaluate_admin_access(); 