
-- Enums
CREATE TYPE public.app_role AS ENUM ('admin','user');

-- updated_at trigger fn
CREATE OR REPLACE FUNCTION public.tg_set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

-- profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  bio text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- user_roles
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user',
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role);
$$;

-- Auto create profile + default role on new user
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles(id, full_name, avatar_url)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT DO NOTHING;
  INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- categories
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL DEFAULT 'Sparkles',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories public read" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- articles
CREATE TABLE public.articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  content text NOT NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  tags text[] NOT NULL DEFAULT '{}',
  author text NOT NULL DEFAULT 'Startup Navigator Team',
  cover_url text,
  reading_time_min int NOT NULL DEFAULT 5,
  published boolean NOT NULL DEFAULT true,
  views int NOT NULL DEFAULT 0,
  search_tsv tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title,'')), 'A') ||
    setweight(to_tsvector('english', coalesce(description,'')), 'B') ||
    setweight(to_tsvector('english', coalesce(content,'')), 'C')
  ) STORED,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX articles_search_idx ON public.articles USING gin(search_tsv);
CREATE INDEX articles_category_idx ON public.articles(category_id);
GRANT SELECT ON public.articles TO anon, authenticated;
GRANT ALL ON public.articles TO service_role;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Articles public read" ON public.articles FOR SELECT USING (published = true);
CREATE POLICY "Admins manage articles" ON public.articles FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER articles_updated BEFORE UPDATE ON public.articles FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- resources
CREATE TABLE public.resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  resource_type text NOT NULL DEFAULT 'link',
  url text NOT NULL,
  thumbnail_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.resources TO anon, authenticated;
GRANT ALL ON public.resources TO service_role;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Resources public read" ON public.resources FOR SELECT USING (true);
CREATE POLICY "Admins manage resources" ON public.resources FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- faqs
CREATE TABLE public.faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  category text NOT NULL DEFAULT 'General',
  sort_order int NOT NULL DEFAULT 0
);
GRANT SELECT ON public.faqs TO anon, authenticated;
GRANT ALL ON public.faqs TO service_role;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "FAQs public read" ON public.faqs FOR SELECT USING (true);
CREATE POLICY "Admins manage faqs" ON public.faqs FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- bookmarks
CREATE TABLE public.bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id uuid REFERENCES public.articles(id) ON DELETE CASCADE,
  resource_id uuid REFERENCES public.resources(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((article_id IS NOT NULL) OR (resource_id IS NOT NULL))
);
CREATE UNIQUE INDEX bookmarks_user_article ON public.bookmarks(user_id, article_id) WHERE article_id IS NOT NULL;
CREATE UNIQUE INDEX bookmarks_user_resource ON public.bookmarks(user_id, resource_id) WHERE resource_id IS NOT NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookmarks TO authenticated;
GRANT ALL ON public.bookmarks TO service_role;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own bookmarks" ON public.bookmarks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- likes
CREATE TABLE public.likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id uuid NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, article_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.likes TO authenticated;
GRANT ALL ON public.likes TO service_role;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own likes" ON public.likes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Likes read all" ON public.likes FOR SELECT USING (true);

