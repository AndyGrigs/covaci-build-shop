/**
 * ПРИКЛАД: Оновлена версія Cart компонента з використанням Edge Functions
 *
 * Цей файл демонструє як використовувати Edge Functions для:
 * 1. Перевірки наявності товарів перед checkout
 * 2. Безпечного оформлення замовлення з валідацією на сервері
 * 3. Обробки помилок з користувацькими повідомленнями
 *
 * Щоб використати цей код, скопіюйте необхідні частини в src/pages/Cart.tsx
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { processCheckout, checkInventory, validateRentalDates } from '../lib/edgeFunctions';
import type { CheckoutItem } from '../lib/edgeFunctions';
import { supabase } from '../lib/supabase';

// Приклад оновленої функції checkout з використанням Edge Function
export function useSecureCheckout() {
  const { user } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkout = async (
    cartItems: any[],
    deliveryAddress: string
  ) => {
    if (!user) {
      setError('You must be logged in to checkout');
      return null;
    }

    if (!deliveryAddress.trim()) {
      setError('Please enter a delivery address');
      return null;
    }

    setProcessing(true);
    setError(null);

    try {
      // 1. Підготувати items для checkout
      const items: CheckoutItem[] = cartItems.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price_at_purchase: item.products.price,
        start_date: item.start_date || undefined,
        end_date: item.end_date || undefined,
      }));

      // 2. Розрахувати загальну суму
      let totalAmount = 0;
      for (const item of cartItems) {
        let itemTotal = item.products.price * item.quantity;

        // Для оренди - розрахунок за днями
        if (item.products.is_rental && item.start_date && item.end_date) {
          const days = Math.ceil(
            (new Date(item.end_date).getTime() - new Date(item.start_date).getTime()) /
            (1000 * 60 * 60 * 24)
          );
          itemTotal = item.products.price * item.quantity * days;
        }

        totalAmount += itemTotal;
      }

      // 3. Викликати Edge Function для безпечного checkout
      const result = await processCheckout({
        items,
        delivery_address: deliveryAddress,
        total_amount: totalAmount,
      });

      // 4. Очистити кошик після успішного замовлення
      await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Checkout failed';
      setError(message);
      console.error('Checkout error:', err);
      return null;
    } finally {
      setProcessing(false);
    }
  };

  return { checkout, processing, error };
}

// Приклад функції для перевірки наявності перед додаванням в кошик
export async function addToCartWithValidation(
  productId: string,
  quantity: number,
  startDate?: string,
  endDate?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Валідація дат на клієнті
    if (startDate && endDate) {
      const dateValidation = validateRentalDates(startDate, endDate);
      if (!dateValidation.valid) {
        return { success: false, error: dateValidation.error };
      }
    }

    // 2. Перевірка наявності через Edge Function
    const availability = await checkInventory({
      product_id: productId,
      quantity,
      start_date: startDate,
      end_date: endDate,
    });

    if (!availability.available) {
      return {
        success: false,
        error: availability.message,
      };
    }

    // 3. Додати в кошик
    const { error } = await supabase.from('cart_items').insert({
      product_id: productId,
      quantity,
      start_date: startDate || null,
      end_date: endDate || null,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to add to cart';
    return { success: false, error: message };
  }
}

// Приклад компонента Cart з Edge Functions
export default function SecureCartExample() {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const { checkout, processing, error } = useSecureCheckout();

  const handleCheckout = async () => {
    const result = await checkout(cartItems, deliveryAddress);

    if (result) {
      alert(`Order created successfully! Order ID: ${result.order_id}`);
      setCartItems([]);
    } else if (error) {
      alert(`Checkout failed: ${error}`);
    }
  };

  const handleAddToCart = async (productId: string, quantity: number) => {
    const result = await addToCartWithValidation(productId, quantity);

    if (result.success) {
      alert('Added to cart!');
      // Reload cart
    } else {
      alert(`Failed: ${result.error}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Shopping Cart</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Cart items list */}
      <div className="space-y-4 mb-6">
        {cartItems.map(item => (
          <div key={item.id} className="border rounded-lg p-4">
            <h3 className="font-semibold">{item.products.name}</h3>
            <p>Quantity: {item.quantity}</p>
            <p>Price: ${item.products.price}</p>
          </div>
        ))}
      </div>

      {/* Checkout form */}
      <div className="border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Delivery Information</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Delivery Address
          </label>
          <textarea
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            className="w-full border rounded px-3 py-2"
            rows={3}
            placeholder="Enter your delivery address"
          />
        </div>

        <button
          onClick={handleCheckout}
          disabled={processing || cartItems.length === 0}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {processing ? 'Processing...' : 'Complete Order'}
        </button>
      </div>

      {/* Info box */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">
          Безпечний checkout з Edge Functions
        </h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>✓ Валідація всіх даних на сервері</li>
          <li>✓ Перевірка наявності товарів</li>
          <li>✓ Захист від підробки цін</li>
          <li>✓ Транзакційне створення замовлення</li>
          <li>✓ Автоматичне оновлення inventory</li>
        </ul>
      </div>
    </div>
  );
}

/**
 * ІНСТРУКЦІЯ З ІНТЕГРАЦІЇ:
 *
 * 1. Скопіюйте хук useSecureCheckout() в ваш Cart.tsx
 *
 * 2. Замініть існуючу функцію handleCheckout на:
 *    const { checkout, processing, error } = useSecureCheckout();
 *
 * 3. В handleCheckout просто викликайте:
 *    const result = await checkout(cartItems, deliveryAddress);
 *
 * 4. Для додавання в кошик використовуйте addToCartWithValidation()
 *
 * 5. Видаліть старий код що напряму створює orders та order_items
 *
 * 6. Тепер вся бізнес-логіка виконується на сервері в Edge Function!
 */
