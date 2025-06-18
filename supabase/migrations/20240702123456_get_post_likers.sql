CREATE OR REPLACE FUNCTION get_post_likers(p_post_id uuid)
RETURNS TABLE (
    user_id uuid,
    full_name text,
    avatar_url text,
    created_at timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        l.user_id,
        p.full_name,
        p.avatar_url,
        l.created_at
    FROM
        likes l
    JOIN
        profiles p ON l.user_id = p.id
    WHERE
        l.post_id = p_post_id
    ORDER BY
        l.created_at DESC;
END;
$$ LANGUAGE plpgsql; 