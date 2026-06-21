import {
  ArrowRight,
  Package,
  Wrench,
  Truck,
  ShieldCheck,
} from "lucide-react";


interface HomeProps {
  onNavigate: (page: string) => void;
}


export default function Home({ onNavigate }: HomeProps) {
  return (
    <div>

      {/* ===== HERO СЕКЦИЯ ===== */}
      <section className="bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center min-h-[520px] py-12 gap-8">

            {/* Левая часть — текст */}
            <div className="flex-1 z-10">
              <h1 className="text-5xl lg:text-6xl font-black text-gray-900 leading-tight mb-6">
                Все для<br />
                строительства<br />
                <span className="text-gray-900">в одном месте</span>
              </h1>
              <p className="text-gray-500 text-lg mb-8 max-w-md leading-relaxed">
                Строительные материалы, спецтехника в оренду<br />
                и професиональные услуги
              </p>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => onNavigate("products")}
                  className="inline-flex items-center space-x-2 px-7 py-3.5 bg-yellow-400 text-gray-900 font-semibold rounded hover:bg-yellow-500 transition"
                >
                  <span>Каталог товаров</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => onNavigate("equipment")}
                  className="inline-flex items-center space-x-2 px-7 py-3.5 border-2 border-gray-300 text-gray-700 font-semibold rounded hover:border-gray-400 transition"
                >
                  <span>Оренда техники</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Правая часть — изображение */}
            <div className="flex-1 relative flex items-center justify-center">
              <img
                src="https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=2070&auto=format&fit=crop"
                alt="Строительная техника"
                className="w-full max-w-xl object-contain drop-shadow-2xl rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* ===== 4 ПРЕИМУЩЕСТВА под hero ===== */}
        <div className="border-t border-gray-100 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 flex-shrink-0 bg-yellow-50 rounded-full flex items-center justify-center">
                  <Package className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Широкий ассортимент</p>
                  <p className="text-xs text-gray-500">материалов</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 flex-shrink-0 bg-yellow-50 rounded-full flex items-center justify-center">
                  <Wrench className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Современная техника</p>
                  <p className="text-xs text-gray-500">в оренду</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 flex-shrink-0 bg-yellow-50 rounded-full flex items-center justify-center">
                  <Truck className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Доставка по всей</p>
                  <p className="text-xs text-gray-500">Украине</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 flex-shrink-0 bg-yellow-50 rounded-full flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Гарантия качества</p>
                  <p className="text-xs text-gray-500">и надёжности</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}