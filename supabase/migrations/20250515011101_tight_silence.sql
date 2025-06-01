/*
  # Check and add foreign key constraint if needed
  
  1. Changes
    - Checks if the foreign key constraint already exists
    - Only adds the constraint if it doesn't exist
    - Prevents the "constraint already exists" error
*/

DO $$ 
BEGIN
  -- Check if the constraint already exists
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'submissions_user_id_fkey'
  ) THEN
    -- Add foreign key constraint from submissions to auth.users
    ALTER TABLE submissions
    ADD CONSTRAINT submissions_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id);
  END IF;
END $$;