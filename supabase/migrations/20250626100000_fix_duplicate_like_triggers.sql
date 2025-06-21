-- Fix duplicate like triggers that are causing double-counting

-- Step 1: Drop all existing conflicting triggers and functions
DROP TRIGGER IF EXISTS trigger_update_post_likes_count ON public.likes;
DROP FUNCTION IF EXISTS public.update_post_likes_count();

-- Step 2: Create a single, clean function to update post likes count
CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.post_id IS NOT NULL THEN
    -- Increment likes count
    UPDATE public.posts 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' AND OLD.post_id IS NOT NULL THEN
    -- Decrement likes count (with minimum of 0)
    UPDATE public.posts 
    SET likes_count = GREATEST(likes_count - 1, 0) 
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create a single trigger to handle likes count updates
CREATE TRIGGER trigger_update_post_likes_count
  AFTER INSERT OR DELETE ON public.likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_post_likes_count();

-- Step 4: Recalculate all post likes counts to fix any inconsistencies
UPDATE public.posts 
SET likes_count = (
  SELECT COUNT(*) 
  FROM public.likes 
  WHERE likes.post_id = posts.id 
  AND likes.post_id IS NOT NULL
); 