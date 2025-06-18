CREATE OR REPLACE FUNCTION get_post_bookmarkers(p_post_id uuid)
RETURNS TABLE (
    user_id uuid,
    full_name text,
    avatar_url text,
    created_at timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        b.user_id,
        p.full_name,
        p.avatar_url,
        b.created_at
    FROM
        bookmarks b
    JOIN
        profiles p ON b.user_id = p.id
    WHERE
        b.post_id = p_post_id
    ORDER BY
        b.created_at DESC;
END;
$$ LANGUAGE plpgsql; 