# Supabase Edge Functions - Повний гайд

## Що таке Edge Functions?

**Supabase Edge Functions** - це serverless функції на TypeScript/JavaScript, які працюють на Deno runtime і виконуються на edge-серверах по всьому світу близько до ваших користувачів.

### Чому це важливо?

Без Edge Functions ваша критична бізнес-логіка виконується на клієнті:
- ❌ Користувач може підробити ціни в DevTools
- ❌ Можна обійти валідацію
- ❌ API ключі третіх сервісів потрапляють на клієнт
- ❌ Складна логіка виконується на різних пристроях з різною продуктивністю

З Edge Functions:
- ✅ Вся критична логіка на сервері
- ✅ Захист від підробки даних
- ✅ API ключі залишаються в безпеці
- ✅ Однакова продуктивність для всіх користувачів
- ✅ Транзакційні операції з rollback
- ✅ Логування та моніторинг

## Архітектура проекту

```
Клієнт (React)                    Edge Functions (Deno)              База даних
     │                                    │                               │
     │  1. Користувач натискає           │                               │
     │     "Complete Order"               │                               │
     │                                    │                               │
     ├─── 2. processCheckout() ──────────>│                               │
     │        (з auth token)              │                               │
     │                                    │  3. Валідація даних           │
     │                                    │     Перевірка auth            │
     │                                    │                               │
     │                                    ├─── 4. Перевірка наявності ──>│
     │                                    │<─── 5. Stock info ────────────┤
     │                                    │                               │
     │                                    │  6. Валідація цін             │
     │                                    │     Розрахунок загальної суми │
     │                                    │                               │
     │                                    ├─── 7. BEGIN TRANSACTION ─────>│
     │                                    ├─── 8. INSERT order ──────────>│
     │                                    ├─── 9. INSERT order_items ────>│
     │                                    ├─── 10. UPDATE stock ─────────>│
     │                                    ├─── 11. COMMIT ───────────────>│
     │                                    │                               │
     │<─── 12. { order_id, success } ─────┤                               │
     │                                    │                               │
     │  13. Показати успіх                │                               │
     │      Очистити кошик                │                               │
```

## Створені функції

### 1. `checkout` - Безпечне оформлення замовлення

**Файл:** [supabase/functions/checkout/index.ts](supabase/functions/checkout/index.ts)

**Що робить:**
- Валідує всі вхідні дані (items, адреса, суми)
- Перевіряє auth token користувача
- Перевіряє наявність кожного товару
- Перевіряє що ціни не були підроблені
- Розраховує правильну суму для оренди
- Створює замовлення та items в одній транзакції
- Оновлює stock_quantity
- При помилці робить rollback

**Виклик:**
```typescript
import { processCheckout } from '@/lib/edgeFunctions'

const result = await processCheckout({
  items: [
    {
      product_id: 'uuid',
      quantity: 2,
      price_at_purchase: 50.00,
      start_date: '2025-12-10',
      end_date: '2025-12-15'
    }
  ],
  delivery_address: 'вул. Хрещатик, 1, Київ',
  total_amount: 500.00
})
```

### 2. `check-inventory` - Перевірка наявності

**Файл:** [supabase/functions/check-inventory/index.ts](supabase/functions/check-inventory/index.ts)

**Що робить:**
- Перевіряє stock_quantity для товарів
- Для оренди - перевіряє доступність на конкретні дати
- Знаходить конфліктуючі замовлення
- Розраховує скільки одиниць доступно
- Розраховує вартість оренди

**Виклик:**
```typescript
import { checkInventory } from '@/lib/edgeFunctions'

// Для товару
const availability = await checkInventory({
  product_id: 'uuid',
  quantity: 3
})

// Для оренди
const availability = await checkInventory({
  product_id: 'uuid',
  quantity: 2,
  start_date: '2025-12-10',
  end_date: '2025-12-15'
})

console.log(availability.available) // true/false
console.log(availability.message) // "7 units available for rental"
console.log(availability.total_price) // 500.00
```

## Швидкий старт

### Крок 1: Встановити Supabase CLI

**Windows (Scoop):**
```bash
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**macOS:**
```bash
brew install supabase/tap/supabase
```

**Linux:**
```bash
curl -sSfL https://github.com/supabase/cli/releases/download/v1.123.4/supabase_1.123.4_linux_amd64.deb -o supabase.deb
sudo dpkg -i supabase.deb
```

### Крок 2: Ініціалізувати проект (якщо ще не зроблено)

```bash
cd c:\Users\andre\Documents\some-future-project-3
supabase init
```

### Крок 3: Запустити локально

```bash
supabase start
```

Це запустить:
- PostgreSQL на порту 54322
- API Gateway на порту 54321
- Studio (UI) на порту 54323

Виведе credentials:
```
API URL: http://localhost:54321
anon key: eyJh...
service_role key: eyJh...
```

### Крок 4: Запустити Edge Functions локально

```bash
supabase functions serve
```

Функції доступні на:
- http://localhost:54321/functions/v1/checkout
- http://localhost:54321/functions/v1/check-inventory

### Крок 5: Тестування

**Через curl:**
```bash
# Перевірка inventory
curl -X POST http://localhost:54321/functions/v1/check-inventory \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "your-uuid-here",
    "quantity": 2
  }'
