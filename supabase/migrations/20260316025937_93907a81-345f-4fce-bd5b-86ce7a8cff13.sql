-- Avatar storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Storage policies for avatars
CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Authenticated users can upload avatars" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can update their own avatars" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete their own avatars" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Affiliate/Sponsorship marketplace tables
CREATE TABLE public.brand_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name text NOT NULL,
  brand_logo_url text,
  title text NOT NULL,
  description text,
  campaign_type text NOT NULL DEFAULT 'sponsorship',
  budget_min numeric DEFAULT 0,
  budget_max numeric DEFAULT 0,
  commission_rate numeric DEFAULT 0,
  category text,
  requirements text,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE public.campaign_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.brand_campaigns(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, creator_id)
);

-- RLS for brand_campaigns
ALTER TABLE public.brand_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active campaigns viewable by everyone" ON public.brand_campaigns FOR SELECT USING (is_active = true OR auth.uid() = created_by);
CREATE POLICY "Users can create campaigns" ON public.brand_campaigns FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Owners can update campaigns" ON public.brand_campaigns FOR UPDATE TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "Owners can delete campaigns" ON public.brand_campaigns FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- RLS for campaign_applications
ALTER TABLE public.campaign_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators can view their applications" ON public.campaign_applications FOR SELECT TO authenticated USING (auth.uid() = creator_id OR auth.uid() = (SELECT created_by FROM public.brand_campaigns WHERE id = campaign_id));
CREATE POLICY "Creators can apply" ON public.campaign_applications FOR INSERT TO authenticated WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Campaign owners can update applications" ON public.campaign_applications FOR UPDATE TO authenticated USING (auth.uid() = (SELECT created_by FROM public.brand_campaigns WHERE id = campaign_id));

-- Triggers for updated_at
CREATE TRIGGER update_brand_campaigns_updated_at BEFORE UPDATE ON public.brand_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_campaign_applications_updated_at BEFORE UPDATE ON public.campaign_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();