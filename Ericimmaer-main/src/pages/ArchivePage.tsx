import { useState, useEffect, useMemo } from 'react';
import { Search, NotebookPen, BookOpen, Microscope, X, SlidersHorizontal } from 'lucide-react';
import { useLivePosts, useCategories, useTags } from '@/lib/hooks';
import { PostListItem } from '@/components/PostCard';
import AdSlot from '@/components/AdSlot';
import type { PostType } from '@/types/db';

const typeTabs: { value: PostType | 'all'; label: string; icon: typeof BookOpen }[] = [
  { value: 'all', label: 'All', icon: BookOpen },
  { value: 'journal', label: 'Journal', icon: NotebookPen },
  { value: 'article', label: 'Articles', icon: BookOpen },
  { value: 'research', label: 'Research', icon: Microscope },
];

export default function ArchivePage({ initialType, initialCategory }: { initialType?: string; initialCategory?: string }) {
  const { posts, loading } = useLivePosts();
  const { categories } = useCategories();
  const tags = useTags();

  const [type, setType] = useState<PostType | 'all'>((initialType as PostType) || 'all');
  const [category, setCategory] = useState<string>(initialCategory || 'all');
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    setType((initialType as PostType) || 'all');
    setCategory(initialCategory || 'all');
  }, [initialType, initialCategory]);

  const filtered = useMemo(() => {
    let list = posts;
    if (type !== 'all') list = list.filter((p) => p.type === type);
    if (category !== 'all') {
      const cat = categories.find((c) => c.slug === category);
      if (cat) list = list.filter((p) => p.category_id === cat.id);
    }
    if (tagFilter) {
      // tagFilter is a tag slug; we don't have post_tags joined here, so fetch-based filter isn't available client-side without joins.
      // We approximate by matching tag name in title/excerpt when no join data is present.
      // (Tag filtering is best-effort client-side; the archive primarily filters by type/category/text.)
      list = list.filter((p) => `${p.title} ${p.excerpt ?? ''}`.toLowerCase().includes(tagFilter.replace(/-/g, ' ')));
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((p) => `${p.title} ${p.excerpt ?? ''} ${p.author_name}`.toLowerCase().includes(q));
    }
    return list;
  }, [posts, type, category, tagFilter, query, categories]);

  const hasFilters = type !== 'all' || category !== 'all' || tagFilter || query;

  const clearFilters = () => {
    setType('all'); setCategory('all'); setTagFilter(null); setQuery('');
  };

  return (
    <div className="container-page py-8 sm:py-12 animate-fade-in">
      <header className="mb-8">
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight">Archive</h1>
        <p className="mt-2 text-ink-500 dark:text-ink-400">Every journal entry, article, and research paper in one place.</p>
      </header>

      {/* Type tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        {typeTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.value}
              onClick={() => setType(tab.value)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                type === tab.value
                  ? 'bg-ink-900 dark:bg-accent-500 text-white'
                  : 'bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-700 text-ink-600 dark:text-ink-300 hover:border-ink-400'
              }`}
            >
              <Icon size={15} /> {tab.label}
            </button>
          );
        })}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
        {/* Main column */}
        <div>
          {/* Search + filters row */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by title, author, or topic…"
                className="input-field pl-10"
              />
              {query && (
                <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600">
                  <X size={16} />
                </button>
              )}
            </div>
            {hasFilters && (
              <button onClick={clearFilters} className="btn-ghost shrink-0">
                <X size={15} /> Clear
              </button>
            )}
          </div>

          {/* Results */}
          {loading ? (
            <div className="py-20 flex flex-col items-center gap-3 text-ink-400">
              <div className="h-7 w-7 rounded-full border-2 border-accent-400 border-t-transparent animate-spin" />
              <p className="text-sm">Loading posts…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-ink-400 mb-2">No posts match your filters.</p>
              <button onClick={clearFilters} className="text-sm font-medium text-accent-600 hover:underline">Clear filters</button>
            </div>
          ) : (
            <>
              <p className="text-xs text-ink-400 mb-3">{filtered.length} {filtered.length === 1 ? 'post' : 'posts'}</p>
              <div className="divide-y divide-ink-100 dark:divide-ink-800/60">
                {filtered.map((p) => <PostListItem key={p.id} post={p} />)}
              </div>
            </>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-6 lg:sticky lg:top-24 self-start">
          <div className="rounded-xl border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-ink-900 dark:text-ink-50 mb-3">
              <SlidersHorizontal size={15} /> Categories
            </h3>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setCategory('all')}
                className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${category === 'all' ? 'bg-accent-50 dark:bg-accent-500/10 text-accent-700 dark:text-accent-300 font-medium' : 'text-ink-600 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-800'}`}
              >
                All categories
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.slug)}
                  className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${category === c.slug ? 'bg-accent-50 dark:bg-accent-500/10 text-accent-700 dark:text-accent-300 font-medium' : 'text-ink-600 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-800'}`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {tags.length > 0 && (
            <div className="rounded-xl border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-5">
              <h3 className="text-sm font-semibold text-ink-900 dark:text-ink-50 mb-3">Popular tags</h3>
              <div className="flex flex-wrap gap-2">
                {tags.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTagFilter(tagFilter === t.slug ? null : t.slug)}
                    className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                      tagFilter === t.slug
                        ? 'border-accent-400 bg-accent-50 dark:bg-accent-500/10 text-accent-700 dark:text-accent-300'
                        : 'border-ink-200 dark:border-ink-700 text-ink-500 dark:text-ink-400 hover:border-ink-400'
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <AdSlot slotKey="ad_sidebar" label="Sidebar ad slot" className="h-64 rounded-xl" />
        </aside>
      </div>
    </div>
  );
}
