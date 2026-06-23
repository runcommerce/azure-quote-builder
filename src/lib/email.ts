// Email sending via Resend (or nodemailer SMTP fallback)
const FROM = "Azure Quote Builder <noreply@azurecomm.ie>";

export async function sendPasswordResetEmail(email: string, name: string, token: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f7f7f7;font-family:Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f7;padding:40px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
        <tr><td style="background:#183230;padding:24px 32px">
          <div style="color:#fff;font-size:18px;font-weight:700;letter-spacing:0.01em">azure <span style="color:#B3D9ED;font-weight:400;font-size:12px;letter-spacing:0.1em;text-transform:uppercase">communications</span></div>
          <div style="color:rgba(255,255,255,0.6);font-size:13px;margin-top:4px">AI Quote Builder</div>
        </td></tr>
        <tr><td style="padding:36px 32px">
          <h1 style="margin:0 0 16px;font-size:22px;color:#183230;font-weight:700">Reset your password</h1>
          <p style="margin:0 0 24px;font-size:15px;color:#404040;line-height:1.6">Hi ${name}, we received a request to reset your password. Click the button below to choose a new one.</p>
          <a href="${resetUrl}" style="display:inline-block;background:#007EBB;color:#fff;padding:13px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">Reset Password</a>
          <p style="margin:24px 0 0;font-size:13px;color:#888;line-height:1.6">This link expires in <strong>1 hour</strong>. If you didn't request a reset, you can safely ignore this email.</p>
          <p style="margin:12px 0 0;font-size:12px;color:#aaa;word-break:break-all">Or copy this link: ${resetUrl}</p>
        </td></tr>
        <tr><td style="background:#f7f7f7;padding:16px 32px;border-top:1px solid #e6e6e6">
          <p style="margin:0;font-size:12px;color:#aaa">© ${new Date().getFullYear()} Azure Communications · Powered by Standfast AI</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  if (process.env.RESEND_API_KEY) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.RESEND_API_KEY}` },
      body: JSON.stringify({ from: FROM, to: email, subject: "Reset your Azure Quote Builder password", html }),
    });
    return res.ok;
  }

  // SMTP fallback via nodemailer
  if (process.env.SMTP_HOST) {
    const nodemailer = await import("nodemailer");
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transport.sendMail({ from: FROM, to: email, subject: "Reset your Azure Quote Builder password", html });
    return true;
  }

  // Dev fallback — log to console
  console.log(`[DEV] Password reset link for ${email}: ${resetUrl}`);
  return true;
}

export async function sendWelcomeEmail(email: string, name: string) {
  const loginUrl = `${process.env.NEXTAUTH_URL}/login`;
  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f7f7f7;font-family:Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f7;padding:40px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
        <tr><td style="background:#183230;padding:24px 32px">
          <div style="color:#fff;font-size:18px;font-weight:700">azure <span style="color:#B3D9ED;font-weight:400;font-size:12px;text-transform:uppercase">communications</span></div>
          <div style="color:rgba(255,255,255,0.6);font-size:13px;margin-top:4px">AI Quote Builder</div>
        </td></tr>
        <tr><td style="padding:36px 32px">
          <h1 style="margin:0 0 16px;font-size:22px;color:#183230;font-weight:700">Welcome, ${name}</h1>
          <p style="margin:0 0 24px;font-size:15px;color:#404040;line-height:1.6">Your account has been created. You can now log in to the Azure Quote Builder.</p>
          <a href="${loginUrl}" style="display:inline-block;background:#007EBB;color:#fff;padding:13px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">Log In</a>
        </td></tr>
        <tr><td style="background:#f7f7f7;padding:16px 32px;border-top:1px solid #e6e6e6">
          <p style="margin:0;font-size:12px;color:#aaa">© ${new Date().getFullYear()} Azure Communications · Powered by Standfast AI</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  if (process.env.RESEND_API_KEY) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.RESEND_API_KEY}` },
      body: JSON.stringify({ from: FROM, to: email, subject: "Welcome to Azure Quote Builder", html }),
    });
  } else {
    console.log(`[DEV] Welcome email sent to ${email}`);
  }
}
