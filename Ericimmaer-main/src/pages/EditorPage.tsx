import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bold, Italic, Underline, Strikethrough, Heading2, Heading3, List, ListOrdered,
  Quote, Link as LinkIcon, Code, Image as ImageIcon, Eye, Code2, Save,
  Calendar, X, Tag as TagIcon, AlignLeft, Check, Trash2, AlertCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useCategories, useTags, useSettings } from '@/lib/hooks';
import { slugify, estimateReadingTime, excerptFromHtml, cn } from '@/lib/utils';
import { useNavigate } from '@/lib/router';
import type { PostType, PostStatus, Post } from '@/types/db';

type EditorMode = 'visual' | 'raw';

interface EditorState {
  title: string;
  slug: string;
  type: PostType;
  category_id: string | null;
  excerpt: string;
  body_html: string;
  featured_image: string;
  status: PostStatus;
  published_at: string;
  author_name: string;
  tagIds: string[];
}

const emptyState: EditorState = {
  title: '',
  slug: '',
  type: 'article',
  category_id: null,
  excerpt: '',
  body_html: '',
  featured_image: '',
  status: 'draft',
  published_at: '',
  author_name: 'Editorial Team',
  tagIds: [],
};

export default function EditorPage({ editSlug }: { editSlug?: string }) {
  const navigate = useNavigate();
  const { categories } = useCategories();
  const tags = useTags();
  const { settings } = useSettings();

  const [mode, setMode] = useState<EditorMode>('visual');
  const [state, setState] = useState<EditorState>(emptyState);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(!editSlug);
  const [newTag, setNewTag] = useState('');

  const visualRef = useRef<HTMLDivElement>(null);
  const syncingRef = useRef(false);

  // Load existing post for editing
  useEffect(() => {
    if (!editSlug) { setLoaded(true); return; }
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('posts')
        .select('*')
        .eq('slug', editSlug)
        .maybeSingle();
      if (!active || !data) { setLoaded(true); return; }
      const post = data as Post;
      const { data: ptData } = await supabase.from('post_tags').select('tag_id').eq('post_id', post.id);
      const tagIds = (ptData ?? []).map((r: { tag_id: string }) => r.tag_id);
      setEditingId(post.id);
      setState({
        title: post.title,
        slug: post.slug,
        type: post.type,
        category_id: post.category_id,
        excerpt: post.excerpt ?? '',
        body_html: post.body_html,
        featured_image: post.featured_image ?? '',
        status: post.status,
        published_at: post.published_at ? new Date(post.published_at).toISOString().slice(0, 16) : '',
        author_name: post.author_name,
        tagIds,
      });
      setLoaded(true);
    })();
    return () => { active = false; };
  }, [editSlug]);

  // Sync visual editor content when switching to visual mode
  useEffect(() => {
    if (mode === 'visual' && visualRef.current && loaded) {
      visualRef.current.innerHTML = state.body_html;
    }
  }, [mode, loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = (patch: Partial<EditorState>) => setState((s) => ({ ...s, ...patch }));

  const exec = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (visualRef.current) {
      syncingRef.current = true;
      update({ body_html: visualRef.current.innerHTML });
      setTimeout(() => { syncingRef.current = false; }, 0);
    }
  };

  const onVisualInput = useCallback(() => {
    if (visualRef.current) {
      update({ body_html: visualRef.current.innerHTML });
    }
  }, []);

  const insertLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) exec('createLink', url);
  };

  const insertImage = () => {
    const url = window.prompt('Image URL:');
    if (url) exec('insertImage', url);
  };

  const insertCodeBlock = () => {
    const code = window.prompt('Paste your code:');
    if (code && visualRef.current) {
      const pre = document.createElement('pre');
      const codeEl = document.createElement('code');
      codeEl.textContent = code;
      pre.appendChild(codeEl);
      visualRef.current.appendChild(pre);
      onVisualInput();
    }
  };

  const toggleTag = (tagId: string) => {
    setState((s) => ({
      ...s,
      tagIds: s.tagIds.includes(tagId) ? s.tagIds.filter((t) => t !== tagId) : [...s.tagIds, tagId],
    }));
  };

  const addNewTag = async () => {
    const name = newTag.trim();
    if (!name) return;
    const slug = slugify(name);
    const { data } = await supabase.from('tags').insert({ name, slug }).select('*').single();
    if (data) {
      // force a reload of tags by updating local state via a hack: tags come from hook
      window.location.reload();
    }
    setNewTag('');
  };

  const removeTag = async (tagId: string) => {
    // Only remove the association, not the tag itself
    setState((s) => ({ ...s, tagIds: s.tagIds.filter((t) => t !== tagId) }));
  };

  const computeStatus = (): PostStatus => {
    if (state.status === 'scheduled' && state.published_at) {
      const target = new Date(state.published_at);
      if (target > new Date()) return 'scheduled';
      return 'published';
    }
    return state.status;
  };

  const validate = (): string | null => {
    if (!state.title.trim()) return 'Title is required.';
    if (!state.body_html.trim() || state.body_html === '<br>') return 'Post content is empty.';
    return null;
  };

  const save = async (asDraft = false) => {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    setSaving(true);
    setSavedMsg('');

    const status: PostStatus = asDraft ? 'draft' : computeStatus();
    const publishedAt = state.published_at ? new Date(state.published_at).toISOString() : (status === 'published' ? new Date().toISOString() : null);
    const readingTime = estimateReadingTime(state.body_html);
    const slug = state.slug || slugify(state.title);
    const excerpt = state.excerpt || excerptFromHtml(state.body_html);

    const payload = {
      title: state.title.trim(),
      slug,
      type: state.type,
      category_id: state.category_id,
      excerpt,
      body_html: state.body_html,
      featured_image: state.featured_image || null,
      status,
      published_at: publishedAt,
      author_name: state.author_name || settings.default_author || 'Editorial Team',
      reading_time_minutes: readingTime,
    };

    try {
      let postId = editingId;
      if (postId) {
        const { error: e } = await supabase.from('posts').update(payload).eq('id', postId);
        if (e) throw e;
      } else {
        const { data, error: e } = await supabase.from('posts').insert(payload).select('id').single();
        if (e) throw e;
        postId = data.id;
        setEditingId(postId);
      }

      // Sync tags
      await supabase.from('post_tags').delete().eq('post_id', postId);
      if (state.tagIds.length > 0) {
        await supabase.from('post_tags').insert(state.tagIds.map((tag_id) => ({ post_id: postId, tag_id })));
      }

      setSavedMsg(asDraft ? 'Draft saved.' : status === 'scheduled' ? 'Post scheduled.' : 'Post published!');
      setTimeout(() => setSavedMsg(''), 3000);
      if (!asDraft && status === 'published') {
        setTimeout(() => navigate(`/post/${slug}`), 800);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not save the post.';
      setError(`Save failed: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const deletePost = async () => {
    if (!editingId) return;
    if (!window.confirm('Delete this post permanently? This cannot be undone.')) return;
    setSaving(true);
    const { error } = await supabase.from('posts').delete().eq('id', editingId);
    setSaving(false);
    if (error) { setError('Could not delete the post.'); return; }
    navigate('/archive');
  };

  if (!loaded) {
    return (
      <div className="container-page py-24 flex flex-col items-center gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-accent-400 border-t-transparent animate-spin" />
        <p className="text-sm text-ink-400">Loading editor…</p>
      </div>
    );
  }

  const previewHtml = state.body_html;

  return (
    <div className="container-page py-6 sm:py-10 animate-fade-in">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <h1 className="font-serif text-2xl font-semibold tracking-tight">
            {editingId ? 'Edit post' : 'New post'}
          </h1>
          <span className={cn(
            'px-2.5 py-1 rounded-full text-xs font-semibold',
            state.status === 'published' ? 'bg-sage-100 text-sage-700 dark:bg-sage-500/15 dark:text-sage-300'
              : state.status === 'scheduled' ? 'bg-accent-100 text-accent-700 dark:bg-accent-500/15 dark:text-accent-300'
              : 'bg-ink-200 text-ink-600 dark:bg-ink-700 dark:text-ink-300'
          )}>
            {state.status}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {savedMsg && <span className="inline-flex items-center gap-1 text-sm text-sage-600 dark:text-sage-400"><Check size={14} /> {savedMsg}</span>}
          <button onClick={() => save(true)} disabled={saving} className="btn-ghost">
            <Save size={15} /> Save draft
          </button>
          <button onClick={() => save(false)} disabled={saving} className="btn-primary">
            <Check size={15} /> {state.status === 'scheduled' ? 'Schedule' : 'Publish'}
          </button>
          {editingId && (
            <button onClick={deletePost} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-200 dark:border-rose-500/30 px-3 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition">
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-5 flex items-start gap-2 rounded-lg border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
          <AlertCircle size={16} className="mt-0.5 shrink-0" /> {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Editor column */}
        <div className="min-w-0">
          {/* Title */}
          <input
            value={state.title}
            onChange={(e) => {
              update({ title: e.target.value });
              if (!editingId) update({ slug: slugify(e.target.value) });
            }}
            placeholder="Post title…"
            className="w-full bg-transparent font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-ink-950 dark:text-ink-50 placeholder-ink-300 dark:placeholder-ink-600 outline-none mb-2"
          />
          <input
            value={state.slug}
            onChange={(e) => update({ slug: slugify(e.target.value) })}
            placeholder="url-slug"
            className="w-full bg-transparent text-sm text-ink-400 outline-none mb-5 font-mono"
          />

          {/* Mode toggle */}
          <div className="flex items-center justify-between mb-3">
            <div className="inline-flex rounded-lg border border-ink-200 dark:border-ink-700 p-0.5 bg-ink-100 dark:bg-ink-800">
              <button
                onClick={() => setMode('visual')}
                className={cn('inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition', mode === 'visual' ? 'bg-white dark:bg-ink-900 text-ink-900 dark:text-ink-50 shadow-sm' : 'text-ink-500')}
              >
                <Eye size={14} /> Visual
              </button>
              <button
                onClick={() => setMode('raw')}
                className={cn('inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition', mode === 'raw' ? 'bg-white dark:bg-ink-900 text-ink-900 dark:text-ink-50 shadow-sm' : 'text-ink-500')}
              >
                <Code2 size={14} /> HTML
              </button>
            </div>
            {mode === 'raw' && (
              <span className="text-xs text-ink-400">Full HTML, CSS & inline scripts supported</span>
            )}
          </div>

          {/* Visual editor */}
          {mode === 'visual' && (
            <div className="rounded-xl border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 overflow-hidden">
              <div className="flex flex-wrap items-center gap-0.5 border-b border-ink-200 dark:border-ink-800 px-2 py-1.5 bg-ink-50 dark:bg-ink-950/50">
                <ToolBtn onClick={() => exec('bold')} title="Bold"><Bold size={16} /></ToolBtn>
                <ToolBtn onClick={() => exec('italic')} title="Italic"><Italic size={16} /></ToolBtn>
                <ToolBtn onClick={() => exec('underline')} title="Underline"><Underline size={16} /></ToolBtn>
                <ToolBtn onClick={() => exec('strikeThrough')} title="Strikethrough"><Strikethrough size={15} /></ToolBtn>
                <Divider />
                <ToolBtn onClick={() => exec('formatBlock', '<h2>')} title="Heading 2"><Heading2 size={16} /></ToolBtn>
                <ToolBtn onClick={() => exec('formatBlock', '<h3>')} title="Heading 3"><Heading3 size={16} /></ToolBtn>
                <ToolBtn onClick={() => exec('formatBlock', '<p>')} title="Paragraph"><AlignLeft size={16} /></ToolBtn>
                <Divider />
                <ToolBtn onClick={() => exec('insertUnorderedList')} title="Bullet list"><List size={16} /></ToolBtn>
                <ToolBtn onClick={() => exec('insertOrderedList')} title="Numbered list"><ListOrdered size={16} /></ToolBtn>
                <ToolBtn onClick={() => exec('formatBlock', '<blockquote>')} title="Quote"><Quote size={16} /></ToolBtn>
                <ToolBtn onClick={insertCodeBlock} title="Code block"><Code size={16} /></ToolBtn>
                <Divider />
                <ToolBtn onClick={insertLink} title="Link"><LinkIcon size={16} /></ToolBtn>
                <ToolBtn onClick={insertImage} title="Image"><ImageIcon size={16} /></ToolBtn>
              </div>
              <div
                ref={visualRef}
                contentEditable
                suppressContentEditableWarning
                onInput={onVisualInput}
                className="prose-article min-h-[420px] max-w-none p-5 outline-none"
                data-placeholder="Start writing…"
              />
            </div>
          )}

          {/* Raw HTML editor */}
          {mode === 'raw' && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-ink-200 dark:border-ink-800 bg-ink-950 overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 border-b border-ink-800 text-xs font-mono text-ink-400">
                  <Code2 size={13} /> source.html
                </div>
                <textarea
                  value={state.body_html}
                  onChange={(e) => update({ body_html: e.target.value })}
                  spellCheck={false}
                  className="w-full h-[420px] bg-ink-950 text-ink-100 font-mono text-sm p-4 outline-none resize-none leading-relaxed"
                  placeholder="<h2>Hello world</h2>\n<p>Write your HTML here…</p>\n<style>…</style>\n<script>…</script>"
                />
              </div>
              <div className="rounded-xl border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 border-b border-ink-200 dark:border-ink-800 text-xs font-mono text-ink-400">
                  <Eye size={13} /> live preview
                </div>
                <div className="prose-article h-[420px] overflow-y-auto p-4 max-w-none" dangerouslySetInnerHTML={{ __html: previewHtml }} />
              </div>
            </div>
          )}
        </div>

        {/* Settings sidebar */}
        <aside className="space-y-5 lg:sticky lg:top-24 self-start">
          <Panel title="Content type">
            <div className="grid grid-cols-3 gap-1.5">
              {(['journal', 'article', 'research'] as PostType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => update({ type: t })}
                  className={cn('rounded-lg px-2 py-2 text-xs font-medium capitalize transition', state.type === t ? 'bg-accent-500 text-white' : 'bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-300 hover:bg-ink-200 dark:hover:bg-ink-700')}
                >
                  {t}
                </button>
              ))}
            </div>
          </Panel>

          <Panel title="Category">
            <select
              value={state.category_id ?? ''}
              onChange={(e) => update({ category_id: e.target.value || null })}
              className="input-field"
            >
              <option value="">Uncategorized</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Panel>

          <Panel title="Featured image URL">
            <input
              value={state.featured_image}
              onChange={(e) => update({ featured_image: e.target.value })}
              placeholder="https://images.pexels.com/…"
              className="input-field"
            />
            {state.featured_image && (
              <div className="mt-2 rounded-lg overflow-hidden aspect-[16/9] bg-ink-100 dark:bg-ink-800">
                <img src={state.featured_image} alt="Featured preview" className="h-full w-full object-cover" />
              </div>
            )}
          </Panel>

          <Panel title="Tags">
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {state.tagIds.map((tid) => {
                const tag = tags.find((t) => t.id === tid);
                if (!tag) return null;
                return (
                  <span key={tid} className="inline-flex items-center gap-1 rounded-full bg-accent-50 dark:bg-accent-500/10 text-accent-700 dark:text-accent-300 px-2.5 py-1 text-xs font-medium">
                    {tag.name}
                    <button onClick={() => removeTag(tid)} className="hover:text-accent-900"><X size={11} /></button>
                  </span>
                );
              })}
              {state.tagIds.length === 0 && <span className="text-xs text-ink-400">No tags selected</span>}
            </div>
            <div className="max-h-32 overflow-y-auto flex flex-wrap gap-1.5">
              {tags.filter((t) => !state.tagIds.includes(t.id)).map((t) => (
                <button key={t.id} onClick={() => toggleTag(t.id)} className="inline-flex items-center gap-1 rounded-full border border-ink-200 dark:border-ink-700 px-2.5 py-1 text-xs text-ink-500 hover:border-accent-400 hover:text-accent-600 transition">
                  <TagIcon size={10} /> {t.name}
                </button>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <input value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addNewTag())} placeholder="New tag…" className="input-field text-sm" />
              <button onClick={addNewTag} className="btn-ghost shrink-0 text-sm px-3">Add</button>
            </div>
          </Panel>

          <Panel title="Excerpt">
            <textarea
              value={state.excerpt}
              onChange={(e) => update({ excerpt: e.target.value })}
              placeholder="Short summary (auto-generated if empty)"
              rows={3}
              className="input-field resize-none"
            />
          </Panel>

          <Panel title="Author">
            <input value={state.author_name} onChange={(e) => update({ author_name: e.target.value })} className="input-field" />
          </Panel>

          <Panel title="Publish settings">
            <div className="flex items-center gap-1.5 mb-3">
              {(['draft', 'published', 'scheduled'] as PostStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => update({ status: s, })}
                  className={cn('flex-1 rounded-lg px-2 py-2 text-xs font-medium capitalize transition', state.status === s ? 'bg-ink-900 dark:bg-accent-500 text-white' : 'bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-300')}
                >
                  {s}
                </button>
              ))}
            </div>
            {state.status === 'scheduled' && (
              <div>
                <label className="label flex items-center gap-1.5"><Calendar size={13} /> Schedule for</label>
                <input
                  type="datetime-local"
                  value={state.published_at}
                  onChange={(e) => update({ published_at: e.target.value })}
                  className="input-field"
                />
                <p className="mt-1.5 text-xs text-ink-400">The post goes live automatically at this time.</p>
              </div>
            )}
            {state.status === 'published' && state.published_at && (
              <p className="text-xs text-ink-400">Publishes immediately. Scheduled time ignored for published posts.</p>
            )}
          </Panel>
        </aside>
      </div>
    </div>
  );
}

function ToolBtn({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
  return <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={onClick} title={title} className="tool-btn">{children}</button>;
}
function Divider() { return <span className="w-px h-5 bg-ink-200 dark:bg-ink-700 mx-1" />; }
function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-400 mb-3">{title}</h3>
      {children}
    </div>
  );
}
