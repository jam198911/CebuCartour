/**
 * utils/email.js — Transactional email via Resend.
 * All exported functions are fire-and-forget; errors are logged, never thrown.
 */

const { Resend } = require('resend');

const client = () => {
  if (!process.env.EMAIL_SERVICE_KEY) return null;
  const opts = process.env.RESEND_BASE_URL ? { baseUrl: process.env.RESEND_BASE_URL } : {};
  return new Resend(process.env.EMAIL_SERVICE_KEY, opts);
};
const FROM   = () => process.env.MAIL_FROM || 'CebuCarTour <onboarding@resend.dev>';

async function send(to, subject, html) {
  const resend = client();
  if (!resend || !to) return;
  try {
    await resend.emails.send({ from: FROM(), to: [to], subject, html });
  } catch (err) {
    console.error('[email]', subject, '--', err.message);
  }
}

// ─── HTML layout helper ───────────────────────────────────────────────────────

function layout(title, body) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:560px;width:100%">
  <!-- header -->
  <tr><td style="background:#0ea5e9;padding:24px 32px">
    <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-.3px">CebuCarTour</p>
    <p style="margin:4px 0 0;font-size:13px;color:#bae6fd">Cebu's car rental &amp; tour booking platform</p>
  </td></tr>
  <!-- body -->
  <tr><td style="padding:32px">
    <h2 style="margin:0 0 16px;font-size:20px;color:#1e293b">${title}</h2>
    ${body}
  </td></tr>
  <!-- footer -->
  <tr><td style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0">
    <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center">
      CebuCarTour &nbsp;·&nbsp; Cebu, Philippines<br>
      This is an automated message — please do not reply.
    </p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

function pill(color, text) {
  return `<span style="display:inline-block;background:${color}20;color:${color};border:1px solid ${color}40;padding:2px 10px;border-radius:20px;font-size:12px;font-weight:700">${text}</span>`;
}

function row(label, value) {
  return `<tr>
    <td style="padding:6px 0;font-size:13px;color:#64748b;width:40%">${label}</td>
    <td style="padding:6px 0;font-size:13px;color:#1e293b;font-weight:600">${value}</td>
  </tr>`;
}

function btn(href, text, color = '#0ea5e9') {
  return `<a href="${href}" style="display:inline-block;margin-top:20px;padding:12px 28px;background:${color};color:#fff;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px">${text}</a>`;
}

// ─── Booking created (status: pending) ───────────────────────────────────────

