import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

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
  return useCallback((page: string) => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (page.startsWith('product-detail:')) {
      navigate('/tovar/' + page.split(':')[1]);
    } else if (page.startsWith('products:')) {
      navigate('/catalog/' + page.split(':')[1]);
    } else {
      navigate(PAGE_TO_PATH[page] ?? '/');
    }
  }, [navigate]);
}
