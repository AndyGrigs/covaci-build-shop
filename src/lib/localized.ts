import i18n from '../i18n';

type Translatable = {
  name: string;
  name_ro?: string | null;
  description?: string | null;
  description_ro?: string | null;
};

export function locName(item: Translatable): string {
  return i18n.language === 'ro' && item.name_ro?.trim()
    ? item.name_ro
    : item.name;
}

export function locDesc(item: Translatable): string {
  return i18n.language === 'ro' && item.description_ro?.trim()
    ? item.description_ro
    : (item.description ?? '');
}
