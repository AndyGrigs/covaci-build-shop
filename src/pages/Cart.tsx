import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';
import type { Database } from '../types/database';

type CartItem = Database['public']['Tables']['cart_items']['Row'] & {
  products: Database['public']['Tables']['products']['Row'];
};

interface CartProps {
  onNavigate: (page: string) => void;
}

export default function Cart({ onNavigate }: CartProps) {
  const { user, profile } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (user) {
      loadCart();
      setDeliveryAddress(profile?.address || '');
    }
  }, [user, profile]);

  const loadCart = async () => {
    if (!user) return;

    setLoading(true);
    const { data } = await supabase
      .from('cart_items')
      .select(`
        *,
        products (*)
      `)
      .eq('user_id', user.id);

    if (data) {
      setCartItems(data as CartItem[]);
    }
    setLoading(false);
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    await supabase
      .from('cart_items')
      .update({ quantity: newQuantity })
      .eq('id', itemId);

    loadCart();
  };

  const removeItem = async (itemId: string) => {
    await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId);

    loadCart();
  };

  const calculateTotal = () => {
    return cartItems.reduce(
      (sum, item) => sum + item.products.price * item.quantity,
      0
    );
  };

  const handleCheckout = async () => {
    if (!user || cartItems.length === 0) return;

    if (!deliveryAddress.trim()) {
      alert('Пожалуйста, введите адрес доставки');
      return;
    }

    setProcessing(true);

    const totalAmount = calculateTotal();

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        total_amount: totalAmount,
        status: 'pending',
        delivery_address: deliveryAddress,
        notes: notes || null,
      })
      .select()
      .single();

    if (orderError || !order) {
      alert('Ошибка при создании заказа');
      setProcessing(false);
      return;
    }

    const orderItems = cartItems.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.products.price,
      subtotal: item.products.price * item.quantity,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      alert('Ошибка при добавлении товаров к заказу');
      setProcessing(false);
      return;
    }

    await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id);

    setProcessing(false);
    alert('Заказ успешно оформлен!');
    onNavigate('cabinet');
  };

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Пожалуйста, войдите</h2>
        <p className="text-gray-600 mb-6">Вам нужно войти в систему, чтобы увидеть вашу корзину</p>
        <button
          onClick={() => onNavigate('login')}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
        >
          Войти
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">Загрузка корзины...</p>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Ваша корзина пуста</h2>
        <p className="text-gray-600 mb-6">Добавьте несколько товаров, чтобы начать</p>
        <button
          onClick={() => onNavigate('products')}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
        >
          Просмотр товаров
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Корзина покупок</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg shadow-md p-6 flex items-center space-x-4"
            >
              <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg flex items-center justify-center flex-shrink-0">
                {item.products.image_url ? (
                  <img
                    src={item.products.image_url}
                    alt={item.products.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <span className="text-gray-400 text-2xl font-bold">
                    {item.products.name.charAt(0)}
                  </span>
                )}
              </div>

              <div className="flex-grow">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {item.products.name}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  ${item.products.price.toFixed(2)} / {item.products.unit}
                </p>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="p-1 bg-gray-100 hover:bg-gray-200 rounded transition"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-medium w-12 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="p-1 bg-gray-100 hover:bg-gray-200 rounded transition"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="text-right">
                <p className="text-xl font-bold text-gray-900 mb-2">
                  ${(item.products.price * item.quantity).toFixed(2)}
                </p>
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-red-600 hover:text-red-700 transition"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
            <h2 className="text-xl font-bold mb-4">Сводка заказа</h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Промежуточный итог:</span>
                <span className="font-semibold">${calculateTotal().toFixed(2)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between">
                <span className="text-lg font-bold">Итого:</span>
                <span className="text-2xl font-bold text-blue-600">
                  ${calculateTotal().toFixed(2)}
                </span>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Адрес доставки
                </label>
                <textarea
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Введите адрес доставки..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Примечания (необязательно)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                  placeholder="Любые специальные инструкции..."
                />
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={processing}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? 'Обработка...' : 'Перейти к оформлению заказа'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
