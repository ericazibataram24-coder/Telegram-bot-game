import { useState } from 'react';
import { Share2, Twitter, Facebook, Linkedin, MessageCircle, Send, Link2, Check } from 'lucide-react';
import Modal from './Modal';

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  url: string;
  title: string;
}

export default function ShareModal({ open, onClose, url, title }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const shareLinks = [
    { name: 'X / Twitter', icon: Twitter, color: 'hover:bg-black hover:text-white', url: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}` },
    { name: 'Facebook', icon: Facebook, color: 'hover:bg-blue-600 hover:text-white', url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
    { name: 'LinkedIn', icon: Linkedin, color: 'hover:bg-blue-700 hover:text-white', url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}` },
    { name: 'WhatsApp', icon: MessageCircle, color: 'hover:bg-green-500 hover:text-white', url: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}` },
    { name: 'Telegram', icon: Send, color: 'hover:bg-sky-500 hover:text-white', url: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}` },
  ];

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const el = document.createElement('textarea');
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title, url }); } catch { /* cancelled */ }
    } else {
      copyLink();
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Share this post" maxWidth="max-w-md">
      <div className="grid grid-cols-5 gap-2 mb-5">
        {shareLinks.map((s) => {
          const Icon = s.icon;
          return (
            <a
              key={s.name}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              title={s.name}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl border border-ink-200 dark:border-ink-700 text-ink-600 dark:text-ink-300 transition-colors ${s.color}`}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium">{s.name.split(' ')[0]}</span>
            </a>
          );
        })}
      </div>

      <button
        onClick={nativeShare}
        className="w-full mb-3 inline-flex items-center justify-center gap-2 rounded-lg bg-ink-900 dark:bg-accent-500 text-white px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition"
      >
        <Share2 size={16} /> More sharing options
      </button>

      <div className="flex items-center gap-2 rounded-lg border border-ink-200 dark:border-ink-700 bg-ink-50 dark:bg-ink-800/50 p-1.5 pl-3">
        <Link2 size={16} className="text-ink-400 shrink-0" />
        <input
          readOnly
          value={url}
          className="flex-1 bg-transparent text-sm text-ink-600 dark:text-ink-300 outline-none truncate"
        />
        <button
          onClick={copyLink}
          className={`shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition ${copied ? 'bg-sage-500 text-white' : 'bg-ink-200 dark:bg-ink-700 text-ink-700 dark:text-ink-200 hover:bg-ink-300 dark:hover:bg-ink-600'}`}
        >
          {copied ? <span className="inline-flex items-center gap-1"><Check size={14} /> Copied</span> : 'Copy'}
        </button>
      </div>
    </Modal>
  );
}

export function ShareButton({ onClick, className = '' }: { onClick: () => void; className?: string }) {
  return (
    <button onClick={onClick} className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium border border-ink-200 dark:border-ink-700 text-ink-600 dark:text-ink-300 hover:border-accent-400 hover:text-accent-600 transition-colors ${className}`}>
      <Share2 size={16} /> Share
    </button>
  );
}
