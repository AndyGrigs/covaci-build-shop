# Supabase Edge Functions

Це серверні функції для обробки бізнес-логіки вашого застосунку.

## Встановлення Supabase CLI

```bash
# Windows (через scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# macOS
brew install supabase/tap/supabase

# Linux
curl -sSfL https://github.com/supabase/cli/releases/download/v1.123.4/supabase_1.123.4_linux_amd64.deb -o supabase.deb
sudo dpkg -i supabase.deb
```

## Доступні функції

### 1. checkout
**Призначення:** Безпечна обробка процесу оформлення замовлення

**Можливості:**
- Валідація всіх вхідних даних на сервері
- Перевірка наявності товарів на складі
- Перевірка правильності цін (захист від підробки на клієнті)
- Автоматичний розрахунок вартості оренди за днями
- Транзакційне створення замовлення з rollback при помилках
- Автоматичне оновлення inventory
- Валідація дат оренди

**Endpoint:** `POST /checkout`

**Приклад запиту:**
```json
{
  "items": [
    {
      "product_id": "uuid-here",
      "quantity": 2,
      "price_at_purchase": 100.50,
      "start_date": "2025-12-10",
      "end_date": "2025-12-15"
    }
  ],
  "delivery_address": "вул. Хрещатик, 1, Київ",
  "total_amount": 1005.00
}
```

**Відповідь (успіх):**
```json
{
  "success": true,
  "order_id": "uuid-here",
  "message": "Order created successfully"
}
```

**Відповідь (помилка):**
```json
{
  "error": "Insufficient stock for product xyz. Available: 5, requested: 10"
}
```

### 2. check-inventory
**Призначення:** Перевірка наявності товарів та доступності для оренди

**Можливості:**
- Перевірка stock quantity для товарів
- Перевірка доступності обладнання на конкретні дати
- Розрахунок вартості оренди
- Перевірка конфліктів з існуючими замовленнями
- Підрахунок зарезервованої кількості

**Endpoint:** `POST /check-inventory`

**Приклад запиту (для товару):**
```json
{
  "product_id": "uuid-here",
  "quantity": 3
}
```

**Приклад запиту (для оренди):**
```json
{
  "product_id": "uuid-here",
  "quantity": 2,
  "start_date": "2025-12-10",
  "end_date": "2025-12-15"
}
```

**Відповідь:**
```json
{
  "available": true,
  "stock_quantity": 10,
  "reserved_quantity": 3,
  "available_quantity": 7,
  "requested_quantity": 2,
  "product_name": "Бетономішалка 150L",
  "rental_days": 5,
  "price_per_day": 50.00,
  "total_price": 500.00,
  "message": "7 units available for rental",
  "conflicting_rentals": 2
}
```

## Локальна розробка

### 1. Запустити локальний Supabase

```bash
cd c:\Users\andre\Documents\some-future-project-3
supabase start
```

Це запустить:
- PostgreSQL Database
- Studio (UI для управління БД)
- GoTrue (Auth)
- Storage
- Edge Functions

### 2. Розгорнути функції локально

```bash
supabase functions serve
```

Функції будуть доступні за адресою:
- http://localhost:54321/functions/v1/checkout
- http://localhost:54321/functions/v1/check-inventory

### 3. Тестування функцій

```bash
# Тест checkout функції
curl -X POST http://localhost:54321/functions/v1/checkout \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"product_id": "uuid", "quantity": 1, "price_at_purchase": 100}],
    "delivery_address": "Test Address",
    "total_amount": 100
  }'

# Тест check-inventory функції
curl -X POST http://localhost:54321/functions/v1/check-inventory \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "uuid",
    "quantity": 2
  }'
```

## Деплой на продакшен

### 1. Підключитися до проекту

```bash
supabase link --project-ref your-project-ref
```

### 2. Розгорнути функції

```bash
# Розгорнути всі функції
supabase functions deploy

# Або розгорнути окрему функцію
supabase functions deploy checkout
supabase functions deploy check-inventory
```

### 3. Налаштувати змінні оточення

Змінні `SUPABASE_URL` та `SUPABASE_ANON_KEY` автоматично доступні у функціях.

Для додаткових змінних:
```bash
supabase secrets set MY_SECRET=value
```

## Моніторинг

### Переглянути логи

```bash
# Локально
supabase functions logs

# На продакшені
supabase functions logs checkout --project-ref your-project-ref
```

### Переглянути статус

```bash
supabase functions list
```

## Безпека

### CORS
Функції налаштовані на прийом запитів з будь-яких доменів (`Access-Control-Allow-Origin: *`).

**Для продакшену** змініть на:
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://yourdomain.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
```

### JWT верифікація
- **checkout** - вимагає аутентифікації (verify_jwt: true)
- **check-inventory** - публічна функція (verify_jwt: false)

### Rate Limiting
Додайте rate limiting через Supabase Dashboard:
- Settings → API → Rate Limiting
- Рекомендовано: 10-20 requests/second

## Структура проекту

```
supabase/
├── functions/
│   ├── checkout/
│   │   └── index.ts         # Валідація та обробка замовлень
│   ├── check-inventory/
│   │   └── index.ts         # Перевірка наявності
│   └── README.md            # Ця документація
├── migrations/              # SQL міграції
└── config.toml             # Конфігурація Supabase
```

## Типові помилки

### 1. "Function not found"
```bash
# Перевірте що функція розгорнута
supabase functions list
```

### 2. "Unauthorized"
```bash
# Перевірте Authorization header
# Формат: Bearer YOUR_ANON_KEY
```

### 3. CORS помилка
Перевірте що `corsHeaders` включені в response

## Розширення функціоналу

### Додати нову функцію

```bash
# Створити нову функцію
supabase functions new my-function

# Відредагувати код
code supabase/functions/my-function/index.ts

# Розгорнути
supabase functions deploy my-function
```

### Приклад нової функції

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const { name } = await req.json()

  return new Response(
    JSON.stringify({ message: `Hello ${name}!` }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
```

## Корисні посилання

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Deno Deploy Docs](https://deno.com/deploy/docs)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli/introduction)
