-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_bookmarked_posts(uuid);

-- Create the get_bookmarked_posts function
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
        true as is_bookmarked, -- Always true since we're only returning bookmarked posts
        jsonb_build_object(
            'id', COALESCE(pr.id, p.user_id),
            'name', COALESCE(pr.username, 'Deleted User'),
            'avatar', COALESCE(pr.avatar_url, 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg')
        ) as author
    FROM
        posts p
    INNER JOIN
        bookmarks b ON p.id = b.post_id
    LEFT JOIN
        profiles pr ON p.user_id = pr.id
    WHERE
        b.user_id = p_user_id
    ORDER BY
        b.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_bookmarked_posts(uuid) TO authenticated, anon;