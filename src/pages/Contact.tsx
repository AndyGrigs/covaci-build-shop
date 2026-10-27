import { MapPin, Phone, Clock, Mail } from 'lucide-react';
import Seo from '../components/Seo';
import { BRAND_NAME, BRAND_URL, BRAND_PHONE, BRAND_PHONE_RAW } from '../lib/brand';
import { useTranslation } from 'react-i18next';
import { useLangPath } from '../hooks/useLang';

export default function Contact() {
  const { t } = useTranslation();
  const lp = useLangPath();

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Seo
        title={t('seo.contacts.title')}
        description={t('seo.contacts.desc', { brand: BRAND_NAME })}
        path={lp('/kontakt')}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'LocalBusiness',
          name: BRAND_NAME,
          url: BRAND_URL,
          telephone: BRAND_PHONE,
          image: `${BRAND_URL}/shop.jpg`,
          address: {
            '@type': 'PostalAddress',
            streetAddress: 'с. Самурза',
            addressLocality: 'Taraclia',
            postalCode: '7419',
            addressCountry: 'MD',
          },
          openingHoursSpecification: [
            {
              '@type': 'OpeningHoursSpecification',
              dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
              opens: '08:00',
              closes: '18:00',
            },
            {
              '@type': 'OpeningHoursSpecification',
              dayOfWeek: ['Saturday'],
              opens: '09:00',
              closes: '14:00',
            },
          ],
        }}
      />
      <h1 className="text-4xl font-bold text-gray-900 mb-2">{t('contact.title')}</h1>
      <p className="text-gray-500 mb-10">{t('contact.subtitle')}</p>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-yellow-50 rounded-full flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">{t('contact.address')}</p>
              <p className="text-gray-500">с. Самурза Taraclia 7419</p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-yellow-50 rounded-full flex items-center justify-center flex-shrink-0">
              <Phone className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">{t('contact.phone')}</p>
              <a href={`tel:${BRAND_PHONE_RAW}`} className="text-gray-500 hover:text-yellow-500 transition">
                {BRAND_PHONE}
              </a>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-yellow-50 rounded-full flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">{t('contact.hours')}</p>
              <p className="text-gray-500">{t('contact.hoursWeek')}</p>
              <p className="text-gray-500">{t('contact.hoursSat')}</p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-yellow-50 rounded-full flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">{t('contact.email')}</p>
              <a href="mailto:info@denalexshop.md" className="text-gray-500 hover:text-yellow-500 transition">
                info@denalexshop.md
              </a>
            </div>
          </div>
        </div>

        <div className="bg-gray-100 rounded-xl h-64 md:h-auto flex items-center justify-center text-gray-400">
          <p className="text-sm">{t('contact.mapSoon')}</p>
        </div>
      </div>
    </div>
  );
}
