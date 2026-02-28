import {
  attachEmailProviderMessageId,
  claimOrderEmailSend,
  releaseOrderEmailClaim,
} from "@/lib/reliability-store";
import { getOptionalEnv, getRequiredEnv } from "@/lib/env";

type EmailType = "stripe_paid" | "cod_placed";

type OrderEmailInput = {
  orderId: string;
  orderNumber: string;
  to: string;
  paymentMethod: "stripe" | "cod";
  deliveryDate: string;
  amount: number;
  items: Array<{ name: string; qty: number; unitPrice: number }>;
  trackingUrl: string;
  emailType: EmailType;
};

function money(value: number) {
  return `AED ${value.toLocaleString("en-US")}`;
}

function buildHtml(input: OrderEmailInput) {
  const rows = input.items
    .map(
      (item) =>
        `<tr><td style=\"padding:6px 0\">${item.name} x ${item.qty}</td><td style=\"padding:6px 0;text-align:right\">${money(
          item.qty * item.unitPrice,
        )}</td></tr>`,
    )
    .join("");

  return `
  <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a;max-width:620px;margin:0 auto;">
    <h2 style="margin-bottom:8px;">S4 Order Confirmation</h2>
    <p style="margin:0 0 14px;">Order <strong>#${input.orderNumber}</strong> is confirmed.</p>
    <p style="margin:0 0 14px;">Payment method: <strong>${input.paymentMethod === "stripe" ? "Stripe (Paid)" : "Cash on Delivery"}</strong></p>
    <p style="margin:0 0 14px;">Delivery date: <strong>${input.deliveryDate}</strong></p>
    <table style="width:100%;border-collapse:collapse;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;margin:10px 0 14px;">
      ${rows}
      <tr><td style="padding:10px 0;font-weight:700;">Total</td><td style="padding:10px 0;text-align:right;font-weight:700;">${money(input.amount)}</td></tr>
    </table>
    <p style="margin:0 0 16px;">Track your order: <a href="${input.trackingUrl}">${input.trackingUrl}</a></p>
    <p style="margin:0;color:#475569;font-size:13px;">S4 Commerce Team</p>
  </div>`;
}

export async function sendOrderConfirmationEmail(input: OrderEmailInput) {
  if (!input.to?.trim()) {
    return { sent: false as const, deduped: true as const };
  }

  const provider = (getOptionalEnv("EMAIL_PROVIDER") || "resend").toLowerCase();
  if (provider !== "resend") {
    throw new Error(`Unsupported EMAIL_PROVIDER: ${provider}`);
  }

  const claimed = await claimOrderEmailSend({
    orderId: input.orderId,
    emailType: input.emailType,
  });
  if (!claimed) {
    return { sent: false as const, deduped: true as const };
  }

  const apiKey = getRequiredEnv("EMAIL_API_KEY");
  const from = getRequiredEnv("EMAIL_FROM");
  const replyTo = getOptionalEnv("EMAIL_REPLY_TO");

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        reply_to: replyTo || undefined,
        subject: `Order #${input.orderNumber} confirmed`,
        html: buildHtml(input),
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Email provider error (${response.status}): ${text}`);
    }

    const json = (await response.json()) as { id?: string };
    await attachEmailProviderMessageId({
      orderId: input.orderId,
      emailType: input.emailType,
      providerMessageId: json.id,
    });

    return { sent: true as const, deduped: false as const, id: json.id };
  } catch (error) {
    await releaseOrderEmailClaim({
      orderId: input.orderId,
      emailType: input.emailType,
    });
    throw error;
  }
}
