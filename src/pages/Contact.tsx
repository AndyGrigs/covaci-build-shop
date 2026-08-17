import { MapPin, Phone, Clock, Mail } from 'lucide-react';

export default function Contact() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-2">Контакты</h1>
      <p className="text-gray-500 mb-10">Свяжитесь с нами любым удобным способом</p>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-yellow-50 rounded-full flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">Адрес</p>
              <p className="text-gray-500">с. Самурза Taraclia 7419</p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-yellow-50 rounded-full flex items-center justify-center flex-shrink-0">
              <Phone className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">Телефон</p>
              <a href="tel:+37378719072" className="text-gray-500 hover:text-yellow-500 transition">
                +373 78719072
              </a>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-yellow-50 rounded-full flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">Часы работы</p>
              <p className="text-gray-500">Пн–Пт: 8:00 – 18:00</p>
              <p className="text-gray-500">Сб: 9:00 – 14:00</p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-yellow-50 rounded-full flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">Email</p>
              <a href="mailto:info@denalexshop.md" className="text-gray-500 hover:text-yellow-500 transition">
                info@denalexshop.md
              </a>
            </div>
          </div>
        </div>

        <div className="bg-gray-100 rounded-xl h-64 md:h-auto flex items-center justify-center text-gray-400">
          <p className="text-sm">Карта — скоро</p>
        </div>
      </div>
    </div>
  );
}
