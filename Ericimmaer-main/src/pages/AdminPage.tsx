import { useState, useEffect, useMemo } from 'react';
import { PenLine, Search, Edit2, Trash2, Plus, Eye, Clock, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from '@/lib/router';
import { formatDate, isLivePost, cn } from '@/lib/utils';
import type { Post } from '@/types/db';

const statusStyle: Record<string, string> = {
  published: 'bg-sage-100 text-sage-700 dark:bg-sage-500/15 dark:text-sage-300',
  scheduled: 'bg-accent-100 text-accent-700 dark:bg-accent-500/15 dark:text-accent-300',
  draft: 'bg-ink-200 text-ink-600 dark:bg-ink-700 dark:text-ink-300',
};

export default function AdminPage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'published' | 'scheduled' | 'draft'>('all');

  useEffect(() => {
    let active = true;
    supabase.from('posts').select('*').order('updated_at', { ascending: false }).then(({ data }) => {
      if (active) { setPosts(data ?? []); setLoading(false); }
    });
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    let list = posts;
    if (filter !== 'all') list = list.filter((p) => p.status === filter);
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((p) => p.title.toLowerCase().includes(q));
    return list;
  }, [posts, filter, query]);

  const counts = useMemo(() => ({
    all: posts.length,
    published: posts.filter((p) => p.status === 'published').length,
    scheduled: posts.filter((p) => p.status === 'scheduled').length,
    draft: posts.filter((p) => p.status === 'draft').length,
  }), [posts]);

  const del = async (id: string, title: string) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    await supabase.from('posts').delete().eq('id', id);
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="container-page py-8 sm:py-12 animate-fade-in">
      <header className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink-900 dark:bg-accent-500 text-white">
            <FileText size={20} />
          </span>
          <div>
            <h1 className="font-serif text-2xl font-semibold tracking-tight">Manage posts</h1>
            <p className="text-sm text-ink-400">{posts.length} total · {counts.published} live</p>
          </div>
        </div>
        <button onClick={() => navigate('/editor')} className="btn-primary">
          <Plus size={15} /> New post
        </button>
      </header>

      {/* Filters + search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="inline-flex rounded-lg border border-ink-200 dark:border-ink-700 p-0.5 bg-ink-100 dark:bg-ink-800 self-start">
          {(['all', 'published', 'scheduled', 'draft'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn('rounded-md px-3 py-1.5 text-sm font-medium capitalize transition', filter === f ? 'bg-white dark:bg-ink-900 text-ink-900 dark:text-ink-50 shadow-sm' : 'text-ink-500')}
            >
              {f} <span className="text-xs opacity-60">({counts[f]})</span>
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search posts…" className="input-field pl-10" />
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center gap-3 text-ink-400">
          <div className="h-7 w-7 rounded-full border-2 border-accent-400 border-t-transparent animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-ink-400 mb-4">No posts here yet.</p>
          <button onClick={() => navigate('/editor')} className="btn-primary"><Plus size={15} /> Write your first post</button>
        </div>
      ) : (
        <div className="rounded-2xl border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 overflow-hidden">
          <div className="divide-y divide-ink-100 dark:divide-ink-800/60">
            {filtered.map((p) => {
              const live = isLivePost(p);
              return (
                <div key={p.id} className="flex items-center gap-3 p-4 hover:bg-ink-50 dark:hover:bg-ink-800/40 transition-colors group">
                  <div className="hidden sm:flex h-12 w-12 shrink-0 rounded-lg overflow-hidden bg-ink-100 dark:bg-ink-800">
                    {p.featured_image ? <img src={p.featured_image} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-ink-300"><PenLine size={16} /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={cn('px-2 py-0.5 rounded-full text-[11px] font-semibold', statusStyle[p.status])}>{p.status}</span>
                      <span className="text-xs text-ink-400 capitalize">{p.type}</span>
                      {!live && p.status === 'published' && <span className="text-xs text-accent-600 dark:text-accent-400">· future date</span>}
                    </div>
                    <h3 className="font-medium text-sm text-ink-900 dark:text-ink-100 truncate">{p.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-ink-400 mt-0.5">
                      <span>{p.author_name}</span>
                      <span className="inline-flex items-center gap-1"><Clock size={11} /> {formatDate(p.published_at)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {live && (
                      <button onClick={() => navigate(`/post/${p.slug}`)} className="tool-btn" title="View"><Eye size={16} /></button>
                    )}
                    <button onClick={() => navigate(`/editor/${p.slug}`)} className="tool-btn" title="Edit"><Edit2 size={16} /></button>
                    <button onClick={() => del(p.id, p.title)} className="tool-btn text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10" title="Delete"><Trash2 size={16} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-6 text-center">
        <button onClick={() => navigate('/settings')} className="text-sm text-ink-500 hover:text-accent-600">Manage site settings & ad slots →</button>
      </div>
    </div>
  );
}
