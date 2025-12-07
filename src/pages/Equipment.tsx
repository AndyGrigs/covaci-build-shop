import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Search, Filter, X } from 'lucide-react';
import type { Database } from '../types/database';

type Equipment = Database['public']['Tables']['equipment']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

interface EquipmentProps {
  onNavigate: (page: string) => void;
}

export default function EquipmentPage({ onNavigate }: EquipmentProps) {
  const { user } = useAuth();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCategories();
    loadEquipment();
  }, []);

  const loadCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('type', 'equipment')
      .order('name');

    if (data) setCategories(data);
  };

  const loadEquipment = async () => {
    setLoading(true);
    let query = supabase
      .from('equipment')
      .select('*')
      .eq('is_available', true)
      .order('name');

    if (selectedCategory) {
      query = query.eq('category_id', selectedCategory);
    }

    const { data } = await query;

    if (data) {
      const filtered = searchTerm
        ? data.filter(e =>
            e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.description?.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : data;
      setEquipment(filtered);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadEquipment();
  }, [selectedCategory, searchTerm]);

  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  const handleRentalRequest = async () => {
    if (!user) {
      onNavigate('login');
      return;
    }

    if (!selectedEquipment || !startDate || !endDate) return;

    const days = calculateDays();
    if (days <= 0) {
      alert('Пожалуйста, выберите действительные даты аренды');
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
      alert('Ошибка при отправке запроса на аренду');
    } else {
      alert('Запрос на аренду успешно отправлен!');
      setSelectedEquipment(null);
      setStartDate('');
      setEndDate('');
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Аренда оборудования</h1>
        <p className="text-gray-600">Профессиональные инструменты и оборудование для ваших строительных нужд</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
            <div className="flex items-center space-x-2 mb-4">
              <Filter className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold">Фильтры</h2>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Поиск
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Поиск оборудования..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Категория
              </label>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={`w-full text-left px-3 py-2 rounded-lg transition ${
                    selectedCategory === ''
                      ? 'bg-green-50 text-green-600 font-medium'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  Все категории
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition ${
                      selectedCategory === category.id
                        ? 'bg-green-50 text-green-600 font-medium'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <div className="lg:col-span-3">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Загрузка оборудования...</p>
            </div>
          ) : equipment.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-md">
              <p className="text-gray-600">Оборудование не найдено</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {equipment.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition"
                >
                  <div className="h-48 bg-gradient-to-br from-green-200 to-green-300 flex items-center justify-center">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
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
                        <span className="text-sm text-gray-600">Дневная ставка:</span>
                        <span className="text-xl font-bold text-green-600">
                          ${item.daily_rate.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-sm text-gray-600">Депозит:</span>
                        <span className="text-sm font-medium text-gray-700">
                          ${item.deposit_amount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedEquipment(item)}
                      className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition flex items-center justify-center space-x-2"
                    >
                      <Calendar className="w-5 h-5" />
                      <span>Запросить аренду</span>
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
              <h3 className="text-2xl font-bold">Запрос на аренду</h3>
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
                <p>Дневная ставка: ${selectedEquipment.daily_rate.toFixed(2)}</p>
                <p>Требуемый депозит: ${selectedEquipment.deposit_amount.toFixed(2)}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Дата начала
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
                  Дата окончания
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || today}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {startDate && endDate && calculateDays() > 0 && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Дней аренды:</span>
                    <span className="font-semibold">{calculateDays()}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Дневная ставка:</span>
                    <span className="font-semibold">${selectedEquipment.daily_rate.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Депозит:</span>
                    <span className="font-semibold">${selectedEquipment.deposit_amount.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-green-200 mt-2 pt-2 flex justify-between">
                    <span className="font-semibold">Итого:</span>
                    <span className="text-xl font-bold text-green-600">
                      ${(selectedEquipment.daily_rate * calculateDays()).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={handleRentalRequest}
                disabled={!startDate || !endDate || calculateDays() <= 0 || submitting}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Отправка...' : 'Отправить запрос'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
