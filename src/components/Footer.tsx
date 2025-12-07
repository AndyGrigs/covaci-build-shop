import { Building2, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Building2 className="w-8 h-8 text-blue-500" />
              <span className="text-xl font-bold text-white">СтройМаркет</span>
            </div>
            <p className="text-sm">
              Надежный партнер в сфере качественных строительных материалов и аренды профессионального оборудования.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Быстрые ссылки</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition">О нас</a></li>
              <li><a href="#" className="hover:text-white transition">Товары</a></li>
              <li><a href="#" className="hover:text-white transition">Аренда оборудования</a></li>
              <li><a href="#" className="hover:text-white transition">Контакты</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Служба поддержки</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition">Центр помощи</a></li>
              <li><a href="#" className="hover:text-white transition">Информация о доставке</a></li>
              <li><a href="#" className="hover:text-white transition">Возврат</a></li>
              <li><a href="#" className="hover:text-white transition">Условия и положения</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Контактная информация</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start space-x-2">
                <MapPin className="w-5 h-5 flex-shrink-0" />
                <span>123 Construction Ave, Builder City, BC 12345</span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="w-5 h-5" />
                <span>+1 (555) 123-4567</span>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="w-5 h-5" />
                <span>info@buildmart.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center">
          <p>&copy; 2024 СтройМаркет. Все права защищены.</p>
        </div>
      </div>
    </footer>
  );
}
