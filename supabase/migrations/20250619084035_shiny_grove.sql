/*
  # Fix Username Display Issue

  1. Updates
    - Ensure all database functions properly handle username display
    - Add better fallback logic for missing profiles
    - Fix any data inconsistencies

  2. Data Integrity
    - Update any posts that might have missing profile references
    - Ensure all users have proper profiles
*/

-- First, let's ensure all users have profiles
INSERT INTO profiles (id, username, avatar_url, bio, created_at, updated_at)
SELECT 
    au.id,
    COALESCE(au.raw_user_meta_data->>'username', '@' || split_part(au.email, '@', 1)) as username,
    COALESCE(au.raw_user_meta_data->>'avatar_url', 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg') as avatar_url,
    NULL as bio,
    au.created_at,
    au.updated_at
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- Update the get_all_posts function with better username handling
CREATE OR REPLACE FUNCTION get_all_posts(p_user_id uuid DEFAULT NULL)
RETURNS TABLE (
    id uuid,
    prompt text,
    ai_source ai_source_type,
    images text[],
    category text,
    tags text[],
    likes integer,
    comments integer,
    shares integer,
    created_at timestamptz,
    is_liked boolean,
    is_bookmarked boolean,
    author jsonb
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.prompt,
        p.ai_source,
        p.images,
        p.category,
        p.tags,
        COALESCE(p.likes_count, 0) as likes,
        COALESCE(p.comments_count, 0) as comments,
        COALESCE(p.shares_count, 0) as shares,
        p.created_at,
        CASE 
            WHEN p_user_id IS NOT NULL THEN EXISTS(
                SELECT 1 FROM likes l 
                WHERE l.post_id = p.id AND l.user_id = p_user_id
            )
            ELSE false
        END as is_liked,
        CASE 
            WHEN p_user_id IS NOT NULL THEN EXISTS(
                SELECT 1 FROM bookmarks b 
                WHERE b.post_id = p.id AND b.user_id = p_user_id
            )
            ELSE false
        END as is_bookmarked,
        jsonb_build_object(
            'id', p.user_id,
            'name', COALESCE(pr.username, au.email, 'Unknown User'),
            'avatar', COALESCE(pr.avatar_url, 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg')
        ) as author
    FROM
        posts p
    LEFT JOIN
        profiles pr ON p.user_id = pr.id
    LEFT JOIN
        auth.users au ON p.user_id = au.id
    ORDER BY
        p.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Update the get_bookmarked_posts function
CREATE OR REPLACE FUNCTION get_bookmarked_posts(p_user_id uuid)
RETURNS TABLE (
    id uuid,
    prompt text,
    ai_source ai_source_type,
    images text[],
    category text,
    tags text[],
    likes integer,
    comments integer,
    shares integer,
    created_at timestamptz,
    is_liked boolean,
    is_bookmarked boolean,
    author jsonb
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.prompt,
        p.ai_source,
        p.images,
        p.category,
        p.tags,
        COALESCE(p.likes_count, 0) as likes,
        COALESCE(p.comments_count, 0) as comments,
        COALESCE(p.shares_count, 0) as shares,
        p.created_at,
        EXISTS(
            SELECT 1 FROM likes l 
            WHERE l.post_id = p.id AND l.user_id = p_user_id
        ) as is_liked,
        true as is_bookmarked,
        jsonb_build_object(
            'id', p.user_id,
            'name', COALESCE(pr.username, au.email, 'Unknown User'),
            'avatar', COALESCE(pr.avatar_url, 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg')
        ) as author
    FROM
        posts p
    INNER JOIN
        bookmarks b ON p.id = b.post_id
    LEFT JOIN
        profiles pr ON p.user_id = pr.id
    LEFT JOIN
        auth.users au ON p.user_id = au.id
    WHERE
        b.user_id = p_user_id
    ORDER BY
        b.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Update the get_post_details function
CREATE OR REPLACE FUNCTION get_post_details(p_post_id uuid, p_user_id uuid DEFAULT NULL)
RETURNS TABLE (
    id uuid,
    prompt text,
    ai_source ai_source_type,
    images text[],
    category text,
    tags text[],
    likes integer,
    comments integer,
    shares integer,
    created_at timestamptz,
    is_liked boolean,
    is_bookmarked boolean,
    author jsonb
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.prompt,
        p.ai_source,
        p.images,
        p.category,
        p.tags,
        COALESCE(p.likes_count, 0) as likes,
        COALESCE(p.comments_count, 0) as comments,
        COALESCE(p.shares_count, 0) as shares,
        p.created_at,
        CASE 
            WHEN p_user_id IS NOT NULL THEN EXISTS(
                SELECT 1 FROM likes l 
                WHERE l.post_id = p.id AND l.user_id = p_user_id
            )
            ELSE false
        END as is_liked,
        CASE 
            WHEN p_user_id IS NOT NULL THEN EXISTS(
                SELECT 1 FROM bookmarks b 
                WHERE b.post_id = p.id AND b.user_id = p_user_id
            )
            ELSE false
        END as is_bookmarked,
        jsonb_build_object(
            'id', p.user_id,
            'name', COALESCE(pr.username, au.email, 'Unknown User'),
            'avatar', COALESCE(pr.avatar_url, 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg')
        ) as author
    FROM
        posts p
    LEFT JOIN
        profiles pr ON p.user_id = pr.id
    LEFT JOIN
        auth.users au ON p.user_id = au.id
    WHERE
        p.id = p_post_id;
END;
$$ LANGUAGE plpgsql;

-- Update the get_comments_for_post function
CREATE OR REPLACE FUNCTION get_comments_for_post(p_post_id uuid, p_user_id uuid DEFAULT NULL)
RETURNS TABLE (
    id uuid,
    content text,
    created_at timestamptz,
    parent_id uuid,
    likes_count integer,
    is_liked boolean,
    author jsonb
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        c.content,
        c.created_at,
        c.parent_id,
        COALESCE(c.likes_count, 0) as likes_count,
        CASE 
            WHEN p_user_id IS NOT NULL THEN EXISTS(
                SELECT 1 FROM likes l 
                WHERE l.comment_id = c.id AND l.user_id = p_user_id
            )
            ELSE false
        END as is_liked,
        jsonb_build_object(
            'id', c.user_id,
            'name', COALESCE(pr.username, au.email, 'Unknown User'),
            'avatar', COALESCE(pr.avatar_url, 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg')
        ) as author
    FROM
        comments c
    LEFT JOIN
        profiles pr ON c.user_id = pr.id
    LEFT JOIN
        auth.users au ON c.user_id = au.id
    WHERE
        c.post_id = p_post_id
    ORDER BY
        c.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_all_posts(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_bookmarked_posts(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_post_details(uuid, uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_comments_for_post(uuid, uuid) TO authenticated, anon;