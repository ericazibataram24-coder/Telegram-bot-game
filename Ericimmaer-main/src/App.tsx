import { useState, useEffect } from 'react';
import { ThemeProvider } from '@/context/ThemeContext';
import { useRoute, useNavigate } from '@/lib/router';
import { useSettings } from '@/lib/hooks';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SearchModal from '@/components/SearchModal';
import HomePage from '@/pages/HomePage';
import ArchivePage from '@/pages/ArchivePage';
import ArticlePage from '@/pages/ArticlePage';
import EditorPage from '@/pages/EditorPage';
import SettingsPage from '@/pages/SettingsPage';
import AdminPage from '@/pages/AdminPage';

function AppRoutes() {
  const route = useRoute();
  const { settings } = useSettings();
  const [searchOpen, setSearchOpen] = useState(false);

  // Keyboard shortcut for search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const siteName = settings.site_name || 'Inkwell';
  const tagline = settings.site_tagline || 'Ideas worth publishing';

  const renderPage = () => {
    const path = route.path;
    if (path === '/') return <HomePage />;
    if (path === '/archive') {
      const params = parseQuery();
      return <ArchivePage initialType={params.type} initialCategory={params.category} />;
    }
    if (path.startsWith('/post/')) {
      const slug = path.split('/')[2];
      return <ArticlePage slug={decodeURIComponent(slug)} />;
    }
    if (path === '/editor') return <EditorPage />;
    if (path.startsWith('/editor/')) {
      const slug = path.split('/')[2];
      return <EditorPage editSlug={decodeURIComponent(slug)} />;
    }
    if (path === '/settings') return <SettingsPage />;
    if (path === '/admin') return <AdminPage />;
    return <NotFound />;
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header siteName={siteName} onOpenSearch={() => setSearchOpen(true)} />
      <main className="flex-1">{renderPage()}</main>
      <Footer siteName={siteName} tagline={tagline} />
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}

function parseQuery(): Record<string, string> {
  const raw = window.location.hash.split('?')[1] || '';
  const params: Record<string, string> = {};
  new URLSearchParams(raw).forEach((v, k) => { params[k] = v; });
  return params;
}

function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="container-page py-24 text-center animate-fade-in">
      <h1 className="font-serif text-5xl font-semibold text-ink-300 dark:text-ink-700">404</h1>
      <p className="mt-3 text-ink-500 mb-6">This page wandered off.</p>
      <button onClick={() => navigate('/')} className="btn-primary">Back home</button>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppRoutes />
    </ThemeProvider>
  );
}
