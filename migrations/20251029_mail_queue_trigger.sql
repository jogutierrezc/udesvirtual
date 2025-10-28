-- Migration: create mail_queue table and trigger to enqueue emails on new contact_messages

CREATE TABLE IF NOT EXISTS public.mail_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.contact_messages(id) ON DELETE CASCADE,
  recipient_email text NOT NULL,
  subject text NOT NULL,
  payload jsonb,
  processed boolean NOT NULL DEFAULT false,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

-- Function to insert a delivery job into mail_queue when a contact_messages row is created
CREATE OR REPLACE FUNCTION public.enqueue_mail_for_contact_messages()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  recip_email text;
BEGIN
  SELECT p.email INTO recip_email FROM public.profiles p WHERE p.id = NEW.profile_id;
  -- If recipient has no email, skip enqueue
  IF recip_email IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.mail_queue (message_id, recipient_email, subject, payload)
  VALUES (
    NEW.id,
    recip_email,
    'UDES E-Exchange — Nuevo mensaje recibido',
    jsonb_build_object(
      'sender_name', NEW.sender_name,
      'sender_email', NEW.sender_email,
      'university_representing', NEW.university_representing,
      'reason', NEW.reason,
      'reason_other', NEW.reason_other,
      'country', NEW.country,
      'department', NEW.department,
      'message', NEW.message,
      'created_at', NEW.created_at
    )
  );

  RETURN NEW;
END;
$$;

-- Trigger to call the function after insert
DROP TRIGGER IF EXISTS contact_message_enqueue ON public.contact_messages;
CREATE TRIGGER contact_message_enqueue
  AFTER INSERT ON public.contact_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.enqueue_mail_for_contact_messages();
