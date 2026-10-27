import { useLocation } from 'react-router-dom';

export type Lang = 'ru' | 'ro';

/** Read language from the current URL path. */
export function useLang(): Lang {
  const { pathname } = useLocation();
  return pathname.startsWith('/ro') ? 'ro' : 'ru';
}

/** Return a function that prefixes a base path with /ro when needed. */
export function useLangPath() {
  const lang = useLang();
  return (basePath: string): string => {
    if (lang !== 'ro') return basePath;
    if (basePath === '/') return '/ro';
    return '/ro' + basePath;
  };
}

/** Derive language from a raw path string (no hooks, safe for server/SSG). */
export function langFromPath(path: string): Lang {
  return path.startsWith('/ro') ? 'ro' : 'ru';
}

/** Convert any path to its /ro counterpart. */
export function toRoPath(path: string): string {
  if (path.startsWith('/ro')) return path;
  return '/ro' + (path === '/' ? '' : path);
}

/** Strip /ro prefix from a path. */
export function toRuPath(path: string): string {
  if (!path.startsWith('/ro')) return path;
  return path.slice(3) || '/';
}
