export type PostType = 'journal' | 'article' | 'research';
export type PostStatus = 'draft' | 'scheduled' | 'published';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  type: PostType;
  category_id: string | null;
  excerpt: string | null;
  body_html: string;
  featured_image: string | null;
  status: PostStatus;
  published_at: string | null;
  author_name: string;
  reading_time_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface PostWithRelations extends Post {
  category?: Category | null;
  tags?: Tag[];
}

export interface Comment {
  id: string;
  post_id: string;
  parent_id: string | null;
  author_name: string;
  author_email: string;
  body: string;
  created_at: string;
  children?: Comment[];
}

export interface Reactions {
  post_id: string;
  likes: number;
  impressions: number;
}

export interface Settings {
  key: string;
  value: string;
  updated_at: string;
}

export type SettingsMap = Record<string, string>;
