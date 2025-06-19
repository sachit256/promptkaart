-- Update get_post_likers function
DROP FUNCTION IF EXISTS get_post_likers(uuid);
CREATE OR REPLACE FUNCTION get_post_likers(p_post_id uuid)
RETURNS TABLE (
    user_id uuid,
    name text,
    avatar text,
    created_at timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        l.user_id,
        COALESCE(pr.username, u.raw_user_meta_data->>'full_name', 'Anonymous') as name,
        COALESCE(pr.avatar_url, u.raw_user_meta_data->>'avatar_url', 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg') as avatar,
        l.created_at
    FROM
        likes l
    LEFT JOIN
        profiles pr ON l.user_id = pr.id
    LEFT JOIN
        auth.users u ON l.user_id = u.id
    WHERE
        l.post_id = p_post_id
    ORDER BY
        l.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update get_post_bookmarkers function
DROP FUNCTION IF EXISTS get_post_bookmarkers(uuid);
CREATE OR REPLACE FUNCTION get_post_bookmarkers(p_post_id uuid)
RETURNS TABLE (
    user_id uuid,
    name text,
    avatar text,
    created_at timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        b.user_id,
        COALESCE(pr.username, u.raw_user_meta_data->>'full_name', 'Anonymous') as name,
        COALESCE(pr.avatar_url, u.raw_user_meta_data->>'avatar_url', 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg') as avatar,
        b.created_at
    FROM
        bookmarks b
    LEFT JOIN
        profiles pr ON b.user_id = pr.id
    LEFT JOIN
        auth.users u ON b.user_id = u.id
    WHERE
        b.post_id = p_post_id
    ORDER BY
        b.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update get_post_comments function
DROP FUNCTION IF EXISTS get_post_comments(uuid);
CREATE OR REPLACE FUNCTION get_post_comments(p_post_id uuid)
RETURNS TABLE (
    id uuid,
    content text,
    created_at timestamptz,
    user_id uuid,
    full_name text,
    avatar_url text,
    parent_id uuid,
    replies_count integer,
    likes_count integer,
    path ltree
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE comments_with_path AS (
        SELECT
            c.id,
            c.content,
            c.created_at,
            c.user_id,
            COALESCE(p.username, u.raw_user_meta_data->>'full_name', 'Anonymous') as full_name,
            COALESCE(p.avatar_url, u.raw_user_meta_data->>'avatar_url', 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg') as avatar_url,
            c.parent_id,
            c.replies_count,
            c.likes_count,
            CAST(c.id::text AS ltree) AS path
        FROM
            comments c
        LEFT JOIN
            profiles p ON c.user_id = p.id
        LEFT JOIN
            auth.users u ON c.user_id = u.id
        WHERE
            c.post_id = p_post_id AND c.parent_id IS NULL

        UNION ALL

        SELECT
            c.id,
            c.content,
            c.created_at,
            c.user_id,
            COALESCE(p.username, u.raw_user_meta_data->>'full_name', 'Anonymous') as full_name,
            COALESCE(p.avatar_url, u.raw_user_meta_data->>'avatar_url', 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg') as avatar_url,
            c.parent_id,
            c.replies_count,
            c.likes_count,
            cp.path || '.' || c.id::text
        FROM
            comments c
        JOIN
            comments_with_path cp ON c.parent_id = cp.id
        LEFT JOIN
            profiles p ON c.user_id = p.id
        LEFT JOIN
            auth.users u ON c.user_id = u.id
    )
    SELECT
        id,
        content,
        created_at,
        user_id,
        full_name,
        avatar_url,
        parent_id,
        replies_count,
        likes_count,
        path
    FROM
        comments_with_path
    ORDER BY
        path;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 