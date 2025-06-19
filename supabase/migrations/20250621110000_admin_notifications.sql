-- Drop old objects to avoid conflicts
DROP TRIGGER IF EXISTS on_new_like ON likes;
DROP TRIGGER IF EXISTS on_new_comment ON comments;
DROP FUNCTION IF EXISTS handle_new_like();
DROP FUNCTION IF EXISTS handle_new_comment();
DROP FUNCTION IF EXISTS get_notifications(uuid);
DROP TABLE IF EXISTS notifications;
DROP TYPE IF EXISTS notification_type;

-- Create a new, simpler enum for notification types
CREATE TYPE admin_notification_type AS ENUM ('announcement', 'update', 'promo');

-- Create the new notifications table for admin broadcasts
CREATE TABLE notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    type admin_notification_type NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    is_read boolean DEFAULT false, -- This can be managed client-side if needed
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies for notifications
-- Allow read access to all authenticated users
CREATE POLICY "Authenticated users can view notifications" ON notifications
  FOR SELECT TO authenticated USING (true);


-- Function to get all notifications
CREATE OR REPLACE FUNCTION get_notifications()
RETURNS TABLE (
    id uuid,
    type text,
    title text,
    message text,
    created_at timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        n.id,
        n.type::text,
        n.title,
        n.message,
        n.created_at
    FROM
        notifications n
    ORDER BY
        n.created_at DESC;
END;
$$ LANGUAGE plpgsql; 