/*
  # Post Activity System Migration

  1. Functions
    - Enhanced trigger functions for accurate count tracking
    - Functions to get detailed post activity data

  2. Indexes
    - Optimized indexes for activity queries
    - Performance improvements for user activity tracking

  3. Views
    - Create views for common activity queries
    - Simplify complex activity data retrieval
*/

-- Create indexes for better activity query performance
CREATE INDEX IF NOT EXISTS idx_likes_post_user_created ON likes(post_id, user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post_user_created ON comments(post_id, user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookmarks_post_user_created ON bookmarks(post_id, user_id, created_at DESC);

-- Create a view for post activity summary
CREATE OR REPLACE VIEW post_activity_summary AS
SELECT 
  p.id as post_id,
  p.user_id as post_owner_id,
  p.prompt,
  p.category,
  p.created_at as post_created_at,
  COALESCE(p.likes_count, 0) as likes_count,
  COALESCE(p.comments_count, 0) as comments_count,
  COALESCE(p.shares_count, 0) as shares_count,
  COALESCE(bookmark_counts.count, 0) as bookmarks_count
FROM posts p
LEFT JOIN (
  SELECT post_id, COUNT(*) as count
  FROM bookmarks
  GROUP BY post_id
) bookmark_counts ON p.id = bookmark_counts.post_id;

-- Create a view for user activity summary
CREATE OR REPLACE VIEW user_activity_summary AS
SELECT 
  u.id as user_id,
  COALESCE(posts_created.count, 0) as posts_created,
  COALESCE(likes_given.count, 0) as likes_given,
  COALESCE(comments_given.count, 0) as comments_given,
  COALESCE(bookmarks_given.count, 0) as bookmarks_given,
  COALESCE(likes_received.count, 0) as likes_received,
  COALESCE(comments_received.count, 0) as comments_received,
  COALESCE(bookmarks_received.count, 0) as bookmarks_received
FROM profiles u
LEFT JOIN (
  SELECT user_id, COUNT(*) as count
  FROM posts
  GROUP BY user_id
) posts_created ON u.id = posts_created.user_id
LEFT JOIN (
  SELECT user_id, COUNT(*) as count
  FROM likes
  WHERE post_id IS NOT NULL
  GROUP BY user_id
) likes_given ON u.id = likes_given.user_id
LEFT JOIN (
  SELECT user_id, COUNT(*) as count
  FROM comments
  GROUP BY user_id
) comments_given ON u.id = comments_given.user_id
LEFT JOIN (
  SELECT user_id, COUNT(*) as count
  FROM bookmarks
  GROUP BY user_id
) bookmarks_given ON u.id = bookmarks_given.user_id
LEFT JOIN (
  SELECT p.user_id, COUNT(l.id) as count
  FROM posts p
  LEFT JOIN likes l ON p.id = l.post_id
  GROUP BY p.user_id
) likes_received ON u.id = likes_received.user_id
LEFT JOIN (
  SELECT p.user_id, COUNT(c.id) as count
  FROM posts p
  LEFT JOIN comments c ON p.id = c.post_id
  GROUP BY p.user_id
) comments_received ON u.id = comments_received.user_id
LEFT JOIN (
  SELECT p.user_id, COUNT(b.id) as count
  FROM posts p
  LEFT JOIN bookmarks b ON p.id = b.post_id
  GROUP BY p.user_id
) bookmarks_received ON u.id = bookmarks_received.user_id;

-- Function to get detailed post activity
CREATE OR REPLACE FUNCTION get_post_activity_details(target_post_id uuid)
RETURNS TABLE (
  activity_type text,
  user_id uuid,
  username text,
  avatar_url text,
  content text,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  -- Likes
  SELECT 
    'like'::text as activity_type,
    l.user_id,
    pr.username,
    pr.avatar_url,
    NULL::text as content,
    l.created_at
  FROM likes l
  JOIN profiles pr ON l.user_id = pr.id
  WHERE l.post_id = target_post_id
  
  UNION ALL
  
  -- Comments
  SELECT 
    'comment'::text as activity_type,
    c.user_id,
    pr.username,
    pr.avatar_url,
    c.content,
    c.created_at
  FROM comments c
  JOIN profiles pr ON c.user_id = pr.id
  WHERE c.post_id = target_post_id
  
  UNION ALL
  
  -- Bookmarks
  SELECT 
    'bookmark'::text as activity_type,
    b.user_id,
    pr.username,
    pr.avatar_url,
    NULL::text as content,
    b.created_at
  FROM bookmarks b
  JOIN profiles pr ON b.user_id = pr.id
  WHERE b.post_id = target_post_id
  
  ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's own activity
CREATE OR REPLACE FUNCTION get_user_own_activity(target_user_id uuid)
RETURNS TABLE (
  activity_type text,
  target_post_id uuid,
  target_post_prompt text,
  target_post_author text,
  content text,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  -- User's likes
  SELECT 
    'like'::text as activity_type,
    l.post_id as target_post_id,
    p.prompt as target_post_prompt,
    pr.username as target_post_author,
    NULL::text as content,
    l.created_at
  FROM likes l
  JOIN posts p ON l.post_id = p.id
  JOIN profiles pr ON p.user_id = pr.id
  WHERE l.user_id = target_user_id
  
  UNION ALL
  
  -- User's comments
  SELECT 
    'comment'::text as activity_type,
    c.post_id as target_post_id,
    p.prompt as target_post_prompt,
    pr.username as target_post_author,
    c.content,
    c.created_at
  FROM comments c
  JOIN posts p ON c.post_id = p.id
  JOIN profiles pr ON p.user_id = pr.id
  WHERE c.user_id = target_user_id
  
  UNION ALL
  
  -- User's bookmarks
  SELECT 
    'bookmark'::text as activity_type,
    b.post_id as target_post_id,
    p.prompt as target_post_prompt,
    pr.username as target_post_author,
    NULL::text as content,
    b.created_at
  FROM bookmarks b
  JOIN posts p ON b.post_id = p.id
  JOIN profiles pr ON p.user_id = pr.id
  WHERE b.user_id = target_user_id
  
  ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT SELECT ON post_activity_summary TO authenticated, anon;
GRANT SELECT ON user_activity_summary TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_post_activity_details(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_own_activity(uuid) TO authenticated;