-- chat conversations & messages
CREATE TABLE public.chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'New chat',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_conversations TO authenticated;
GRANT ALL ON public.chat_conversations TO service_role;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own conversations" ON public.chat_conversations FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER convo_updated BEFORE UPDATE ON public.chat_conversations FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant','system')),
  content text NOT NULL,
  sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  confidence numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX chat_messages_convo ON public.chat_messages(conversation_id, created_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own chat messages" ON public.chat_messages FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- search history
CREATE TABLE public.search_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.search_history TO authenticated;
GRANT ALL ON public.search_history TO service_role;
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own searches" ON public.search_history FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ SEED DATA ============

-- 25 Categories
INSERT INTO public.categories(slug, name, description, icon, sort_order) VALUES
('company-registration','Company Registration','Incorporate your startup: entity types, MCA, DIN, DSC, and incorporation steps.','Building2',1),
('business-models','Business Models','Revenue models, unit economics, and business model canvases for startups.','LayoutGrid',2),
('startup-india','Startup India','DPIIT recognition, tax exemptions, and Startup India benefits.','Flag',3),
('funding','Funding','How startups raise capital across every stage of growth.','Banknote',4),
('seed-funding','Seed Funding','Everything you need to close a strong seed round.','Sprout',5),
('angel-investors','Angel Investors','Finding, pitching, and closing angel investors for early-stage capital.','Users',6),
('vc-funding','VC Funding','Understanding venture capital, term sheets, and later-stage rounds.','TrendingUp',7),
('legal','Legal Compliance','Founders'' agreements, contracts, IP, ROC filings and ongoing compliance.','Scale',8),
('gst','GST','Goods and Services Tax registration, filings, and startup implications.','Receipt',9),
('taxation','Taxation','Income tax, TDS, presumptive taxation, and startup-friendly tax rules.','Calculator',10),
('branding','Branding','Positioning, identity, and building a memorable brand.','Palette',11),
('marketing','Marketing','Growth marketing, content, SEO, paid, and community.','Megaphone',12),
('sales','Sales','B2B and B2C sales playbooks, pipelines, and CRMs.','HandshakeIcon',13),
('finance','Finance','Financial planning, runway, burn, and unit economics.','LineChart',14),
('hiring','Hiring','Building teams: sourcing, interviewing, ESOPs, and offers.','UserPlus',15),
('payroll','Payroll','Payroll setup, PF, ESIC, and compliant compensation.','Wallet',16),
('business-growth','Business Growth','Frameworks and tactics to grow revenue predictably.','Rocket',17),
('operations','Operations','Ops playbooks: SOPs, tooling, and vendor management.','Cog',18),
('scaling','Scaling','Scaling teams, systems, and infrastructure without breaking.','Expand',19),
('international-expansion','International Expansion','Going global: entity setup, hiring, and GTM abroad.','Globe',20),
('exit-strategies','Exit Strategies','M&A, secondaries, and IPO paths for founders.','DoorOpen',21),
('ai-tools','AI Tools','Curated AI tools that supercharge startup teams.','Sparkles',22),
('technology-stack','Technology Stack','Choosing tech, architecture, and dev practices for early startups.','Code',23),
('product-development','Product Development','From MVP to product-market fit: discovery, design, and delivery.','Boxes',24),
('investor-relations','Investor Relations','Investor updates, board meetings, and cap table hygiene.','Presentation',25);

-- 100 Articles (procedurally seeded, 4 per category)
WITH c AS (SELECT id, name, slug FROM public.categories ORDER BY sort_order)
INSERT INTO public.articles(slug, title, description, content, category_id, tags, cover_url, reading_time_min, author)
SELECT
  c.slug || '-' || t.n,
  t.title_prefix || ' — ' || c.name,
  t.desc_prefix || ' ' || c.name || '. A practical, founder-focused guide.',
  E'# ' || t.title_prefix || ' — ' || c.name || E'\n\n' ||
  '**Category:** ' || c.name || E'\n\n' ||
  E'## Overview\n\nThis guide covers ' || c.name || E' from first principles for Indian and global startup founders. You''ll learn what matters, why it matters, and the exact steps to take.\n\n' ||
  E'## Key Concepts\n\n- **Foundation:** the basics of ' || lower(c.name) || E' every founder should know.\n- **Frameworks:** proven mental models used by top operators.\n- **Pitfalls:** the most common mistakes and how to avoid them.\n- **Metrics:** what to measure and target ranges.\n\n' ||
  E'## Step-by-Step Playbook\n\n1. **Assess your current state** — audit where you stand today.\n2. **Set a target outcome** — define a 30/60/90 day goal.\n3. **Pick the right tools** — use lightweight software and templates.\n4. **Execute in short cycles** — ship weekly, review, iterate.\n5. **Compound results** — document learnings and scale what works.\n\n' ||
  E'## India-specific notes\n\nIn the Indian startup ecosystem, ' || lower(c.name) || E' interacts with DPIIT recognition, Startup India benefits, and the MCA/ROC framework. Refer to the official Startup India portal for the latest schemes and tax exemptions.\n\n' ||
  E'## Common Mistakes\n\n- Skipping documentation early on\n- Optimising for vanity metrics\n- Under-investing in advisors and mentors\n- Delaying compliance until it becomes urgent\n\n' ||
  E'## Tools and Templates\n\nSee the Resources section for downloadable templates, government links, and recommended AI tools that accelerate ' || lower(c.name) || E' work.\n\n' ||
  E'## Summary\n\n' || c.name || E' is one of the most important levers for startup success. Nail the fundamentals, keep iterating, and revisit this guide every quarter.',
  c.id,
  ARRAY['startup', lower(c.name), 'guide', 'india'],
  'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1200&q=70',
  6 + (t.n * 2),
  'Startup Navigator Team'
FROM c CROSS JOIN (VALUES
  (1, 'Getting Started', 'A beginner-friendly introduction to'),
  (2, 'Deep Dive', 'An in-depth practical playbook on'),
  (3, 'Advanced Playbook', 'Advanced strategies and frameworks for'),
  (4, 'Checklist & Templates', 'A ready-to-use checklist and templates for')
) AS t(n, title_prefix, desc_prefix);

-- 75 Resources (3 per category)
WITH c AS (SELECT name, slug FROM public.categories ORDER BY sort_order)
INSERT INTO public.resources(title, description, category, resource_type, url, thumbnail_url)
SELECT
  r.title_prefix || ': ' || c.name,
  r.desc_prefix || ' ' || c.name || '. Curated by the Startup Navigator team.',
  c.name,
  r.rtype,
  'https://www.startupindia.gov.in/',
  'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&q=70'
FROM c CROSS JOIN (VALUES
  ('Official Guide', 'Government and official documentation on', 'link'),
  ('Template Pack', 'Downloadable templates and checklists for', 'template'),
  ('Recommended Tool', 'Top-rated software to accelerate work in', 'tool')
) AS r(title_prefix, desc_prefix, rtype);

-- 50 FAQs (2 per category)
WITH c AS (SELECT name FROM public.categories ORDER BY sort_order)
INSERT INTO public.faqs(question, answer, category, sort_order)
SELECT
  f.q_prefix || ' ' || c.name || '?',
  f.a_prefix || ' ' || c.name || '. Read the full guide in Explore Topics for step-by-step details, checklists, and India-specific notes.',
  c.name,
  f.n
FROM c CROSS JOIN (VALUES
  (1, 'What do founders most often get wrong about', 'The most common mistake founders make is under-investing in the basics of'),
  (2, 'How do I get started with', 'Start by reading our beginner guide, then follow the 30/60/90 day playbook for')
) AS f(n, q_prefix, a_prefix);
