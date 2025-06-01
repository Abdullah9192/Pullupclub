/*
  # Fix Admin Update Policies for Submissions
  
  1. Changes
    - Drop existing policies
    - Create new policies with proper admin access
    - Ensure admins can update submissions
    - Fix status updates
*/

-- First, drop all existing policies
DROP POLICY IF EXISTS "Users can view own submissions" ON submissions;
DROP POLICY IF EXISTS "Users can insert own submissions" ON submissions;
DROP POLICY IF EXISTS "Users can update own submissions" ON submissions;
DROP POLICY IF EXISTS "Admins can view all submissions" ON submissions;
DROP POLICY IF EXISTS "Admins can manage all submissions" ON submissions;

-- Enable RLS
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Create a simple policy for users to view their own submissions
CREATE POLICY "Users can view own submissions"
    ON submissions
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() AND deleted_at IS NULL);

-- Create a policy for users to insert their own submissions
CREATE POLICY "Users can insert own submissions"
    ON submissions
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Create a policy for users to update their own submissions (only if pending)
CREATE POLICY "Users can update own pending submissions"
    ON submissions
    FOR UPDATE
    TO authenticated
    USING (
        user_id = auth.uid() 
        AND status = 'pending' 
        AND deleted_at IS NULL
    )
    WITH CHECK (user_id = auth.uid());

-- Create a policy for admins to view all submissions
CREATE POLICY "Admins can view all submissions"
    ON submissions
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND (user_profiles.role = 'admin' OR user_profiles.is_super_admin = true)
            AND user_profiles.deleted_at IS NULL
        )
    );

-- Create a policy for admins to update all submissions
CREATE POLICY "Admins can update all submissions"
    ON submissions
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND (user_profiles.role = 'admin' OR user_profiles.is_super_admin = true)
            AND user_profiles.deleted_at IS NULL
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND (user_profiles.role = 'admin' OR user_profiles.is_super_admin = true)
            AND user_profiles.deleted_at IS NULL
        )
    );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON submissions TO authenticated;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status) WHERE deleted_at IS NULL; 