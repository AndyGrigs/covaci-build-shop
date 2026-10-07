import { Link } from "react-router-dom";
import { Building2, Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Building2 className="w-8 h-8 text-brand" />
              <span className="text-xl font-bold text-white">DenAlex</span>
            </div>
            <p className="text-sm">
              Надежный партнер в сфере качественных строительных материалов и
              аренды профессионального оборудования.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Быстрые ссылки</h3>
            <ul className="space-y-2 text-sm">
              <li><span className="text-gray-400">О нас</span></li>
              <li>
                <Link to="/catalog" className="hover:text-white transition">Товары</Link>
              </li>
              <li>
                <Link to="/arenda-tehniki" className="hover:text-white transition">Аренда оборудования</Link>
              </li>
              <li>
                <Link to="/kontakt" className="hover:text-white transition">Контакты</Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Служба поддержки</h3>
            <ul className="space-y-2 text-sm">
              <li><span className="text-gray-400">Центр помощи</span></li>
              <li><span className="text-gray-400">Информация о доставке</span></li>
              <li><span className="text-gray-400">Возврат</span></li>
              <li><span className="text-gray-400">Условия и положения</span></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">
              Контактная информация
            </h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start space-x-2">
                <MapPin className="w-5 h-5 flex-shrink-0" />
                <span>с. Самурза Taraclia 7419</span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="w-5 h-5" />
                <span>+37378719072</span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="w-5 h-5" />
                <span>+37378790842</span>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="w-5 h-5" />
                <span>covacialexandr@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center">
          <p>&copy; 2024 DenAlex. Все права защищены.</p>
        </div>
      </div>
    </footer>
  );
}
