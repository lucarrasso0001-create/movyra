-- Remove unique constraint from user_id to allow multiple profiles per user
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_key;
