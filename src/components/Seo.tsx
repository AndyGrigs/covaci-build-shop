import { Head } from 'vite-react-ssg';
import { BRAND_NAME } from '../lib/brand';

const SITE_URL = 'https://den-alex.com';
const SITE_NAME = BRAND_NAME;
const DEFAULT_IMAGE = `${SITE_URL}/shop.jpg`;

type SeoProps = {
  title: string;
  description: string;
  /** Full canonical path, already language-prefixed (e.g. '/ro/catalog'). */
  path: string;
  image?: string | null;
  type?: 'website' | 'product';
  jsonLd?: object;
};

export default function Seo({
  title,
  description,
  path,
  image,
  type = 'website',
  jsonLd,
}: SeoProps) {
  const isRo = path.startsWith('/ro');
  const ruPath = isRo ? (path.slice(3) || '/') : path;
  const roPath = isRo ? path : '/ro' + (path === '/' ? '' : path);

  const canonicalUrl = `${SITE_URL}${path}`;
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const img = image || DEFAULT_IMAGE;
  const locale = isRo ? 'ro_RO' : 'ru_RU';

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />

      {/* hreflang — tells Google about the language pair */}
      <link rel="alternate" hreflang="ru" href={`${SITE_URL}${ruPath}`} />
      <link rel="alternate" hreflang="ro" href={`${SITE_URL}${roPath}`} />
      <link rel="alternate" hreflang="x-default" href={`${SITE_URL}${ruPath}`} />

      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content={locale} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={img} />
      <meta name="twitter:card" content="summary_large_image" />

      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd).replace(/</g, '\\u003c')}
        </script>
      )}
    </Head>
  );
}
