# Supabase Edge Functions

## Доступні функції

### send-confirmation-email
Веб-хук для відправки листів підтвердження. Викликається Supabase Auth на сервері (не браузером), запит підписаний — перевірка підпису всередині функції.

**Не потребує CORS** — запити між серверами, браузер не бере участі.

## Встановлення Supabase CLI

```bash
# Windows (через scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# macOS
brew install supabase/tap/supabase
```

## Локальна розробка

```bash
supabase start
supabase functions serve
```

## Деплой

```bash
supabase link --project-ref your-project-ref
supabase functions deploy send-confirmation-email
```

## Безпека

### CORS
`send-confirmation-email` — веб-хук між серверами, CORS не застосовується.

Якщо в майбутньому з'явиться функція, яку викликає браузер, використовуй `_shared/cors.ts`:

```ts
const ALLOWED_ORIGINS = [
  'https://den-alex.com',
  'http://localhost:5173',
]

export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') ?? ''
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  }
  if (ALLOWED_ORIGINS.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin
  }
  return headers
}
```

### JWT верифікація
- **send-confirmation-email** — перевіряє підпис веб-хука Supabase Auth

### Оформлення замовлень
Замість Edge Function використовується PostgreSQL RPC `create_order` — атомарна транзакція з перевіркою цін і залишків прямо в базі.

## Структура

```
supabase/
├── functions/
│   ├── send-confirmation-email/
│   │   └── index.ts
│   └── README.md
├── migrations/
└── config.toml
```

## Корисні посилання

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli/introduction)
