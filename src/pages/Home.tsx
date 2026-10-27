import {
  ArrowRight,
  Package,
  Wrench,
  Truck,
  ShieldCheck,
} from "lucide-react";
import Seo from '../components/Seo';
import { useState, useEffect } from "react";
import { Link, useLoaderData } from "react-router-dom";
import { useAppNav } from "../hooks/useAppNav";
import { supabase } from "../lib/supabase";
import type { Database } from "../types/database";
import type { HomeLoaderData } from "../lib/homeLoader";
import { BRAND_NAME, BRAND_URL, BRAND_PHONE } from "../lib/brand";
import { useTranslation } from "react-i18next";

type Category = Database["public"]["Tables"]["categories"]["Row"];
type Equipment = Database["public"]["Tables"]["equipment"]["Row"];

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

export default function Home() {
  const { t } = useTranslation();
  const onNavigate = useAppNav();
  const initial = useLoaderData() as HomeLoaderData | undefined;
  const [categories, setCategories] = useState<Category[]>(initial?.categories ?? []);
  const [equipment, setEquipment] = useState<Equipment[]>(initial?.equipment ?? []);
  const [loading, setLoading] = useState(!initial);

  useEffect(() => {
    const loadCategories = supabase
      .from("categories")
      .select("*")
      .eq("type", "product")
      .order("name")
      .limit(6)
      .then(({ data }) => { if (data) setCategories(data); });

    const loadEquipment = supabase
      .from("equipment")
      .select("*")
      .eq("is_available", true)
      .eq("is_archived", false)
      .order("name")
      .limit(3)
      .then(({ data }) => { if (data) setEquipment(data); });

    Promise.all([loadCategories, loadEquipment]).finally(() => setLoading(false));
  }, []);

  const getEquipmentImage = (item: Equipment): string => {
    if (item.images?.[0]) return item.images[0];
    const nameLower = item.name.toLowerCase();
    const matchedKey = Object.keys(EQUIPMENT_IMAGES).find((key) =>
      nameLower.includes(key)
    );
    return matchedKey ? EQUIPMENT_IMAGES[matchedKey] : EQUIPMENT_IMAGES.default;
  };

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
      <Seo
        title={t('seo.home.title', { brand: BRAND_NAME })}
        description={t('seo.home.desc', { brand: BRAND_NAME })}
        path="/"
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

      {/* HERO */}
      <section className="bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center min-h-[520px] py-12 gap-8">

            <div className="flex-1 z-10">
              <h1 className="text-5xl lg:text-6xl font-black text-gray-900 leading-tight mb-6">
                {t('home.hero.line1')}<br />
                {t('home.hero.line2')}<br />
                <span className="text-gray-900">{t('home.hero.line3')}</span>
              </h1>
              <p className="text-gray-500 text-lg mb-8 max-w-md leading-relaxed">
                {t('home.hero.subtitle').split('\n').map((line, i) => (
                  <span key={i}>{line}{i === 0 && <br />}</span>
                ))}
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/catalog"
                  className="inline-flex items-center space-x-2 px-7 py-3.5 bg-yellow-400 text-gray-900 font-semibold rounded hover:bg-yellow-500 transition"
                >
                  <span>{t('home.hero.catalogBtn')}</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/arenda-tehniki"
                  className="inline-flex items-center space-x-2 px-7 py-3.5 border-2 border-gray-300 text-gray-700 font-semibold rounded hover:border-gray-400 transition"
                >
                  <span>{t('home.hero.equipmentBtn')}</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>

            <div className="flex-1 relative flex items-center justify-center">
              <img
                src="/shop.jpg"
                alt={t('home.hero.imgAlt')}
                className="w-full max-w-xl object-contain drop-shadow-2xl rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Features strip */}
        <div className="border-t border-gray-100 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 flex-shrink-0 bg-yellow-50 rounded-full flex items-center justify-center">
                  <Package className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{t('home.feat.range')}</p>
                  <p className="text-xs text-gray-500">{t('home.feat.rangeSub')}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 flex-shrink-0 bg-yellow-50 rounded-full flex items-center justify-center">
                  <Wrench className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{t('home.feat.modern')}</p>
                  <p className="text-xs text-gray-500">{t('home.feat.modernSub')}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 flex-shrink-0 bg-yellow-50 rounded-full flex items-center justify-center">
                  <Truck className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{t('home.feat.delivery')}</p>
                  <p className="text-xs text-gray-500">{t('home.feat.deliverySub')}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 flex-shrink-0 bg-yellow-50 rounded-full flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{t('home.feat.quality')}</p>
                  <p className="text-xs text-gray-500">{t('home.feat.qualitySub')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular categories */}
      {(loading || categories.length > 0) && (
        <section className="py-14 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">
                {t('home.categories.title')}
              </h2>
              <button
                onClick={() => onNavigate("products")}
                className="inline-flex items-center space-x-1 text-gray-600 hover:text-yellow-500 font-medium transition text-sm"
              >
                <span>{t('home.categories.all')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {!loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {categories.filter((c) => c.slug).map((category) => (
                  <Link
                    key={category.id}
                    to={`/catalog/${category.slug}`}
                    className="group block bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-yellow-400 hover:shadow-md transition-all duration-200 text-left"
                  >
                    <div className="h-36 overflow-hidden bg-gray-50">
                      <img
                        src={getCategoryImage(category)}
                        alt={category.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-semibold text-gray-800 leading-tight mb-1">
                        {category.name}
                      </p>
                      <div className="flex items-center justify-end">
                        <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-yellow-500 transition-colors" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-gray-100 rounded-lg h-52 animate-pulse" />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Equipment section */}
      <section className="py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-10">

            <div className="lg:w-64 flex-shrink-0 flex flex-col justify-center">
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-4 h-4 bg-yellow-400 rounded-sm flex-shrink-0" />
                <span className="text-xs font-bold text-yellow-500 uppercase tracking-widest">
                  {t('home.equip.badge')}
                </span>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 leading-tight mb-4">
                {t('home.equip.title').split('\n').map((line, i) => (
                  <span key={i}>{line}{i === 0 && <br />}</span>
                ))}
              </h2>

              <p className="text-gray-500 text-sm leading-relaxed mb-8">
                {t('home.equip.desc')}
              </p>

              <Link
                to="/arenda-tehniki"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-yellow-400 text-gray-900 font-semibold rounded hover:bg-yellow-500 transition w-fit"
              >
                <span>{t('home.equip.btn')}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="flex-1 relative">
              {!loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {equipment.map((item) => (
                    <div
                      key={item.id}
                      className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <div className="h-44 bg-gray-50 overflow-hidden">
                        <img
                          src={getEquipmentImage(item)}
                          alt={item.name}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      <div className="p-4">
                        <h3 className="font-semibold text-gray-800 text-sm mb-2 leading-tight">
                          {item.name}
                        </h3>
                        <p className="text-yellow-500 font-bold text-sm mb-3">
                          от {item.daily_rate.toLocaleString("ru-RU")} MDL
                          <span className="text-gray-400 font-normal text-xs"> {t('home.equip.perShift')}</span>
                        </p>
                        <button
                          onClick={() => onNavigate("equipment")}
                          className="w-full py-2 border border-gray-300 text-gray-700 text-sm rounded hover:border-yellow-400 hover:text-yellow-500 transition"
                        >
                          {t('home.equip.details')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
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

        {/* Advantages strip */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 border-t border-gray-100 pt-10">

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 flex-shrink-0 bg-yellow-50 rounded-full flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{t('home.adv.experience')}</p>
                <p className="text-xs text-gray-500">{t('home.adv.experienceSub')}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 flex-shrink-0 bg-yellow-50 rounded-full flex items-center justify-center">
                <Wrench className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{t('home.adv.individual')}</p>
                <p className="text-xs text-gray-500">{t('home.adv.individualSub')}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 flex-shrink-0 bg-yellow-50 rounded-full flex items-center justify-center">
                <Package className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{t('home.adv.flexible')}</p>
                <p className="text-xs text-gray-500">{t('home.adv.flexibleSub')}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 flex-shrink-0 bg-yellow-50 rounded-full flex items-center justify-center">
                <Truck className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{t('home.adv.fast')}</p>
                <p className="text-xs text-gray-500">{t('home.adv.fastSub')}</p>
              </div>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
