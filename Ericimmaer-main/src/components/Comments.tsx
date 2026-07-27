import { useState, useMemo } from 'react';
import { MessageSquare, CornerDownRight, Send } from 'lucide-react';
import type { Comment } from '@/types/db';
import { useComments } from '@/lib/hooks';
import { relativeTime } from '@/lib/utils';

function buildTree(comments: Comment[]): Comment[] {
  const map = new Map<string, Comment>();
  const roots: Comment[] = [];
  comments.forEach((c) => map.set(c.id, { ...c, children: [] }));
  comments.forEach((c) => {
    const node = map.get(c.id)!;
    if (c.parent_id && map.has(c.parent_id)) {
      map.get(c.parent_id)!.children!.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

function CommentForm({
  parentId,
  onSubmit,
  onCancel,
  placeholder = 'Share your thoughts…',
  compact = false,
}: {
  postId: string;
  parentId: string | null;
  onSubmit: (c: { author_name: string; author_email: string; body: string; parent_id?: string | null }) => Promise<void>;
  onCancel?: () => void;
  placeholder?: string;
  compact?: boolean;
}) {
  const [name, setName] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !body.trim()) { setError('Please enter your name and comment.'); return; }
    setSubmitting(true);
    setError('');
    try {
      await onSubmit({ author_name: name.trim(), author_email: '', body: body.trim(), parent_id: parentId });
      setBody('');
      onCancel?.();
    } catch {
      setError('Could not post your comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className={`mt-3 ${compact ? '' : ''}`}>
      <div className={`flex gap-3 ${compact ? 'flex-col' : 'flex-col sm:flex-row'}`}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="input-field sm:w-48 shrink-0"
          maxLength={60}
        />
        <div className="flex-1 flex gap-2">
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={placeholder}
            className="input-field flex-1"
            maxLength={1000}
          />
          <button type="submit" disabled={submitting} className="btn-primary shrink-0">
            <Send size={15} /> {compact ? 'Reply' : 'Post'}
          </button>
          {onCancel && (
            <button type="button" onClick={onCancel} className="btn-ghost shrink-0 hidden sm:inline-flex">Cancel</button>
          )}
        </div>
      </div>
      {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
    </form>
  );
}

function CommentNode({ comment, depth, addComment }: { comment: Comment; depth: number; addComment: (c: { author_name: string; author_email: string; body: string; parent_id?: string | null }) => Promise<void> }) {
  const [replying, setReplying] = useState(false);
  const palette = ['bg-accent-500', 'bg-sage-500', 'bg-ink-600', 'bg-rose-500', 'bg-sky-500'];
  const colorIdx = comment.id.charCodeAt(0) % palette.length;

  return (
    <div className={depth > 0 ? 'ml-4 sm:ml-6 pl-4 sm:pl-6 border-l-2 border-ink-200 dark:border-ink-700' : ''}>
      <div className="flex gap-3 py-4">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white text-sm font-semibold ${palette[colorIdx]}`}>
          {comment.author_name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="font-medium text-sm text-ink-900 dark:text-ink-100">{comment.author_name}</span>
            <span className="text-xs text-ink-400">{relativeTime(comment.created_at)}</span>
          </div>
          <p className="mt-1 text-sm text-ink-700 dark:text-ink-200 whitespace-pre-wrap break-words">{comment.body}</p>
          {depth < 3 && (
            <button
              onClick={() => setReplying((v) => !v)}
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-ink-400 hover:text-accent-600 transition-colors"
            >
              <CornerDownRight size={13} /> Reply
            </button>
          )}
          {replying && (
            <CommentForm
              postId={comment.post_id}
              parentId={comment.id}
              onSubmit={addComment}
              onCancel={() => setReplying(false)}
              placeholder="Write a reply…"
              compact
            />
          )}
        </div>
      </div>
      {comment.children && comment.children.length > 0 && (
        <div>
          {comment.children.map((child) => (
            <CommentNode key={child.id} comment={child} depth={depth + 1} addComment={addComment} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Comments({ postId }: { postId: string }) {
  const { comments, loading, addComment } = useComments(postId);
  const tree = useMemo(() => buildTree(comments), [comments]);

  return (
    <section className="mt-12">
      <h3 className="flex items-center gap-2 font-serif text-xl font-semibold text-ink-900 dark:text-ink-50 mb-5">
        <MessageSquare size={20} /> Conversation {comments.length > 0 && <span className="text-ink-400 font-sans text-base">({comments.length})</span>}
      </h3>

      <CommentForm postId={postId} parentId={null} onSubmit={addComment} />

      {loading ? (
        <p className="mt-6 text-sm text-ink-400">Loading comments…</p>
      ) : tree.length === 0 ? (
        <p className="mt-8 text-sm text-ink-400 italic">Be the first to share your thoughts.</p>
      ) : (
        <div className="mt-6 divide-y divide-ink-100 dark:divide-ink-800/50">
          {tree.map((c) => (
            <CommentNode key={c.id} comment={c} depth={0} addComment={addComment} />
          ))}
        </div>
      )}
    </section>
  );
}
