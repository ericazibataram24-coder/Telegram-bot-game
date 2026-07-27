/*
# CMS & Blogging Platform — Initial Schema

## Purpose
A full-stack content management system and blogging platform supporting
journal entries, articles, and research papers with a dual-mode editor,
threaded comments, reactions, social sharing, post scheduling, and
ad-injection slots. This is a single-tenant app (no sign-in screen), so all
policies use `TO anon, authenticated` so the anon-key frontend can read and
write shared/public content.

## New Tables
1. `categories` — taxonomy for grouping posts (Journal, Article, Research).
2. `posts` — main content table. `type` distinguishes journal/article/research.
   Supports scheduling via `published_at`, featured image URL, raw HTML body,
   SEO meta, and reading-time computed at read time.
3. `tags` — simple tag list.
4. `post_tags` — many-to-many join between posts and tags.
5. `comments` — threaded/nested comments with parent_id self-reference.
6. `reactions` — aggregate like/impression counters per post (single row per post).
7. `settings` — key/value store for site-wide config (site name, ad code slots,
   theme defaults, etc.).

## Security (RLS)
- RLS enabled on every table.
- All tables use `TO anon, authenticated` with `USING (true)` / `WITH CHECK (true)`
  because this is a single-tenant, intentionally-public blog with no sign-in.
  The CMS editor is part of the same app and writes as the anon role.

## Notes
- `posts.body_html` stores the full HTML authored in the editor (visual or raw mode).
- `posts.excerpt` is a short summary used in cards/lists.
- `posts.status` is `draft` | `scheduled` | `published`.
- `posts.published_at` doubles as the scheduling target; a post is considered
  live when status='published' AND published_at <= now().
- `reactions.impressions` tracks page views; `likes` tracks likes.
- `settings` holds ad-injection code (header/sidebar/in-article) and site config.
- Indexes added for common query paths (slug, type, status, published_at, parent_id).
*/

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- categories
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_categories" ON categories;
CREATE POLICY "anon_read_categories" ON categories FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_categories" ON categories;
CREATE POLICY "anon_insert_categories" ON categories FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_categories" ON categories;
CREATE POLICY "anon_update_categories" ON categories FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_categories" ON categories;
CREATE POLICY "anon_delete_categories" ON categories FOR DELETE
  TO anon, authenticated USING (true);

-- posts
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  type text NOT NULL DEFAULT 'article' CHECK (type IN ('journal','article','research')),
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  excerpt text,
  body_html text NOT NULL DEFAULT '',
  featured_image text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','published')),
  published_at timestamptz,
  author_name text NOT NULL DEFAULT 'Editorial Team',
  reading_time_minutes integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_posts" ON posts;
CREATE POLICY "anon_read_posts" ON posts FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_posts" ON posts;
CREATE POLICY "anon_insert_posts" ON posts FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_posts" ON posts;
CREATE POLICY "anon_update_posts" ON posts FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_posts" ON posts;
CREATE POLICY "anon_delete_posts" ON posts FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_type ON posts(type);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category_id);

-- tags
CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_tags" ON tags;
CREATE POLICY "anon_read_tags" ON tags FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_tags" ON tags;
CREATE POLICY "anon_insert_tags" ON tags FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_tags" ON tags;
CREATE POLICY "anon_update_tags" ON tags FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_tags" ON tags;
CREATE POLICY "anon_delete_tags" ON tags FOR DELETE
  TO anon, authenticated USING (true);

-- post_tags
CREATE TABLE IF NOT EXISTS post_tags (
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);
ALTER TABLE post_tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_post_tags" ON post_tags;
CREATE POLICY "anon_read_post_tags" ON post_tags FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_post_tags" ON post_tags;
CREATE POLICY "anon_insert_post_tags" ON post_tags FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_post_tags" ON post_tags;
CREATE POLICY "anon_delete_post_tags" ON post_tags FOR DELETE
  TO anon, authenticated USING (true);

-- comments
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  author_email text NOT NULL DEFAULT '',
  body text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_comments" ON comments;
CREATE POLICY "anon_read_comments" ON comments FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_comments" ON comments;
CREATE POLICY "anon_insert_comments" ON comments FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_comments" ON comments;
CREATE POLICY "anon_delete_comments" ON comments FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);

-- reactions
CREATE TABLE IF NOT EXISTS reactions (
  post_id uuid PRIMARY KEY REFERENCES posts(id) ON DELETE CASCADE,
  likes integer NOT NULL DEFAULT 0,
  impressions integer NOT NULL DEFAULT 0
);
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_reactions" ON reactions;
CREATE POLICY "anon_read_reactions" ON reactions FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_reactions" ON reactions;
CREATE POLICY "anon_insert_reactions" ON reactions FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_reactions" ON reactions;
CREATE POLICY "anon_update_reactions" ON reactions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

-- settings
CREATE TABLE IF NOT EXISTS settings (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_settings" ON settings;
CREATE POLICY "anon_read_settings" ON settings FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_settings" ON settings;
CREATE POLICY "anon_insert_settings" ON settings FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_settings" ON settings;
CREATE POLICY "anon_update_settings" ON settings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

-- updated_at trigger for posts
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_posts_touch ON posts;
CREATE TRIGGER trg_posts_touch BEFORE UPDATE ON posts
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- auto-update reading time estimate based on body length (~200 wpm from word count of stripped text)
-- We compute reading time on the client when saving instead, to avoid full-text functions.
