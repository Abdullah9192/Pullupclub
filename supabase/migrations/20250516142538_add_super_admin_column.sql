/*
  # Add Super Admin Column
  
  1. Changes
    - Add is_super_admin column to user_profiles
    - Set proper permissions
    - Add index for performance
*/

-- First check if the column exists
DO $$ 
BEGIN
    -- Add the column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'is_super_admin'
    ) THEN
        -- Add the column
        ALTER TABLE user_profiles 
        ADD COLUMN is_super_admin boolean NOT NULL DEFAULT false;

        -- Create index for faster lookups
        CREATE INDEX idx_user_profiles_super_admin 
        ON user_profiles(is_super_admin) 
        WHERE is_super_admin = true;

        -- Grant necessary permissions
        ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

        -- Create policy for super admin access
        CREATE POLICY "Super admins can manage all profiles"
            ON user_profiles
            FOR ALL
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM user_profiles
                    WHERE user_id = auth.uid()
                    AND is_super_admin = true
                    AND deleted_at IS NULL
                )
            );

        -- Create policy for users to view their own profile
        CREATE POLICY "Users can view their own profile"
            ON user_profiles
            FOR SELECT
            TO authenticated
            USING (user_id = auth.uid());
    END IF;
END $$;

-- Update your user to be a super admin
UPDATE user_profiles 
SET is_super_admin = true,
    role = 'admin',
    updated_at = now()
WHERE user_id = 'a01bec8d-c476-44ae-9f64-df27b39e10bb';

-- Verify the update
SELECT 
    u.email,
    up.role,
    up.is_super_admin,
    up.updated_at
FROM auth.users u
JOIN user_profiles up ON up.user_id = u.id
WHERE u.id = 'a01bec8d-c476-44ae-9f64-df27b39e10bb'; 