function sendBookingCreated(b) {
  const typeLabel = b.type === 'car' ? 'Car Rental' : 'Tour';
  const body = `
    <p style="margin:0 0 20px;font-size:15px;color:#475569">
      Hi <strong>${b.name || 'there'}</strong>, we've received your booking request.
      The vendor will confirm shortly.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:8px;padding:16px 20px;margin-bottom:20px">
      <tbody>
        ${row('Booking ID',  b.id)}
        ${row('Type',        typeLabel)}
        ${row('Date',        b.date + (b.returnDate && b.returnDate !== b.date ? ` → ${b.returnDate}` : ''))}
        ${b.pickTime  ? row('Pick-up time',  b.pickTime)  : ''}
        ${b.pickup    ? row('Pick-up point', b.pickup)    : ''}
        ${b.guests > 1 ? row('Guests', b.guests)         : ''}
        ${row('Total',       `&#8369;${Number(b.total).toLocaleString()}`)}
        ${row('Status',      pill('#f59e0b', 'Pending confirmation'))}
      </tbody>
    </table>
    <p style="font-size:13px;color:#64748b;margin:0">
      Log in to <strong>CebuCarTour</strong> to track your booking status.
    </p>`;
  return send(b.email, `Booking Received – ${b.id}`, layout('Booking Request Received', body));
}

// ─── Booking status update ────────────────────────────────────────────────────

function sendBookingStatusUpdate(b, newStatus) {
  const configs = {
    confirmed: {
      subject:  `Your booking ${b.id} is confirmed`,
      title:    'Booking Confirmed!',
      intro:    `Great news, <strong>${b.name || 'there'}</strong>! Your booking has been confirmed by the vendor.`,
      statusPill: pill('#16a34a', 'Confirmed'),
    },
    cancelled: {
      subject:  `Your booking ${b.id} has been cancelled`,
      title:    'Booking Cancelled',
      intro:    `Hi <strong>${b.name || 'there'}</strong>, your booking has been cancelled.`,
      statusPill: pill('#dc2626', 'Cancelled'),
    },
    completed: {
      subject:  `Your booking ${b.id} is complete`,
      title:    'Booking Complete',
      intro:    `Hi <strong>${b.name || 'there'}</strong>, your booking has been marked as complete. We hope you had a great experience!`,
      statusPill: pill('#0ea5e9', 'Completed'),
    },
  };

  const cfg = configs[newStatus];
  if (!cfg) return Promise.resolve();

  const typeLabel = b.type === 'car' ? 'Car Rental' : 'Tour';
  const body = `
    <p style="margin:0 0 20px;font-size:15px;color:#475569">${cfg.intro}</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:8px;padding:16px 20px;margin-bottom:20px">
      <tbody>
        ${row('Booking ID',  b.id)}
        ${row('Type',        typeLabel)}
        ${row('Date',        b.date + (b.returnDate && b.returnDate !== b.date ? ` → ${b.returnDate}` : ''))}
        ${b.pickTime  ? row('Pick-up time',  b.pickTime)  : ''}
        ${b.pickup    ? row('Pick-up point', b.pickup)    : ''}
        ${row('Total',       `&#8369;${Number(b.total).toLocaleString()}`)}
        ${row('Status',      cfg.statusPill)}
      </tbody>
    </table>
    <p style="font-size:13px;color:#64748b;margin:0">
      Log in to <strong>CebuCarTour</strong> to view your booking details.
    </p>`;
  return send(b.email, cfg.subject, layout(cfg.title, body));
}

// ─── Vendor account decision ──────────────────────────────────────────────────

function sendVendorDecision(user, decision, reason = '') {
  const configs = {
    approved: {
      subject: 'Your vendor account has been approved – CebuCarTour',
      title:   'You\'re approved!',
      body:    `<p style="margin:0 0 16px;font-size:15px;color:#475569">
        Hi <strong>${user.name || 'there'}</strong>, welcome aboard!
        Your vendor account on <strong>CebuCarTour</strong> has been approved.
        You can now log in and start listing your cars and tours.
      </p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 20px;margin-bottom:20px">
        ${pill('#16a34a', 'Account Approved')}
        <p style="margin:10px 0 0;font-size:13px;color:#15803d">
          Start by creating your first listing from the Vendor Dashboard.
        </p>
      </div>`,
    },
    rejected: {
      subject: 'Update on your vendor application – CebuCarTour',
      title:   'Application Update',
      body:    `<p style="margin:0 0 16px;font-size:15px;color:#475569">
        Hi <strong>${user.name || 'there'}</strong>, thank you for applying to become a vendor on CebuCarTour.
        Unfortunately, we were unable to approve your application at this time.
      </p>
      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px 20px;margin-bottom:20px">
        ${pill('#dc2626', 'Not Approved')}
        ${reason ? `<p style="margin:10px 0 0;font-size:13px;color:#b91c1c"><strong>Reason:</strong> ${reason}</p>` : ''}
      </div>
      <p style="font-size:13px;color:#64748b;margin:0">
        If you believe this is a mistake, please contact our support team.
      </p>`,
    },
    suspended: {
      subject: 'Your vendor account has been suspended – CebuCarTour',
      title:   'Account Suspended',
      body:    `<p style="margin:0 0 16px;font-size:15px;color:#475569">
        Hi <strong>${user.name || 'there'}</strong>, your vendor account on CebuCarTour has been temporarily suspended.
      </p>
      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:16px 20px;margin-bottom:20px">
        ${pill('#ea580c', 'Account Suspended')}
        ${reason ? `<p style="margin:10px 0 0;font-size:13px;color:#c2410c"><strong>Reason:</strong> ${reason}</p>` : ''}
      </div>
      <p style="font-size:13px;color:#64748b;margin:0">
        Please contact support if you have questions about this decision.
      </p>`,
    },
  };

  const cfg = configs[decision];
  if (!cfg) return Promise.resolve();
  return send(user.email, cfg.subject, layout(cfg.title, cfg.body));
}

// ─── Admin: new registration notification ────────────────────────────────────

function sendAdminNewRegistration(user) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return Promise.resolve();

  const isVendor  = user.role === 'vendor';
  const roleLabel = isVendor ? 'Vendor' : 'Customer';
  const rolePill  = isVendor ? pill('#7c3aed', 'Vendor') : pill('#0ea5e9', 'Customer');

  const vendorRows = isVendor ? `
    ${row('Company',  user.company  || '—')}
    ${row('Phone',    user.phone    || '—')}
    ${row('Address',  user.address  || '—')}
    ${user.idType   ? row('ID Type',  user.idType)   : ''}
    ${user.idNumber ? row('ID No.',   user.idNumber) : ''}
  ` : '';

  const body = `
    <p style="margin:0 0 20px;font-size:15px;color:#475569">
      A new <strong>${roleLabel}</strong> has submitted a registration and is waiting for your approval.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:8px;padding:16px 20px;margin-bottom:20px">
      <tbody>
        ${row('Name',   user.name  || '—')}
        ${row('Email',  user.email || '—')}
        ${row('Role',   rolePill)}
        ${vendorRows}
        ${row('Registered', new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' }))}
      </tbody>
    </table>
    <p style="font-size:13px;color:#64748b;margin:0">
      Log in to the <strong>Admin Dashboard</strong> to review and approve or reject this registration.
    </p>`;

  const resend = client();
  if (!resend) return Promise.resolve();
  return resend.emails.send({
    from:    FROM(),
    to:      [adminEmail],
    subject: `New ${roleLabel} Registration — ${user.name}`,
    html:    layout(`New ${roleLabel} Registration`, body),
  }).catch(err => console.error('[email] sendAdminNewRegistration:', err.message));
}

// ─── Set-password on first approval ──────────────────────────────────────────

function sendSetPasswordEmail(user, setUrl) {
  const body = `
    <p style="margin:0 0 16px;font-size:15px;color:#475569">
      Hi <strong>${user.name || 'there'}</strong>, your <strong>CebuCarTour</strong> account has been approved!
      Click the button below to set your password and start using the platform.
    </p>
    <div style="text-align:center">
      ${btn(setUrl, 'Set My Password', '#0ea5e9')}
    </div>
    <p style="margin:20px 0 0;font-size:12px;color:#94a3b8">
      This link expires in 24 hours. If you didn't register on CebuCarTour, you can ignore this email.
    </p>`;
  return send(
    user.email,
    'Your CebuCarTour account is approved — set your password',
    layout('Account Approved!', body)
  );
}

// ─── Forgot-password reset link ──────────────────────────────────────────────

function sendPasswordReset(to, resetUrl) {
  const body = `
    <p style="margin:0 0 16px;font-size:15px;color:#475569">
      We received a request to reset the password for your <strong>CebuCarTour</strong> account.
      Click the button below to choose a new password. This link expires in <strong>1 hour</strong>.
    </p>
    <div style="text-align:center">
      ${btn(resetUrl, 'Reset Password', '#0ea5e9')}
    </div>
    <p style="margin:20px 0 0;font-size:12px;color:#94a3b8">
      If you didn't request this, you can safely ignore this email — your password won't change.
    </p>`;
  return send(to, 'Reset Your CebuCarTour Password', layout('Reset Your Password', body));
}

module.exports = { sendBookingCreated, sendBookingStatusUpdate, sendVendorDecision, sendSetPasswordEmail, sendAdminNewRegistration, sendPasswordReset };
