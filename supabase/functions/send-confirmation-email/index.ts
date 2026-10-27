import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { renderEmail } from '../_shared/email.ts'
import type { Lang } from '../_shared/email.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const HOOK_SECRET = Deno.env.get('SEND_EMAIL_HOOK_SECRET') ?? ''
const RESEND_FROM = Deno.env.get('RESEND_FROM') ?? ''

interface EmailHookPayload {
  user: {
    id: string
    email: string
    new_email?: string
    user_metadata: { full_name?: string; locale?: string }
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

  const ts = parseInt(msgTimestamp, 10)
  if (Math.abs(Math.floor(Date.now() / 1000) - ts) > 300) return false

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

  const signedContent = `${msgId}.${msgTimestamp}.${body}`
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(signedContent)
  )
  const computed = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))

  return msgSignature.split(' ').some((sig) => sig.split(',')[1] === computed)
}

function buildActionUrl(tokenHash: string, type: string, redirectTo: string): string {
  return `${SUPABASE_URL}/auth/v1/verify?token=${tokenHash}&type=${type}&redirect_to=${encodeURIComponent(redirectTo)}`
}

// All user-visible strings, keyed by language.
const T = {
  ru: {
    signup: {
      subject: 'Подтвердите ваш email — DenAlex',
      greeting: (name: string) => `Добро пожаловать, ${name}!`,
      body: 'Спасибо за регистрацию в DenAlex. Для завершения подтвердите ваш адрес электронной почты:',
      button: 'Подтвердить email',
      footer: 'Ссылка действительна 24 часа. Если вы не регистрировались — просто проигнорируйте это письмо.',
    },
    recovery: {
      subject: 'Сброс пароля — DenAlex',
      greeting: (name: string) => `Здравствуйте, ${name}!`,
      body: 'Мы получили запрос на сброс пароля для вашего аккаунта. Нажмите кнопку ниже, чтобы установить новый пароль:',
      button: 'Сбросить пароль',
      footer: 'Ссылка действительна 1 час. Если вы не запрашивали сброс — просто проигнорируйте это письмо.',
    },
    invite: {
      subject: 'Приглашение в DenAlex',
      greeting: () => 'Вас пригласили в DenAlex!',
      body: 'Нажмите кнопку ниже, чтобы принять приглашение и создать аккаунт:',
      button: 'Принять приглашение',
      footer: 'Если вы не ожидали этого приглашения — просто проигнорируйте это письмо.',
    },
    email_change: {
      subject: 'Подтверждение смены email — DenAlex',
      greeting: (name: string) => `Здравствуйте, ${name}!`,
      bodyOld: 'Вы запросили смену электронной почты. Подтвердите это действие с текущего адреса:',
      bodyNew: 'Подтвердите новый адрес электронной почты, нажав кнопку ниже:',
      button: 'Подтвердить адрес',
      footer: 'Если вы не меняли email — немедленно обратитесь в поддержку.',
    },
  },
  ro: {
    signup: {
      subject: 'Confirmați adresa de email — DenAlex',
      greeting: (name: string) => `Bun venit, ${name}!`,
      body: 'Mulțumim pentru înregistrarea la DenAlex. Pentru finalizare, confirmați adresa dvs. de email:',
      button: 'Confirmați emailul',
      footer: 'Link-ul este valabil 24 de ore. Dacă nu v-ați înregistrat — ignorați acest mesaj.',
    },
    recovery: {
      subject: 'Resetare parolă — DenAlex',
      greeting: (name: string) => `Bună ziua, ${name}!`,
      body: 'Am primit o solicitare de resetare a parolei pentru contul dvs. Apăsați butonul de mai jos pentru a seta o parolă nouă:',
      button: 'Resetați parola',
      footer: 'Link-ul este valabil 1 oră. Dacă nu ați solicitat resetarea — ignorați acest mesaj.',
    },
    invite: {
      subject: 'Invitație la DenAlex',
      greeting: () => 'Ați fost invitat la DenAlex!',
      body: 'Apăsați butonul de mai jos pentru a accepta invitația și a crea un cont:',
      button: 'Acceptați invitația',
      footer: 'Dacă nu așteptați această invitație — ignorați acest mesaj.',
    },
    email_change: {
      subject: 'Confirmare schimbare email — DenAlex',
      greeting: (name: string) => `Bună ziua, ${name}!`,
      bodyOld: 'Ați solicitat schimbarea adresei de email. Confirmați această acțiune de la adresa curentă:',
      bodyNew: 'Confirmați noua adresă de email apăsând butonul de mai jos:',
      button: 'Confirmați adresa',
      footer: 'Dacă nu ați schimbat emailul — contactați imediat suportul.',
    },
  },
} as const

function buildEmailContent(payload: EmailHookPayload): { subject: string; html: string } {
  const { user, email_data } = payload
  const fullName = user.user_metadata?.full_name ?? (payload.user.user_metadata?.locale === 'ro' ? 'Client' : 'Пользователь')
  const lang: Lang = (user.user_metadata?.locale === 'ro' ? 'ro' : 'ru')
  const s = T[lang]
  const { email_action_type, token_hash, token_hash_new, redirect_to } = email_data

  switch (email_action_type) {
    case 'signup':
      return {
        subject: s.signup.subject,
        html: renderEmail({
          lang,
          greeting: s.signup.greeting(fullName),
          body: s.signup.body,
          buttonLabel: s.signup.button,
          url: buildActionUrl(token_hash, 'signup', redirect_to),
          footer: s.signup.footer,
        }),
      }

    case 'recovery':
      return {
        subject: s.recovery.subject,
        html: renderEmail({
          lang,
          greeting: s.recovery.greeting(fullName),
          body: s.recovery.body,
          buttonLabel: s.recovery.button,
          url: buildActionUrl(token_hash, 'recovery', redirect_to),
          footer: s.recovery.footer,
        }),
      }

    case 'invite':
      return {
        subject: s.invite.subject,
        html: renderEmail({
          lang,
          greeting: s.invite.greeting(),
          body: s.invite.body,
          buttonLabel: s.invite.button,
          url: buildActionUrl(token_hash, 'invite', redirect_to),
          footer: s.invite.footer,
        }),
      }

    case 'email_change': {
      const sendingToOld = !!user.new_email && user.email !== user.new_email
      const tokenToUse = sendingToOld ? token_hash : (token_hash_new ?? token_hash)
      return {
        subject: s.email_change.subject,
        html: renderEmail({
          lang,
          greeting: s.email_change.greeting(fullName),
          body: sendingToOld ? s.email_change.bodyOld : s.email_change.bodyNew,
          buttonLabel: s.email_change.button,
          url: buildActionUrl(tokenToUse, 'email_change', redirect_to),
          footer: s.email_change.footer,
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
