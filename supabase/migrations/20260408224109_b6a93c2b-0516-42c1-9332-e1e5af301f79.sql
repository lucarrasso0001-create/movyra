
-- 1. Add has_pin boolean column so client knows if PIN is set without seeing hash
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_pin boolean NOT NULL DEFAULT false;

-- Backfill has_pin from existing pin_hash values
UPDATE public.profiles SET has_pin = (pin_hash IS NOT NULL AND pin_hash != '');

-- 2. Create server-side PIN verification function using pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Function to set/update PIN (hashes server-side with bcrypt)
CREATE OR REPLACE FUNCTION public.set_profile_pin(p_profile_id uuid, p_pin text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate PIN format
  IF p_pin IS NOT NULL AND p_pin != '' THEN
    IF LENGTH(p_pin) != 4 OR p_pin !~ '^\d{4}$' THEN
      RAISE EXCEPTION 'PIN must be exactly 4 digits';
    END IF;
    
    UPDATE public.profiles
    SET pin_hash = crypt(p_pin, gen_salt('bf', 10)),
        has_pin = true,
        updated_at = now()
    WHERE id = p_profile_id AND user_id = auth.uid();
  ELSE
    -- Clear PIN
    UPDATE public.profiles
    SET pin_hash = NULL,
        has_pin = false,
        updated_at = now()
    WHERE id = p_profile_id AND user_id = auth.uid();
  END IF;
  
  RETURN FOUND;
END;
$$;

-- Function to verify PIN server-side
CREATE OR REPLACE FUNCTION public.verify_profile_pin(p_profile_id uuid, p_pin text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_pin IS NULL OR p_pin = '' THEN
    RETURN false;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_profile_id
      AND user_id = auth.uid()
      AND pin_hash = crypt(p_pin, pin_hash)
  );
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.set_profile_pin(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_profile_pin(uuid, text) TO authenticated;

-- 3. Revoke SELECT on pin_hash column from authenticated users
REVOKE SELECT (pin_hash) ON public.profiles FROM authenticated;
REVOKE SELECT (pin_hash) ON public.profiles FROM anon;
REVOKE SELECT (pin_hash) ON public.profiles FROM public;
