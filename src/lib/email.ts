import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM_EMAIL ?? 'Lend <noreply@lend.issev.de>'

function baseTemplate(content: string) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f6f6f6;margin:0;padding:32px 16px;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;padding:32px;border:1px solid #e5e5e5;">
    <div style="margin-bottom:24px;display:flex;align-items:center;gap:8px;">
      <span style="background:#7c3aed;border-radius:8px;padding:6px 8px;color:#fff;font-weight:700;font-size:14px;">Lend</span>
    </div>
    ${content}
    <p style="font-size:11px;color:#aaa;margin-top:28px;padding-top:16px;border-top:1px solid #f0f0f0;">
      Sent by Lend · You received this because someone logged a loan with your name or email.
    </p>
  </div>
</body>
</html>`
}

export async function sendLoanCreatedEmail({
  to,
  borrowerName,
  itemName,
  ownerName,
  dueDate,
  notes,
}: {
  to: string
  borrowerName: string
  itemName: string
  ownerName: string
  dueDate: string
  notes?: string | null
}) {
  const formatted = new Date(dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  const html = baseTemplate(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111;">You're borrowing something 📦</h2>
    <p style="margin:0 0 24px;color:#555;font-size:15px;">Hi ${borrowerName}, ${ownerName} has logged a loan for you.</p>
    <div style="background:#f9f8ff;border:1px solid #e9e4ff;border-radius:12px;padding:20px;margin-bottom:24px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:6px 0;color:#888;font-size:13px;width:40%;">Item</td><td style="padding:6px 0;font-weight:600;font-size:14px;color:#111;">${itemName}</td></tr>
        <tr><td style="padding:6px 0;color:#888;font-size:13px;">Due back</td><td style="padding:6px 0;font-weight:600;font-size:14px;color:#111;">${formatted}</td></tr>
        ${notes ? `<tr><td style="padding:6px 0;color:#888;font-size:13px;">Notes</td><td style="padding:6px 0;font-size:14px;color:#333;">${notes}</td></tr>` : ''}
      </table>
    </div>
    <p style="margin:0;color:#555;font-size:14px;">Please return it by the due date. If you have questions, contact ${ownerName} directly.</p>
  `)

  return resend.emails.send({
    from: FROM,
    to,
    subject: `You're borrowing ${itemName} — due back ${formatted}`,
    html,
  })
}

export async function sendOverdueEmail({
  to,
  borrowerName,
  itemName,
  ownerName,
  dueDate,
}: {
  to: string
  borrowerName: string
  itemName: string
  ownerName: string
  dueDate: string
}) {
  const formatted = new Date(dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const daysOverdue = Math.floor((Date.now() - new Date(dueDate).getTime()) / 86400000)

  const html = baseTemplate(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#b91c1c;">Overdue reminder ⚠️</h2>
    <p style="margin:0 0 24px;color:#555;font-size:15px;">Hi ${borrowerName}, a loan from ${ownerName} is overdue.</p>
    <div style="background:#fff5f5;border:1px solid #fecaca;border-radius:12px;padding:20px;margin-bottom:24px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:6px 0;color:#888;font-size:13px;width:40%;">Item</td><td style="padding:6px 0;font-weight:600;font-size:14px;color:#111;">${itemName}</td></tr>
        <tr><td style="padding:6px 0;color:#888;font-size:13px;">Was due</td><td style="padding:6px 0;font-weight:600;font-size:14px;color:#b91c1c;">${formatted} (${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} ago)</td></tr>
      </table>
    </div>
    <p style="margin:0;color:#555;font-size:14px;">Please return <strong>${itemName}</strong> to ${ownerName} as soon as possible.</p>
  `)

  return resend.emails.send({
    from: FROM,
    to,
    subject: `Overdue: ${itemName} was due back on ${formatted}`,
    html,
  })
}
