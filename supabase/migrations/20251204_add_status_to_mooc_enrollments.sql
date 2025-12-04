-- Add status column to mooc_enrollments
ALTER TABLE mooc_enrollments 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

-- Add check constraint for status values
ALTER TABLE mooc_enrollments 
ADD CONSTRAINT mooc_enrollments_status_check 
CHECK (status IN ('active', 'retired', 'blocked'));

-- Update existing records to have 'active' status
UPDATE mooc_enrollments 
SET status = 'active' 
WHERE status IS NULL;
