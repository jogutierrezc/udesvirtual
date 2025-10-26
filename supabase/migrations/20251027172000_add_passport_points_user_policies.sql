-- Add policies for users to manage their own passport data
-- This allows the real-time celebration system to work properly

-- Allow authenticated users to insert their own points
CREATE POLICY "Users can insert their own points"
  ON public.passport_points_ledger FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Allow authenticated users to update their own points (for corrections if needed)
CREATE POLICY "Users can update their own points"
  ON public.passport_points_ledger FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Allow authenticated users to insert their own badges (when earned through system)
CREATE POLICY "Users can insert their own badges"
  ON public.passport_user_badges FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Allow authenticated users to update their own badges (for evidence/metadata updates)
CREATE POLICY "Users can update their own badges"
  ON public.passport_user_badges FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());