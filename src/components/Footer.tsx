import { Link } from "react-router-dom";
import { Building2, Mail, Phone, MapPin } from "lucide-react";
import { BRAND_NAME, BRAND_PHONE_RAW, BRAND_EMAIL_SUPPORT } from "../lib/brand";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Building2 className="w-8 h-8 text-brand" />
              <span className="text-xl font-bold text-white">{BRAND_NAME}</span>
            </div>
            <p className="text-sm">{t('footer.tagline')}</p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">{t('footer.quickLinks')}</h3>
            <ul className="space-y-2 text-sm">
              <li><span className="text-gray-400">{t('footer.about')}</span></li>
              <li>
                <Link to="/catalog" className="hover:text-white transition">{t('footer.products')}</Link>
              </li>
              <li>
                <Link to="/arenda-tehniki" className="hover:text-white transition">{t('footer.equipment')}</Link>
              </li>
              <li>
                <Link to="/kontakt" className="hover:text-white transition">{t('footer.contacts')}</Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">{t('footer.support')}</h3>
            <ul className="space-y-2 text-sm">
              <li><span className="text-gray-400">{t('footer.helpCenter')}</span></li>
              <li><span className="text-gray-400">{t('footer.deliveryInfo')}</span></li>
              <li><span className="text-gray-400">{t('footer.returns')}</span></li>
              <li><span className="text-gray-400">{t('footer.terms')}</span></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">{t('footer.contactInfo')}</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start space-x-2">
                <MapPin className="w-5 h-5 flex-shrink-0" />
                <span>с. Самурза Taraclia 7419</span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="w-5 h-5" />
                <span>{BRAND_PHONE_RAW}</span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="w-5 h-5" />
                <span>+37378790842</span>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="w-5 h-5" />
                <span>{BRAND_EMAIL_SUPPORT}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center">
          <p>&copy; {new Date().getFullYear()} {BRAND_NAME}. {t('footer.rights')}</p>
        </div>
      </div>
    </footer>
  );
}
