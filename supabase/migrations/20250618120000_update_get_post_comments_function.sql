CREATE EXTENSION IF NOT EXISTS ltree;

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
            p.full_name,
            p.avatar_url,
            c.parent_id,
            c.replies_count,
            c.likes_count,
            CAST(c.id::text AS ltree) AS path
        FROM
            comments c
        LEFT JOIN
            profiles p ON c.user_id = p.id
        WHERE
            c.post_id = p_post_id AND c.parent_id IS NULL

        UNION ALL

        SELECT
            c.id,
            c.content,
            c.created_at,
            c.user_id,
            p.full_name,
            p.avatar_url,
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
$$ LANGUAGE plpgsql; 