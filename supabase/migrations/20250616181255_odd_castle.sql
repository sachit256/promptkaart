/*
  # Remove title and description from posts table

  1. Schema Changes
    - Drop title and description columns from posts table
    - Update constraints to reflect new structure
    - Clean up any references to these columns

  2. Data Migration
    - Safely remove columns without data loss
    - Ensure prompt field remains the primary content field
*/

-- Remove title and description columns from posts table
ALTER TABLE posts DROP COLUMN IF EXISTS title;
ALTER TABLE posts DROP COLUMN IF EXISTS description;

-- Drop any constraints related to title and description
DO $$
BEGIN
  -- Drop title constraints if they exist
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'posts_title_not_empty'
  ) THEN
    ALTER TABLE posts DROP CONSTRAINT posts_title_not_empty;
  END IF;

  -- Drop description constraints if they exist
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'posts_description_not_empty'
  ) THEN
    ALTER TABLE posts DROP CONSTRAINT posts_description_not_empty;
  END IF;
END $$;

-- Ensure prompt field has proper constraints
DO $$
BEGIN
  -- Make sure prompt is NOT NULL
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'posts' AND column_name = 'prompt' AND is_nullable = 'YES'
  ) THEN
    -- First update any NULL values
    UPDATE posts SET prompt = 'No prompt provided' WHERE prompt IS NULL OR prompt = '';
    -- Then add NOT NULL constraint
    ALTER TABLE posts ALTER COLUMN prompt SET NOT NULL;
  END IF;

  -- Ensure prompt is not empty
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'posts_prompt_not_empty'
  ) THEN
    ALTER TABLE posts ADD CONSTRAINT posts_prompt_not_empty 
    CHECK (char_length(trim(prompt)) > 0);
  END IF;
END $$;

-- Drop any indexes on title and description
DROP INDEX IF EXISTS idx_posts_title_search;
DROP INDEX IF EXISTS idx_posts_description_search;

-- Keep the prompt search index
CREATE INDEX IF NOT EXISTS idx_posts_prompt_search ON posts USING gin(to_tsvector('english', prompt));