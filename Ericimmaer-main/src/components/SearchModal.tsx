import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, Clock, ArrowRight } from 'lucide-react';
import Modal from './Modal';
import { useLivePosts } from '@/lib/hooks';
import { useNavigate } from '@/lib/router';

const typeLabel: Record<string, string> = { journal: 'Journal', article: 'Article', research: 'Research' };

export default function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { posts } = useLivePosts();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return posts
      .filter((p) => {
        const haystack = `${p.title} ${p.excerpt ?? ''} ${p.author_name} ${typeLabel[p.type]}`.toLowerCase();
        return haystack.includes(q);
      })
      .slice(0, 8);
  }, [query, posts]);

  const go = (slug: string) => {
    navigate(`/post/${slug}`);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-xl">
      <div className="flex items-center gap-3 border-b border-ink-200 dark:border-ink-800 pb-3 mb-3">
        <Search size={18} className="text-ink-400" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search posts, authors, topics…"
          className="flex-1 bg-transparent text-base text-ink-900 dark:text-ink-100 outline-none placeholder-ink-400"
        />
        <button onClick={onClose} className="text-ink-400 hover:text-ink-700 dark:hover:text-ink-200">
          <X size={18} />
        </button>
      </div>

      {query && results.length === 0 && (
        <p className="py-8 text-center text-sm text-ink-400">No posts found for "{query}"</p>
      )}

      {!query && (
        <p className="py-8 text-center text-sm text-ink-400">Start typing to search across all published posts.</p>
      )}

      {results.length > 0 && (
        <ul className="max-h-80 overflow-y-auto -mr-2 pr-2">
          {results.map((p) => (
            <li key={p.id}>
              <button
                onClick={() => go(p.slug)}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors text-left group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs text-ink-400 mb-0.5">
                    <span>{typeLabel[p.type]}</span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1"><Clock size={11} /> {p.reading_time_minutes}m</span>
                  </div>
                  <p className="font-medium text-sm text-ink-900 dark:text-ink-100 truncate group-hover:text-accent-600 dark:group-hover:text-accent-400">{p.title}</p>
                </div>
                <ArrowRight size={16} className="text-ink-300 group-hover:text-accent-500 transition-colors shrink-0" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
