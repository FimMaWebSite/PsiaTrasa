-- SQL Schema for PsiaTrasa Supabase Integration
-- You can run this in your Supabase SQL Editor

-- 1. Profiles Table (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT NOT NULL,
  dog_name TEXT,
  dog_breed TEXT,
  dog_size TEXT CHECK (dog_size IN ('small', 'medium', 'large')),
  dog_temperament TEXT CHECK (dog_temperament IN ('friendly', 'neutral', 'reactive')),
  avatar_url TEXT,
  email TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for Profiles
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Trigger to automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, dog_name, dog_breed, dog_size, dog_temperament, avatar_url, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'dogName',
    new.raw_user_meta_data->>'dogBreed',
    new.raw_user_meta_data->>'dogSize',
    new.raw_user_meta_data->>'dogTemperament',
    COALESCE(
      new.raw_user_meta_data->>'avatar_url',
      'https://api.dicebear.com/7.x/adventurer/svg?seed=' || COALESCE(new.raw_user_meta_data->>'dogName', split_part(new.email, '@', 1))
    ),
    new.email
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 2. Donations Table (Ściana Chwały)
CREATE TABLE IF NOT EXISTS public.donations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  donor_name TEXT NOT NULL,
  coffees INTEGER NOT NULL DEFAULT 1,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- Create policies for Donations
CREATE POLICY "Donations are viewable by everyone" ON public.donations
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert donations" ON public.donations
  FOR INSERT WITH CHECK (true); -- Allows webhook or local submissions
