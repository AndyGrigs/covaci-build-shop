import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { renderEmail } from '../_shared/email.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const HOOK_SECRET = Deno.env.get('SEND_EMAIL_HOOK_SECRET') ?? ''
const RESEND_FROM = Deno.env.get('RESEND_FROM') ?? ''

interface EmailHookPayload {
  user: {
    id: string
    email: string
    new_email?: string
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

  // Секрет має формат "v1,whsec_<base64>" — стрипимо обидва префікси
  let raw = HOOK_SECRET
  if (raw.startsWith('v1,')) raw = raw.slice(3)
  if (raw.startsWith('whsec_')) raw = raw.slice(6)
  const secretBytes = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0))

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

function buildEmailContent(
  payload: EmailHookPayload
): { subject: string; html: string } {
  const { user, email_data } = payload
  const fullName = user.user_metadata?.full_name ?? 'Пользователь'
  const { email_action_type, token_hash, token_hash_new, redirect_to } = email_data

  switch (email_action_type) {
    case 'signup':
      return {
        subject: 'Подтвердите ваш email — DenAlex',
        html: renderEmail({
          greeting: `Добро пожаловать, ${fullName}!`,
          body: 'Спасибо за регистрацию в DenAlex. Для завершения подтвердите ваш адрес электронной почты:',
          buttonLabel: 'Подтвердить email',
          url: buildActionUrl(token_hash, 'signup', redirect_to),
          footer: 'Ссылка действительна 24 часа. Если вы не регистрировались — просто проигнорируйте это письмо.',
        }),
      }

    case 'recovery':
      return {
        subject: 'Сброс пароля — DenAlex',
        html: renderEmail({
          greeting: `Здравствуйте, ${fullName}!`,
          body: 'Мы получили запрос на сброс пароля для вашего аккаунта. Нажмите кнопку ниже, чтобы установить новый пароль:',
          buttonLabel: 'Сбросить пароль',
          url: buildActionUrl(token_hash, 'recovery', redirect_to),
          footer: 'Ссылка действительна 1 час. Если вы не запрашивали сброс — просто проигнорируйте это письмо.',
        }),
      }

    case 'invite':
      return {
        subject: 'Приглашение в DenAlex',
        html: renderEmail({
          greeting: 'Вас пригласили в DenAlex!',
          body: 'Нажмите кнопку ниже, чтобы принять приглашение и создать аккаунт:',
          buttonLabel: 'Принять приглашение',
          url: buildActionUrl(token_hash, 'invite', redirect_to),
          footer: 'Если вы не ожидали этого приглашения — просто проигнорируйте это письмо.',
        }),
      }

    case 'email_change': {
      // With double_confirm_changes = true GoTrue calls this hook twice.
      // When sending to the OLD address: user.email = old, user.new_email = pending new → use token_hash.
      // When sending to the NEW address: user.email = new, user.new_email absent/same   → use token_hash_new.
      const sendingToOld = !!user.new_email && user.email !== user.new_email
      const tokenToUse = sendingToOld ? token_hash : (token_hash_new ?? token_hash)
      const body = sendingToOld
        ? 'Вы запросили смену электронной почты. Подтвердите это действие с текущего адреса:'
        : 'Подтвердите новый адрес электронной почты, нажав кнопку ниже:'
      return {
        subject: 'Подтверждение смены email — DenAlex',
        html: renderEmail({
          greeting: `Здравствуйте, ${fullName}!`,
          body,
          buttonLabel: 'Подтвердить адрес',
          url: buildActionUrl(tokenToUse, 'email_change', redirect_to),
          footer: 'Если вы не меняли email — немедленно обратитесь в поддержку.',
        }),
      }
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
