-- Create table for activity completions
CREATE TABLE IF NOT EXISTS public.passport_activity_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES public.passport_activities(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Ensure unique completion per user-activity
  CONSTRAINT unique_user_activity_completion UNIQUE(user_id, activity_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_passport_activity_completions_user ON public.passport_activity_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_passport_activity_completions_activity ON public.passport_activity_completions(activity_id);
CREATE INDEX IF NOT EXISTS idx_passport_activity_completions_completed_at ON public.passport_activity_completions(completed_at);

-- Enable RLS
ALTER TABLE public.passport_activity_completions ENABLE ROW LEVEL SECURITY;

-- Policies
-- Users can view their own completions
CREATE POLICY passport_activity_completions_read_own
  ON public.passport_activity_completions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can insert/update their own completions
CREATE POLICY passport_activity_completions_write_own
  ON public.passport_activity_completions
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins can manage all completions
CREATE POLICY passport_activity_completions_admin_all
  ON public.passport_activity_completions
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));