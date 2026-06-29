// email.ts — Azure IQ transactional email via Resend (SMTP fallback)
// FROM: uses RESEND_FROM env var, falls back to onboarding@resend.dev (Resend test sender)
// When no provider: returns the link so admins can share manually

function getFrom() {
  return process.env.RESEND_FROM
    ? `Azure IQ <${process.env.RESEND_FROM}>`
    : "Azure IQ <onboarding@resend.dev>";
}

async function sendViaResend(to: string, subject: string, html: string): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.RESEND_API_KEY}` },
    body: JSON.stringify({ from: getFrom(), to, subject, html }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("Resend error:", err);
    return false;
  }
  return true;
}

async function sendViaSMTP(to: string, subject: string, html: string): Promise<boolean> {
  if (!process.env.SMTP_HOST) return false;
  const nodemailer = await import("nodemailer");
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  await transport.sendMail({ from: getFrom(), to, subject, html });
  return true;
}

// Shared email header/footer
function emailHeader() {
  return `<div style="background:#1a3a2e;padding:24px 32px;border-radius:12px 12px 0 0">
    <div style="color:#fff;font-size:18px;font-weight:700">azure
      <span style="color:#c8e63c;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;font-weight:400;margin-left:4px">communications · IQ</span>
    </div>
  </div>`;
}

function emailFooter() {
  return `<div style="background:#f7f7f7;padding:16px 32px;border-top:1px solid #e6e6e6;border-radius:0 0 12px 12px">
    <p style="margin:0;font-size:12px;color:#aaa">© ${new Date().getFullYear()} Azure Communications · Powered by Standfast AI</p>
  </div>`;
}

function emailWrap(body: string) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f7f7f7;font-family:sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f7;padding:40px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
        <tr><td>${emailHeader()}</td></tr>
        <tr><td style="padding:32px">${body}</td></tr>
        <tr><td>${emailFooter()}</td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function ctaButton(href: string, label: string) {
  return `<a href="${href}" style="display:inline-block;background:#1a3a2e;color:#c8e63c;padding:13px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">${label}</a>`;
}

// ── PASSWORD RESET ─────────────────────────────────────────────────────────
export async function sendPasswordResetEmail(
  email: string,
  name: string,
  token: string
): Promise<{ sent: boolean; resetLink: string }> {
  const resetLink = `${process.env.NEXTAUTH_URL || "https://azure-quote-builder.vercel.app"}/reset-password?token=${token}`;
  const firstName = name?.split(" ")[0] ?? "";
  const html = emailWrap(`
    <h2 style="margin:0 0 12px;font-size:20px;color:#111827;font-weight:700">Reset your password</h2>
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.7">
      Hi${firstName ? " " + firstName : ""},<br><br>
      We received a request to reset your Azure IQ password. Click the button below to choose a new one.
    </p>
    ${ctaButton(resetLink, "Reset my password →")}
    <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;line-height:1.6">
      This link expires in <strong>1 hour</strong>. If you didn't request a reset, you can safely ignore this email.
    </p>
    <p style="margin:10px 0 0;font-size:11px;color:#d1d5db;word-break:break-all">${resetLink}</p>
  `);

  const subject = "Reset your Azure IQ password";
  const sent = await sendViaResend(email, subject, html) || await sendViaSMTP(email, subject, html);
  if (!sent) console.log(`[DEV] Password reset link for ${email}: ${resetLink}`);
  return { sent, resetLink };
}

// ── WELCOME EMAIL ──────────────────────────────────────────────────────────
export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  const loginLink = `${process.env.NEXTAUTH_URL || "https://azure-quote-builder.vercel.app"}/login`;
  const firstName = name?.split(" ")[0] ?? "";
  const html = emailWrap(`
    <h2 style="margin:0 0 12px;font-size:20px;color:#111827;font-weight:700">Welcome to Azure IQ${firstName ? ", " + firstName : ""}</h2>
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.7">
      Your account has been created. You can now sign in and start quoting.
    </p>
    ${ctaButton(loginLink, "Sign in to Azure IQ →")}
  `);

  const sent = await sendViaResend(email, "Welcome to Azure IQ", html) || await sendViaSMTP(email, "Welcome to Azure IQ", html);
  if (!sent) console.log(`[DEV] Welcome email for ${email}: ${loginLink}`);
}

// ── TEMP PASSWORD (admin-created users) ────────────────────────────────────
export async function sendTempPasswordEmail(
  email: string,
  name: string,
  tempPassword: string
): Promise<{ sent: boolean }> {
  const loginLink = `${process.env.NEXTAUTH_URL || "https://azure-quote-builder.vercel.app"}/login`;
  const firstName = name?.split(" ")[0] ?? "";
  const html = emailWrap(`
    <h2 style="margin:0 0 12px;font-size:20px;color:#111827;font-weight:700">Welcome to Azure IQ${firstName ? ", " + firstName : ""}</h2>
    <p style="margin:0 0 16px;font-size:15px;color:#6b7280;line-height:1.7">
      An account has been created for you. Use the details below to sign in for the first time.
    </p>
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px 20px;margin-bottom:24px">
      <div style="font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">Email</div>
      <div style="font-size:15px;color:#111827;font-weight:600;margin-bottom:12px">${email}</div>
      <div style="font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">Temporary password</div>
      <div style="font-size:18px;color:#1a3a2e;font-weight:700;font-family:monospace;letter-spacing:0.08em">${tempPassword}</div>
    </div>
    <p style="margin:0 0 24px;font-size:14px;color:#ef4444;font-weight:600">
      ⚠ Please change your password immediately after signing in.
    </p>
    ${ctaButton(loginLink, "Sign in to Azure IQ →")}
    <p style="margin:20px 0 0;font-size:12px;color:#9ca3af;line-height:1.6">
      If you did not expect this email, please contact your administrator.
    </p>
  `);

  const subject = "Your Azure IQ account is ready";
  const sent = await sendViaResend(email, subject, html) || await sendViaSMTP(email, subject, html);
  if (!sent) console.log(`[DEV] Temp password for ${email}: ${tempPassword} — login: ${loginLink}`);
  return { sent };
}
