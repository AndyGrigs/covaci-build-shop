-- Атомарне оформлення замовлення: все в одній транзакції

CREATE OR REPLACE FUNCTION public.create_order(
  p_items            jsonb,
  p_delivery_address text,
  p_notes            text    DEFAULT NULL,
  p_expected_total   numeric DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id     uuid := auth.uid();
  v_order_id    uuid;
  v_total       numeric(10,2) := 0;
  v_item        record;
  v_price       numeric(10,2);
  v_name        text;
  v_stock       integer;
  v_active      boolean;
  v_product_ids uuid[] := '{}';
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Необходимо войти в аккаунт';
  END IF;

  IF p_delivery_address IS NULL OR btrim(p_delivery_address) = '' THEN
    RAISE EXCEPTION 'Укажите адрес доставки';
  END IF;

  IF p_items IS NULL
     OR jsonb_typeof(p_items) <> 'array'
     OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Корзина пуста';
  END IF;

  INSERT INTO orders (user_id, total_amount, status, delivery_address, notes)
  VALUES (v_user_id, 0, 'pending', btrim(p_delivery_address), NULLIF(btrim(p_notes), ''))
  RETURNING id INTO v_order_id;

  -- Дублі product_id складаємо; ORDER BY задає однаковий порядок блокувань
  FOR v_item IN
    SELECT (e->>'product_id')::uuid                  AS product_id,
           SUM((e->>'quantity')::integer)::integer   AS quantity
    FROM jsonb_array_elements(p_items) AS e
    GROUP BY 1
    ORDER BY 1
  LOOP
    IF v_item.quantity <= 0 THEN
      RAISE EXCEPTION 'Некорректное количество товара';
    END IF;

    -- Атомарне списання: умова перевіряється під блокуванням рядка
    UPDATE products
    SET stock_quantity = stock_quantity - v_item.quantity
    WHERE id = v_item.product_id
      AND is_active = true
      AND stock_quantity >= v_item.quantity
    RETURNING price INTO v_price;

    IF NOT FOUND THEN
      SELECT name, stock_quantity, is_active
        INTO v_name, v_stock, v_active
      FROM products
      WHERE id = v_item.product_id;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Товар не найден';
      ELSIF v_active IS DISTINCT FROM true THEN
        RAISE EXCEPTION 'Товар «%» больше недоступен', v_name;
      ELSE
        RAISE EXCEPTION 'Недостаточно товара «%»: на складе %, в заказе %',
          v_name, v_stock, v_item.quantity;
      END IF;
    END IF;

    -- Ціна беремо з БД, а не від клієнта
    INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
    VALUES (v_order_id, v_item.product_id, v_item.quantity, v_price, v_price * v_item.quantity);

    v_total       := v_total + v_price * v_item.quantity;
    v_product_ids := v_product_ids || v_item.product_id;
  END LOOP;

  IF p_expected_total IS NOT NULL AND abs(v_total - p_expected_total) > 0.01 THEN
    RAISE EXCEPTION 'Цены изменились. Обновите корзину и повторите оформление';
  END IF;

  UPDATE orders SET total_amount = v_total WHERE id = v_order_id;

  -- Прибираємо з кошика лише те, що замовлено
  DELETE FROM cart_items
  WHERE user_id = v_user_id
    AND product_id = ANY(v_product_ids);

  RETURN v_order_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_order(jsonb, text, text, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_order(jsonb, text, text, numeric) TO authenticated;