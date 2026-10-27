import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { renderEmail } from '../_shared/email.ts'
import type { Lang } from '../_shared/email.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const RESEND_FROM = Deno.env.get('RESEND_FROM') ?? ''
const ORDER_EMAIL_SECRET = Deno.env.get('ORDER_EMAIL_SECRET') ?? ''
const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://den-alex.com'

// All user-visible strings for order/rental emails.
const T = {
  ru: {
    order: {
      subject: (id: string) => `Заказ #${id} принят — DenAlex`,
      greeting: (name: string) => `Спасибо за заказ, ${name}!`,
      body: 'Ваш заказ успешно оформлен. Детали:',
      thProduct: 'Товар',
      thQty: 'Кол-во',
      thPrice: 'Цена',
      thTotal: 'Сумма',
      total: 'Итого:',
      delivery: 'Адрес доставки:',
      notes: 'Примечание:',
      button: 'Перейти в кабинет',
      footer: 'Наш менеджер свяжется с вами в ближайшее время для подтверждения доставки.',
    },
    rental: {
      subject: 'Аренда подтверждена — DenAlex',
      greeting: (name: string) => `Спасибо, ${name}!`,
      body: 'Ваша заявка на аренду оборудования принята. Детали:',
      equipment: 'Оборудование',
      startDate: 'Дата начала',
      endDate: 'Дата окончания',
      days: 'Количество дней',
      rate: 'Суточная ставка',
      deposit: 'Залог',
      total: 'Итого',
      notes: 'Примечание:',
      button: 'Перейти в кабинет',
      footer: 'Наш менеджер свяжется с вами для согласования деталей передачи оборудования.',
    },
    defaultName: 'Клиент',
  },
  ro: {
    order: {
      subject: (id: string) => `Comanda #${id} acceptată — DenAlex`,
      greeting: (name: string) => `Mulțumim pentru comandă, ${name}!`,
      body: 'Comanda dvs. a fost înregistrată cu succes. Detalii:',
      thProduct: 'Produs',
      thQty: 'Cant.',
      thPrice: 'Preț',
      thTotal: 'Total',
      total: 'Total:',
      delivery: 'Adresa de livrare:',
      notes: 'Notă:',
      button: 'Mergeți la contul dvs.',
      footer: 'Managerul nostru vă va contacta în curând pentru confirmarea livrării.',
    },
    rental: {
      subject: 'Închiriere confirmată — DenAlex',
      greeting: (name: string) => `Mulțumim, ${name}!`,
      body: 'Cererea dvs. de închiriere a fost acceptată. Detalii:',
      equipment: 'Utilaj',
      startDate: 'Data de start',
      endDate: 'Data de final',
      days: 'Număr de zile',
      rate: 'Tarif zilnic',
      deposit: 'Garanție',
      total: 'Total',
      notes: 'Notă:',
      button: 'Mergeți la contul dvs.',
      footer: 'Managerul nostru vă va contacta pentru a conveni detaliile predării utilajului.',
    },
    defaultName: 'Client',
  },
} as const

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  if (!ORDER_EMAIL_SECRET || req.headers.get('x-order-secret') !== ORDER_EMAIL_SECRET) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { type, id } = await req.json()

  const db = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  let to: string
  let subject: string
  let html: string

  if (type === 'order') {
    const { data: order, error } = await db
      .from('orders')
      .select(`
        id, user_id, total_amount, delivery_address, notes,
        order_items ( quantity, unit_price, subtotal, products ( name ) )
      `)
      .eq('id', id)
      .single()

    if (error || !order) {
      return json({ error: 'Order not found' }, 404)
    }

    const { data: { user } } = await db.auth.admin.getUserById(order.user_id)
    to = user!.email!
    const { data: prof } = await db.from('profiles').select('full_name, locale').eq('id', order.user_id).maybeSingle()
    const lang: Lang = prof?.locale === 'ro' ? 'ro' : 'ru'
    const s = T[lang]
    const fullName = prof?.full_name || s.defaultName

    const rows = (order.order_items as Array<{
      quantity: number; unit_price: number; subtotal: number
      products: { name: string } | null
    }>).map((item) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;">${item.products?.name ?? '—'}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;text-align:center;">${item.quantity}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;text-align:right;">${Number(item.unit_price).toFixed(2)} lei</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;text-align:right;">${Number(item.subtotal).toFixed(2)} lei</td>
      </tr>`).join('')

    const itemsHtml = `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr style="background:#f9fafb;">
            <th style="padding:8px 12px;text-align:left;color:#6b7280;font-weight:600;">${s.order.thProduct}</th>
            <th style="padding:8px 12px;text-align:center;color:#6b7280;font-weight:600;">${s.order.thQty}</th>
            <th style="padding:8px 12px;text-align:right;color:#6b7280;font-weight:600;">${s.order.thPrice}</th>
            <th style="padding:8px 12px;text-align:right;color:#6b7280;font-weight:600;">${s.order.thTotal}</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="padding:10px 12px;text-align:right;font-weight:600;color:#111827;">${s.order.total}</td>
            <td style="padding:10px 12px;text-align:right;font-weight:700;color:#dc2626;">${Number(order.total_amount).toFixed(2)} lei</td>
          </tr>
        </tfoot>
      </table>
      <p style="margin:4px 0 0;color:#374151;font-size:14px;"><strong>${s.order.delivery}</strong> ${order.delivery_address}</p>
      ${order.notes ? `<p style="margin:4px 0 8px;color:#374151;font-size:14px;"><strong>${s.order.notes}</strong> ${order.notes}</p>` : ''}`

    subject = s.order.subject(String(order.id).slice(0, 8).toUpperCase())
    html = renderEmail({
      lang,
      greeting: s.order.greeting(fullName),
      body: s.order.body,
      itemsHtml,
      buttonLabel: s.order.button,
      url: `${SITE_URL}/kabinet`,
      footer: s.order.footer,
    })

  } else if (type === 'rental') {
    const { data: rental, error } = await db
      .from('rentals')
      .select(`
        id, user_id, equipment_name, start_date, end_date, total_days,
        daily_rate, deposit_paid, total_amount, notes
      `)
      .eq('id', id)
      .single()

    if (error || !rental) {
      return json({ error: 'Rental not found' }, 404)
    }

    const { data: { user } } = await db.auth.admin.getUserById(rental.user_id)
    to = user!.email!
    const { data: prof } = await db.from('profiles').select('full_name, locale').eq('id', rental.user_id).maybeSingle()
    const lang: Lang = prof?.locale === 'ro' ? 'ro' : 'ru'
    const s = T[lang]
    const fullName = prof?.full_name || s.defaultName

    const depositRow = Number(rental.deposit_paid) > 0
      ? `<tr><td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;color:#6b7280;">${s.rental.deposit}</td><td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;">${Number(rental.deposit_paid).toFixed(2)} lei</td></tr>`
      : ''

    const itemsHtml = `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;border-collapse:collapse;font-size:14px;">
        <tbody>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;color:#6b7280;">${s.rental.equipment}</td><td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-weight:600;">${rental.equipment_name ?? '—'}</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;color:#6b7280;">${s.rental.startDate}</td><td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;">${rental.start_date}</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;color:#6b7280;">${s.rental.endDate}</td><td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;">${rental.end_date}</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;color:#6b7280;">${s.rental.days}</td><td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;">${rental.total_days}</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;color:#6b7280;">${s.rental.rate}</td><td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;">${Number(rental.daily_rate).toFixed(2)} lei</td></tr>
          ${depositRow}
          <tr><td style="padding:10px 12px;font-weight:600;color:#111827;">${s.rental.total}</td><td style="padding:10px 12px;font-weight:700;color:#dc2626;">${Number(rental.total_amount).toFixed(2)} lei</td></tr>
        </tbody>
      </table>
      ${rental.notes ? `<p style="margin:4px 0 8px;color:#374151;font-size:14px;"><strong>${s.rental.notes}</strong> ${rental.notes}</p>` : ''}`

    subject = s.rental.subject
    html = renderEmail({
      lang,
      greeting: s.rental.greeting(fullName),
      body: s.rental.body,
      itemsHtml,
      buttonLabel: s.rental.button,
      url: `${SITE_URL}/kabinet`,
      footer: s.rental.footer,
    })

  } else {
    return json({ error: 'Unknown type' }, 400)
  }

  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: RESEND_FROM, to: [to], subject, html }),
  })

  if (!resendRes.ok) {
    const err = await resendRes.text()
    console.error('Resend error:', err)
    return json({ error: 'Failed to send email' }, 500)
  }

  return json({ ok: true })
})

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
