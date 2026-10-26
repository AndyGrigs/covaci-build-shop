export type RenderEmailOpts = {
  greeting: string
  body: string
  /** Optional HTML block inserted between the body paragraph and the button */
  itemsHtml?: string
  buttonLabel: string
  url: string
  footer: string
}

export function renderEmail(opts: RenderEmailOpts): string {
  return `<!DOCTYPE html>
<html lang="ru">
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
              <p style="margin:4px 0 0;color:#fca5a5;font-size:13px;">Строительные материалы и оборудование</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 40px 32px;">
              <h2 style="margin:0 0 16px;color:#111827;font-size:20px;font-weight:600;">${opts.greeting}</h2>
              <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">${opts.body}</p>
              ${opts.itemsHtml ?? ''}
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
