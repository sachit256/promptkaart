/*
  # Add support for nested comments and reply counts

  1. Updates
    - Add function to update reply counts for parent comments
    - Create trigger to maintain reply counts
    - Update existing data to have correct reply counts

  2. Performance
    - Ensure indexes support nested comment queries
    - Optimize for comment thread loading
*/

-- Function to update reply counts for parent comments
CREATE OR REPLACE FUNCTION update_comment_replies_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.parent_id IS NOT NULL THEN
    UPDATE comments 
    SET replies_count = replies_count + 1,
        updated_at = now()
    WHERE id = NEW.parent_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' AND OLD.parent_id IS NOT NULL THEN
    UPDATE comments 
    SET replies_count = GREATEST(replies_count - 1, 0),
        updated_at = now()
    WHERE id = OLD.parent_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for reply counts
DROP TRIGGER IF EXISTS trigger_update_comment_replies_count ON comments;
CREATE TRIGGER trigger_update_comment_replies_count
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_replies_count();

-- Recalculate all reply counts for existing comments
UPDATE comments 
SET replies_count = (
  SELECT COUNT(*) 
  FROM comments AS replies 
  WHERE replies.parent_id = comments.id
);

-- Add index for better performance on nested comment queries
CREATE INDEX IF NOT EXISTS idx_comments_parent_created ON comments(parent_id, created_at DESC);

-- Verify the trigger is working
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'trigger_update_comment_replies_count'
  ) THEN
    RAISE EXCEPTION 'Reply count trigger was not created successfully';
  END IF;
END $$;