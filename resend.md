# Resend — Налаштування email для КовачМаркет

Інтеграція Resend з Supabase для відправки кастомних email листів через Edge Function.

---

## Архітектура

```
Користувач реєструється
        ↓
  Supabase Auth Hook (send_email)
        ↓
  Edge Function: send-confirmation-email
        ↓
  Resend API → Лист користувачу
```

---

## Крок 1 — Resend акаунт та API ключ

1. Зайдіть на [resend.com](https://resend.com) → **Sign Up**
2. **API Keys** → **Create API Key**
   - Назва: `supabase-smtp`
   - Permission: `Sending access`
3. Скопіюйте ключ — **показується лише один раз**: `re_xxxxxxxxx`

> **Для тесту без домену** використовуйте `from: onboarding@resend.dev` (лист прийде лише на email акаунту Resend).
> **Для продакшну** додайте власний домен: **Domains** → **Add Domain**.

---

## Крок 2 — Секрети Supabase

```bash
# API ключ Resend
supabase secrets set RESEND_API_KEY=re_xxxxxxxxx

# Довільний рядок для верифікації webhook підпису
supabase secrets set SEND_EMAIL_HOOK_SECRET=your-random-secret-here
```

Згенерувати секрет можна командою:
```bash
openssl rand -hex 32
```

---

## Крок 3 — Deploy Edge Function

```bash
supabase functions deploy send-confirmation-email
```

Файл функції: [`supabase/functions/send-confirmation-email/index.ts`](supabase/functions/send-confirmation-email/index.ts)

Що робить функція:
- Отримує Auth Hook webhook від Supabase при реєстрації
- Верифікує підпис запиту (HMAC-SHA256)
- Відправляє брендований HTML email через Resend API

---

## Крок 4 — Auth Hook в Supabase Dashboard

**Authentication → Hooks → Send email**

| Поле | Значення |
|------|----------|
| Hook | Send email |
| URL | `https://<project-ref>.supabase.co/functions/v1/send-confirmation-email` |
| Secret | значення `SEND_EMAIL_HOOK_SECRET` |

> `<project-ref>` — ID проєкту зі сторінки **Project Settings → General**.

---

## Крок 5 — URL Configuration

**Authentication → URL Configuration**

| Поле | Dev | Production |
|------|-----|------------|
| Site URL | `http://localhost:5173` | `https://your-domain.com` |
| Redirect URLs | `http://localhost:5173` | `https://your-domain.com` |

---

## Крок 6 — Замінити `from` адресу

У файлі [`supabase/functions/send-confirmation-email/index.ts`](supabase/functions/send-confirmation-email/index.ts), рядок ~82:

```ts
// До (тест)
from: 'КовачМаркет <onboarding@resend.dev>',

// Після (продакшн з власним доменом)
from: 'КовачМаркет <noreply@your-domain.com>',
```

---

## Перевірка

1. Зареєструйте новий тестовий акаунт
2. Перевірте пошту — має прийти лист від КовачМаркет
3. Натисніть кнопку **«Підтвердити email»** → вас перенаправить на сайт

---

## SMTP (альтернатива без Edge Function)

Якщо не потрібен кастомний шаблон — простіший варіант через SMTP:

**Authentication → Emails → SMTP Settings** → увімкніть **Enable custom SMTP**:

| Поле | Значення |
|------|----------|
| Sender email | `onboarding@resend.dev` |
| Sender name | `КовачМаркет` |
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | `re_xxxxxxxxx` (API ключ) |
| Minimum interval | `60` |

> Edge Function дає повний контроль над шаблоном; SMTP — швидке рішення за 2 хвилини.
