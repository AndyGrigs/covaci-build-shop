import { Link } from 'react-router-dom';
import { Head } from 'vite-react-ssg';
import { BRAND_NAME } from '../lib/brand';

export default function NotFound() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <Head>
        <title>{`Страница не найдена | ${BRAND_NAME}`}</title>
        <meta name="robots" content="noindex" />
      </Head>

      <p className="text-6xl font-black text-yellow-600 mb-4">404</p>
      <h1 className="text-3xl font-bold text-gray-900 mb-3">Страница не найдена</h1>
      <p className="text-gray-600 mb-8">
        Возможно, ссылка устарела или адрес введён с ошибкой.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          to="/"
          className="px-6 py-3 bg-brand text-gray-900 rounded-lg font-medium hover:bg-brand-dark transition"
        >
          На главную
        </Link>
        <Link
          to="/catalog"
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition"
        >
          Каталог товаров
        </Link>
        <Link
          to="/arenda-tehniki"
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition"
        >
          Аренда техники
        </Link>
      </div>
    </div>
  );
}
