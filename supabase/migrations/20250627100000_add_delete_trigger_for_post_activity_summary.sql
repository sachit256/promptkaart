/*
  # Add INSTEAD OF DELETE trigger for post_activity_summary view

  This migration adds an INSTEAD OF DELETE trigger to the post_activity_summary view
  to enable deletion operations. When a row is deleted from the view, it will delete
  the corresponding post from the posts table, which will cascade to delete all
  related activity records (likes, comments, bookmarks) due to foreign key constraints.
*/

-- Create a function to handle deletions from post_activity_summary view
CREATE OR REPLACE FUNCTION handle_post_activity_summary_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Delete the post, which will cascade to delete all related activity
    DELETE FROM posts WHERE id = OLD.post_id;
    
    -- Return OLD to indicate the row was processed
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the INSTEAD OF DELETE trigger
CREATE TRIGGER post_activity_summary_delete_trigger
    INSTEAD OF DELETE ON post_activity_summary
    FOR EACH ROW
    EXECUTE FUNCTION handle_post_activity_summary_delete();

-- Grant necessary permissions
GRANT DELETE ON post_activity_summary TO authenticated;

-- Add comment for documentation
COMMENT ON TRIGGER post_activity_summary_delete_trigger ON post_activity_summary IS 
'INSTEAD OF DELETE trigger that deletes the corresponding post and all related activity when a row is deleted from the post_activity_summary view'; 