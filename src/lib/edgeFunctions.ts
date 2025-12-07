import { supabase } from './supabase'

/**
 * Інтерфейси для Edge Functions
 */

export interface CheckoutItem {
  product_id: string
  quantity: number
  price_at_purchase: number
  start_date?: string
  end_date?: string
}

export interface CheckoutRequest {
  items: CheckoutItem[]
  delivery_address: string
  total_amount: number
}

export interface CheckoutResponse {
  success: boolean
  order_id: string
  message: string
}

export interface InventoryCheckRequest {
  product_id: string
  quantity: number
  start_date?: string
  end_date?: string
}

export interface InventoryCheckResponse {
  available: boolean
  stock_quantity: number
  reserved_quantity?: number
  available_quantity?: number
  requested_quantity: number
  product_name: string
  rental_days?: number
  price_per_day?: number
  total_price?: number
  message: string
  conflicting_rentals?: number
}

/**
 * Перевірка наявності товару або доступності для оренди
 */
export async function checkInventory(
  request: InventoryCheckRequest
): Promise<InventoryCheckResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('check-inventory', {
      body: request,
    })

    if (error) {
      throw new Error(error.message || 'Failed to check inventory')
    }

    return data as InventoryCheckResponse
  } catch (error) {
    console.error('Inventory check error:', error)
    throw error
  }
}

/**
 * Безпечне оформлення замовлення через Edge Function
 * Включає валідацію на сервері, перевірку наявності та транзакційне створення
 */
export async function processCheckout(
  request: CheckoutRequest
): Promise<CheckoutResponse> {
  try {
    // Отримати поточну сесію для auth token
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      throw new Error('You must be logged in to checkout')
    }

    const { data, error } = await supabase.functions.invoke('checkout', {
      body: request,
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    })

    if (error) {
      throw new Error(error.message || 'Checkout failed')
    }

    if (data.error) {
      throw new Error(data.error)
    }

    return data as CheckoutResponse
  } catch (error) {
    console.error('Checkout error:', error)
    throw error
  }
}

/**
 * Utility функції для роботи з датами оренди
 */

export function calculateRentalDays(startDate: string, endDate: string): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
}

export function calculateRentalPrice(
  pricePerDay: number,
  quantity: number,
  startDate: string,
  endDate: string
): number {
  const days = calculateRentalDays(startDate, endDate)
  return pricePerDay * quantity * days
}

/**
 * Валідація дат на клієнті (додаткова перевірка, основна - на сервері)
 */
export function validateRentalDates(
  startDate: string,
  endDate: string
): { valid: boolean; error?: string } {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const now = new Date()

  // Очистити час для коректного порівняння дат
  now.setHours(0, 0, 0, 0)
  start.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)

  if (start < now) {
    return { valid: false, error: 'Start date cannot be in the past' }
  }

  if (end <= start) {
    return { valid: false, error: 'End date must be after start date' }
  }

  return { valid: true }
}

/**
 * Приклад використання:
 *
 * // Перевірка наявності перед додаванням в кошик
 * const availability = await checkInventory({
 *   product_id: 'uuid-here',
 *   quantity: 2,
 *   start_date: '2025-12-10',
 *   end_date: '2025-12-15'
 * })
 *
 * if (availability.available) {
 *   console.log(`Available: ${availability.available_quantity} units`)
 *   console.log(`Total price: $${availability.total_price}`)
 * }
 *
 * // Оформлення замовлення
 * const order = await processCheckout({
 *   items: [
 *     {
 *       product_id: 'uuid-here',
 *       quantity: 2,
 *       price_at_purchase: 50.00,
 *       start_date: '2025-12-10',
 *       end_date: '2025-12-15'
 *     }
 *   ],
 *   delivery_address: 'вул. Хрещатик, 1, Київ',
 *   total_amount: 500.00
 * })
 *
 * console.log(`Order created: ${order.order_id}`)
 */
