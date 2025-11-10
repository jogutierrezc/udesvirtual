-- Add support for live sessions in mooc_lessons
-- This allows lessons to be either recorded videos or live synchronous sessions

-- Add new columns to mooc_lessons
ALTER TABLE mooc_lessons
ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'video' CHECK (content_type IN ('video', 'live_session')),
ADD COLUMN IF NOT EXISTS live_platform TEXT,
ADD COLUMN IF NOT EXISTS live_url TEXT,
ADD COLUMN IF NOT EXISTS live_date DATE,
ADD COLUMN IF NOT EXISTS live_time TIME;

-- Add comment to document the feature
COMMENT ON COLUMN mooc_lessons.content_type IS 'Type of lesson content: video (recorded) or live_session (synchronous)';
COMMENT ON COLUMN mooc_lessons.live_platform IS 'Platform for live sessions: Google Meet, Teams, Zoom, etc';
COMMENT ON COLUMN mooc_lessons.live_url IS 'URL/link for the live session';
COMMENT ON COLUMN mooc_lessons.live_date IS 'Date of the live session';
COMMENT ON COLUMN mooc_lessons.live_time IS 'Time of the live session';
