import { useState, useEffect, useRef } from 'react';
import { Clock, Calendar, User, ArrowLeft, Tag as TagIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { usePostBySlug, useSettings } from '@/lib/hooks';
import { useNavigate } from '@/lib/router';
import { formatDate } from '@/lib/utils';
import ReactionsBar from '@/components/ReactionsBar';
import Comments from '@/components/Comments';
import ShareModal, { ShareButton } from '@/components/ShareModal';
import AdSlot from '@/components/AdSlot';

const typeLabel: Record<string, string> = { journal: 'Journal', article: 'Article', research: 'Research' };

export default function ArticlePage({ slug }: { slug: string }) {
  const { post, loading } = usePostBySlug(slug);
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [shareOpen, setShareOpen] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const impressionTracked = useRef(false);

  useEffect(() => {
    if (!post || impressionTracked.current) return;
    impressionTracked.current = true;
    (async () => {
      const tracked = JSON.parse(localStorage.getItem('inkwell-impressions') || '[]') as string[];
      if (tracked.includes(post.id)) return;
      localStorage.setItem('inkwell-impressions', JSON.stringify([...tracked, post.id]));
      try {
        await supabase.rpc('increment_impressions', { p_post_id: post.id });
      } catch {
        const existing = await supabase.from('reactions').select('*').eq('post_id', post.id).maybeSingle();
        if (existing.data) {
          await supabase.from('reactions').update({ impressions: existing.data.impressions + 1 }).eq('post_id', post.id);
        } else {
          await supabase.from('reactions').insert({ post_id: post.id, likes: 0, impressions: 1 });
        }
      }
    })();
  }, [post]);

  // Inject in-article ad code into the first <p> after the first heading
  useEffect(() => {
    if (!post || !bodyRef.current || !settings.ad_in_article) return;
    const paragraphs = bodyRef.current.querySelectorAll('p');
    if (paragraphs.length >= 3) {
      const target = paragraphs[2] as HTMLElement;
      if (!bodyRef.current.querySelector('[data-inarticle-ad]')) {
        const adWrap = document.createElement('div');
        adWrap.setAttribute('data-inarticle-ad', 'true');
        adWrap.className = 'my-8';
        adWrap.innerHTML = settings.ad_in_article;
        target.parentNode?.insertBefore(adWrap, target);
        const scripts = Array.from(adWrap.querySelectorAll('script'));
        scripts.forEach((oldScript) => {
          const newScript = document.createElement('script');
          Array.from(oldScript.attributes).forEach((attr) => newScript.setAttribute(attr.name, attr.value));
          newScript.textContent = oldScript.textContent;
          oldScript.parentNode?.replaceChild(newScript, oldScript);
        });
      }
    }
  }, [post, settings.ad_in_article]);

  if (loading) {
    return (
      <div className="container-page py-24 flex flex-col items-center gap-4">
        <div className="h-8 w-8 rounded-full border-2 border-accent-400 border-t-transparent animate-spin" />
        <p className="text-sm text-ink-400">Loading article…</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container-page py-24 text-center animate-fade-in">
        <h1 className="font-serif text-3xl font-semibold mb-3">Post not found</h1>
        <p className="text-ink-400 mb-6">The article you're looking for doesn't exist or has been removed.</p>
        <button onClick={() => navigate('/archive')} className="btn-primary">Back to archive</button>
      </div>
    );
  }

  const shareUrl = `${window.location.origin}${window.location.pathname}#/post/${post.slug}`;

  return (
    <article className="animate-fade-in pb-8">
      {/* Back link */}
      <div className="container-page pt-6">
        <button onClick={() => navigate('/archive')} className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-accent-600 transition-colors">
          <ArrowLeft size={15} /> Archive
        </button>
      </div>

      {/* Hero */}
      <header className="container-page pt-6 pb-8 max-w-3xl mx-auto">
        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-accent-100 text-accent-700 dark:bg-accent-500/15 dark:text-accent-300 mb-4">
          {typeLabel[post.type]}{post.category ? ` · ${post.category.name}` : ''}
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-ink-950 dark:text-ink-50 leading-[1.1]">
          {post.title}
        </h1>
        {post.excerpt && <p className="mt-4 text-lg text-ink-500 dark:text-ink-400 leading-relaxed">{post.excerpt}</p>}
        <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-ink-400">
          <span className="inline-flex items-center gap-1.5"><User size={14} /> {post.author_name}</span>
          <span className="inline-flex items-center gap-1.5"><Calendar size={14} /> {formatDate(post.published_at)}</span>
          <span className="inline-flex items-center gap-1.5"><Clock size={14} /> {post.reading_time_minutes} min read</span>
        </div>
      </header>

      {/* Featured image */}
      {post.featured_image && (
        <div className="container-page mb-8">
          <div className="max-w-4xl mx-auto rounded-2xl overflow-hidden aspect-[16/9] bg-ink-100 dark:bg-ink-800">
            <img src={post.featured_image} alt={post.title} className="h-full w-full object-cover" />
          </div>
        </div>
      )}

      {/* Body + sidebar */}
      <div className="container-page">
        <div className="grid lg:grid-cols-[1fr_240px] gap-10 max-w-4xl mx-auto">
          <div className="min-w-0">
            <div ref={bodyRef} className="prose-article max-w-prose" dangerouslySetInnerHTML={{ __html: post.body_html }} />

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-10 flex flex-wrap gap-2">
                {post.tags.map((t) => (
                  <span key={t.id} className="inline-flex items-center gap-1.5 rounded-full bg-ink-100 dark:bg-ink-800 px-3 py-1.5 text-xs font-medium text-ink-600 dark:text-ink-300">
                    <TagIcon size={12} /> {t.name}
                  </span>
                ))}
              </div>
            )}

            {/* Engagement bar */}
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 py-5 border-y border-ink-200 dark:border-ink-800">
              <ReactionsBar postId={post.id} />
              <ShareButton onClick={() => setShareOpen(true)} />
            </div>

            {/* Comments */}
            <Comments postId={post.id} />
          </div>

          {/* Sticky sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-5">
              <div className="rounded-xl border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-400 mb-2">Author</p>
                <p className="font-medium text-ink-900 dark:text-ink-100">{post.author_name}</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-ink-400 mb-1">Reading time</p>
                <p className="text-sm text-ink-700 dark:text-ink-300">{post.reading_time_minutes} min</p>
              </div>
              <AdSlot slotKey="ad_sidebar" label="Sidebar ad" className="h-64 rounded-xl" />
            </div>
          </aside>
        </div>
      </div>

      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} url={shareUrl} title={post.title} />
    </article>
  );
}
