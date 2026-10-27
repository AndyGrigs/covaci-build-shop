import { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toRoPath } from './useLang';

const PAGE_TO_PATH: Record<string, string> = {
  home: '/',
  products: '/catalog',
  equipment: '/arenda-tehniki',
  cart: '/korzina',
  cabinet: '/kabinet',
  admin: '/admin',
  login: '/vkhod',
  register: '/registraciya',
  contact: '/kontakt',
};

export function useAppNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isRo = pathname.startsWith('/ro');

  return useCallback((page: string) => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    let path: string;
    if (page.startsWith('product-detail:')) {
      path = '/tovar/' + page.split(':')[1];
    } else if (page.startsWith('products:')) {
      path = '/catalog/' + page.split(':')[1];
    } else {
      path = PAGE_TO_PATH[page] ?? '/';
    }

    const isAuthPage = path.startsWith('/vkhod') || path.startsWith('/registraciya') ||
      path.startsWith('/vosstanovlenie') || path.startsWith('/admin');

    // Auth pages stay at their fixed paths but carry ?lang=ro so the form knows the user's language.
    navigate(isRo && isAuthPage ? path + '?lang=ro' : isRo ? toRoPath(path) : path);
  }, [navigate, isRo]);
}
