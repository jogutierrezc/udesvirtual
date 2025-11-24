-- Script to apply the professor lesson access fix migration
-- This script can be run directly in the Supabase SQL Editor

-- Fix RLS policy on mooc_lessons to allow professors to edit lessons
-- This addresses the issue where professors get "Unauthorized" errors when trying to edit lessons

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Admins and course creators can manage lessons" ON public.mooc_lessons;

-- Create a new policy that allows admins, course creators, AND professors
CREATE POLICY "Admins, professors, and course creators can manage lessons"
  ON public.mooc_lessons FOR ALL
  USING (
    -- Allow if user is an admin
    has_role(auth.uid(), 'admin'::app_role) OR
    -- Allow if user created the course
    EXISTS (SELECT 1 FROM public.mooc_courses WHERE id = mooc_lessons.course_id AND created_by = auth.uid()) OR
    -- Allow if user has professor role
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'professor')
  )
  WITH CHECK (
    -- Same checks for INSERT/UPDATE operations
    has_role(auth.uid(), 'admin'::app_role) OR
    EXISTS (SELECT 1 FROM public.mooc_courses WHERE id = mooc_lessons.course_id AND created_by = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'professor')
  );

-- Verify the policy was created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'mooc_lessons' 
  AND policyname = 'Admins, professors, and course creators can manage lessons';
