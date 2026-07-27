import { useMemo } from 'react';
import { ArrowRight, Sparkles, BookOpen, Microscope, NotebookPen } from 'lucide-react';
import { useLivePosts, useCategories, useSettings } from '@/lib/hooks';
import { PostCard } from '@/components/PostCard';
import AdSlot from '@/components/AdSlot';
import { useNavigate } from '@/lib/router';

export default function HomePage() {
  const { posts, loading } = useLivePosts();
  const { categories } = useCategories();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const featured = useMemo(() => posts[0], [posts]);
  const rest = useMemo(() => posts.slice(1, 5), [posts]);

  const sections = [
    { type: 'journal', label: 'Journal Entries', icon: NotebookPen, desc: 'Reflections and field notes' },
    { type: 'research', label: 'Research Papers', icon: Microscope, desc: 'Empirical studies and analysis' },
    { type: 'article', label: 'Articles', icon: BookOpen, desc: 'In-depth essays and guides' },
  ];

  if (loading) {
    return (
      <div className="container-page py-24 flex flex-col items-center justify-center gap-4">
        <div className="h-8 w-8 rounded-full border-2 border-accent-400 border-t-transparent animate-spin" />
        <p className="text-sm text-ink-400">Loading the latest stories…</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="container-page pt-10 sm:pt-16 pb-8">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-50 dark:bg-accent-500/10 text-accent-700 dark:text-accent-300 px-3 py-1 text-xs font-semibold mb-5">
            <Sparkles size={13} /> {settings.site_tagline || 'Ideas worth publishing'}
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-ink-950 dark:text-ink-50 leading-[1.05]">
            Stories, research, and ideas — <span className="text-accent-600 dark:text-accent-400">all in one place.</span>
          </h1>
          <p className="mt-5 text-lg text-ink-600 dark:text-ink-300 leading-relaxed max-w-2xl">
            A publishing platform for journal entries, long-form articles, and research papers. Read, react, and join the conversation.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button onClick={() => navigate('/archive')} className="btn-primary">
              Browse the archive <ArrowRight size={16} />
            </button>
            <button onClick={() => navigate('/editor')} className="btn-ghost">
              Start writing
            </button>
          </div>
        </div>
      </section>

      {/* Header ad slot */}
      <section className="container-page mb-12">
        <AdSlot slotKey="ad_header" label="Header ad slot" className="h-24 sm:h-28" />
      </section>

      {/* Featured + grid */}
      {featured && (
        <section className="container-page mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-2xl font-semibold tracking-tight">Latest stories</h2>
            <button onClick={() => navigate('/archive')} className="text-sm font-medium text-accent-600 dark:text-accent-400 hover:underline">
              View all
            </button>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <PostCard post={featured} featured />
            {rest.map((p) => <PostCard key={p.id} post={p} />)}
          </div>
        </section>
      )}

      {/* Type sections */}
      {sections.map((section, idx) => {
        const items = posts.filter((p) => p.type === section.type).slice(0, 3);
        if (items.length === 0) return null;
        const Icon = section.icon;
        return (
          <section key={section.type} className="container-page mb-16">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-100 dark:bg-ink-800 text-ink-700 dark:text-ink-200">
                  <Icon size={18} />
                </span>
                <div>
                  <h2 className="font-serif text-2xl font-semibold tracking-tight">{section.label}</h2>
                  <p className="text-sm text-ink-400">{section.desc}</p>
                </div>
              </div>
              <button onClick={() => navigate(`/archive?type=${section.type}`)} className="text-sm font-medium text-accent-600 dark:text-accent-400 hover:underline shrink-0">
                More →
              </button>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((p) => <PostCard key={p.id} post={p} />)}
              {items.length < 3 && idx === 0 && (
                <div className="hidden lg:block">
                  <AdSlot slotKey="ad_sidebar" label="Sidebar ad slot" className="h-full min-h-[200px] rounded-2xl" />
                </div>
              )}
            </div>
          </section>
        );
      })}

      {/* Categories */}
      {categories.length > 0 && (
        <section className="container-page mb-8">
          <h2 className="font-serif text-2xl font-semibold tracking-tight mb-6">Browse by category</h2>
          <div className="flex flex-wrap gap-3">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => navigate(`/archive?category=${c.slug}`)}
                className="group inline-flex items-center gap-2 rounded-full border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 px-4 py-2 text-sm font-medium text-ink-700 dark:text-ink-200 hover:border-accent-400 hover:text-accent-600 transition-colors"
              >
                {c.name}
                <ArrowRight size={13} className="opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" />
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
