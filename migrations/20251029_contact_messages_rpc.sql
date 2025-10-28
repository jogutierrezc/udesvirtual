-- Migration: add RPC to allow profile owners to mark messages read/unread

CREATE OR REPLACE FUNCTION public.mark_contact_message_set_read(msg_id uuid, new_read boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  p_id uuid;
BEGIN
  SELECT profile_id INTO p_id FROM public.contact_messages WHERE id = msg_id;
  IF p_id IS NULL THEN
    RAISE EXCEPTION 'Message not found';
  END IF;
  -- check that the caller is the profile owner
  IF auth.uid() IS NULL OR auth.uid() <> p_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.contact_messages SET read = new_read WHERE id = msg_id;
END;
$$;

-- Grant execute to authenticated role (so authenticated users can call it)
GRANT EXECUTE ON FUNCTION public.mark_contact_message_set_read(uuid, boolean) TO authenticated;
