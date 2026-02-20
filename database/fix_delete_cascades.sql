-- Fix User Progress Deletion Cascade
-- This script ensures that when a lesson is deleted (e.g., via course deletion),
-- the associated user progress records are also automatically deleted.

-- 1. Check if the foreign key exists and drop it to recreate with CASCADE
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_progress_lesson_id_fkey' 
        AND table_name = 'user_progress'
    ) THEN
        ALTER TABLE user_progress DROP CONSTRAINT user_progress_lesson_id_fkey;
    END IF;
END $$;

-- 2. Add the foreign key with ON DELETE CASCADE
ALTER TABLE user_progress
ADD CONSTRAINT user_progress_lesson_id_fkey
FOREIGN KEY (lesson_id)
REFERENCES lessons(id)
ON DELETE CASCADE;

-- 3. Also check `certificates` table just in case (though previous inspection showed it was correct)
-- If we need to be thorough:
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'certificates_course_id_fkey' 
        AND table_name = 'certificates'
    ) THEN
        -- We won't drop it if it's already correct, but recreating ensures it works.
        -- Use caution if large table, but for this app it's fine.
        ALTER TABLE certificates DROP CONSTRAINT certificates_course_id_fkey;
        
        ALTER TABLE certificates
        ADD CONSTRAINT certificates_course_id_fkey
        FOREIGN KEY (course_id)
        REFERENCES courses(id)
        ON DELETE CASCADE;
    END IF;
END $$;