```

**Через код:**
```typescript
// src/lib/edgeFunctions.ts вже створений
import { checkInventory, processCheckout } from '@/lib/edgeFunctions'

// Використовуйте функції як показано вище
```

### Крок 6: Оновити код клієнта

Див. приклад в [src/examples/CartWithEdgeFunctions.example.tsx](src/examples/CartWithEdgeFunctions.example.tsx)

Основні зміни:
1. Імпортувати `processCheckout` замість прямих insert запитів
2. Викликати Edge Function замість створення order напряму
3. Обробити помилки від Edge Function

**Було (небезпечно):**
```typescript
// ❌ Створення на клієнті - небезпечно!
const { data: order } = await supabase
  .from('orders')
  .insert({ user_id, total_amount, delivery_address })
```

**Стало (безпечно):**
```typescript
// ✅ Через Edge Function - безпечно!
const result = await processCheckout({
  items,
  delivery_address,
  total_amount
})
```

## Деплой на продакшен

### Крок 1: Підключитися до проекту

```bash
supabase login
supabase link --project-ref your-project-ref
```

**Де знайти project-ref:**
1. Перейти на https://supabase.com/dashboard
2. Вибрати ваш проект
3. Settings → General → Reference ID

### Крок 2: Розгорнути функції

```bash
# Всі функції
supabase functions deploy

# Або окремо
supabase functions deploy checkout
supabase functions deploy check-inventory
```

### Крок 3: Налаштувати змінні оточення (опціонально)

Для додаткових секретів:
```bash
supabase secrets set STRIPE_API_KEY=sk_live_...
supabase secrets set SENDGRID_API_KEY=SG....
```

В коді функції:
```typescript
const stripeKey = Deno.env.get('STRIPE_API_KEY')
```

### Крок 4: Оновити CORS (для продакшену)

В файлах функцій змініть:
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://yourdomain.com', // Замість '*'
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
```

### Крок 5: Оновити URL в клієнті

В [src/lib/supabase.ts](src/lib/supabase.ts) використовується `VITE_SUPABASE_URL`:
```typescript
// .env.production
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJh...
```

## Моніторинг та дебаг

### Переглянути логи

```bash
# Локально
supabase functions logs

# На продакшені
supabase functions logs checkout
supabase functions logs check-inventory
```

### Переглянути статус

```bash
supabase functions list
```

### Дебаг в VSCode

1. Додати `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Supabase Functions",
      "type": "node",
      "request": "attach",
      "port": 9229
    }
  ]
}
```

2. Запустити з дебагом:
```bash
supabase functions serve --debug
```

## Безпека

### Поточні налаштування

- `checkout` - вимагає JWT token (verify_jwt: true)
- `check-inventory` - публічна (verify_jwt: false)

### Додати rate limiting

В Supabase Dashboard:
1. Settings → API → Rate Limiting
2. Встановити ліміти (рекомендовано 10-20 req/sec)

### Додати CAPTCHA

Для публічних endpoint (реєстрація, check-inventory):
```typescript
import { verify } from 'https://esm.sh/hcaptcha'

const token = req.headers.get('hcaptcha-token')
const verified = await verify(HCAPTCHA_SECRET, token)

if (!verified.success) {
  return new Response('CAPTCHA failed', { status: 403 })
}
```

## Що далі?

### Рекомендовані додаткові функції

1. **send-order-email** - відправка email після створення замовлення
2. **process-payment** - інтеграція з платіжною системою
3. **calculate-shipping** - розрахунок вартості доставки
4. **validate-promo-code** - перевірка промокодів
5. **generate-invoice-pdf** - генерація PDF інвойсів

### Покращення існуючих функцій

- [ ] Додати логування в Sentry
- [ ] Додати метрики для моніторингу
- [ ] Додати email notifications
- [ ] Додати webhook для статусів замовлень
- [ ] Додати резервування товарів в кошику

## Корисні посилання

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Deno Deploy Documentation](https://deno.com/deploy/docs)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli/introduction)
- [Наш README для Edge Functions](supabase/functions/README.md)
- [Приклад використання](src/examples/CartWithEdgeFunctions.example.tsx)

## Підтримка

При проблемах:
1. Перевірте логи: `supabase functions logs`
2. Перевірте CORS налаштування
3. Перевірте що auth token передається правильно
4. Перегляньте Network tab в DevTools

Для питань створюйте issue в репозиторії або звертайтесь до [Supabase Discord](https://discord.supabase.com).
