import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CheckoutItem {
  product_id: string
  quantity: number
  unit_price: number
}

interface CheckoutRequest {
  items: CheckoutItem[]
  delivery_address: string
  total_amount: number
}

serve(async (req) => {
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

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser()

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { items, delivery_address, total_amount }: CheckoutRequest = await req.json()

    if (!items || items.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Cart is empty' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!delivery_address || delivery_address.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Delivery address is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (total_amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid total amount' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    for (const item of items) {
      if (!item.product_id || item.quantity <= 0 || item.unit_price <= 0) {
        return new Response(
          JSON.stringify({ error: 'Invalid item data' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Перевірка наявності та підрахунок суми за реальними цінами з БД
    let calculatedTotal = 0
    const productChecks: { product_id: string; quantity: number; new_stock: number }[] = []

    for (const item of items) {
      const { data: product, error: productError } = await supabaseClient
        .from('products')
        .select('id, price, stock_quantity')
        .eq('id', item.product_id)
        .single()

      if (productError || !product) {
        return new Response(
          JSON.stringify({ error: `Product ${item.product_id} not found` }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (product.stock_quantity < item.quantity) {
        return new Response(
          JSON.stringify({
            error: `Insufficient stock for product ${item.product_id}. Available: ${product.stock_quantity}, requested: ${item.quantity}`
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      calculatedTotal += product.price * item.quantity
      productChecks.push({
        product_id: item.product_id,
        quantity: item.quantity,
        new_stock: product.stock_quantity - item.quantity,
      })
    }

    if (Math.abs(calculatedTotal - total_amount) > 0.01) {
      return new Response(
        JSON.stringify({
          error: 'Price mismatch. Please refresh the cart.',
          calculated: calculatedTotal,
          provided: total_amount,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 1. Створити замовлення
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .insert({
        user_id: user.id,
        total_amount,
        status: 'pending',
        delivery_address,
      })
      .select()
      .single()

    if (orderError || !order) {
      console.error('Order creation error:', orderError)
      return new Response(
        JSON.stringify({ error: 'Failed to create order' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Створити order_items з unit_price та subtotal
    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.unit_price * item.quantity,
    }))

    const { error: itemsError } = await supabaseClient
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      console.error('Order items error:', itemsError)
      await supabaseClient.from('orders').delete().eq('id', order.id)
      return new Response(
        JSON.stringify({ error: 'Failed to create order items' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Оновити stock
    for (const check of productChecks) {
      const { error: updateError } = await supabaseClient
        .from('products')
        .update({ stock_quantity: check.new_stock })
        .eq('id', check.product_id)

      if (updateError) {
        console.error('Stock update error:', updateError)
        await supabaseClient.from('orders').delete().eq('id', order.id)
        return new Response(
          JSON.stringify({ error: 'Failed to update inventory' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    return new Response(
      JSON.stringify({ success: true, order_id: order.id, message: 'Order created successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    console.error('Unexpected error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
