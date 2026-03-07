import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const HOOK_SECRET = Deno.env.get('SEND_EMAIL_HOOK_SECRET') ?? ''

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
  const signature = req.headers.get('x-supabase-signature')
  if (!signature || !HOOK_SECRET) return false

  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(HOOK_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  )

  const [, signatureHex] = signature.split('=')
  const signatureBytes = Uint8Array.from(
    signatureHex.match(/.{1,2}/g)!.map((b) => parseInt(b, 16))
  )

  return crypto.subtle.verify('HMAC', key, signatureBytes, encoder.encode(body))
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
  const { user, email_data } = payload

  // Для не-реєстраційних подій повертаємо успіх — Supabase обробить сам
  if (email_data.email_action_type !== 'signup') {
    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const fullName = user.user_metadata?.full_name ?? 'Користувач'
  const confirmUrl = `${SUPABASE_URL}/auth/v1/verify?token=${email_data.token_hash}&type=signup&redirect_to=${encodeURIComponent(email_data.redirect_to)}`

  const emailHtml = `
<!DOCTYPE html>
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
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">КовачМаркет</h1>
              <p style="margin:4px 0 0;color:#fca5a5;font-size:13px;">Будівельні матеріали та обладнання</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 40px 32px;">
              <h2 style="margin:0 0 16px;color:#111827;font-size:20px;font-weight:600;">Вітаємо, ${fullName}!</h2>
              <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
                Дякуємо за реєстрацію на КовачМаркет. Для завершення підтвердіть вашу електронну адресу:
              </p>
              <table cellpadding="0" cellspacing="0" style="margin:24px auto 32px;">
                <tr>
                  <td style="background:#dc2626;border-radius:8px;">
                    <a href="${confirmUrl}"
                       style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">
                      Підтвердити email
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">
                Посилання дійсне 24 години. Якщо ви не реєструвались — просто ігноруйте цей лист.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 24px;">
              <hr style="border:none;border-top:1px solid #e5e7eb;" />
              <p style="margin:16px 0 0;color:#9ca3af;font-size:11px;word-break:break-all;">
                <a href="${confirmUrl}" style="color:#dc2626;">${confirmUrl}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim()

  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'КовачМаркет <noreply@your-domain.com>',
      to: [user.email],
      subject: 'Підтвердіть вашу електронну адресу — КовачМаркет',
      html: emailHtml,
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
