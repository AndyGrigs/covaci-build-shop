import { Package, Wrench, Shield, Truck, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface HomeProps {
  onNavigate: (page: string) => void;
}

export default function Home({ onNavigate }: HomeProps) {
  // Carousel images - using placeholder images with building themes
  const carouselImages = [
    {
      id: 1,
      url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=2070&auto=format&fit=crop',
      alt: 'Строительные материалы'
    },
    {
      id: 2,
      url: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?q=80&w=2070&auto=format&fit=crop',
      alt: 'Строительная техника'
    },
    {
      id: 3,
      url: 'https://images.unsplash.com/photo-1556089205-7ad460c5e83f?q=80&w=2067&auto=format&fit=crop',
      alt: 'Строительная площадка'
    }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  const goToNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === carouselImages.length - 1 ? 0 : prevIndex + 1
    );
  };

  const goToPrev = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? carouselImages.length - 1 : prevIndex - 1
    );
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div>
      {/* Hero Carousel Section */}
      <section className="relative bg-gradient-to-br from-blue-600 to-blue-800 text-white px-4">
        <div className="max-w-7xl mx-auto">
          <div className="relative overflow-hidden rounded-2xl h-[500px]">
            {/* Carousel Images */}
            <div
              className="flex transition-transform duration-500 ease-in-out h-full"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {carouselImages.map((image) => (
                <div key={image.id} className="w-full flex-shrink-0 relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30 z-10"></div>
                  <img
                    src={image.url}
                    alt={image.alt}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-8 z-20">
                    <div className="max-w-4xl mx-auto text-center">
                      <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
                        Качественные строительные материалы и аренда оборудования
                      </h1>
                      <p className="text-xl mb-8 text-blue-100 max-w-3xl mx-auto">
                        Все, что нужно для ваших строительных проектов: от премиальных материалов до профессионального оборудования.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                          onClick={() => onNavigate('products')}
                          className="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition inline-flex items-center justify-center space-x-2"
                        >
                          <span>Покупка материалов</span>
                          <ArrowRight className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => onNavigate('equipment')}
                          className="px-8 py-4 bg-blue-700 text-white rounded-lg font-semibold hover:bg-blue-600 transition inline-flex items-center justify-center space-x-2"
                        >
                          <span>Аренда оборудования</span>
                          <ArrowRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Carousel Navigation Arrows */}
            <button
              onClick={goToPrev}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 z-30 bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full p-3 transition"
              aria-label="Предыдущее изображение"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>

            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 z-30 bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full p-3 transition"
              aria-label="Следующее изображение"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>

            {/* Carousel Indicators */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-30 flex space-x-2">
              {carouselImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-3 h-3 rounded-full transition ${
                    currentIndex === index ? 'bg-white' : 'bg-white/50'
                  }`}
                  aria-label={`Перейти к слайду ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="hidden md:block bg-white rounded-2xl p-8 shadow-lg -mt-20 relative z-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">500+</div>
                <div className="text-gray-600">Товаров</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">100+</div>
                <div className="text-gray-600">Оборудования</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">5К+</div>
                <div className="text-gray-600">Довольных клиентов</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">24/7</div>
                <div className="text-gray-600">Поддержка</div>
              </div>
            </div>
          </div>

          {/* Mobile stats for smaller screens */}
          <div className="md:hidden bg-white rounded-2xl p-6 shadow-lg -mt-12 relative z-10">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold mb-1">500+</div>
                <div className="text-sm text-gray-600">Товаров</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-1">100+</div>
                <div className="text-sm text-gray-600">Оборудования</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-1">5К+</div>
                <div className="text-sm text-gray-600">Клиентов</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-1">24/7</div>
                <div className="text-sm text-gray-600">Поддержка</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Почему выбирают СтройМаркет?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Лучшее качество материалов и оборудования с непревзойденным сервисом
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Премиальные материалы</h3>
              <p className="text-gray-600">
                Высококачественные строительные материалы от проверенных производителей
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Wrench className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Профессиональное оборудование</h3>
              <p className="text-gray-600">
                Хорошо обслуживаемые инструменты и оборудование для любого проекта
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Truck className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Быстрая доставка</h3>
              <p className="text-gray-600">
                Быстрая и надежная доставка на вашу строительную площадку
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Гарантия качества</h3>
              <p className="text-gray-600">
                100% гарантия удовлетворенности на все товары и аренду
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-gradient-to-br from-slate-100 to-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition">
              <Package className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-2xl font-bold mb-3">Строительные материалы</h3>
              <p className="text-gray-600 mb-6">
                Просмотрите наш обширный каталог строительных материалов: цемент, кирпич, пиломатериалы и многое другое.
              </p>
              <button
                onClick={() => onNavigate('products')}
                className="text-blue-600 font-semibold hover:text-blue-700 inline-flex items-center space-x-2"
              >
                <span>Просмотр материалов</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition">
              <Wrench className="w-12 h-12 text-green-600 mb-4" />
              <h3 className="text-2xl font-bold mb-3">Аренда оборудования</h3>
              <p className="text-gray-600 mb-6">
                Арендуйте профессиональное оборудование для ваших строительных проектов по конкурентным ценам.
              </p>
              <button
                onClick={() => onNavigate('equipment')}
                className="text-green-600 font-semibold hover:text-green-700 inline-flex items-center space-x-2"
              >
                <span>Просмотр оборудования</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Готовы начать свой проект?</h2>
          <p className="text-xl mb-8 text-blue-100">
            Присоединяйтесь к тысячам довольных клиентов, которые доверяют СтройМаркет свои строительные нужды
          </p>
          <button
            onClick={() => onNavigate('register')}
            className="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition inline-flex items-center space-x-2"
          >
            <span>Начать прямо сейчас</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>
    </div>
  );
}
