import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface AdSlotProps {
  /** settings key: ad_header | ad_sidebar | ad_in_article */
  slotKey: string;
  code?: string;
  className?: string;
  label?: string;
}

/**
 * Renders ad/injection code slots. The code comes from site settings
 * (managed in the CMS) and is injected as raw HTML + scripts, compatible
 * with Google AdSense, Monetag, or custom banner scripts. Falls back to a
 * tasteful placeholder when no code is configured.
 */
export default function AdSlot({ slotKey, code, className = '', label }: AdSlotProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [resolvedCode, setResolvedCode] = useState<string>(code ?? '');

  useEffect(() => {
    if (code !== undefined) { setResolvedCode(code); return; }
    let active = true;
    supabase.from('settings').select('value').eq('key', slotKey).maybeSingle().then(({ data }) => {
      if (active && data) setResolvedCode(data.value);
    });
    return () => { active = false; };
  }, [slotKey, code]);

  useEffect(() => {
    if (!ref.current || !resolvedCode) return;
    // Inject raw HTML and execute any <script> tags (required for AdSense/Monetag)
    const container = ref.current;
    container.innerHTML = resolvedCode;
    const scripts = Array.from(container.querySelectorAll('script'));
    scripts.forEach((oldScript) => {
      const newScript = document.createElement('script');
      Array.from(oldScript.attributes).forEach((attr) => newScript.setAttribute(attr.name, attr.value));
      newScript.textContent = oldScript.textContent;
      oldScript.parentNode?.replaceChild(newScript, oldScript);
    });
  }, [resolvedCode]);

  if (!resolvedCode) {
    return (
      <div className={`rounded-lg border border-dashed border-ink-300 dark:border-ink-700 bg-ink-100/40 dark:bg-ink-900/40 flex items-center justify-center text-xs text-ink-400 dark:text-ink-500 ${className}`}>
        <span>{label ?? 'Advertisement'}</span>
      </div>
    );
  }

  return <div ref={ref} className={className} aria-hidden="true" />;
}
