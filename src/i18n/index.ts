import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ru from './ru';
import ro from './ro';

const STORAGE_KEY = 'lang';

function getInitialLanguage(): string {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'ro' || stored === 'ru') return stored;
  }
  return 'ru';
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      ru: { translation: ru },
      ro: { translation: ro },
    },
    lng: getInitialLanguage(),
    fallbackLng: 'ru',
    interpolation: { escapeValue: false },
  });

export function setLanguage(lang: 'ru' | 'ro') {
  i18n.changeLanguage(lang);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, lang);
  }
}

export function getLanguage(): 'ru' | 'ro' {
  return (i18n.language as 'ru' | 'ro') || 'ru';
}

export default i18n;
