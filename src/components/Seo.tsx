import { Head } from 'vite-react-ssg';

const SITE_URL = 'https://den-alex.com';
const SITE_NAME = 'DenAlex';
const DEFAULT_IMAGE = `${SITE_URL}/covaci-site.png`;

type SeoProps = {
  title: string;
  description: string;
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
  const url = `${SITE_URL}${path}`;
  const fullTitle = title === SITE_NAME ? title : `${title} | ${SITE_NAME}`;
  const img = image || DEFAULT_IMAGE;

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="ru_RU" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
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
