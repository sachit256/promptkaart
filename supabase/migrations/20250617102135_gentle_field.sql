/*
  # Fix Profile Counts Migration

  1. Functions
    - Recalculate all profile counts based on actual data
    - Update profile posts count when posts are created/deleted
    - Update profile likes received count when posts are liked/unliked

  2. Triggers
    - Posts count trigger for profile updates
    - Likes received count trigger for profile updates

  3. Data Integrity
    - Fix existing profile counts
    - Maintain accurate counts going forward
*/

-- Function to recalculate all profile counts
CREATE OR REPLACE FUNCTION recalculate_profile_counts()
RETURNS void AS $$
DECLARE
  profile_record RECORD;
  posts_count_val INTEGER;
  likes_received_val INTEGER;
BEGIN
  -- Loop through all profiles
  FOR profile_record IN SELECT id FROM profiles LOOP
    -- Calculate posts count
    SELECT COUNT(*) INTO posts_count_val
    FROM posts 
    WHERE user_id = profile_record.id;
    
    -- Calculate likes received count (likes on user's posts)
    SELECT COUNT(*) INTO likes_received_val
    FROM likes l
    INNER JOIN posts p ON l.post_id = p.id
    WHERE p.user_id = profile_record.id;
    
    -- Update the profile with correct counts
    UPDATE profiles 
    SET 
      posts_count = posts_count_val,
      likes_received_count = likes_received_val,
      updated_at = now()
    WHERE id = profile_record.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the function to fix existing data
SELECT recalculate_profile_counts();

-- Function to handle post count updates
CREATE OR REPLACE FUNCTION update_profile_posts_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles 
    SET posts_count = posts_count + 1,
        updated_at = now()
    WHERE id = NEW.user_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles 
    SET posts_count = GREATEST(posts_count - 1, 0),
        updated_at = now()
    WHERE id = OLD.user_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to handle likes count updates for posts
CREATE OR REPLACE FUNCTION update_profile_likes_received_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.post_id IS NOT NULL THEN
    UPDATE profiles 
    SET likes_received_count = likes_received_count + 1,
        updated_at = now()
    WHERE id = (SELECT user_id FROM posts WHERE id = NEW.post_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' AND OLD.post_id IS NOT NULL THEN
    UPDATE profiles 
    SET likes_received_count = GREATEST(likes_received_count - 1, 0),
        updated_at = now()
    WHERE id = (SELECT user_id FROM posts WHERE id = OLD.post_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers to avoid conflicts
DROP TRIGGER IF EXISTS trigger_update_profile_posts_count ON posts;
DROP TRIGGER IF EXISTS trigger_update_profile_likes_received_count ON likes;

-- Create trigger for posts count
CREATE TRIGGER trigger_update_profile_posts_count
  AFTER INSERT OR DELETE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_posts_count();

-- Create trigger for likes received count (only for post likes)
CREATE TRIGGER trigger_update_profile_likes_received_count
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_likes_received_count();