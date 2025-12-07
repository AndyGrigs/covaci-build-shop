import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { User, Package, Calendar, Edit, Save, Settings } from 'lucide-react';
import type { Database } from '../types/database';

type Order = Database['public']['Tables']['orders']['Row'] & {
  order_items: (Database['public']['Tables']['order_items']['Row'] & {
    products: Database['public']['Tables']['products']['Row'] | null;
  })[];
};

type Rental = Database['public']['Tables']['rentals']['Row'] & {
  equipment: Database['public']['Tables']['equipment']['Row'] | null;
};

interface CabinetProps {
  onNavigate: (page: string) => void;
}

export default function Cabinet({ onNavigate }: CabinetProps) {
  const { user, profile, isAdmin, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'rentals'>('profile');
  const [orders, setOrders] = useState<Order[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    company_name: profile?.company_name || '',
    address: profile?.address || '',
  });

  useEffect(() => {
    if (user) {
      loadOrders();
      loadRentals();
    }
  }, [user]);

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name,
        phone: profile.phone || '',
        company_name: profile.company_name || '',
        address: profile.address || '',
      });
    }
  }, [profile]);

  const loadOrders = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (*)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setOrders(data as Order[]);
    }
  };

  const loadRentals = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('rentals')
      .select(`
        *,
        equipment (*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setRentals(data as Rental[]);
    }
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile(formData);
      setEditing(false);
      alert('Профиль успешно обновлен!');
    } catch (error) {
      alert('Ошибка при обновлении профиля');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      confirmed: 'bg-blue-100 text-blue-700',
      active: 'bg-green-100 text-green-700',
      shipped: 'bg-cyan-100 text-cyan-700',
      delivered: 'bg-green-100 text-green-700',
      completed: 'bg-gray-100 text-gray-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  if (!user) {
    onNavigate('login');
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Личный кабинет</h1>

      <div className="mb-6 border-b border-gray-200">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-4 px-2 font-medium transition ${
              activeTab === 'profile'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <User className="w-5 h-5 inline mr-2" />
            Профиль
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-4 px-2 font-medium transition ${
              activeTab === 'orders'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Package className="w-5 h-5 inline mr-2" />
            Заказы ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('rentals')}
            className={`pb-4 px-2 font-medium transition ${
              activeTab === 'rentals'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Calendar className="w-5 h-5 inline mr-2" />
            Аренда ({rentals.length})
          </button>
          {isAdmin && (
            <button
              onClick={() => onNavigate('admin')}
              className="pb-4 px-2 font-medium transition flex items-center space-x-2 text-gray-500 hover:text-gray-700"
            >
              <Settings className="w-5 h-5" />
              <span>Админ-панель</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'profile' && (
        <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Информация профиля</h2>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Edit className="w-4 h-4" />
                <span>Редактировать</span>
              </button>
            ) : (
              <button
                onClick={handleSaveProfile}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                <Save className="w-4 h-4" />
                <span>Сохранить</span>
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Полное имя
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                disabled={!editing}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Телефон
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={!editing}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Название компании (необязательно)
              </label>
              <input
                type="text"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                disabled={!editing}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Адрес
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                disabled={!editing}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                rows={3}
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Заказов пока нет</p>
              <button
                onClick={() => onNavigate('products')}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Начать покупки
              </button>
            </div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      Заказ #{order.id.slice(0, 8)}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>

                <div className="border-t border-gray-200 pt-4 mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Адрес доставки:</strong> {order.delivery_address}
                  </p>
                  {order.notes && (
                    <p className="text-sm text-gray-600">
                      <strong>Примечания:</strong> {order.notes}
                    </p>
                  )}
                </div>

                <div className="space-y-2 mb-4">
                  {order.order_items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>
                        {item.products?.name || 'Товар'} x {item.quantity}
                      </span>
                      <span className="font-medium">${item.subtotal.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
                  <span className="font-semibold">Итого:</span>
                  <span className="text-xl font-bold text-blue-600">
                    ${order.total_amount.toFixed(2)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'rentals' && (
        <div className="space-y-4">
          {rentals.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Нет истории аренды</p>
              <button
                onClick={() => onNavigate('equipment')}
                className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                Просмотр оборудования
              </button>
            </div>
          ) : (
            rentals.map((rental) => (
              <div key={rental.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {rental.equipment?.name || 'Оборудование'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Запрошено: {new Date(rental.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(rental.status)}`}>
                    {rental.status}
                  </span>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">
                      <strong>Дата начала:</strong> {new Date(rental.start_date).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Дата окончания:</strong> {new Date(rental.end_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">
                      <strong>Всего дней:</strong> {rental.total_days}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Дневная ставка:</strong> ${rental.daily_rate.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Депозит:</strong> ${rental.deposit_paid.toFixed(2)}
                    </p>
                  </div>
                </div>

                {rental.notes && (
                  <p className="text-sm text-gray-600 mb-4">
                    <strong>Примечания:</strong> {rental.notes}
                  </p>
                )}

                <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
                  <span className="font-semibold">Общая сумма:</span>
                  <span className="text-xl font-bold text-green-600">
                    ${rental.total_amount.toFixed(2)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
