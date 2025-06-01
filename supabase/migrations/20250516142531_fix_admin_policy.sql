/*
  # Fix Admin Access Policy

  1. Changes
    - Remove old email-based admin policy
    - Ensure only role-based admin policy exists
    - Add debug logging for admin access
*/

-- Drop the old email-based admin policy if it exists
DROP POLICY IF EXISTS "Admins can view all submissions" ON submissions;

-- Recreate the role-based admin policy
CREATE POLICY "Admins can view all submissions"
    ON submissions
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.role = 'admin'
            AND user_profiles.deleted_at IS NULL
        )
    );

-- Add debug logging function
CREATE OR REPLACE FUNCTION log_admin_access()
RETURNS TRIGGER AS $$
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
        TG_OP,
        TG_TABLE_NAME,
        NEW.id,
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
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create admin access logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_access_logs (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid REFERENCES auth.users(id),
    email text,
    action text,
    table_name text,
    record_id bigint,
    access_granted boolean,
    access_reason text,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on admin_access_logs
ALTER TABLE admin_access_logs ENABLE ROW LEVEL SECURITY;

-- Only allow admins to view logs
CREATE POLICY "Admins can view access logs"
    ON admin_access_logs
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.role = 'admin'
            AND user_profiles.deleted_at IS NULL
        )
    );

-- Create trigger for submissions table
DROP TRIGGER IF EXISTS log_submissions_access ON submissions;
CREATE TRIGGER log_submissions_access
    BEFORE SELECT OR INSERT OR UPDATE OR DELETE
    ON submissions
    FOR EACH ROW
    EXECUTE FUNCTION log_admin_access(); 