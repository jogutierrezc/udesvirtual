-- Migration: Create class_attendance table for Passport points trigger
-- Includes logic for student registration validation

CREATE TABLE public.class_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  attended BOOLEAN NOT NULL DEFAULT FALSE,
  attended_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for quick lookup by email
CREATE INDEX idx_class_attendance_email ON public.class_attendance(email);

-- Note: The frontend should check if the email ends with '@mail.udes.edu.co' and user_id is NULL.
-- If so, show a modal inviting registration for more international benefits.
-- Backend can also validate and return a flag if user_id is missing for UDES emails.
