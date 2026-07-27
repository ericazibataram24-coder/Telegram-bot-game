import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  maxWidth?: string;
}

export default function Modal({ open, onClose, children, title, maxWidth = 'max-w-md' }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div
        ref={ref}
        className={`relative w-full ${maxWidth} rounded-2xl bg-white dark:bg-ink-900 shadow-2xl border border-ink-200 dark:border-ink-800 animate-slide-up max-h-[90vh] overflow-y-auto`}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-ink-200 dark:border-ink-800 px-5 py-4">
            <h3 className="font-serif text-lg font-semibold text-ink-900 dark:text-ink-50">{title}</h3>
            <button onClick={onClose} className="text-ink-400 hover:text-ink-700 dark:hover:text-ink-200 transition" aria-label="Close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>,
    document.body
  );
}
