/*
  # Add Super Admin Function
  
  1. Changes
    - Add function to set super admin status
    - Update admin access check to include super admin
*/

-- Add is_super_admin column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'is_super_admin'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN is_super_admin boolean DEFAULT false;
    END IF;
END $$;

-- Create function to set super admin status
CREATE OR REPLACE FUNCTION set_super_admin(p_user_id uuid)
RETURNS void AS $$
BEGIN
    -- Update user profile to set super admin and admin role
    UPDATE user_profiles 
    SET is_super_admin = true,
        role = 'admin',
        updated_at = now()
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_id = auth.uid()
        AND is_super_admin = true
        AND deleted_at IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update admin access check to include super admin
CREATE OR REPLACE FUNCTION evaluate_admin_access()
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_id = auth.uid()
        AND (
            role = 'admin' 
            OR is_super_admin = true
        )
        AND deleted_at IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION set_super_admin TO service_role;
GRANT EXECUTE ON FUNCTION is_super_admin TO authenticated;
GRANT EXECUTE ON FUNCTION evaluate_admin_access TO authenticated; 