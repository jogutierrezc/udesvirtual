-- Add INSERT policy for profiles table to fix RLS violation when editing profile

-- Allow users to insert their own profile (for upsert operations)
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);