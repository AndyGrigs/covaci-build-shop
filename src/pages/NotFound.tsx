import { Link } from 'react-router-dom';
import { Head } from 'vite-react-ssg';
import { BRAND_NAME } from '../lib/brand';
import { useTranslation } from 'react-i18next';

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <Head>
        <title>{t('notFound.pageTitle', { brand: BRAND_NAME })}</title>
        <meta name="robots" content="noindex" />
      </Head>

      <p className="text-6xl font-black text-yellow-600 mb-4">404</p>
      <h1 className="text-3xl font-bold text-gray-900 mb-3">{t('notFound.title')}</h1>
      <p className="text-gray-600 mb-8">{t('notFound.desc')}</p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          to="/"
          className="px-6 py-3 bg-brand text-gray-900 rounded-lg font-medium hover:bg-brand-dark transition"
        >
          {t('notFound.home')}
        </Link>
        <Link
          to="/catalog"
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition"
        >
          {t('notFound.catalog')}
        </Link>
        <Link
          to="/arenda-tehniki"
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition"
        >
          {t('notFound.equipment')}
        </Link>
      </div>
    </div>
  );
}
