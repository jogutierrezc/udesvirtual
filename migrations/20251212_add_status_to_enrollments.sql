-- Add status column to mooc_enrollments
ALTER TABLE public.mooc_enrollments 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Update existing records to have 'active' status
UPDATE public.mooc_enrollments 
SET status = 'active' 
WHERE status IS NULL;
