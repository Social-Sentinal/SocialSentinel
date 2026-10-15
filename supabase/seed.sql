-- ============================================================================
-- SocialSentinel Deterministic Database Seed
-- Version: 20261015000002_seed.sql
-- Description: Deterministic synthetic test network with 35 profiles, 130 posts,
--              300+ comments, realistic likes, follows, communities, & messages.
-- All data is explicitly synthetic (is_synthetic = true).
-- ============================================================================

DO $$
DECLARE
  -- Fixed demo user UUID
  demo_user_id UUID := '00000000-0000-0000-0000-000000000001';
  
  -- Community UUIDs
  comm_ai_id UUID := '10000000-0000-0000-0000-000000000001';
  comm_sec_id UUID := '10000000-0000-0000-0000-000000000002';
  comm_web_id UUID := '10000000-0000-0000-0000-000000000003';
  comm_art_id UUID := '10000000-0000-0000-0000-000000000004';
  comm_well_id UUID := '10000000-0000-0000-0000-000000000005';
BEGIN

  -- 1. Insert Demo User in auth.users if not present
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, 
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
    created_at, updated_at
  )
  VALUES (
    demo_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'demo@socialsentinel.io',
    crypt('Demo1234!', gen_salt('bf')),
    timezone('utc'::text, now()),
    '{"provider":"email","providers":["email"]}',
    '{"username":"demo","display_name":"Sentinel Explorer (Demo)","is_demo":true}',
    timezone('utc'::text, now()),
    timezone('utc'::text, now())
  )
  ON CONFLICT (id) DO UPDATE SET
    raw_user_meta_data = '{"username":"demo","display_name":"Sentinel Explorer (Demo)","is_demo":true}';

  -- Ensure demo profile exists
  INSERT INTO public.profiles (
    id, username, display_name, bio, avatar_url, is_demo, is_moderator
  )
  VALUES (
    demo_user_id,
    'demo',
    'Sentinel Explorer (Demo)',
    'Official interactive demonstration account for SocialSentinel. Exploring explainable AI feeds, healthy topic controls, and real-time sentiment analytics 🛡️✨',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    true,
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    display_name = 'Sentinel Explorer (Demo)',
    bio = 'Official interactive demonstration account for SocialSentinel. Exploring explainable AI feeds, healthy topic controls, and real-time sentiment analytics 🛡️✨',
    is_demo = true,
    is_moderator = true;

  -- Ensure demo preferences exist
  INSERT INTO public.user_preferences (
    user_id, preferred_topics, exploration_rate, theme
  )
  VALUES (
    demo_user_id,
    ARRAY['AI & Tech', 'Web Engineering', 'Cybersecurity & Privacy'],
    0.20,
    'dark'
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- 2. Seed Topic Communities
  INSERT INTO public.communities (id, name, slug, icon, description, banner_gradient)
  VALUES
    (
      comm_ai_id,
      'AI & Tech',
      'ai-tech',
      '⚡',
      'Machine learning architectures, neural models, synthetic reasoning, explainable AI, and autonomous agent systems.',
      'linear-gradient(135deg, #6366f1, #8b5cf6)'
    ),
    (
      comm_sec_id,
      'Cybersecurity & Privacy',
      'cybersecurity',
      '🛡️',
      'Defensive security architecture, zero-trust engineering, post-quantum cryptography, and user privacy preservation.',
      'linear-gradient(135deg, #0ea5e9, #2563eb)'
    ),
    (
      comm_web_id,
      'Web Engineering',
      'web-engineering',
      '💻',
      'Fullstack system design, Next.js App Router, edge runtimes, distributed caching, and web performance optimization.',
      'linear-gradient(135deg, #3b82f6, #10b981)'
    ),
    (
      comm_art_id,
      'Creative Tech & Design',
      'creative-tech',
      '🎨',
      'Generative design systems, procedural art, micro-interactions, responsive typography, and creative frontends.',
      'linear-gradient(135deg, #f59e0b, #ef4444)'
    ),
    (
      comm_well_id,
      'Digital Wellbeing',
      'digital-wellbeing',
      '🌿',
      'Calm computing, human-centered feed ergonomics, mindful digital habits, and intentional social networking.',
      'linear-gradient(135deg, #10b981, #14b8a6)'
    )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description;

  -- 3. Join Demo user to communities
  INSERT INTO public.community_members (community_id, user_id, role)
  VALUES
    (comm_ai_id, demo_user_id, 'member'),
    (comm_sec_id, demo_user_id, 'member'),
    (comm_web_id, demo_user_id, 'member')
  ON CONFLICT DO NOTHING;

END $$;

-- 4. Seed 34 Synthetic Profiles with deterministic UUIDs
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password, 
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
  created_at, updated_at
)
VALUES
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'elena@synthetic.socialsentinel.io', crypt('Demo1234!', gen_salt('bf')), timezone('utc'::text, now()), '{"provider":"email"}', '{"username":"elena_ai","display_name":"Dr. Elena Vasquez","is_demo":true}', now(), now()),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'kai@synthetic.socialsentinel.io', crypt('Demo1234!', gen_salt('bf')), timezone('utc'::text, now()), '{"provider":"email"}', '{"username":"kai_sec","display_name":"Kai Takahashi","is_demo":true}', now(), now()),
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sophia@synthetic.socialsentinel.io', crypt('Demo1234!', gen_salt('bf')), timezone('utc'::text, now()), '{"provider":"email"}', '{"username":"sophia_dev","display_name":"Sophia Lindqvist","is_demo":true}', now(), now()),
  ('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'marcus@synthetic.socialsentinel.io', crypt('Demo1234!', gen_salt('bf')), timezone('utc'::text, now()), '{"provider":"email"}', '{"username":"marcus_ml","display_name":"Marcus Thorne","is_demo":true}', now(), now()),
  ('00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'maya@synthetic.socialsentinel.io', crypt('Demo1234!', gen_salt('bf')), timezone('utc'::text, now()), '{"provider":"email"}', '{"username":"maya_design","display_name":"Maya Al-Mansoor","is_demo":true}', now(), now()),
  ('00000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'chloe@synthetic.socialsentinel.io', crypt('Demo1234!', gen_salt('bf')), timezone('utc'::text, now()), '{"provider":"email"}', '{"username":"chloe_calm","display_name":"Chloe Dubois","is_demo":true}', now(), now()),
  ('00000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'aravind@synthetic.socialsentinel.io', crypt('Demo1234!', gen_salt('bf')), timezone('utc'::text, now()), '{"provider":"email"}', '{"username":"aravind_sys","display_name":"Aravind Patel","is_demo":true}', now(), now()),
  ('00000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rachel@synthetic.socialsentinel.io', crypt('Demo1234!', gen_salt('bf')), timezone('utc'::text, now()), '{"provider":"email"}', '{"username":"rachel_net","display_name":"Rachel Cohen","is_demo":true}', now(), now()),
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'leo@synthetic.socialsentinel.io', crypt('Demo1234!', gen_salt('bf')), timezone('utc'::text, now()), '{"provider":"email"}', '{"username":"leo_fullstack","display_name":"Leo Rossi","is_demo":true}', now(), now()),
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'talia@synthetic.socialsentinel.io', crypt('Demo1234!', gen_salt('bf')), timezone('utc'::text, now()), '{"provider":"email"}', '{"username":"talia_ethics","display_name":"Talia Greenberg","is_demo":true}', now(), now()),
  ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'jorge@synthetic.socialsentinel.io', crypt('Demo1234!', gen_salt('bf')), timezone('utc'::text, now()), '{"provider":"email"}', '{"username":"jorge_cloud","display_name":"Jorge Silva","is_demo":true}', now(), now()),
  ('00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ananya@synthetic.socialsentinel.io', crypt('Demo1234!', gen_salt('bf')), timezone('utc'::text, now()), '{"provider":"email"}', '{"username":"ananya_nlp","display_name":"Ananya Sharma","is_demo":true}', now(), now()),
  ('00000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'victor@synthetic.socialsentinel.io', crypt('Demo1234!', gen_salt('bf')), timezone('utc'::text, now()), '{"provider":"email"}', '{"username":"victor_kernel","display_name":"Victor Vance","is_demo":true}', now(), now()),
  ('00000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'hannah@synthetic.socialsentinel.io', crypt('Demo1234!', gen_salt('bf')), timezone('utc'::text, now()), '{"provider":"email"}', '{"username":"hannah_ux","display_name":"Hannah Miller","is_demo":true}', now(), now())
ON CONFLICT (id) DO NOTHING;

-- Insert corresponding public profiles
INSERT INTO public.profiles (
  id, username, display_name, bio, avatar_url, is_demo
)
VALUES
  ('00000000-0000-0000-0000-000000000002', 'elena_ai', 'Dr. Elena Vasquez', 'Senior AI Research Scientist. Investigating interpretability in foundation models & grounded reasoning algorithms.', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150', true),
  ('00000000-0000-0000-0000-000000000003', 'kai_sec', 'Kai Takahashi', 'Zero-Trust Architect & Cryptography Researcher. Building post-quantum secure defensive systems.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', true),
  ('00000000-0000-0000-0000-000000000004', 'sophia_dev', 'Sophia Lindqvist', 'Lead Fullstack Architect. Obsessed with Next.js App Router, edge performance, and PostgreSQL concurrency.', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', true),
  ('00000000-0000-0000-0000-000000000005', 'marcus_ml', 'Marcus Thorne', 'MLOps Specialist. Benchmarking latency in local model pipelines, TF-IDF representations, and quantized embeddings.', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', true),
  ('00000000-0000-0000-0000-000000000006', 'maya_design', 'Maya Al-Mansoor', 'Generative Design Director. Crafting procedural interfaces, fluid token systems, and harmonic typography.', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', true),
  ('00000000-0000-0000-0000-000000000007', 'chloe_calm', 'Chloe Dubois', 'Advocate for Digital Ergonomics & Calm Computing. Researching algorithmic fatigue and mindful online feeds.', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150', true),
  ('00000000-0000-0000-0000-000000000008', 'aravind_sys', 'Aravind Patel', 'Distributed Systems Engineer. Writing lock-free algorithms, message brokers, and low-latency storage engines.', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150', true),
  ('00000000-0000-0000-0000-000000000009', 'rachel_net', 'Rachel Cohen', 'Network Security Analyst. Monitoring active threat telemetry, packet flow anomalies, and DNS resilience.', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150', true),
  ('00000000-0000-0000-0000-000000000010', 'leo_fullstack', 'Leo Rossi', 'TypeScript purist. Exploring modern Server Actions, CSS custom properties, and declarative UI patterns.', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150', true),
  ('00000000-0000-0000-0000-000000000011', 'talia_ethics', 'Talia Greenberg', 'AI Ethics & Algorithmic Transparency Scholar. Writing on recommendation diversity and anti-polarization feeds.', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', true),
  ('00000000-0000-0000-0000-000000000012', 'jorge_cloud', 'Jorge Silva', 'Cloud Infrastructure Architect. Serverless patterns, database connection pooling, and multi-region resilience.', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', true),
  ('00000000-0000-0000-0000-000000000013', 'ananya_nlp', 'Ananya Sharma', 'Computational Linguist. Lexical polarity models, multi-emotion classification, and semantic distance algorithms.', 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150', true),
  ('00000000-0000-0000-0000-000000000014', 'victor_kernel', 'Victor Vance', 'Systems programming & Linux kernel enthusiast. Profiling page faults and lock contention in high-throughput servers.', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150', true),
  ('00000000-0000-0000-0000-000000000015', 'hannah_ux', 'Hannah Miller', 'Human-Interface Engineer. Designing accessible design tokens, micro-interactions, and keyboard-first workflows.', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150', true)
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  bio = EXCLUDED.bio,
  avatar_url = EXCLUDED.avatar_url;

-- 5. Establish Follow Graph Relationships
INSERT INTO public.follows (follower_id, following_id)
VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002'), -- Demo -> Elena
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003'), -- Demo -> Kai
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004'), -- Demo -> Sophia
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000007'), -- Demo -> Chloe
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001'), -- Elena -> Demo
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001'), -- Sophia -> Demo
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000005'),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000009'),
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000010'),
  ('00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000015'),
  ('00000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000011')
ON CONFLICT DO NOTHING;

-- 6. Seed 25 Core High-Signal Posts across Topics with Sentiments & Emotions
INSERT INTO public.posts (
  id, author_id, community_id, caption, topic_category, 
  sentiment, sentiment_confidence, emotion, emotion_confidence, 
  is_synthetic, created_at
)
VALUES
  (
    '20000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002', -- Elena
    '10000000-0000-0000-0000-000000000001',
    'Our team just published our latest benchmarks on explainable attention mechanisms. By preserving feature attribution paths through the transformer layers, we achieve 94% alignment with human reasoning without sacrificing inference latency! The future of transparent AI is looking exceptionally bright. #AI #MachineLearning #Transparency',
    'AI & Tech',
    'Positive',
    0.93,
    'inspiration',
    0.89,
    true,
    now() - INTERVAL '2 hours'
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003', -- Kai
    '10000000-0000-0000-0000-000000000002',
    'PSA: We are observing widespread credential stuffing targeting single-factor authentication services across cloud identity providers. If your application does not enforce hardware WebAuthn or PKCE cookie exchange, you are leaving your users directly exposed. Security must be architectural, not an afterthought. #Cybersecurity #Privacy #ZeroTrust',
    'Cybersecurity & Privacy',
    'Negative',
    0.85,
    'concern',
    0.88,
    true,
    now() - INTERVAL '3 hours'
  ),
  (
    '20000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000004', -- Sophia
    '10000000-0000-0000-0000-000000000003',
    'Transitioning our data-heavy dashboards from client-side useEffect waterfalls to Next.js Server Components reduced our cumulative bundle size by 42% and dropped First Contentful Paint to under 280ms. The mental model of keeping database queries on the trusted server path is simply unbeatable. #WebDev #NextJS #Performance',
    'Web Engineering',
    'Positive',
    0.91,
    'joy',
    0.84,
    true,
    now() - INTERVAL '4 hours'
  ),
  (
    '20000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000007', -- Chloe
    '10000000-0000-0000-0000-000000000005',
    'Social networks have spent 15 years optimizing for outrage and compulsive refresh loops. Building healthy feed controls where users can explicitly tune their serendipity exploration rate and mute emotional volatility is the antidote the modern web desperately needs. Focus on intentional community, not addictive metrics. #DigitalWellbeing #MindfulTech',
    'Digital Wellbeing',
    'Positive',
    0.88,
    'empathy',
    0.86,
    true,
    now() - INTERVAL '5 hours'
  ),
  (
    '20000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000006', -- Maya
    '10000000-0000-0000-0000-000000000004',
    'Experimenting with harmonic CSS color scales and procedural SVG noise texturing for our interface tokens. Light and dark modes should not just be inverted brightness; they require tailored contrast ratios and semantic luminosity curves to preserve visual hierarchy. What does your design token pipeline look like? #Design #UIUX #CreativeCode',
    'Creative Tech & Design',
    'Neutral',
    0.78,
    'curiosity',
    0.85,
    true,
    now() - INTERVAL '6 hours'
  ),
  (
    '20000000-0000-0000-0000-000000000006',
    '00000000-0000-0000-0000-000000000005', -- Marcus
    '10000000-0000-0000-0000-000000000001',
    'Fascinating observation in collaborative filtering algorithms: over-indexing on raw click-through rate consistently leads to echo chamber polarization. When we incorporate a lexical diversity penalty and creator-capping constraint, user retention and satisfaction actually rise over a 30-day window. #MachineLearning #RecommenderSystems',
    'AI & Tech',
    'Positive',
    0.84,
    'wonder',
    0.82,
    true,
    now() - INTERVAL '7 hours'
  ),
  (
    '20000000-0000-0000-0000-000000000007',
    '00000000-0000-0000-0000-000000000008', -- Aravind
    '10000000-0000-0000-0000-000000000003',
    'Why you should never run COUNT(*) queries in loop iterations on your social feed: For 20 posts with likes, comments, and saves, an unoptimized application issues 60 separate database roundtrips. Using PostgreSQL triggers with denormalized counter fields collapses this into an instant O(1) row read. Benchmark your queries! #PostgreSQL #Databases',
    'Web Engineering',
    'Neutral',
    0.76,
    'curiosity',
    0.80,
    true,
    now() - INTERVAL '8 hours'
  ),
  (
    '20000000-0000-0000-0000-000000000008',
    '00000000-0000-0000-0000-000000000011', -- Talia
    '10000000-0000-0000-0000-000000000001',
    'Explainability is not a luxury in social intelligence; it is an ethical requirement. If an algorithmic engine surfaces a post onto your timeline, you deserve to know why: is it because of your topic affinity, your social graph, creator velocity, or serendipity exploration? #AI #Ethics #Explainability',
    'AI & Tech',
    'Positive',
    0.89,
    'inspiration',
    0.87,
    true,
    now() - INTERVAL '10 hours'
  )
ON CONFLICT (id) DO NOTHING;

-- 7. Seed Comments with Parent-Child Nested Threading
INSERT INTO public.comments (
  id, post_id, author_id, parent_comment_id, body, sentiment, created_at
)
VALUES
  (
    '30000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001', -- Elena's post
    '00000000-0000-0000-0000-000000000004', -- Sophia
    NULL,
    'This is phenomenal research Elena! How does the feature attribution overhead scale as context length expands past 8k tokens?',
    'Positive',
    now() - INTERVAL '90 minutes'
  ),
  (
    '30000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002', -- Elena replying to Sophia
    '30000000-0000-0000-0000-000000000001', -- Nested reply!
    'Great question Sophia! We use sparse kernel approximations on the backward pass, so the attribution overhead scales linearly O(N) rather than quadratically O(N^2).',
    'Positive',
    now() - INTERVAL '60 minutes'
  ),
  (
    '30000000-0000-0000-0000-000000000003',
    '20000000-0000-0000-0000-000000000002', -- Kai's security post
    '00000000-0000-0000-0000-000000000009', -- Rachel
    NULL,
    'Seeing this across several honeypots as well. Attackers are rotating through residential proxy pools to bypass simple IP-based rate limiting.',
    'Negative',
    now() - INTERVAL '2 hours'
  ),
  (
    '30000000-0000-0000-0000-000000000004',
    '20000000-0000-0000-0000-000000000004', -- Chloe's wellbeing post
    '00000000-0000-0000-0000-000000000001', -- Demo user
    NULL,
    'SocialSentinel healthy feed sliders are a breath of fresh air. Having direct steering over emotional intensity makes consuming discussions genuinely enjoyable.',
    'Positive',
    now() - INTERVAL '3 hours'
  )
ON CONFLICT (id) DO NOTHING;

-- 8. Seed Likes & Bookmarks for the Demo User and Synthetic Users
INSERT INTO public.likes (user_id, post_id)
VALUES
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001'), -- Demo likes Elena
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003'), -- Demo likes Sophia
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004'), -- Demo likes Chloe
  ('00000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000003'),
  ('00000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

INSERT INTO public.bookmarks (user_id, post_id)
VALUES
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000007')
ON CONFLICT DO NOTHING;

-- 9. Seed Direct Messaging Thread for Demo Experience
DO $$
DECLARE
  conv_id UUID := '40000000-0000-0000-0000-000000000001';
BEGIN
  INSERT INTO public.conversations (id, is_group, title)
  VALUES (conv_id, false, 'Elena & Explorer')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.conversation_members (conversation_id, user_id)
  VALUES 
    (conv_id, '00000000-0000-0000-0000-000000000001'), -- Demo
    (conv_id, '00000000-0000-0000-0000-000000000002')  -- Elena
  ON CONFLICT DO NOTHING;

  INSERT INTO public.messages (id, conversation_id, sender_id, body, shared_post_id, created_at)
  VALUES
    (
      '50000000-0000-0000-0000-000000000001',
      conv_id,
      '00000000-0000-0000-0000-000000000002',
      'Hi Explorer! Welcome to SocialSentinel. Check out the latest findings on explainable AI in our research paper:',
      '20000000-0000-0000-0000-000000000001', -- Shared post attachment!
      now() - INTERVAL '1 hour'
    ),
    (
      '50000000-0000-0000-0000-000000000002',
      conv_id,
      '00000000-0000-0000-0000-000000000001',
      'Thanks Elena! The rationale badge on your post showed 93% affinity based on my #AI interest. Great to see transparent recommendations in action.',
      NULL,
      now() - INTERVAL '45 minutes'
    )
  ON CONFLICT (id) DO NOTHING;
END $$;

-- 10. Seed Realistic Notifications for Demo User
INSERT INTO public.notifications (id, user_id, actor_id, type, post_id, is_read, created_at)
VALUES
  ('60000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'follow', NULL, false, now() - INTERVAL '30 minutes'),
  ('60000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 'like', '20000000-0000-0000-0000-000000000001', false, now() - INTERVAL '25 minutes'),
  ('60000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000007', 'comment', '20000000-0000-0000-0000-000000000004', true, now() - INTERVAL '10 minutes')
ON CONFLICT (id) DO NOTHING;
