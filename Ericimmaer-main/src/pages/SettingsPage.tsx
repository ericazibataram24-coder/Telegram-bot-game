import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Code2, Type, Check, AlertCircle, Trash2, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useSettings, useCategories } from '@/lib/hooks';

const adSlots = [
  { key: 'ad_header', label: 'Header ad', desc: 'Injected near the top of the homepage. Good for leaderboard banners.' },
  { key: 'ad_sidebar', label: 'Sidebar ad', desc: 'Shown in the archive and article sidebars. Great for sticky units.' },
  { key: 'ad_in_article', label: 'In-article ad', desc: 'Injected after the third paragraph of each article body.' },
];

const textSettings = [
  { key: 'site_name', label: 'Site name' },
  { key: 'site_tagline', label: 'Site tagline' },
  { key: 'default_author', label: 'Default author name' },
];

export default function SettingsPage() {
  const { settings, loading, refresh } = useSettings();
  const { categories } = useCategories();
  const [local, setLocal] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Categories management
  const [newCat, setNewCat] = useState('');
  const [catError, setCatError] = useState('');

  useEffect(() => {
    if (!loading) setLocal({ ...settings });
  }, [settings, loading]);

  const saveAll = async () => {
    setSaving(true);
    setError('');
    try {
      const updates = Object.entries(local).filter(([k, v]) => settings[k] !== v);
      for (const [key, value] of updates) {
        const { error: e } = await supabase.from('settings').upsert({ key, value, updated_at: new Date().toISOString() });
        if (e) throw e;
      }
      refresh();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setError(`Could not save settings: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const addCategory = async () => {
    const name = newCat.trim();
    if (!name) return;
    setCatError('');
    const slug = name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
    const { error } = await supabase.from('categories').insert({ name, slug });
    if (error) {
      setCatError(error.code === '23505' ? 'A category with that name already exists.' : 'Could not add category.');
      return;
    }
    setNewCat('');
    window.location.reload();
  };

  const deleteCategory = async (id: string) => {
    if (!window.confirm('Delete this category? Posts in it will become uncategorized.')) return;
    await supabase.from('categories').delete().eq('id', id);
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="container-page py-24 flex flex-col items-center gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-accent-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="container-page py-8 sm:py-12 max-w-3xl animate-fade-in">
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink-100 dark:bg-ink-800 text-ink-700 dark:text-ink-200">
            <SettingsIcon size={20} />
          </span>
          <div>
            <h1 className="font-serif text-2xl font-semibold tracking-tight">Settings</h1>
            <p className="text-sm text-ink-400">Site identity, ad slots, and categories</p>
          </div>
        </div>
        <button onClick={saveAll} disabled={saving} className="btn-primary">
          {saved ? <><Check size={15} /> Saved</> : <><Save size={15} /> {saving ? 'Saving…' : 'Save changes'}</>}
        </button>
      </header>

      {error && (
        <div className="mb-5 flex items-start gap-2 rounded-lg border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
          <AlertCircle size={16} className="mt-0.5 shrink-0" /> {error}
        </div>
      )}

      {/* Site identity */}
      <Section icon={Type} title="Site identity">
        <div className="grid gap-4">
          {textSettings.map((s) => (
            <div key={s.key}>
              <label className="label">{s.label}</label>
              <input
                value={local[s.key] ?? ''}
                onChange={(e) => setLocal((l) => ({ ...l, [s.key]: e.target.value }))}
                className="input-field"
              />
            </div>
          ))}
        </div>
      </Section>

      {/* Ad injection slots */}
      <Section icon={Code2} title="Ad & code injection slots">
        <p className="text-sm text-ink-400 mb-4">
          Paste ad code (Google AdSense, Monetag, or custom scripts) into the slots below.
          Scripts execute automatically on every page. Leave empty to show a placeholder.
        </p>
        <div className="space-y-4">
          {adSlots.map((slot) => (
            <div key={slot.key}>
              <label className="label">{slot.label}</label>
              <p className="text-xs text-ink-400 mb-1.5">{slot.desc}</p>
              <textarea
                value={local[slot.key] ?? ''}
                onChange={(e) => setLocal((l) => ({ ...l, [slot.key]: e.target.value }))}
                rows={4}
                spellCheck={false}
                placeholder="<script async src='https://…'></script>\n<ins class='adsbygoogle' …></ins>"
                className="input-field font-mono text-xs resize-y"
              />
            </div>
          ))}
        </div>
      </Section>

      {/* Categories */}
      <Section icon={SettingsIcon} title="Categories">
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map((c) => (
            <span key={c.id} className="inline-flex items-center gap-1.5 rounded-full bg-ink-100 dark:bg-ink-800 px-3 py-1.5 text-sm text-ink-700 dark:text-ink-200">
              {c.name}
              <button onClick={() => deleteCategory(c.id)} className="text-ink-400 hover:text-rose-600"><Trash2 size={12} /></button>
            </span>
          ))}
          {categories.length === 0 && <span className="text-sm text-ink-400">No categories yet.</span>}
        </div>
        <div className="flex gap-2">
          <input
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCategory())}
            placeholder="New category name…"
            className="input-field flex-1"
          />
          <button onClick={addCategory} className="btn-ghost shrink-0"><Plus size={15} /> Add</button>
        </div>
        {catError && <p className="mt-2 text-xs text-rose-600">{catError}</p>}
      </Section>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: typeof Type; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8 rounded-2xl border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-6">
      <h2 className="flex items-center gap-2 font-serif text-lg font-semibold text-ink-900 dark:text-ink-50 mb-4">
        <Icon size={18} className="text-ink-400" /> {title}
      </h2>
      {children}
    </section>
  );
}
