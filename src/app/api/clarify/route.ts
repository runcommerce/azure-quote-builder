import { NextRequest, NextResponse } from "next/server";

// Field labels for human-readable email body
const FIELD_LABELS: Record<string, string> = {
  quantity:               "Print quantity",
  delivery_address:       "Delivery address / location",
  delivery_location_count:"Number of delivery locations",
  finished_size_length:   "Finished size (length mm)",
  finished_size_width:    "Finished size (width mm)",
  pages:                  "Total number of pages",
  substrate_name:         "Substrate / paper stock",
  fold_type:              "Fold type",
  binding_type:           "Binding type",
  bundling_type:          "Bundling requirements",
  proof_type:             "Proof type required",
  artwork_status:         "Artwork status (new / repeat / supplied)",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      to,           // requester email — from created_by + portal domain, or passed explicitly
      specRef,      // e.g. "741086"
      specName,     // e.g. "CIREBC1105 – A4 2pp"
      createdBy,    // e.g. "Bryan Nicholas CPT"
      missingFields, // string[] of field keys from FIELD_LABELS
      customMessage, // optional override message
      send,          // boolean — if false, just return draft without sending
    } = body;

    if (!specRef && !specName) {
      return NextResponse.json({ error: "specRef or specName required" }, { status: 400 });
    }

    // Build missing fields list
    const fieldList = (missingFields as string[])
      .map((f: string) => `  • ${FIELD_LABELS[f] ?? f}`)
      .join("\n");

    const subject = `Spec clarification required — ${specName ?? specRef}`;

    const textBody = `Hi${createdBy ? " " + createdBy.split(" ")[0] : ""},

Thank you for sending through the spec${specRef ? ` (ref: ${specRef})` : ""}.

To complete the quote, we need a few additional details:

${fieldList}

Could you please come back to us with the above at your earliest convenience? We'll have a price back to you promptly once we have everything.

Many thanks,
Azure Communications
quotes@azurecomm.ie`;

    const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f7f7f7;font-family:Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f7;padding:40px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden">
        <tr><td style="background:#1a3a2e;padding:24px 32px">
          <div style="color:#fff;font-size:18px;font-weight:700;letter-spacing:0.01em">
            azure <span style="color:#c8e63c;font-weight:400;font-size:11px;letter-spacing:0.12em;text-transform:uppercase">communications</span>
          </div>
          <div style="color:rgba(255,255,255,0.5);font-size:12px;margin-top:3px">Quote Builder</div>
        </td></tr>
        <tr><td style="padding:32px 32px 24px">
          <h2 style="margin:0 0 16px;font-size:18px;color:#1a3a2e;font-weight:700">
            Spec clarification required
          </h2>
          <p style="margin:0 0 8px;font-size:14px;color:#404040;line-height:1.7">
            Hi${createdBy ? " " + createdBy.split(" ")[0] : ""},
          </p>
          <p style="margin:0 0 20px;font-size:14px;color:#404040;line-height:1.7">
            Thank you for sending through the spec${specRef ? ` <strong>(ref: ${specRef})</strong>` : ""}. To complete the quote we need a few additional details:
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:24px">
            ${(missingFields as string[]).map((f: string, i: number) => `
            <tr style="background:${i % 2 === 0 ? "#f9fafb" : "#fff"}">
              <td style="padding:10px 16px;font-size:13px;color:#111827;border-bottom:1px solid #e5e7eb">
                ${FIELD_LABELS[f] ?? f}
              </td>
            </tr>`).join("")}
          </table>
          <p style="margin:0 0 8px;font-size:14px;color:#404040;line-height:1.7">
            We'll have a price back to you promptly once we have everything.
          </p>
          <p style="margin:0;font-size:14px;color:#404040;line-height:1.7">Many thanks,<br><strong>Azure Communications</strong></p>
        </td></tr>
        <tr><td style="background:#f7f7f7;padding:14px 32px;border-top:1px solid #e6e6e6">
          <p style="margin:0;font-size:11px;color:#aaa">© ${new Date().getFullYear()} Azure Communications · quotes@azurecomm.ie</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    // Return draft without sending if send=false
    if (!send) {
      return NextResponse.json({ subject, textBody, htmlBody, to: to ?? null });
    }

    // Send via Resend if configured
    if (process.env.RESEND_API_KEY && to) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Azure Communications <quotes@azurecomm.ie>",
          to,
          subject,
          html: htmlBody,
          text: textBody,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return NextResponse.json({ error: "Resend error: " + JSON.stringify(err), draft: { subject, textBody, htmlBody } }, { status: 502 });
      }
      return NextResponse.json({ sent: true, to, subject });
    }

    // SMTP fallback
    if (process.env.SMTP_HOST && to) {
      const nodemailer = await import("nodemailer");
      const transport = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
      await transport.sendMail({
        from: "Azure Communications <quotes@azurecomm.ie>",
        to,
        subject,
        html: htmlBody,
        text: textBody,
      });
      return NextResponse.json({ sent: true, to, subject });
    }

    // No email provider — return draft for manual copy/paste
    return NextResponse.json({
      sent: false,
      reason: "No email provider configured (RESEND_API_KEY or SMTP_HOST needed)",
      draft: { subject, textBody, htmlBody },
    });

  } catch (err) {
    console.error("Clarify route error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
