DROP FUNCTION IF EXISTS get_all_posts(uuid);
DROP FUNCTION IF EXISTS get_post_details(uuid, uuid);

-- Update the get_all_posts function with robust author fallbacks
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
            'name', COALESCE(
                pr.username,
                u.raw_user_meta_data->>'full_name',
                'Anonymous'
            ),
            'avatar', COALESCE(
                pr.avatar_url,
                u.raw_user_meta_data->>'avatar_url',
                'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg'
            )
        ) as author
    FROM
        posts p
    LEFT JOIN
        profiles pr ON p.user_id = pr.id
    LEFT JOIN
        auth.users u ON p.user_id = u.id
    ORDER BY
        p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the get_post_details function with robust author fallbacks
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
            'name', COALESCE(
                pr.username,
                u.raw_user_meta_data->>'full_name',
                'Anonymous'
            ),
            'avatar', COALESCE(
                pr.avatar_url,
                u.raw_user_meta_data->>'avatar_url',
                'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg'
            )
        ) as author
    FROM
        posts p
    LEFT JOIN
        profiles pr ON p.user_id = pr.id
    LEFT JOIN
        auth.users u ON p.user_id = u.id
    WHERE
        p.id = p_post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 