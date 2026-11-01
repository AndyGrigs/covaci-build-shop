import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import ru from './ru';
import ro from './ro';

const resources = {
  ru: { translation: ru },
  ro: { translation: ro },
};

const baseConfig = {
  resources,
  fallbackLng: 'ru' as const,
  interpolation: { escapeValue: false },
  initImmediate: false, // synchronous init (resources are pre-loaded)
};

// Russian instance — also the global default (used for auth pages)
i18next.use(initReactI18next).init({ ...baseConfig, lng: 'ru' });

// Romanian instance — independent, wrapped in I18nextProvider in LangLayout
const i18nRo = i18next.createInstance();
i18nRo.use(initReactI18next).init({ ...baseConfig, lng: 'ro' });

export { i18nRo };
export default i18next; // Russian / global

/** Current language, read from ?lang= (auth pages) or the /ro path prefix (content pages). */
export function getLanguage(): 'ru' | 'ro' {
  if (typeof window === 'undefined') return 'ru';
  const param = new URLSearchParams(window.location.search).get('lang');
  if (param === 'ro') return 'ro';
  return window.location.pathname.startsWith('/ro') ? 'ro' : 'ru';
}
