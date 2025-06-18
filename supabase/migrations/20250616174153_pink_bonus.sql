/*
  # Remove title and description requirements from posts

  1. Updates
    - Make title and description optional in posts table
    - Update constraints to allow auto-generated titles
    - Ensure prompt remains required

  2. Data Migration
    - Update existing posts to use prompt as title/description if needed
    - Maintain data integrity
*/

-- Remove NOT NULL constraints from title and description
ALTER TABLE posts ALTER COLUMN title DROP NOT NULL;
ALTER TABLE posts ALTER COLUMN description DROP NOT NULL;

-- Update check constraints to allow empty title and description
DO $$
BEGIN
  -- Drop existing constraints
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'posts_title_not_empty'
  ) THEN
    ALTER TABLE posts DROP CONSTRAINT posts_title_not_empty;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'posts_description_not_empty'
  ) THEN
    ALTER TABLE posts DROP CONSTRAINT posts_description_not_empty;
  END IF;
END $$;

-- Set default values for title and description
ALTER TABLE posts ALTER COLUMN title SET DEFAULT '';
ALTER TABLE posts ALTER COLUMN description SET DEFAULT '';

-- Update existing posts where title or description might be problematic
UPDATE posts 
SET 
  title = CASE 
    WHEN title IS NULL OR trim(title) = '' THEN 
      substring(prompt, 1, 50) || CASE WHEN length(prompt) > 50 THEN '...' ELSE '' END
    ELSE title 
  END,
  description = CASE 
    WHEN description IS NULL OR trim(description) = '' THEN prompt
    ELSE description 
  END
WHERE 
  (title IS NULL OR trim(title) = '') OR
  (description IS NULL OR trim(description) = '');

-- Ensure prompt constraint remains strong
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'posts_prompt_not_empty'
  ) THEN
    ALTER TABLE posts ADD CONSTRAINT posts_prompt_not_empty 
    CHECK (char_length(trim(prompt)) > 0);
  END IF;
END $$;