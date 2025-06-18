/*
  # Fix comment count trigger

  1. Updates
    - Ensure the comment count trigger is working properly
    - Fix any issues with the trigger function
    - Recalculate existing comment counts

  2. Data Integrity
    - Update all existing posts with correct comment counts
    - Ensure triggers fire correctly for future comments
*/

-- First, let's recalculate all comment counts for existing posts
UPDATE posts 
SET comments_count = (
  SELECT COUNT(*) 
  FROM comments 
  WHERE comments.post_id = posts.id
);

-- Ensure the trigger function exists and works correctly
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts 
    SET comments_count = comments_count + 1,
        updated_at = now()
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts 
    SET comments_count = GREATEST(comments_count - 1, 0),
        updated_at = now()
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate the trigger to ensure it's working
DROP TRIGGER IF EXISTS trigger_update_post_comments_count ON comments;
CREATE TRIGGER trigger_update_post_comments_count
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comments_count();

-- Verify the trigger is working by checking if it exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'trigger_update_post_comments_count'
  ) THEN
    RAISE EXCEPTION 'Comment count trigger was not created successfully';
  END IF;
END $$;