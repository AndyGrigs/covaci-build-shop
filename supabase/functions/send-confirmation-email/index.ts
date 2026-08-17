import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const HOOK_SECRET = Deno.env.get('SEND_EMAIL_HOOK_SECRET') ?? ''
const RESEND_FROM = Deno.env.get('RESEND_FROM') ?? ''

interface EmailHookPayload {
  user: {
    id: string
    email: string
    user_metadata: { full_name?: string }
  }
  email_data: {
    token: string
    token_hash: string
    redirect_to: string
    email_action_type: 'signup' | 'recovery' | 'invite' | 'email_change'
    site_url: string
    token_new?: string
    token_hash_new?: string
  }
}

async function verifyHookSignature(req: Request, body: string): Promise<boolean> {
  const msgId = req.headers.get('webhook-id')
  const msgTimestamp = req.headers.get('webhook-timestamp')
  const msgSignature = req.headers.get('webhook-signature')

  if (!msgId || !msgTimestamp || !msgSignature || !HOOK_SECRET) return false

  // Відхиляємо вебхуки старші за 5 хвилин
  const ts = parseInt(msgTimestamp, 10)
  if (Math.abs(Math.floor(Date.now() / 1000) - ts) > 300) return false

  // Секрет зберігається як "whsec_<base64>" — стрипимо префікс і декодуємо
  const secretBase64 = HOOK_SECRET.startsWith('whsec_') ? HOOK_SECRET.slice(6) : HOOK_SECRET
  const secretBytes = Uint8Array.from(atob(secretBase64), (c) => c.charCodeAt(0))

  const key = await crypto.subtle.importKey(
    'raw',
    secretBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  // Standard Webhooks: підписуємо "{webhook-id}.{webhook-timestamp}.{body}"
  const signedContent = `${msgId}.${msgTimestamp}.${body}`
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(signedContent)
  )
  const computed = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))

  // Заголовок може містити кілька підписів через пробіл: "v1,sig1 v1,sig2"
  return msgSignature.split(' ').some((sig) => sig.split(',')[1] === computed)
}

function buildActionUrl(tokenHash: string, type: string, redirectTo: string): string {
  return `${SUPABASE_URL}/auth/v1/verify?token=${tokenHash}&type=${type}&redirect_to=${encodeURIComponent(redirectTo)}`
}

function renderEmail(opts: {
  greeting: string
  body: string
  buttonLabel: string
  url: string
  footer: string
}): string {
  return `<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:#dc2626;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">DenAlex</h1>
              <p style="margin:4px 0 0;color:#fca5a5;font-size:13px;">Будівельні матеріали та обладнання</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 40px 32px;">
              <h2 style="margin:0 0 16px;color:#111827;font-size:20px;font-weight:600;">${opts.greeting}</h2>
              <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">${opts.body}</p>
              <table cellpadding="0" cellspacing="0" style="margin:24px auto 32px;">
                <tr>
                  <td style="background:#dc2626;border-radius:8px;">
                    <a href="${opts.url}"
                       style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">
                      ${opts.buttonLabel}
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">${opts.footer}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 24px;">
              <hr style="border:none;border-top:1px solid #e5e7eb;" />
              <p style="margin:16px 0 0;color:#9ca3af;font-size:11px;word-break:break-all;">
                <a href="${opts.url}" style="color:#dc2626;">${opts.url}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function buildEmailContent(
  payload: EmailHookPayload
): { subject: string; html: string } {
  const { user, email_data } = payload
  const fullName = user.user_metadata?.full_name ?? 'Користувач'
  const { email_action_type, token_hash, token_hash_new, redirect_to } = email_data

  switch (email_action_type) {
    case 'signup':
      return {
        subject: 'Підтвердіть вашу електронну адресу — DenAlex',
        html: renderEmail({
          greeting: `Вітаємо, ${fullName}!`,
          body: 'Дякуємо за реєстрацію на DenAlex. Для завершення підтвердіть вашу електронну адресу:',
          buttonLabel: 'Підтвердити email',
          url: buildActionUrl(token_hash, 'signup', redirect_to),
          footer: 'Посилання дійсне 24 години. Якщо ви не реєструвались — просто ігноруйте цей лист.',
        }),
      }

    case 'recovery':
      return {
        subject: 'Скидання пароля — DenAlex',
        html: renderEmail({
          greeting: `Привіт, ${fullName}!`,
          body: 'Ми отримали запит на скидання пароля для вашого акаунта. Натисніть кнопку нижче, щоб встановити новий пароль:',
          buttonLabel: 'Скинути пароль',
          url: buildActionUrl(token_hash, 'recovery', redirect_to),
          footer: 'Посилання дійсне 1 годину. Якщо ви не запитували скидання — просто ігноруйте цей лист.',
        }),
      }

    case 'invite':
      return {
        subject: 'Запрошення до DenAlex',
        html: renderEmail({
          greeting: 'Вас запросили до DenAlex!',
          body: 'Натисніть кнопку нижче, щоб прийняти запрошення та створити акаунт:',
          buttonLabel: 'Прийняти запрошення',
          url: buildActionUrl(token_hash, 'invite', redirect_to),
          footer: 'Якщо ви не очікували цього запрошення — просто ігноруйте цей лист.',
        }),
      }

    case 'email_change':
      // token_hash_new — для підтвердження нової адреси, token_hash — для старої
      return {
        subject: 'Підтвердження зміни email — DenAlex',
        html: renderEmail({
          greeting: `Привіт, ${fullName}!`,
          body: 'Для підтвердження зміни вашої електронної адреси натисніть кнопку нижче:',
          buttonLabel: 'Підтвердити нову адресу',
          url: buildActionUrl(token_hash_new ?? token_hash, 'email_change', redirect_to),
          footer: 'Якщо ви не змінювали email — негайно зверніться до підтримки.',
        }),
      }
  }
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  const body = await req.text()

  const isValid = await verifyHookSignature(req, body)
  if (!isValid) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const payload: EmailHookPayload = JSON.parse(body)

  const { subject, html } = buildEmailContent(payload)

  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: [payload.user.email],
      subject,
      html,
    }),
  })

  if (!resendRes.ok) {
    const err = await resendRes.text()
    console.error('Resend error:', err)
    return new Response(JSON.stringify({ error: 'Failed to send email' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({}), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
