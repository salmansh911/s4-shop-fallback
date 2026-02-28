import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  getActiveCommerceProviderName,
  markOrderPaid,
} from "@/lib/commerce";
import {
  finalizeMedusaCheckoutAttemptById,
  getCheckoutAttemptByIdForRead,
} from "@/lib/commerce/providers/medusa";
import { sendOrderConfirmationEmail } from "@/lib/email/transactional";
import {
  isStripeEventProcessed,
  recordMarketingEvent,
  recordStripeWebhookEvent,
} from "@/lib/reliability-store";

type StripeWebhookEvent = {
  id: string;
  type: string;
  data: {
    object: {
      id?: string;
      metadata?: Record<string, string | undefined>;
      payment_status?: string;
      client_reference_id?: string;
    };
  };
};

function parseStripeSignature(header: string) {
  const entries = header.split(",").map((entry) => entry.trim());
  const timestamp = entries.find((entry) => entry.startsWith("t="))?.slice(2);
  const signatures = entries
    .filter((entry) => entry.startsWith("v1="))
    .map((entry) => entry.slice(3));

  return { timestamp, signatures };
}

function verifyStripeSignature(payload: string, header: string, secret: string) {
  const { timestamp, signatures } = parseStripeSignature(header);
  if (!timestamp || signatures.length === 0) return false;

  const now = Math.floor(Date.now() / 1000);
  const skew = Math.abs(now - Number(timestamp));
  if (!Number.isFinite(Number(timestamp)) || skew > 300) {
    return false;
  }

  const signedPayload = `${timestamp}.${payload}`;
  const digest = createHmac("sha256", secret).update(signedPayload).digest("hex");

  return signatures.some((signature) => {
    const digestBuffer = Buffer.from(digest, "hex");
    const signatureBuffer = Buffer.from(signature, "hex");
    if (digestBuffer.length !== signatureBuffer.length) {
      return false;
    }
    return timingSafeEqual(digestBuffer, signatureBuffer);
  });
}

export async function POST(request: NextRequest) {
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return NextResponse.json({ error: "Missing STRIPE_WEBHOOK_SECRET" }, { status: 500 });
    }

    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
    }

    const rawPayload = await request.text();
    const isValid = verifyStripeSignature(rawPayload, signature, webhookSecret);

    if (!isValid) {
      return NextResponse.json({ error: "Invalid Stripe signature" }, { status: 400 });
    }

    const event = JSON.parse(rawPayload) as StripeWebhookEvent;
    if (await isStripeEventProcessed(event.id)) {
      return NextResponse.json({ received: true, deduped: true });
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const paid = session.payment_status === "paid";
      const providerName = session.metadata?.provider || getActiveCommerceProviderName();
      const attemptId = session.metadata?.attempt_id;
      const orderId = session.metadata?.order_id ?? session.client_reference_id;

      if (paid && providerName === "medusa" && attemptId) {
        const finalizedOrderId = await finalizeMedusaCheckoutAttemptById({
          attemptId,
          sessionId: session.id,
        });
        const attempt = await getCheckoutAttemptByIdForRead(attemptId);
        if (finalizedOrderId && attempt) {
          await sendOrderConfirmationEmail({
            orderId: finalizedOrderId,
            orderNumber: attempt.order_number,
            to: attempt.customer_email,
            paymentMethod: "stripe",
            deliveryDate: attempt.delivery_details.deliveryDate,
            amount: attempt.subtotal,
            items: attempt.items.map((item) => ({
              name: item.name,
              qty: item.qty,
              unitPrice: item.price,
            })),
            trackingUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "https://shop.s4trading.com"}/orders/${attempt.id}`,
            emailType: "stripe_paid",
          });

          await recordMarketingEvent({
            eventName: "checkout_completed",
            userId: attempt.user_id,
            orderId: finalizedOrderId,
            metadata: { provider: "stripe", source: "webhook" },
          });
        }
      } else if (paid && orderId) {
        const result = await markOrderPaid(
          orderId,
          { userId: "system", email: null },
          { provider: "stripe", sessionId: session.id },
        );
        if (result.data) {
          await sendOrderConfirmationEmail({
            orderId,
            orderNumber: result.data.order_number,
            to: session.metadata?.customer_email || "",
            paymentMethod: "stripe",
            deliveryDate: result.data.delivery_date,
            amount: result.data.total_amount,
            items: result.data.items.map((item) => ({
              name: item.name,
              qty: item.qty,
              unitPrice: item.unit_price,
            })),
            trackingUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "https://shop.s4trading.com"}/orders/${orderId}`,
            emailType: "stripe_paid",
          });
          await recordMarketingEvent({
            eventName: "checkout_completed",
            orderId,
            metadata: { provider: "stripe", source: "webhook" },
          });
        }
      }
    }

    await recordStripeWebhookEvent({
      eventId: event.id,
      eventType: event.type,
      status: event.type === "checkout.session.completed" ? "processed" : "ignored",
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected webhook error" },
      { status: 500 },
    );
  }
}
