-- Use existing user_progress table and add quiz_score column
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS quiz_score INTEGER;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

COMMENT ON COLUMN user_progress.quiz_score IS 'Percentage score if lesson is a quiz';
COMMENT ON COLUMN user_progress.completed_at IS 'Timestamp when lesson was marked complete';
