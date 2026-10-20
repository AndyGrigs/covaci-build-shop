import { supabase } from './supabase'

/**
 * Інтерфейси для Edge Functions
 */

export interface CheckoutItem {
  product_id: string
  quantity: number
}

export interface CheckoutRequest {
  items: CheckoutItem[]
  delivery_address: string
  total_amount: number
  notes?: string
}

export interface CheckoutResponse {
  success: boolean
  order_id: string
  message: string
}

export interface InventoryCheckRequest {
  product_id: string
  quantity: number
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

export async function processCheckout(
  request: CheckoutRequest
): Promise<CheckoutResponse> {
  const { data, error } = await supabase.rpc('create_order', {
    p_items: request.items.map(({ product_id, quantity }) => ({ product_id, quantity })),
    p_delivery_address: request.delivery_address,
    p_notes: request.notes?.trim() || undefined,
    p_expected_total: request.total_amount,
  })

  if (error) {
    console.error('Checkout error:', error)
    throw new Error(error.message)
  }

  return { success: true, order_id: data as string, message: 'Заказ оформлен' }
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

