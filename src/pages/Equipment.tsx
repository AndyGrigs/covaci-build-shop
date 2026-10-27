import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useLoaderData, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Search, Filter, X } from 'lucide-react';
import { BRAND_NAME } from '../lib/brand';
import type { Database } from '../types/database';
import { useAppNav } from '../hooks/useAppNav';
import type { EquipmentLoaderData } from '../lib/equipmentLoader';
import Seo from '../components/Seo';
import { useTranslation } from 'react-i18next';
import { useLangPath } from '../hooks/useLang';

type Equipment = Database['public']['Tables']['equipment']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

export default function EquipmentPage() {
  const { slug } = useParams<{ slug?: string }>();
  return <EquipmentView key={slug ?? 'all'} />;
}

function EquipmentView() {
  const { t } = useTranslation();
  const lp = useLangPath();
  const onNavigate = useAppNav();
  const { slug } = useParams<{ slug?: string }>();
  const { user } = useAuth();
  const initial = useLoaderData() as EquipmentLoaderData | undefined;
  const [allEquipment, setAllEquipment] = useState<Equipment[]>(initial?.equipment ?? []);
  const [categories, setCategories] = useState<Category[]>(initial?.categories ?? []);
  const [loading, setLoading] = useState(!initial);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(initial?.category?.id ?? '');
  const firstLoad = useRef(Boolean(initial));
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [busyRanges, setBusyRanges] = useState<{ start_date: string; end_date: string }[]>([]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('type', 'equipment')
      .order('name');

    if (data) {
      setCategories(data);
      if (slug) {
        const match = data.find(c => c.slug === slug);
        if (match) setSelectedCategory(match.id);
      }
    }
  };

  const loadEquipment = async () => {
    if (!firstLoad.current) setLoading(true);
    let query = supabase
      .from('equipment')
      .select('*')
      .eq('is_available', true)
      .eq('is_archived', false)
      .order('name');

    if (selectedCategory) {
      query = query.eq('category_id', selectedCategory);
    }

    const { data } = await query;
    if (data) setAllEquipment(data);

    firstLoad.current = false;
    setLoading(false);
  };

  useEffect(() => {
    loadEquipment();
  }, [selectedCategory]);

  const equipment = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return allEquipment;
    return allEquipment.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q),
    );
  }, [allEquipment, searchTerm]);

  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  useEffect(() => {
    if (!selectedEquipment) {
      setBusyRanges([]);
      return;
    }
    let cancelled = false;
    supabase
      .rpc('equipment_busy_ranges', { p_equipment_id: selectedEquipment.id })
      .then(({ data }) => {
        if (!cancelled) setBusyRanges(data ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedEquipment]);

  const hasConflict =
    !!startDate &&
    !!endDate &&
    busyRanges.some((b) => startDate < b.end_date && endDate > b.start_date);

  const handleRentalRequest = async () => {
    if (!user) {
      onNavigate('login');
      return;
    }

    if (!selectedEquipment || !startDate || !endDate) return;

    const days = calculateDays();
    if (days <= 0) {
      toast.error(t('toast.invalidDates'));
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from('rentals').insert({
      user_id: user.id,
      equipment_id: selectedEquipment.id,
      start_date: startDate,
      end_date: endDate,
      total_days: days,
      daily_rate: selectedEquipment.daily_rate,
      deposit_paid: selectedEquipment.deposit_amount,
      total_amount: selectedEquipment.daily_rate * days,
      status: 'pending',
    });

    setSubmitting(false);

    if (error) {
      if (error.code === '23P01') {
        toast.error(t('toast.rentalConflict'));
      } else {
        toast.error(t('toast.rentalError'));
      }
    } else {
      toast.success(t('toast.rentalSuccess'));
      setSelectedEquipment(null);
      setStartDate('');
      setEndDate('');
    }
  };

  const activeCategory = categories.find((c) => c.id === selectedCategory);
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Seo
        title={activeCategory ? activeCategory.name : t('equipment.seoTitle')}
        description={
          activeCategory
            ? t('equipment.seoCatDesc', { name: activeCategory.name, brand: BRAND_NAME })
            : t('equipment.seoDesc', { brand: BRAND_NAME })
        }
        path={lp(activeCategory ? `/arenda-tehniki/${activeCategory.slug}` : '/arenda-tehniki')}
      />
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">{t('equipment.title')}</h1>
        <p className="text-gray-600">{t('equipment.subtitle')}</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
            <div className="flex items-center space-x-2 mb-4">
              <Filter className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold">{t('equipment.filters')}</h2>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('equipment.search')}
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder={t('equipment.searchPlaceholder')}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('equipment.category')}
              </label>
              <div className="space-y-2">
                <Link
                  to={lp('/arenda-tehniki')}
                  className={`block w-full text-left px-3 py-2 rounded-lg transition ${
                    selectedCategory === ''
                      ? 'bg-green-50 text-green-600 font-medium'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  {t('equipment.allCategories')}
                </Link>
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    to={lp(`/arenda-tehniki/${category.slug}`)}
                    className={`block w-full text-left px-3 py-2 rounded-lg transition ${
                      selectedCategory === category.id
                        ? 'bg-green-50 text-green-600 font-medium'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <div className="lg:col-span-3">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">{t('equipment.loading')}</p>
            </div>
          ) : equipment.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-md">
              <p className="text-gray-600">{t('equipment.notFound')}</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {equipment.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="h-48 bg-gradient-to-br from-green-200 to-green-300 flex items-center justify-center">
                    {item.images?.[0] ? (
                      <img
                        src={item.images[0]}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-green-700 text-4xl font-bold">
                        {item.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.name}</h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {item.description}
                    </p>
                    <div className="mb-3">
                      <div className="flex items-baseline justify-between mb-1">
                        <span className="text-sm text-gray-600">{t('equipment.dailyRate')}</span>
                        <span className="text-xl font-bold text-green-600">
                          {item.daily_rate.toFixed(2)} MDL
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-sm text-gray-600">{t('equipment.deposit')}</span>
                        <span className="text-sm font-medium text-gray-700">
                          {item.deposit_amount.toFixed(2)} MDL
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedEquipment(item)}
                      className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition flex items-center justify-center space-x-2 hover:scale-[1.02] active:scale-95"
                    >
                      <Calendar className="w-5 h-5" />
                      <span>{t('equipment.requestBtn')}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedEquipment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold">{t('equipment.modalTitle')}</h3>
              <button
                onClick={() => setSelectedEquipment(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-4">
              <h4 className="font-semibold text-lg mb-2">{selectedEquipment.name}</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>{t('equipment.rentalDailyRate')} {selectedEquipment.daily_rate.toFixed(2)} MDL</p>
                <p>{t('equipment.depositRequired')} {selectedEquipment.deposit_amount.toFixed(2)} MDL</p>
              </div>
            </div>

            <div className="space-y-4">
              {busyRanges.length > 0 && (
                <div className="text-sm text-gray-600 mb-3">
                  <p className="font-medium">{t('equipment.busy')}</p>
                  <ul>
                    {busyRanges.map((b, i) => (
                      <li key={i}>
                        {new Date(b.start_date).toLocaleDateString()} —{' '}
                        {new Date(b.end_date).toLocaleDateString()}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('equipment.startDate')}
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={today}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('equipment.endDate')}
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || today}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {hasConflict && (
                <p className="text-sm text-red-600 mb-3">
                  {t('equipment.datesConflict')}
                </p>
              )}

              {startDate && endDate && calculateDays() > 0 && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">{t('equipment.rentalDays')}</span>
                    <span className="font-semibold">{calculateDays()}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">{t('equipment.rentalDailyRate')}</span>
                    <span className="font-semibold">{selectedEquipment.daily_rate.toFixed(2)} MDL</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">{t('equipment.rentalDeposit')}</span>
                    <span className="font-semibold">{selectedEquipment.deposit_amount.toFixed(2)} MDL</span>
                  </div>
                  <div className="border-t border-green-200 mt-2 pt-2 flex justify-between">
                    <span className="font-semibold">{t('equipment.rentalTotal')}</span>
                    <span className="text-xl font-bold text-green-600">
                      {(selectedEquipment.daily_rate * calculateDays()).toFixed(2)} MDL
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={handleRentalRequest}
                disabled={!startDate || !endDate || calculateDays() <= 0 || submitting || hasConflict}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? t('equipment.sending') : t('equipment.sendBtn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
