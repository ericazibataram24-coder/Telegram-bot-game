import { useState, useEffect } from 'react';
import { Moon, Sun, Menu, X, PenLine, Home, Archive, Search as SearchIcon, LayoutGrid } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useNavigate } from '@/lib/router';
import { cn } from '@/lib/utils';

interface HeaderProps {
  siteName: string;
  onOpenSearch: () => void;
}

export default function Header({ siteName, onOpenSearch }: HeaderProps) {
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [currentPath, setCurrentPath] = useState(window.location.hash.replace(/^#/, '') || '/');

  useEffect(() => {
    const onHash = () => {
      setCurrentPath(window.location.hash.replace(/^#/, '') || '/');
      setMobileOpen(false);
    };
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('hashchange', onHash);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('hashchange', onHash);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const navItems = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Archive', path: '/archive', icon: Archive },
    { label: 'Manage', path: '/admin', icon: LayoutGrid },
    { label: 'Editor', path: '/editor', icon: PenLine },
  ];

  const isActive = (path: string) => (path === '/' ? currentPath === '/' : currentPath.startsWith(path));

  const go = (path: string) => { navigate(path); setMobileOpen(false); };

  return (
    <header className={cn(
      'sticky top-0 z-50 transition-all duration-300',
      scrolled
        ? 'bg-white/85 dark:bg-ink-950/85 backdrop-blur-lg border-b border-ink-200/70 dark:border-ink-800/70 shadow-sm'
        : 'bg-transparent'
    )}>
      <div className="container-page flex h-16 items-center justify-between">
        <button onClick={() => go('/')} className="flex items-center gap-2 group">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-900 dark:bg-accent-500 text-white transition-transform group-hover:scale-105">
            <PenLine size={18} />
          </span>
          <span className="font-serif text-xl font-semibold tracking-tight text-ink-900 dark:text-ink-50">{siteName}</span>
        </button>

        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => go(item.path)}
              className={cn(
                'px-3.5 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive(item.path)
                  ? 'text-accent-600 dark:text-accent-400 bg-accent-50 dark:bg-accent-500/10'
                  : 'text-ink-600 dark:text-ink-300 hover:text-ink-900 dark:hover:text-ink-50 hover:bg-ink-100 dark:hover:bg-ink-800/60'
              )}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenSearch}
            className="tool-btn"
            aria-label="Search"
          >
            <SearchIcon size={18} />
          </button>
          <button onClick={toggle} className="tool-btn" aria-label="Toggle theme">
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="tool-btn md:hidden"
            aria-label="Menu"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="md:hidden border-t border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-950 animate-slide-up">
          <div className="container-page py-3 flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => go(item.path)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive(item.path)
                      ? 'text-accent-600 dark:text-accent-400 bg-accent-50 dark:bg-accent-500/10'
                      : 'text-ink-700 dark:text-ink-200 hover:bg-ink-100 dark:hover:bg-ink-800'
                  )}
                >
                  <Icon size={17} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}
