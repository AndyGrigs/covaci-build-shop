# Quick Start - Edge Functions за 5 хвилин

## 1️⃣ Встановити Supabase CLI

**Windows:**
```bash
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```


## 2️⃣ Запустити локально

```bash
# У папці проекту
npm run supabase:start

# Або
supabase start
```

Скопіюйте `anon key` з виводу в консоль.

## 3️⃣ Запустити Edge Functions

```bash
npm run functions:serve

# Або
supabase functions serve
```

Functions доступні на `http://localhost:54321/functions/v1/`

## 4️⃣ Тестувати

**Перевірка наявності товару:**
```bash
curl -X POST http://localhost:54321/functions/v1/check-inventory \
  -H "Content-Type: application/json" \
  -d '{"product_id": "your-uuid", "quantity": 2}'
```

**Створення замовлення (потрібен auth token):**
```typescript
import { processCheckout } from '@/lib/edgeFunctions'

const result = await processCheckout({
  items: [{
    product_id: 'uuid',
    quantity: 2,
    price_at_purchase: 100
  }],
  delivery_address: 'Test Address',
  total_amount: 200
})
```

## 5️⃣ Використати в коді

Див. [src/examples/CartWithEdgeFunctions.example.tsx](src/examples/CartWithEdgeFunctions.example.tsx)

Основні зміни в Cart.tsx:

```typescript
// Імпортувати
import { processCheckout } from '@/lib/edgeFunctions'

// Замість прямого insert в orders
const result = await processCheckout({
  items: cartItems.map(item => ({
    product_id: item.product_id,
    quantity: item.quantity,
    price_at_purchase: item.products.price,
  })),
  delivery_address,
  total_amount
})

if (result) {
  alert(`Order created: ${result.order_id}`)
}
```

## 6️⃣ Деплой на продакшен

```bash
# Підключитися
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# Розгорнути
npm run functions:deploy
```

## 📚 Повна документація

- [EDGE_FUNCTIONS_GUIDE.md](EDGE_FUNCTIONS_GUIDE.md) - Детальний гайд
- [supabase/functions/README.md](supabase/functions/README.md) - Документація функцій

## 🚀 Що дають Edge Functions?

✅ Валідація даних на сервері
✅ Захист від підробки цін
✅ Перевірка наявності товарів
✅ Транзакційні операції
✅ Безпека API ключів

## 🆘 Проблеми?

```bash
# Переглянути логи
npm run functions:logs

# Переглянути статус
npm run supabase:status

# Зупинити все
npm run supabase:stop
```

Детальніше: [EDGE_FUNCTIONS_GUIDE.md](EDGE_FUNCTIONS_GUIDE.md)
