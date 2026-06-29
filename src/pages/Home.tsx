import {
  ArrowRight,
  Package,
  Wrench,
  Truck,
  ShieldCheck,
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import type { Database } from "../types/database";

type Category = Database["public"]["Tables"]["categories"]["Row"];
type Equipment = Database["public"]["Tables"]["equipment"]["Row"];


interface HomeProps {
  onNavigate: (page: string) => void;
}

// Статичні зображення для категорий (на случай если в БД нет фото)
const CATEGORY_IMAGES: Record<string, string> = {
  default: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=400&auto=format&fit=crop",
  цемент: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=400&auto=format&fit=crop",
  кирпич: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=400&auto=format&fit=crop",
  изоляция: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=400&auto=format&fit=crop",
  инструменты: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?q=80&w=400&auto=format&fit=crop",
  краска: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?q=80&w=400&auto=format&fit=crop",
  трубы: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=400&auto=format&fit=crop",
};

const EQUIPMENT_IMAGES: Record<string, string> = {
  default: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?q=80&w=600&auto=format&fit=crop",
  экскаватор: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=600&auto=format&fit=crop",
  погрузчик: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=600&auto=format&fit=crop",
  кран: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=600&auto=format&fit=crop",
  бульдозер: "https://images.unsplash.com/photo-1561955553-6dc6aa0cd5fb?q=80&w=600&auto=format&fit=crop",
  каток: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?q=80&w=600&auto=format&fit=crop",
};


export default function Home({ onNavigate }: HomeProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);

  useEffect(() => {
    loadCategories();
    loadEquipment();
  }, []);

  const loadCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .eq("type", "product")
      .order("name")
      .limit(6);
    if (data) setCategories(data);
  };

  const loadEquipment = async () => {
    const { data } = await supabase
      .from("equipment")
      .select("*")
      .eq("is_available", true)
      .order("name")
      .limit(3);
    if (data) setEquipment(data);
  };

  const getEquipmentImage = (item: Equipment): string => {
    if (item.images?.[0]) return item.images[0];
    const nameLower = item.name.toLowerCase();
    const matchedKey = Object.keys(EQUIPMENT_IMAGES).find((key) =>
      nameLower.includes(key)
    );
    return matchedKey ? EQUIPMENT_IMAGES[matchedKey] : EQUIPMENT_IMAGES.default;
  };

   // Функция для получения изображения категории
  const getCategoryImage = (category: Category): string => {
    if (category.image_url) return category.image_url;
    const nameLower = category.name.toLowerCase();
    const matchedKey = Object.keys(CATEGORY_IMAGES).find((key) =>
      nameLower.includes(key)
    );
    return matchedKey ? CATEGORY_IMAGES[matchedKey] : CATEGORY_IMAGES.default;
  };


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
                src="https://i.pinimg.com/1200x/56/69/f7/5669f7b86249c9e966ef3d16847d84a3.jpg"
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

       {/* ===== СЕКЦИЯ "ПОПУЛЯРНЫЕ КАТЕГОРИИ" ===== */}
      <section className="py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Заголовок секции */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              Популярные категории
            </h2>
            <button
              onClick={() => onNavigate("products")}
              className="inline-flex items-center space-x-1 text-gray-600 hover:text-yellow-500 font-medium transition text-sm"
            >
              <span>Все категории</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Сетка категорий */}
          {categories.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => onNavigate("products")}
                  className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-yellow-400 hover:shadow-md transition-all duration-200 text-left"
                >
                  {/* Фото категории */}
                  <div className="h-36 overflow-hidden bg-gray-50">
                    <img
                      src={getCategoryImage(category)}
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  {/* Название и цена */}
                  <div className="p-3">
                    <p className="text-sm font-semibold text-gray-800 leading-tight mb-1">
                      {category.name}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">от 25 грн</span>
                      <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-yellow-500 transition-colors" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            /* Заглушка пока загружаются данные */
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-lg h-52 animate-pulse" />
              ))}
            </div>
          )}

        </div>
      </section>

       {/* ===== СЕКЦИЯ "АРЕНДА ТЕХНИКИ" ===== */}
      <section className="py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-10">

            {/* Левая часть — заголовок и кнопка */}
            <div className="lg:w-64 flex-shrink-0 flex flex-col justify-center">
              {/* Лейбл "АРЕНДА ТЕХНИКИ" */}
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-4 h-4 bg-yellow-400 rounded-sm flex-shrink-0" />
                <span className="text-xs font-bold text-yellow-500 uppercase tracking-widest">
                  Аренда техники
                </span>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 leading-tight mb-4">
                Надёжная техника<br />
                для любых задач
              </h2>

              <p className="text-gray-500 text-sm leading-relaxed mb-8">
                Аренда строительной и спецтехники на выгодных условиях. Опытные операторы и полное техническое обслуживание.
              </p>

              <button
                onClick={() => onNavigate("equipment")}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-yellow-400 text-gray-900 font-semibold rounded hover:bg-yellow-500 transition w-fit"
              >
                <span>Посмотреть технику</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Правая часть — карточки техники */}
            <div className="flex-1 relative">
              {equipment.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {equipment.map((item) => (
                    <div
                      key={item.id}
                      className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                    >
                      {/* Фото */}
                      <div className="h-44 bg-gray-50 overflow-hidden">
                        <img
                          src={getEquipmentImage(item)}
                          alt={item.name}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      {/* Информация */}
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-800 text-sm mb-2 leading-tight">
                          {item.name}
                        </h3>
                        <p className="text-yellow-500 font-bold text-sm mb-3">
                          от {item.daily_rate.toLocaleString("ru-RU")} грн
                          <span className="text-gray-400 font-normal text-xs"> / смена</span>
                        </p>
                        <button
                          onClick={() => onNavigate("equipment")}
                          className="w-full py-2 border border-gray-300 text-gray-700 text-sm rounded hover:border-yellow-400 hover:text-yellow-500 transition"
                        >
                          Подробнее
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Скелетон пока загружается */
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="h-44 bg-gray-100 animate-pulse" />
                      <div className="p-4 space-y-2">
                        <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
                        <div className="h-4 bg-gray-100 rounded animate-pulse w-1/2" />
                        <div className="h-8 bg-gray-100 rounded animate-pulse mt-3" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* ===== ПОЛОСА С 4 ПРЕИМУЩЕСТВАМИ ===== */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 border-t border-gray-100 pt-10">

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 flex-shrink-0 bg-yellow-50 rounded-full flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Большой опыт</p>
                <p className="text-xs text-gray-500">более 10 лет на рынке</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 flex-shrink-0 bg-yellow-50 rounded-full flex items-center justify-center">
                <Wrench className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Индивидуальный подход</p>
                <p className="text-xs text-gray-500">подберём решение для вас</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 flex-shrink-0 bg-yellow-50 rounded-full flex items-center justify-center">
                <Package className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Гибкие условия</p>
                <p className="text-xs text-gray-500">для постоянных клиентов</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 flex-shrink-0 bg-yellow-50 rounded-full flex items-center justify-center">
                <Truck className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Быстрая доставка</p>
                <p className="text-xs text-gray-500">в день заказа</p>
              </div>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}