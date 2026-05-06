-- Remove school-related tables and features
-- Created for YC application cleanup

-- Drop school-related tables in order of dependencies
DROP TABLE IF EXISTS class_prompts CASCADE;
DROP TABLE IF EXISTS class_members CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS teacher_verifications CASCADE;

-- Remove school-related columns from profiles if they exist
ALTER TABLE profiles DROP COLUMN IF EXISTS is_teacher;
ALTER TABLE profiles DROP COLUMN IF EXISTS teacher_verified;

-- Remove any school-related RLS policies if they exist
DROP POLICY IF EXISTS "Teachers can insert prompts for their classes" ON class_prompts;
DROP POLICY IF EXISTS "Class members can view prompts" ON class_prompts;
DROP POLICY IF EXISTS "Teachers can update prompts for their classes" ON class_prompts;
DROP POLICY IF EXISTS "Teachers can delete prompts for their classes" ON class_prompts;
