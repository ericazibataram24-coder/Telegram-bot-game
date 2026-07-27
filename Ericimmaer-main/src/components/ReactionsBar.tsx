import { useState } from 'react';
import { Heart, Eye } from 'lucide-react';
import { useReactions } from '@/lib/hooks';
import { cn } from '@/lib/utils';

export default function ReactionsBar({ postId, compact = false }: { postId: string; compact?: boolean }) {
  const { reactions, liked, toggleLike } = useReactions(postId);
  const [burst, setBurst] = useState(false);

  const handleLike = async () => {
    if (!liked) {
      setBurst(true);
      setTimeout(() => setBurst(false), 600);
    }
    await toggleLike();
  };

  const likes = reactions?.likes ?? 0;
  const impressions = reactions?.impressions ?? 0;

  if (compact) {
    return (
      <button
        onClick={handleLike}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all active:scale-90',
          liked
            ? 'text-rose-600 bg-rose-50 dark:bg-rose-500/10'
            : 'text-ink-500 dark:text-ink-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10'
        )}
        aria-pressed={liked}
      >
        <Heart size={15} className={cn(liked && 'fill-rose-500 stroke-rose-500', burst && 'animate-heart-burst')} />
        <span>{likes}</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-4 py-2">
      <button
        onClick={handleLike}
        className={cn(
          'group inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium border transition-all active:scale-95',
          liked
            ? 'text-rose-600 border-rose-200 bg-rose-50 dark:border-rose-500/30 dark:bg-rose-500/10'
            : 'text-ink-600 dark:text-ink-300 border-ink-200 dark:border-ink-700 hover:border-rose-300 hover:text-rose-600 dark:hover:border-rose-500/40'
        )}
        aria-pressed={liked}
      >
        <Heart size={18} className={cn(liked ? 'fill-rose-500 stroke-rose-500' : '', burst && 'animate-heart-burst')} />
        <span className="tabular-nums">{likes}</span>
        <span className="hidden sm:inline">{likes === 1 ? 'like' : 'likes'}</span>
      </button>
      <span className="inline-flex items-center gap-1.5 text-sm text-ink-400">
        <Eye size={16} /> <span className="tabular-nums">{impressions}</span> views
      </span>
    </div>
  );
}
