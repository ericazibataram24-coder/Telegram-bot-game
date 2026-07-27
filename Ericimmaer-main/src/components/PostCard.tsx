import { Clock, ArrowRight } from 'lucide-react';
import type { PostWithRelations } from '@/types/db';
import { formatDate } from '@/lib/utils';
import { useNavigate } from '@/lib/router';

const typeLabel: Record<string, string> = {
  journal: 'Journal',
  article: 'Article',
  research: 'Research',
};

const typeColor: Record<string, string> = {
  journal: 'bg-sage-100 text-sage-700 dark:bg-sage-500/15 dark:text-sage-300',
  article: 'bg-accent-100 text-accent-700 dark:bg-accent-500/15 dark:text-accent-300',
  research: 'bg-ink-200 text-ink-700 dark:bg-ink-700 dark:text-ink-200',
};

export function PostCard({ post, featured = false }: { post: PostWithRelations; featured?: boolean }) {
  const navigate = useNavigate();
  const href = `/post/${post.slug}`;

  return (
    <article
      onClick={() => navigate(href)}
      className={`group cursor-pointer rounded-2xl overflow-hidden bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 card-hover ${featured ? 'md:col-span-2 md:row-span-2' : ''}`}
    >
      <div className={`relative overflow-hidden ${featured ? 'aspect-[16/9] md:aspect-[2/1]' : 'aspect-[16/10]'}`}>
        {post.featured_image ? (
          <img
            src={post.featured_image}
            alt={post.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-ink-200 to-ink-300 dark:from-ink-800 dark:to-ink-700" />
        )}
        <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold ${typeColor[post.type]}`}>
          {typeLabel[post.type]}
        </span>
      </div>
      <div className="p-5">
        <div className="flex items-center gap-3 text-xs text-ink-400 mb-2.5">
          <span>{post.author_name}</span>
          <span>•</span>
          <span>{formatDate(post.published_at)}</span>
        </div>
        <h3 className={`font-serif font-semibold tracking-tight text-ink-900 dark:text-ink-50 group-hover:text-accent-600 dark:group-hover:text-accent-400 transition-colors ${featured ? 'text-2xl sm:text-3xl leading-tight' : 'text-lg leading-snug'}`}>
          {post.title}
        </h3>
        <p className="mt-2.5 text-sm text-ink-500 dark:text-ink-400 line-clamp-2">{post.excerpt}</p>
        <div className="mt-4 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-xs text-ink-400">
            <Clock size={13} /> {post.reading_time_minutes} min read
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-accent-600 dark:text-accent-400 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all">
            Read <ArrowRight size={13} />
          </span>
        </div>
      </div>
    </article>
  );
}

export function PostListItem({ post }: { post: PostWithRelations }) {
  const navigate = useNavigate();
  return (
    <article
      onClick={() => navigate(`/post/${post.slug}`)}
      className="group grid grid-cols-[auto_1fr] sm:grid-cols-[160px_1fr] gap-4 sm:gap-6 cursor-pointer p-3 -mx-3 rounded-xl hover:bg-white dark:hover:bg-ink-900 transition-colors"
    >
      <div className="relative h-24 w-24 sm:h-24 sm:w-full overflow-hidden rounded-lg">
        {post.featured_image ? (
          <img src={post.featured_image} alt={post.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-ink-200 to-ink-300 dark:from-ink-800 dark:to-ink-700" />
        )}
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2 text-xs text-ink-400 mb-1.5">
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${typeColor[post.type]}`}>{typeLabel[post.type]}</span>
          <span>{formatDate(post.published_at)}</span>
          <span className="inline-flex items-center gap-1"><Clock size={11} /> {post.reading_time_minutes}m</span>
        </div>
        <h3 className="font-serif font-semibold text-ink-900 dark:text-ink-50 group-hover:text-accent-600 dark:group-hover:text-accent-400 transition-colors leading-snug">
          {post.title}
        </h3>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400 line-clamp-2 hidden sm:block">{post.excerpt}</p>
      </div>
    </article>
  );
}
