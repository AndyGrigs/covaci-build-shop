import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { User, Package, Calendar, Edit, Save, Settings } from 'lucide-react';
import type { Database } from '../types/database';
import { useAppNav } from '../hooks/useAppNav';
import { useTranslation } from 'react-i18next';

type Order = Database['public']['Tables']['orders']['Row'] & {
  order_items: (Database['public']['Tables']['order_items']['Row'] & {
    products: Database['public']['Tables']['products']['Row'] | null;
  })[];
};

type Rental = Database['public']['Tables']['rentals']['Row'] & {
  equipment: Database['public']['Tables']['equipment']['Row'] | null;
};

export default function Cabinet() {
  const { t } = useTranslation();
  const onNavigate = useAppNav();
  const { user, profile, isAdmin, loading: authLoading, updateProfile } = useAuth();
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
    if (!authLoading && !user) onNavigate('login');
  }, [authLoading, user, onNavigate]);

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
      setOrders(data as unknown as Order[]);
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
      setRentals(data as unknown as Rental[]);
    }
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile(formData);
      setEditing(false);
      toast.success(t('toast.profileSaved'));
    } catch (error) {
      toast.error(t('toast.profileError'));
    }
  };

  const getOrderStatusLabel = (status: string) => {
    const key = `status.order.${status}` as const;
    return t(key, { defaultValue: status });
  };

  const getRentalStatusLabel = (status: string) => {
    const key = `status.rental.${status}` as const;
    return t(key, { defaultValue: status });
  };

  const STATUS_COLORS: Record<string, string> = {
    pending:   'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-purple-100 text-purple-700',
    shipped:   'bg-cyan-100 text-cyan-700',
    delivered: 'bg-green-100 text-green-700',
    active:    'bg-green-100 text-green-700',
    completed: 'bg-gray-100 text-gray-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  const getStatusColor = (status: string) =>
    STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-700';

  if (authLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto"></div>
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">{t('cabinet.title')}</h1>

      <div className="mb-6 border-b border-gray-200">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-4 px-2 font-medium transition ${
              activeTab === 'profile'
                ? 'border-b-2 border-brand text-yellow-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <User className="w-5 h-5 inline mr-2" />
            {t('cabinet.profile')}
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-4 px-2 font-medium transition ${
              activeTab === 'orders'
                ? 'border-b-2 border-brand text-yellow-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Package className="w-5 h-5 inline mr-2" />
            {t('cabinet.orders', { count: orders.length })}
          </button>
          <button
            onClick={() => setActiveTab('rentals')}
            className={`pb-4 px-2 font-medium transition ${
              activeTab === 'rentals'
                ? 'border-b-2 border-brand text-yellow-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Calendar className="w-5 h-5 inline mr-2" />
            {t('cabinet.rentals', { count: rentals.length })}
          </button>
          {isAdmin && (
            <button
              onClick={() => onNavigate('admin')}
              className="pb-4 px-2 font-medium transition flex items-center space-x-2 text-gray-500 hover:text-gray-700"
            >
              <Settings className="w-5 h-5" />
              <span>{t('cabinet.adminPanel')}</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'profile' && (
        <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">{t('cabinet.profileInfo')}</h2>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-brand text-gray-900 rounded-lg hover:bg-brand-dark transition"
              >
                <Edit className="w-4 h-4" />
                <span>{t('cabinet.edit')}</span>
              </button>
            ) : (
              <button
                onClick={handleSaveProfile}
                className="flex items-center space-x-2 px-4 py-2 bg-brand text-gray-900 rounded-lg hover:bg-brand-dark transition"
              >
                <Save className="w-4 h-4" />
                <span>{t('cabinet.save')}</span>
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('cabinet.fullName')}
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                disabled={!editing}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent disabled:bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('cabinet.email')}
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
                {t('cabinet.phone')}
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={!editing}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent disabled:bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('cabinet.company')}
              </label>
              <input
                type="text"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                disabled={!editing}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent disabled:bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('cabinet.address')}
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                disabled={!editing}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent disabled:bg-gray-50"
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
              <p className="text-gray-600">{t('cabinet.noOrders')}</p>
              <button
                onClick={() => onNavigate('products')}
                className="mt-4 px-6 py-2 bg-brand text-gray-900 rounded-lg hover:bg-brand-dark transition"
              >
                {t('cabinet.startShopping')}
              </button>
            </div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {t('cabinet.order', { id: order.id.slice(0, 8) })}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {new Date(order.created_at ?? '').toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                    {getOrderStatusLabel(order.status)}
                  </span>
                </div>

                <div className="border-t border-gray-200 pt-4 mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>{t('cabinet.deliveryAddress')}</strong> {order.delivery_address}
                  </p>
                  {order.notes && (
                    <p className="text-sm text-gray-600">
                      <strong>{t('cabinet.orderNotes')}</strong> {order.notes}
                    </p>
                  )}
                </div>

                <div className="space-y-2 mb-4">
                  {order.order_items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>
                        {item.products?.name || t('cabinet.product')} x {item.quantity}
                      </span>
                      <span className="font-medium">{item.subtotal.toFixed(2)} MDL</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
                  <span className="font-semibold">{t('cabinet.orderTotal')}</span>
                  <span className="text-xl font-bold text-yellow-600">
                    {order.total_amount.toFixed(2)} MDL
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
              <p className="text-gray-600">{t('cabinet.noRentals')}</p>
              <button
                onClick={() => onNavigate('equipment')}
                className="mt-4 px-6 py-2 bg-brand text-gray-900 rounded-lg hover:bg-brand-dark transition"
              >
                {t('cabinet.viewEquipment')}
              </button>
            </div>
          ) : (
            rentals.map((rental) => (
              <div key={rental.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {rental.equipment_name || rental.equipment?.name || t('cabinet.equipment')}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {t('cabinet.requested')} {new Date(rental.created_at ?? '').toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(rental.status)}`}>
                    {getRentalStatusLabel(rental.status)}
                  </span>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">
                      <strong>{t('cabinet.startDate')}</strong> {new Date(rental.start_date).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>{t('cabinet.endDate')}</strong> {new Date(rental.end_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">
                      <strong>{t('cabinet.totalDays')}</strong> {rental.total_days}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>{t('cabinet.dailyRate')}</strong> {rental.daily_rate.toFixed(2)} MDL
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>{t('cabinet.depositPaid')}</strong> {rental.deposit_paid.toFixed(2)} MDL
                    </p>
                  </div>
                </div>

                {rental.notes && (
                  <p className="text-sm text-gray-600 mb-4">
                    <strong>{t('cabinet.rentalNotes')}</strong> {rental.notes}
                  </p>
                )}

                <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
                  <span className="font-semibold">{t('cabinet.rentalTotal')}</span>
                  <span className="text-xl font-bold text-green-600">
                    {rental.total_amount.toFixed(2)} MDL
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
