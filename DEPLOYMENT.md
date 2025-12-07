# 🚀 Інструкція по деплою проекту

## Частина 1: Deплой Edge Functions на Supabase Cloud

### Крок 1: Створити проект на Supabase

1. Перейдіть на [supabase.com](https://supabase.com)
2. Натисніть **"New project"**
3. Заповніть:
   - Project name: `your-project-name`
   - Database Password: **запам'ятайте!**
   - Region: Europe (Central) - найближче до України
4. Натисніть **"Create new project"** (займе 2-3 хвилини)

### Крок 2: Отримати креденшали

Після створення проекту:

1. Перейдіть в **Settings → API**
2. Скопіюйте:
   ```
   Project URL: https://xxxxx.supabase.co
   anon public key: eyJhbGc...
   Project Ref ID: xxxxx (це ID з URL)
   ```

### Крок 3: Налаштувати базу даних

1. Перейдіть в **SQL Editor**
2. Виконайте міграції з папки `supabase/migrations/` (якщо є)
3. Або вручну створіть таблиці які використовує ваш проект

### Крок 4: Підключитися локально до проекту

Відкрийте термінал:

```bash
cd c:\Users\andre\Documents\some-future-project-3

# Залогінитися в Supabase
supabase login

# Підключити локальний проект до cloud
supabase link --project-ref xxxxx
# Замініть xxxxx на ваш Project Ref ID

# Введіть database password коли попросить
```

### Крок 5: Деплой Edge Functions

```bash
# Деплой всіх функцій
supabase functions deploy

# Або окремо:
supabase functions deploy checkout
supabase functions deploy check-inventory
```

Після деплою побачите:

```
✓ Deployed Function checkout [https://xxxxx.supabase.co/functions/v1/checkout]
✓ Deployed Function check-inventory [https://xxxxx.supabase.co/functions/v1/check-inventory]
```

### Крок 6: Перевірити що функції працюють

```bash
# Тест check-inventory
curl -X POST https://xxxxx.supabase.co/functions/v1/check-inventory \
  -H "Content-Type: application/json" \
  -d '{"product_id":"test","quantity":1}'

# Повинні отримати відповідь (навіть якщо product not found - це нормально)
```

---

## Частина 2: Deплой Frontend на Vercel

### Спосіб A: Через GitHub (Рекомендований)

#### Крок 1: Запушити код на GitHub

```bash
# Якщо ще не створили репозиторій на GitHub:
# 1. Перейдіть на github.com
# 2. Натисніть "New repository"
# 3. Створіть репозиторій (НЕ додавайте README/gitignore)

# Потім в терміналі:
git add .
git commit -m "Add deployment config"

# Якщо це перший push:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main

# Якщо remote вже є:
git push
```

#### Крок 2: Деплой на Vercel

1. Перейдіть на [vercel.com](https://vercel.com)
2. Натисніть **"Add New..." → "Project"**
3. **Імпортуйте** ваш GitHub репозиторій
4. Vercel автоматично розпізнає:
   - Framework: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. **Додайте Environment Variables:**
   - Клік на **"Environment Variables"**
   - Додайте:
     ```
     Name: VITE_SUPABASE_URL
     Value: https://xxxxx.supabase.co (ваш Supabase URL)

     Name: VITE_SUPABASE_ANON_KEY
     Value: eyJhbGc... (ваш anon key)
     ```
6. Натисніть **"Deploy"**
7. Зачекайте 2-3 хвилини

#### Крок 3: Отримати URL

Після деплою побачите:
```
🎉 Deployed to production
https://your-project.vercel.app
```

### Спосіб B: Через Vercel CLI

```bash
# Встановити Vercel CLI глобально
npm install -g vercel

# Залогінитися
vercel login
# Відкриється браузер для авторизації

# Перший деплой (preview)
vercel

# Додати environment variables
vercel env add VITE_SUPABASE_URL production
# Введіть: https://xxxxx.supabase.co

vercel env add VITE_SUPABASE_ANON_KEY production
# Введіть: ваш anon key

# Production деплой зі змінними
vercel --prod
```

---

## Частина 3: Налаштування після деплою

### Крок 1: Оновити CORS в Edge Functions (Безпека)

Зараз ваші функції приймають запити з будь-якого домену (`Access-Control-Allow-Origin: *`).

**Для продакшену** потрібно обмежити:

1. Відкрийте `supabase/functions/checkout/index.ts`
2. Змініть:
   ```typescript
   const corsHeaders = {
     'Access-Control-Allow-Origin': 'https://your-project.vercel.app', // ваш Vercel URL
     'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
   }
   ```
3. Те саме для `supabase/functions/check-inventory/index.ts`
4. Деплой знову:
   ```bash
   supabase functions deploy
   ```

### Крок 2: Оновити Auth URLs в Supabase

1. Перейдіть в Supabase Dashboard → **Authentication → URL Configuration**
2. Додайте:
   - Site URL: `https://your-project.vercel.app`
   - Redirect URLs: `https://your-project.vercel.app/**`

### Крок 3: Перевірити що все працює

1. Відкрийте `https://your-project.vercel.app`
2. Спробуйте:
   - Зареєструватися
   - Переглянути товари
   - Перевірити наявність (виклик check-inventory)
   - Оформити замовлення (виклик checkout)

---

## 🔄 Автоматичний деплой (CI/CD)

Якщо ви використовуєте GitHub + Vercel:

- Кожен `git push` до `main` автоматично деплоїть на Vercel
- Pull requests створюють preview deployments
- Edge Functions потрібно деплоїти вручну через `supabase functions deploy`

**Щоб автоматизувати Edge Functions:**

Можна налаштувати GitHub Actions, але це складніше. Зараз достатньо деплоїти вручну коли змінюєте функції.

---

## 📊 Моніторинг після деплою

### Переглянути логи Edge Functions

```bash
# Логи checkout функції
supabase functions logs checkout --project-ref xxxxx

# Логи check-inventory
supabase functions logs check-inventory --project-ref xxxxx
```

### Vercel Logs

1. Vercel Dashboard → ваш проект → **Deployments**
2. Клік на останній deployment → **View Function Logs**

---

## �� Типові помилки та рішення

### 1. "Missing Supabase environment variables"

**Проблема:** Не додані змінні в Vercel

**Рішення:**
```bash
# Через Vercel Dashboard:
Project Settings → Environment Variables → Add

# Або через CLI:
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
```

### 2. "Function not found"

**Проблема:** Edge Functions не задеплоєні

**Рішення:**
```bash
supabase functions deploy
```

### 3. CORS помилка в браузері

**Проблема:** Неправильний CORS в Edge Functions

**Рішення:** Перевірте що в функціях:
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://your-project.vercel.app',
  // ...
}
```

### 4. "Unauthorized" при checkout

**Проблема:** Користувач не авторизований або невірний JWT

**Рішення:**
- Перевірте що користувач залогінений
- Перевірте що передається Authorization header
- Перевірте що `verify_jwt: true` в config.toml для checkout

---

## 📝 Checklist деплою

- [ ] Створений проект на Supabase Cloud
- [ ] Скопійовані URL та anon key
- [ ] Виконані міграції БД (якщо є)
- [ ] Задеплоєні Edge Functions (`supabase functions deploy`)
- [ ] Перевірено що функції працюють (curl тест)
- [ ] Запушено код на GitHub
- [ ] Створений проект на Vercel
- [ ] Додані environment variables в Vercel
- [ ] Успішний деплой frontend
- [ ] Оновлений CORS в Edge Functions
- [ ] Додані redirect URLs в Supabase Auth
- [ ] Протестовано всі функції на продакшені

---

## 🎯 Корисні посилання

- [Supabase Dashboard](https://app.supabase.com)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Supabase Functions Docs](https://supabase.com/docs/guides/functions)
- [Vercel Docs](https://vercel.com/docs)

---

## 💰 Ціни

**Supabase Free Tier:**
- 500MB database
- 1GB file storage
- 50,000 monthly active users
- 2GB Edge Functions invocations/month

**Vercel Free Tier:**
- 100GB bandwidth/month
- Unlimited deployments
- Automatic HTTPS

Для більшості проектів це безкоштовно! 🎉
