/*
  # Update posts table for prompt functionality

  1. Schema Updates
    - Ensure all required columns exist with proper constraints
    - Update column constraints to match prompt requirements
    - Add indexes for better performance

  2. Data Integrity
    - Make title and description required
    - Ensure prompt field is required
    - Set proper defaults for optional fields

  3. Performance
    - Add missing indexes
    - Optimize for prompt-specific queries
*/

-- Ensure posts table has all required columns with proper constraints
DO $$
BEGIN
  -- Make title NOT NULL if it isn't already
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'posts' AND column_name = 'title' AND is_nullable = 'YES'
  ) THEN
    -- First update any NULL values
    UPDATE posts SET title = 'Untitled Prompt' WHERE title IS NULL OR title = '';
    -- Then add NOT NULL constraint
    ALTER TABLE posts ALTER COLUMN title SET NOT NULL;
  END IF;

  -- Make description NOT NULL if it isn't already
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'posts' AND column_name = 'description' AND is_nullable = 'YES'
  ) THEN
    -- First update any NULL values
    UPDATE posts SET description = 'No description provided' WHERE description IS NULL OR description = '';
    -- Then add NOT NULL constraint
    ALTER TABLE posts ALTER COLUMN description SET NOT NULL;
  END IF;

  -- Make prompt NOT NULL if it isn't already
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'posts' AND column_name = 'prompt' AND is_nullable = 'YES'
  ) THEN
    -- First update any NULL values
    UPDATE posts SET prompt = 'No prompt provided' WHERE prompt IS NULL OR prompt = '';
    -- Then add NOT NULL constraint
    ALTER TABLE posts ALTER COLUMN prompt SET NOT NULL;
  END IF;

  -- Make ai_source NOT NULL if it isn't already
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'posts' AND column_name = 'ai_source' AND is_nullable = 'YES'
  ) THEN
    -- First update any NULL values
    UPDATE posts SET ai_source = 'chatgpt' WHERE ai_source IS NULL;
    -- Then add NOT NULL constraint
    ALTER TABLE posts ALTER COLUMN ai_source SET NOT NULL;
  END IF;

  -- Ensure category has a default
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'posts' AND column_name = 'category' AND column_default IS NOT NULL
  ) THEN
    ALTER TABLE posts ALTER COLUMN category SET DEFAULT 'Art & Design';
    UPDATE posts SET category = 'Art & Design' WHERE category IS NULL OR category = '';
  END IF;
END $$;

-- Add additional indexes for prompt-specific queries
CREATE INDEX IF NOT EXISTS idx_posts_ai_source ON posts(ai_source);
CREATE INDEX IF NOT EXISTS idx_posts_title_search ON posts USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_posts_description_search ON posts USING gin(to_tsvector('english', description));
CREATE INDEX IF NOT EXISTS idx_posts_prompt_search ON posts USING gin(to_tsvector('english', prompt));

-- Add check constraints for data validation
DO $$
BEGIN
  -- Ensure title is not empty
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'posts_title_not_empty'
  ) THEN
    ALTER TABLE posts ADD CONSTRAINT posts_title_not_empty 
    CHECK (char_length(trim(title)) > 0);
  END IF;

  -- Ensure description is not empty
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'posts_description_not_empty'
  ) THEN
    ALTER TABLE posts ADD CONSTRAINT posts_description_not_empty 
    CHECK (char_length(trim(description)) > 0);
  END IF;

  -- Ensure prompt is not empty
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'posts_prompt_not_empty'
  ) THEN
    ALTER TABLE posts ADD CONSTRAINT posts_prompt_not_empty 
    CHECK (char_length(trim(prompt)) > 0);
  END IF;

  -- Ensure images array is not null
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'posts_images_not_null'
  ) THEN
    ALTER TABLE posts ADD CONSTRAINT posts_images_not_null 
    CHECK (images IS NOT NULL);
  END IF;

  -- Ensure tags array is not null
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'posts_tags_not_null'
  ) THEN
    ALTER TABLE posts ADD CONSTRAINT posts_tags_not_null 
    CHECK (tags IS NOT NULL);
  END IF;
END $$;

-- Update any existing posts to ensure they meet the new constraints
UPDATE posts 
SET 
  title = CASE 
    WHEN title IS NULL OR trim(title) = '' THEN 'Untitled Prompt'
    ELSE title 
  END,
  description = CASE 
    WHEN description IS NULL OR trim(description) = '' THEN 'No description provided'
    ELSE description 
  END,
  prompt = CASE 
    WHEN prompt IS NULL OR trim(prompt) = '' THEN 'No prompt provided'
    ELSE prompt 
  END,
  ai_source = CASE 
    WHEN ai_source IS NULL THEN 'chatgpt'
    ELSE ai_source 
  END,
  category = CASE 
    WHEN category IS NULL OR trim(category) = '' THEN 'Art & Design'
    ELSE category 
  END,
  images = CASE 
    WHEN images IS NULL THEN '{}'::text[]
    ELSE images 
  END,
  tags = CASE 
    WHEN tags IS NULL THEN '{}'::text[]
    ELSE tags 
  END
WHERE 
  title IS NULL OR trim(title) = '' OR
  description IS NULL OR trim(description) = '' OR
  prompt IS NULL OR trim(prompt) = '' OR
  ai_source IS NULL OR
  category IS NULL OR trim(category) = '' OR
  images IS NULL OR
  tags IS NULL;