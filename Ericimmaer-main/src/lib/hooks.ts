import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Category, Tag, Post, PostWithRelations, Comment, Reactions, SettingsMap } from '@/types/db';
import { isLivePost } from '@/lib/utils';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    supabase.from('categories').select('*').order('name').then(({ data }) => {
      if (active) {
        setCategories(data ?? []);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, []);
  return { categories, loading };
}

export function useTags() {
  const [tags, setTags] = useState<Tag[]>([]);
  useEffect(() => {
    supabase.from('tags').select('*').order('name').then(({ data }) => {
      setTags(data ?? []);
    });
  }, []);
  return tags;
}

export function useSettings(): { settings: SettingsMap; loading: boolean; refresh: () => void } {
  const [settings, setSettings] = useState<SettingsMap>({});
  const [loading, setLoading] = useState(true);
  const fetch = useCallback(() => {
    supabase.from('settings').select('*').then(({ data }) => {
      const map: SettingsMap = {};
      (data ?? []).forEach((s: { key: string; value: string }) => { map[s.key] = s.value; });
      setSettings(map);
      setLoading(false);
    });
  }, []);
  useEffect(() => { fetch(); }, [fetch]);
  return { settings, loading, refresh: fetch };
}

export function useLivePosts(): { posts: Post[]; loading: boolean } {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    supabase
      .from('posts')
      .select('*')
      .order('published_at', { ascending: false, nullsFirst: false })
      .then(({ data }) => {
        if (!active) return;
        const live = (data ?? []).filter(isLivePost);
        setPosts(live);
        setLoading(false);
      });
    return () => { active = false; };
  }, []);
  return { posts, loading };
}

export function usePostBySlug(slug: string | null): { post: PostWithRelations | null; loading: boolean } {
  const [post, setPost] = useState<PostWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    if (!slug) { setPost(null); setLoading(false); return; }
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from('posts')
        .select('*, category:categories(*)')
        .eq('slug', slug)
        .maybeSingle();
      if (!active) return;
      if (data) {
        const { data: ptData } = await supabase
          .from('post_tags')
          .select('tag:tags(*)')
          .eq('post_id', data.id);
        const tags = ((ptData ?? []) as unknown as Array<{ tag: Tag }>).map((r) => r.tag).filter(Boolean);
        setPost({ ...data, tags });
      } else {
        setPost(null);
      }
      setLoading(false);
    })();
    return () => { active = false; };
  }, [slug]);
  return { post, loading };
}

export function useComments(postId: string | null): {
  comments: Comment[];
  loading: boolean;
  addComment: (c: { author_name: string; author_email: string; body: string; parent_id?: string | null }) => Promise<void>;
  refresh: () => void;
} {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const fetch = useCallback(async () => {
    if (!postId) { setComments([]); return; }
    const { data } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    setComments(data ?? []);
    setLoading(false);
  }, [postId]);

  useEffect(() => { fetch(); }, [fetch]);

  const addComment = useCallback(async (c: { author_name: string; author_email: string; body: string; parent_id?: string | null }) => {
    const { data } = await supabase
      .from('comments')
      .insert({ post_id: postId, parent_id: c.parent_id ?? null, author_name: c.author_name, author_email: c.author_email, body: c.body })
      .select('*')
      .single();
    if (data) setComments((prev) => [...prev, data]);
  }, [postId]);

  return { comments, loading, addComment, refresh: fetch };
}

export function useReactions(postId: string | null): {
  reactions: Reactions | null;
  liked: boolean;
  toggleLike: () => Promise<void>;
  trackImpression: () => Promise<void>;
} {
  const [reactions, setReactions] = useState<Reactions | null>(null);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    let active = true;
    setLiked(false);
    if (!postId) { setReactions(null); return; }
    (async () => {
      const { data } = await supabase.from('reactions').select('*').eq('post_id', postId).maybeSingle();
      if (!active) return;
      if (data) setReactions(data);
      const stored = JSON.parse(localStorage.getItem('inkwell-likes') || '[]') as string[];
      if (stored.includes(postId)) setLiked(true);
    })();
    return () => { active = false; };
  }, [postId]);

  const toggleLike = useCallback(async () => {
    if (!postId) return;
    const stored = JSON.parse(localStorage.getItem('inkwell-likes') || '[]') as string[];
    if (liked) {
      setLiked(false);
      setReactions((r) => r ? { ...r, likes: Math.max(0, r.likes - 1) } : r);
      localStorage.setItem('inkwell-likes', JSON.stringify(stored.filter((id) => id !== postId)));
      try { await supabase.rpc('decrement_likes', { p_post_id: postId }); } catch { /* ignore */ }
      const { data } = await supabase.from('reactions').select('*').eq('post_id', postId).maybeSingle();
      if (data) setReactions(data);
    } else {
      setLiked(true);
      setReactions((r) => r ? { ...r, likes: r.likes + 1 } : { post_id: postId, likes: 1, impressions: 0 });
      localStorage.setItem('inkwell-likes', JSON.stringify([...stored, postId]));
      try {
        await supabase.rpc('increment_likes', { p_post_id: postId });
      } catch {
        const existing = await supabase.from('reactions').select('*').eq('post_id', postId).maybeSingle();
        if (existing.data) {
          await supabase.from('reactions').update({ likes: existing.data.likes + 1 }).eq('post_id', postId);
        } else {
          await supabase.from('reactions').insert({ post_id: postId, likes: 1, impressions: 0 });
        }
      }
      const { data: refreshed } = await supabase.from('reactions').select('*').eq('post_id', postId).maybeSingle();
      if (refreshed) setReactions(refreshed);
    }
  }, [postId, liked]);

  const trackImpression = useCallback(async () => {
    if (!postId) return;
    const tracked = JSON.parse(localStorage.getItem('inkwell-impressions') || '[]') as string[];
    if (tracked.includes(postId)) return;
    localStorage.setItem('inkwell-impressions', JSON.stringify([...tracked, postId]));
    try {
      await supabase.rpc('increment_impressions', { p_post_id: postId });
    } catch {
      const existing = await supabase.from('reactions').select('*').eq('post_id', postId).maybeSingle();
      if (existing.data) {
        await supabase.from('reactions').update({ impressions: existing.data.impressions + 1 }).eq('post_id', postId);
      } else {
        await supabase.from('reactions').insert({ post_id: postId, likes: 0, impressions: 1 });
      }
    }
  }, [postId]);

  return { reactions, liked, toggleLike, trackImpression };
}
