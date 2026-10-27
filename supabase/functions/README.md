# Supabase Edge Functions

## Доступні функції

### send-confirmation-email
Веб-хук для відправки листів підтвердження. Викликається Supabase Auth на сервері (не браузером), запит підписаний — перевірка підпису всередині функції.

**Не потребує CORS** — запити між серверами, браузер не бере участі.

### send-order-email
Відправляє лист клієнту після оформлення замовлення або аренди. Викликається тригером бази даних (`orders_notify`, `rentals_notify`) через `pg_net.http_post`.

Приймає JSON: `{ "type": "order" | "rental", "id": "<uuid>" }`.

Захищена власним секретом (`x-order-secret`), бо використовує `SUPABASE_SERVICE_ROLE_KEY` для обходу RLS.

**Не потребує CORS** — виклик між серверами (тригер → функція).

## Секрети

| Секрет | Де використовується | Як отримати |
|--------|---------------------|-------------|
| `RESEND_API_KEY` | обидві функції | [resend.com](https://resend.com) → API Keys |
| `RESEND_FROM` | обидві функції | верифікований відправник у Resend, напр. `noreply@den-alex.com` |
| `SEND_EMAIL_HOOK_SECRET` | send-confirmation-email | Supabase Dashboard → Auth → Hooks |
| `ORDER_EMAIL_SECRET` | send-order-email | згенерувати самостійно: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `SITE_URL` | send-order-email | `https://den-alex.com` |

`SUPABASE_URL` і `SUPABASE_SERVICE_ROLE_KEY` Supabase інжектує автоматично — вручну задавати не потрібно.

Задати секрети:
```bash
supabase secrets set RESEND_API_KEY=... RESEND_FROM=... ORDER_EMAIL_SECRET=... SITE_URL=https://den-alex.com
```

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

> `[auth.hook.send_email] enabled = false` в `config.toml` — пошта йде в Inbucket (`localhost:54324`), а не через Resend. Увімкни для тестування реальних листів.

## Деплой

```bash
supabase link --project-ref your-project-ref
supabase functions deploy send-confirmation-email
supabase functions deploy send-order-email
```

## Безпека

### CORS
Обидві функції — веб-хуки між серверами, CORS не застосовується.

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

### Автентифікація запитів
- **send-confirmation-email** — перевіряє підпис веб-хука Supabase Auth (Standard Webhooks HMAC-SHA256)
- **send-order-email** — перевіряє заголовок `x-order-secret`

### Оформлення замовлень
Замість Edge Function використовується PostgreSQL RPC `create_order` — атомарна транзакція з перевіркою цін і залишків прямо в базі.

## Структура

```
supabase/
├── functions/
│   ├── _shared/
│   │   └── email.ts          # спільний HTML-шаблон листа
│   ├── send-confirmation-email/
│   │   └── index.ts
│   ├── send-order-email/
│   │   └── index.ts
│   └── README.md
├── migrations/
└── config.toml
```

## Корисні посилання

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli/introduction)
