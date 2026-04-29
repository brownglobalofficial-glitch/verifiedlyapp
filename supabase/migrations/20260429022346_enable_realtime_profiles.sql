-- Enable realtime updates on profiles so clients can react instantly
-- when the Stripe webhook flips is_pro / is_elite.
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
