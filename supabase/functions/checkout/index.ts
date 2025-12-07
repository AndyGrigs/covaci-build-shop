import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CheckoutItem {
  product_id: string
  quantity: number
  price_at_purchase: number
  start_date?: string
  end_date?: string
}

interface CheckoutRequest {
  items: CheckoutItem[]
  delivery_address: string
  total_amount: number
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with user's auth token
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get user from auth token
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser()

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Parse request body
    const { items, delivery_address, total_amount }: CheckoutRequest = await req.json()

    // Валідація вхідних даних
    if (!items || items.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Cart is empty' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!delivery_address || delivery_address.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Delivery address is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (total_amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid total amount' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Валідація кожного item
    for (const item of items) {
      if (!item.product_id || item.quantity <= 0 || item.price_at_purchase <= 0) {
        return new Response(
          JSON.stringify({ error: 'Invalid item data' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Валідація дат для орендування
      if (item.start_date && item.end_date) {
        const start = new Date(item.start_date)
        const end = new Date(item.end_date)

        if (start >= end) {
          return new Response(
            JSON.stringify({ error: 'Invalid rental dates' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }

        if (start < new Date()) {
          return new Response(
            JSON.stringify({ error: 'Start date cannot be in the past' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }
      }
    }

    // Перевірка наявності товарів та обчислення правильної ціни
    let calculatedTotal = 0
    const productChecks = []

    for (const item of items) {
      const { data: product, error: productError } = await supabaseClient
        .from('products')
        .select('id, price, stock_quantity, is_rental')
        .eq('id', item.product_id)
        .single()

      if (productError || !product) {
        return new Response(
          JSON.stringify({ error: `Product ${item.product_id} not found` }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Перевірка наявності на складі
      if (product.stock_quantity < item.quantity) {
        return new Response(
          JSON.stringify({
            error: `Insufficient stock for product ${item.product_id}. Available: ${product.stock_quantity}, requested: ${item.quantity}`
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Перевірка, що ціна не була підроблена
      let itemTotal = product.price * item.quantity

      // Для оренди - розрахунок за днями
      if (product.is_rental && item.start_date && item.end_date) {
        const days = Math.ceil(
          (new Date(item.end_date).getTime() - new Date(item.start_date).getTime()) /
          (1000 * 60 * 60 * 24)
        )
        itemTotal = product.price * item.quantity * days
      }

      calculatedTotal += itemTotal
      productChecks.push({
        product_id: item.product_id,
        quantity: item.quantity,
        new_stock: product.stock_quantity - item.quantity
      })
    }

    // Перевірка, що загальна сума відповідає розрахунку
    if (Math.abs(calculatedTotal - total_amount) > 0.01) {
      return new Response(
        JSON.stringify({
          error: 'Price mismatch. Please refresh the cart.',
          calculated: calculatedTotal,
          provided: total_amount
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // ТРАНЗАКЦІЯ: Створення замовлення та оновлення inventory
    // 1. Створити замовлення
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .insert({
        user_id: user.id,
        total_amount: total_amount,
        status: 'pending',
        delivery_address: delivery_address,
      })
      .select()
      .single()

    if (orderError || !order) {
      console.error('Order creation error:', orderError)
      return new Response(
        JSON.stringify({ error: 'Failed to create order' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // 2. Створити order items
    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price_at_purchase: item.price_at_purchase,
      start_date: item.start_date || null,
      end_date: item.end_date || null,
    }))

    const { error: itemsError } = await supabaseClient
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      console.error('Order items error:', itemsError)
      // Rollback: видалити замовлення
      await supabaseClient.from('orders').delete().eq('id', order.id)

      return new Response(
        JSON.stringify({ error: 'Failed to create order items' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // 3. Оновити stock quantity для кожного продукту
    for (const check of productChecks) {
      const { error: updateError } = await supabaseClient
        .from('products')
        .update({ stock_quantity: check.new_stock })
        .eq('id', check.product_id)

      if (updateError) {
        console.error('Stock update error:', updateError)
        // Rollback: видалити замовлення та items
        await supabaseClient.from('orders').delete().eq('id', order.id)

        return new Response(
          JSON.stringify({ error: 'Failed to update inventory' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        order_id: order.id,
        message: 'Order created successfully'
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
