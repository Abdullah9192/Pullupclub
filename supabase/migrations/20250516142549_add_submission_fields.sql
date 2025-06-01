/*
  # Add missing columns to submissions table
  
  1. Changes
    - Adds age, gender, region, club_affiliation, full_name, and email columns
    - Adds appropriate constraints if they don't exist
    - Makes region NOT NULL
*/

-- Add new columns
ALTER TABLE submissions
ADD COLUMN IF NOT EXISTS age integer,
ADD COLUMN IF NOT EXISTS gender text,
ADD COLUMN IF NOT EXISTS region text,
ADD COLUMN IF NOT EXISTS club_affiliation text,
ADD COLUMN IF NOT EXISTS full_name text,
ADD COLUMN IF NOT EXISTS email text;

-- Add constraints if they don't exist
DO $$ 
BEGIN
  -- Only add constraints if they don't already exist
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_age') THEN
    ALTER TABLE submissions ADD CONSTRAINT valid_age CHECK (age >= 16 AND age <= 100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_gender') THEN
    ALTER TABLE submissions ADD CONSTRAINT valid_gender CHECK (gender IN ('male', 'female', 'other'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_pull_up_count') THEN
    ALTER TABLE submissions ADD CONSTRAINT valid_pull_up_count CHECK (pull_up_count > 0 AND pull_up_count <= 100);
  END IF;
END $$;

-- Make region NOT NULL after adding the column
ALTER TABLE submissions
ALTER COLUMN region SET NOT NULL; 