-- Supabase Database Schema for SaaS Application

-- Enable Row Level Security (RLS)
-- Ensure all tables have RLS enabled and appropriate policies defined.

-- Users Table (Managed by Supabase Auth)
-- Supabase automatically creates an `auth.users` table.
-- We will create a public `profiles` table to store additional user data.

-- Profiles Table
-- Stores public user information linked to the auth.users table.
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  full_name TEXT,
  avatar_url TEXT,
  -- Add other profile fields as needed, e.g., company name, role
  company_name TEXT,
  role TEXT -- e.g., 'admin', 'editor', 'writer', 'viewer'
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Allow users to view their own profile.
CREATE POLICY "Allow individual read access" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Policy: Allow users to update their own profile.
CREATE POLICY "Allow individual update access" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Function to automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>
'full_name', new.raw_user_meta_data->>
'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function after a new user is inserted into auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Content Table
-- Stores the main content created by users.
CREATE TABLE content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  title TEXT NOT NULL,
  body JSONB, -- Store rich text content (e.g., TipTap JSON output)
  status TEXT DEFAULT 'draft' NOT NULL, -- e.g., 'draft', 'in_review', 'approved', 'scheduled', 'published', 'archived'
  seo_analysis JSONB, -- Store results from AI SEO analysis
  readability_analysis JSONB, -- Store results from AI readability analysis
  engagement_analysis JSONB, -- Store results from AI engagement analysis
  scheduled_publish_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ
  -- Add other relevant fields like tags, categories, featured image URL
);

ALTER TABLE content ENABLE ROW LEVEL SECURITY;

-- Policy: Allow users to manage their own content.
CREATE POLICY "Allow individual access to own content" ON content
  FOR ALL USING (auth.uid() = user_id);

-- TODO: Add policies for team collaboration access if needed.

-- Comments Table
-- Stores comments on content.
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES content(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  comment_text TEXT NOT NULL,
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE -- For threaded comments
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Policy: Allow users to view comments on content they can access.
-- (Requires joining with content table to check access)
CREATE POLICY "Allow read access to comments on accessible content" ON comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM content WHERE content.id = comments.content_id
      -- Assuming users can read content if they own it or are part of a team (add team logic later)
      AND (content.user_id = auth.uid() /* OR user is part of the content's team */)
    )
  );

-- Policy: Allow users to insert comments on content they can access.
CREATE POLICY "Allow insert access for comments on accessible content" ON comments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM content WHERE content.id = comments.content_id
      AND (content.user_id = auth.uid() /* OR user is part of the content's team */)
    )
  );

-- Policy: Allow users to update/delete their own comments.
CREATE POLICY "Allow users to manage their own comments" ON comments
  FOR UPDATE, DELETE USING (auth.uid() = user_id);


-- Subscriptions Table (Based on Supabase Stripe Starter)
-- Stores subscription plans and customer data linked to Stripe.
CREATE TABLE customers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) NOT NULL,
  stripe_customer_id TEXT
);

CREATE TABLE products (
  id TEXT PRIMARY KEY, -- Stripe Product ID
  active BOOLEAN,
  name TEXT,
  description TEXT,
  image TEXT,
  metadata JSONB
);

CREATE TYPE pricing_type AS ENUM ('one_time', 'recurring');
CREATE TYPE pricing_plan_interval AS ENUM ('day', 'week', 'month', 'year');

CREATE TABLE prices (
  id TEXT PRIMARY KEY, -- Stripe Price ID
  product_id TEXT REFERENCES products(id),
  active BOOLEAN,
  description TEXT,
  unit_amount BIGINT,
  currency TEXT CHECK (char_length(currency) = 3),
  type pricing_type,
  interval pricing_plan_interval,
  interval_count INTEGER,
  trial_period_days INTEGER,
  metadata JSONB
);

CREATE TYPE subscription_status AS ENUM ('trialing', 'active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'unpaid', 'paused');

CREATE TABLE subscriptions (
  id TEXT PRIMARY KEY, -- Stripe Subscription ID
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  status subscription_status,
  metadata JSONB,
  price_id TEXT REFERENCES prices(id),
  quantity INTEGER,
  cancel_at_period_end BOOLEAN,
  created TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  current_period_start TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  current_period_end TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  ended_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  cancel_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  canceled_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  trial_start TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  trial_end TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Enable RLS for subscription tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies for subscription tables
CREATE POLICY "Allow public read access to products and prices" ON products FOR SELECT USING (true);
CREATE POLICY "Allow public read access to prices" ON prices FOR SELECT USING (true);

CREATE POLICY "Can view own customer data" ON customers FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Can view own subscription data" ON subscriptions FOR SELECT USING (auth.uid() = user_id);

-- Secure stripe_customer_id
-- Ensure this column is not readable by clientside requests.
-- Handled by Supabase default policies if column-level security is needed, or restrict via SELECT permissions in RLS.

-- TODO: Add tables for Teams, Team Memberships, Roles/Permissions if complex collaboration is needed.
-- TODO: Add tables for Content Versions if version history is required.

-- Set up Storage for avatars (if needed)
-- insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);
-- create policy "Avatar images are publicly accessible." on storage.objects for select using ( bucket_id = 'avatars' );
-- create policy "Anyone can upload an avatar." on storage.objects for insert with check ( bucket_id = 'avatars' );
-- create policy "Anyone can update their own avatar." on storage.objects for update using ( auth.uid() = owner ) with check ( bucket_id = 'avatars' );



-- Content Versions Table
-- Stores historical versions of content.
CREATE TABLE content_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES content(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- User who made the change
  created_at TIMESTAMPTZ DEFAULT NOW(),
  body JSONB, -- Snapshot of the content body at the time of saving
  version_message TEXT -- Optional message describing the change
);

ALTER TABLE content_versions ENABLE ROW LEVEL SECURITY;

-- Policy: Allow users to view versions of content they can access.
CREATE POLICY "Allow read access to versions of accessible content" ON content_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM content WHERE content.id = content_versions.content_id
      -- Assuming users can read content if they own it or are part of a team (add team logic later)
      AND (content.user_id = auth.uid() /* OR user is part of the content's team */)
    )
  );

-- Policy: Allow users to insert versions for content they can update.
-- Note: Insertion should be handled server-side within the content update logic.
CREATE POLICY "Allow insert access for versions on updatable content" ON content_versions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM content WHERE content.id = content_versions.content_id
      AND (content.user_id = auth.uid() /* OR user is part of the content's team */)
    )
  );




-- Add Approval/Workflow related columns (optional, depending on complexity)
-- Example: Assignee for review/approval
-- ALTER TABLE content ADD COLUMN assignee_id UUID REFERENCES auth.users(id);

-- Example: Activity Log for status changes, approvals etc.
-- CREATE TABLE content_activity (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   content_id UUID REFERENCES content(id) ON DELETE CASCADE NOT NULL,
--   user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- User who performed the action
--   created_at TIMESTAMPTZ DEFAULT NOW(),
--   activity_type TEXT NOT NULL, -- e.g., 'status_change', 'comment_added', 'version_saved', 'assigned'
--   details JSONB -- e.g., { "old_status": "draft", "new_status": "in_review" }
-- );
-- ALTER TABLE content_activity ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow read access to activity on accessible content" ON content_activity
--   FOR SELECT USING (
--     EXISTS (
--       SELECT 1 FROM content WHERE content.id = content_activity.content_id
--       AND (content.user_id = auth.uid() /* OR user is part of the content's team */)
--     )
--   );

