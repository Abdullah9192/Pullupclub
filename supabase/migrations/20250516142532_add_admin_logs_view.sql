/*
  # Create Admin Logs View
  
  1. Changes
    - Create a view for easy access to admin logs
    - Include user email and access details
    - Format timestamps for readability
*/

-- First check if the base table exists
DO $$ 
BEGIN
    -- Create the base table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'admin_access_logs') THEN
        CREATE TABLE admin_access_logs (
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
    END IF;
END $$;

-- Create or replace the view
CREATE OR REPLACE VIEW admin_access_logs_view AS
SELECT 
    id,
    user_id,
    email,
    action,
    table_name,
    record_id,
    access_granted,
    access_reason,
    to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') as access_time
FROM admin_access_logs
ORDER BY created_at DESC;

-- Grant access to the view for authenticated users
GRANT SELECT ON admin_access_logs_view TO authenticated;

-- Create a policy to allow admins to view the logs
CREATE POLICY "Admins can view access logs view"
    ON admin_access_logs_view
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