-- Rename cosmosis_profiles -> astrologer_profiles
ALTER TABLE public.cosmosis_profiles RENAME TO astrologer_profiles;

-- Rename trigger function
ALTER FUNCTION public.handle_new_cosmosis_user() RENAME TO handle_new_astrologer_user;

-- Rename the updated_at trigger
ALTER TRIGGER cosmosis_profiles_updated_at ON public.astrologer_profiles RENAME TO astrologer_profiles_updated_at;

-- Update realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE public.astrologer_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.astrologer_profiles;

-- Update has_active_subscription to reference new table name
CREATE OR REPLACE FUNCTION public.has_active_subscription(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_status text;
  v_trial_ends timestamptz;
  v_expires timestamptz;
BEGIN
  SELECT subscription_status, trial_ends_at, subscription_expires_at
  INTO v_status, v_trial_ends, v_expires
  FROM public.astrologer_profiles
  WHERE id = p_user_id;

  IF v_status = 'active' THEN
    RETURN coalesce(v_expires > now(), true);
  END IF;

  IF v_status = 'trialing' THEN
    RETURN coalesce(v_trial_ends > now(), false);
  END IF;

  RETURN false;
END;
$$;
