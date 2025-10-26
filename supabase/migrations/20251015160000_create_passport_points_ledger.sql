-- Create passport points ledger table
CREATE TABLE public.passport_points_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  pathway_type TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on passport_points_ledger
ALTER TABLE public.passport_points_ledger ENABLE ROW LEVEL SECURITY;

-- Passport points ledger policies
CREATE POLICY "Users can view their own points ledger"
  ON public.passport_points_ledger FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert points ledger entries"
  ON public.passport_points_ledger FOR INSERT
  WITH CHECK (true);

-- Create index for better query performance
CREATE INDEX idx_passport_points_ledger_user_id ON public.passport_points_ledger(user_id);
CREATE INDEX idx_passport_points_ledger_created_at ON public.passport_points_ledger(created_at DESC);