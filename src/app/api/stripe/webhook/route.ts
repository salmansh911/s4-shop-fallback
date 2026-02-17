import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { markOrderPaid } from "@/lib/supabase-rest";

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

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const paid = session.payment_status === "paid";
      const orderId = session.metadata?.order_id ?? session.client_reference_id;

      if (paid && orderId) {
        await markOrderPaid(orderId);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected webhook error" },
      { status: 500 },
    );
  }
}
