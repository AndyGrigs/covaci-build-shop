import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InventoryCheckRequest {
  product_id: string
  quantity: number
  start_date?: string
  end_date?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { product_id, quantity, start_date, end_date }: InventoryCheckRequest = await req.json()

    // Валідація вхідних даних
    if (!product_id) {
      return new Response(
        JSON.stringify({ error: 'Product ID is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!quantity || quantity <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid quantity' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Отримати інформацію про продукт
    const { data: product, error: productError } = await supabaseClient
      .from('products')
      .select('id, name, price, stock_quantity, is_rental')
      .eq('id', product_id)
      .single()

    if (productError || !product) {
      return new Response(
        JSON.stringify({ error: 'Product not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Для товарів на продаж - проста перевірка stock
    if (!product.is_rental) {
      const available = product.stock_quantity >= quantity

      return new Response(
        JSON.stringify({
          available,
          stock_quantity: product.stock_quantity,
          requested_quantity: quantity,
          product_name: product.name,
          message: available
            ? 'Product is available'
            : `Only ${product.stock_quantity} units available`
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Для орендування - перевірка доступності на дати
    if (!start_date || !end_date) {
      return new Response(
        JSON.stringify({ error: 'Rental dates are required for rental items' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Валідація дат
    const startDate = new Date(start_date)
    const endDate = new Date(end_date)
    const now = new Date()

    if (startDate >= endDate) {
      return new Response(
        JSON.stringify({ error: 'End date must be after start date' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (startDate < now) {
      return new Response(
        JSON.stringify({ error: 'Start date cannot be in the past' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Перевірка конфліктів оренди
    // Знайти всі активні замовлення для цього продукту в зазначений період
    const { data: conflictingOrders, error: ordersError } = await supabaseClient
      .from('order_items')
      .select(`
        quantity,
        start_date,
        end_date,
        orders!inner(status)
      `)
      .eq('product_id', product_id)
      .in('orders.status', ['pending', 'confirmed'])
      .not('start_date', 'is', null)
      .not('end_date', 'is', null)

    if (ordersError) {
      console.error('Orders query error:', ordersError)
      return new Response(
        JSON.stringify({ error: 'Failed to check rental availability' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Підрахувати зарезервовану кількість на конфліктуючі дати
    let reservedQuantity = 0

    if (conflictingOrders) {
      for (const order of conflictingOrders) {
        const orderStart = new Date(order.start_date)
        const orderEnd = new Date(order.end_date)

        // Перевірка перекриття дат
        // Дати перекриваються якщо: start1 < end2 AND start2 < end1
        if (startDate < orderEnd && orderStart < endDate) {
          reservedQuantity += order.quantity
        }
      }
    }

    const availableQuantity = product.stock_quantity - reservedQuantity
    const available = availableQuantity >= quantity

    // Розрахунок вартості оренди
    const rentalDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    )
    const totalPrice = product.price * quantity * rentalDays

    return new Response(
      JSON.stringify({
        available,
        stock_quantity: product.stock_quantity,
        reserved_quantity: reservedQuantity,
        available_quantity: availableQuantity,
        requested_quantity: quantity,
        product_name: product.name,
        rental_days: rentalDays,
        price_per_day: product.price,
        total_price: totalPrice,
        start_date,
        end_date,
        message: available
          ? `${availableQuantity} units available for rental`
          : `Only ${availableQuantity} units available for the selected dates`,
        conflicting_rentals: conflictingOrders?.length || 0
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
