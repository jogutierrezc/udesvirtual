-- Add created_by column to faqs table to track author
ALTER TABLE public.faqs
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add index for faster author lookups
CREATE INDEX IF NOT EXISTS idx_faqs_created_by ON public.faqs(created_by);

-- Comment
COMMENT ON COLUMN public.faqs.created_by IS 'User ID of the FAQ author/creator';
