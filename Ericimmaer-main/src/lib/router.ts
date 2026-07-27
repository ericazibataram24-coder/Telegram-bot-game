import { useEffect, useState, useCallback } from 'react';

export interface Route {
  path: string;
  params: Record<string, string>;
}

function parseHash(): Route {
  const raw = window.location.hash.replace(/^#/, '') || '/';
  const parts = raw.split('?')[0].split('/').filter(Boolean);
  return { path: '/' + parts.join('/'), params: {} };
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(parseHash());

  useEffect(() => {
    const onHash = () => {
      setRoute(parseHash());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  return route;
}

export function navigate(path: string): void {
  const target = path.startsWith('/') ? path : `/${path}`;
  if (window.location.hash === `#${target}`) {
    window.scrollTo(0, 0);
  } else {
    window.location.hash = target;
  }
}

export function useNavigate() {
  return useCallback((path: string) => navigate(path), []);
}

export function matchRoute(
  route: Route,
  patterns: { pattern: string; build: (params: string[]) => Route }[]
): Route | null {
  const segments = route.path.split('/').filter(Boolean);
  for (const { pattern, build } of patterns) {
    const patSeg = pattern.split('/').filter(Boolean);
    if (patSeg.length !== segments.length) continue;
    const params: string[] = [];
    let ok = true;
    for (let i = 0; i < patSeg.length; i++) {
      if (patSeg[i].startsWith(':')) {
        params.push(segments[i]);
      } else if (patSeg[i] !== segments[i]) {
        ok = false;
        break;
      }
    }
    if (ok) return build(params);
  }
  return null;
}
