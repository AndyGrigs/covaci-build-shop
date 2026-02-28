Потрібно додати emailRedirectTo в signUp — без цього Supabase не знає куди редиректити після підтвердження. Також треба налаштувати URL в Dashboard.

Update Todos

Add emailRedirectTo to signUp in AuthContext

Guide through Resend + Supabase SMTP configuration
Edit c:\Users\andre\Documents\covaci-build-shop\src\contexts\AuthContext.tsx
Added 1 line
Update Todos

Add emailRedirectTo to signUp in AuthContext

Guide through Resend + Supabase SMTP configuration
Тепер покроково налаштування SMTP:

Крок 1 — Resend акаунт
Зайдіть на resend.com → Sign Up
API Keys → Create API Key → назвіть supabase-smtp → Create
Скопіюйте ключ — він показується лише один раз (re_xxxxxxxxx)
Крок 2 — SMTP в Supabase Dashboard
Authentication → Emails → SMTP Settings → увімкніть Enable custom SMTP і заповніть:

Поле	Значення
Sender email address	onboarding@resend.dev (для тесту без домену)
Sender name	КовачМаркет
Host	smtp.resend.com
Port number	465
Username	resend
Password	re_xxxxxxxxx ← ваш API ключ
Minimum interval	60
Натисніть Save changes.

Крок 3 — URL Configuration в Supabase
Authentication → URL Configuration:

Поле	Значення
Site URL	http://localhost:5173 (зараз для dev)
Redirect URLs	http://localhost:5173
Збережіть.

Крок 4 — Перевірте
Зареєструйте новий тестовий акаунт
Перевірте пошту — має прийти лист від Supabase
Натисніть посилання в листі → вас перенаправить на сайт і автоматично залогінить
Напишіть якщо є питання при заповненні форм.

Update Todos

Add emailRedirectTo to signUp in AuthContext

Guide through Resend + Supabase SMTP configuration