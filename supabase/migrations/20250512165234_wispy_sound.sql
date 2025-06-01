/*
  # Create Submissions Table

  1. New Table
    - `submissions`: Stores user video submissions
      - Links to Supabase auth.users
      - Tracks submission status and review process
      - Implements soft delete

  2. Security
    - Enables Row Level Security (RLS)
    - Users can view their own submissions
    - Admins can view and update all submissions
*/

-- Drop existing policies if they exist
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view their own submissions" ON submissions;
    DROP POLICY IF EXISTS "Users can insert their own submissions" ON submissions;
    DROP POLICY IF EXISTS "Admins can view all submissions" ON submissions;
EXCEPTION
    WHEN undefined_table THEN
        NULL;
END $$;

CREATE TABLE IF NOT EXISTS submissions (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    pull_up_count integer NOT NULL,
    video_url text NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    reviewer_notes text,
    actual_pull_up_count integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone DEFAULT null
);

ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Users can view their own submissions
CREATE POLICY "Users can view their own submissions"
    ON submissions
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() AND deleted_at IS NULL);

-- Users can insert their own submissions
CREATE POLICY "Users can insert their own submissions"
    ON submissions
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Admins can view all submissions
CREATE POLICY "Admins can view all submissions"
    ON submissions
    FOR ALL
    TO authenticated
    USING (auth.email() = 'support@thebattlebunker.com');