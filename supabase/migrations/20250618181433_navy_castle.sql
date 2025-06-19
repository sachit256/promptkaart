-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_comments_for_post(uuid, uuid);

-- Create the get_comments_for_post function
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
            'id', pr.id,
            'name', pr.username,
            'avatar', COALESCE(pr.avatar_url, 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg')
        ) as author
    FROM
        comments c
    LEFT JOIN
        profiles pr ON c.user_id = pr.id
    WHERE
        c.post_id = p_post_id
    ORDER BY
        c.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_comments_for_post(uuid, uuid) TO authenticated, anon;