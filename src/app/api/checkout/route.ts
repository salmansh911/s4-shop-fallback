import { NextRequest, NextResponse } from "next/server";
import {
  createCheckout,
  getActiveCommerceProviderName,
} from "@/lib/commerce";
import { buildOrderNumber } from "@/lib/commerce/types";
import {
  createCheckoutAttempt,
  markCheckoutAttemptFailed,
} from "@/lib/checkout-attempts";
import { resolveMedusaCustomerId } from "@/lib/identity/customer-map";
import { getAuthenticatedUserFromRequest } from "@/lib/supabase-server";

type CheckoutBody = {
  items: Array<{
    product_id: string;
    name: string;
    qty: number;
    price: number;
    variant_id?: string;
  }>;
  subtotal: number;
  customerEmail: string;
  paymentMethod: "stripe" | "cod";
  deliveryDetails: {
    restaurantName: string;
    address: string;
    contactName: string;
    contactPhone: string;
    email: string;
    deliveryDate: string;
  };
};

async function createStripeSession(input: {
  stripeSecret: string;
  origin: string;
  subtotal: number;
  customerEmail: string;
  successOrderId: string;
  metadata: Record<string, string>;
}) {
  const successUrl = `${input.origin}/orders/${input.successOrderId}?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${input.origin}/checkout?canceled=1`;

  const params = new URLSearchParams();
  params.append("mode", "payment");
  params.append("client_reference_id", input.successOrderId);
  params.append("success_url", successUrl);
  params.append("cancel_url", cancelUrl);
  params.append("customer_email", input.customerEmail);
  params.append("line_items[0][quantity]", "1");
  params.append("line_items[0][price_data][currency]", "aed");
  params.append(
    "line_items[0][price_data][unit_amount]",
    `${Math.round(input.subtotal * 100)}`,
  );
  params.append("line_items[0][price_data][product_data][name]", "S4 Order");

  for (const [key, value] of Object.entries(input.metadata)) {
    params.append(`metadata[${key}]`, value);
  }

  const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.stripeSecret}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });

  const stripeJson = (await stripeRes.json()) as {
    id?: string;
    url?: string;
    error?: { message?: string };
  };

  if (!stripeRes.ok || !stripeJson.url || !stripeJson.id) {
    return {
      ok: false as const,
      error: stripeJson.error?.message || "Stripe session creation failed",
    };
  }

  return {
    ok: true as const,
    data: {
      sessionId: stripeJson.id,
      url: stripeJson.url,
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = (await request.json()) as CheckoutBody;
    if (!body.items?.length || !body.customerEmail || !body.paymentMethod) {
      return NextResponse.json({ error: "Invalid checkout payload" }, { status: 400 });
    }

    const computedSubtotal = body.items.reduce(
      (sum, item) => sum + item.qty * item.price,
      0,
    );
    if (Math.abs(computedSubtotal - Math.round(body.subtotal || 0)) > 0) {
      return NextResponse.json({ error: "Invalid order total" }, { status: 400 });
    }

    const origin = request.nextUrl.origin;
    const providerName = getActiveCommerceProviderName();
    const orderNumber = buildOrderNumber();

    if (providerName === "medusa" && body.paymentMethod === "stripe") {
      const stripeSecret = process.env.STRIPE_SECRET_KEY;
      if (!stripeSecret) {
        return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 });
      }

      const medusaCustomerId = await resolveMedusaCustomerId({
        userId: user.id,
        email: user.email,
      });
      if (!medusaCustomerId) {
        return NextResponse.json(
          { error: "Unable to resolve Medusa customer profile" },
          { status: 500 },
        );
      }

      const attempt = await createCheckoutAttempt({
        userId: user.id,
        medusaCustomerId,
        orderNumber,
        paymentMethod: "stripe",
        items: body.items.map((item) => ({
          ...item,
          variant_id: item.variant_id ?? item.product_id,
        })),
        subtotal: computedSubtotal,
        customerEmail: body.customerEmail,
        deliveryDetails: body.deliveryDetails,
      });

      if (!attempt) {
        return NextResponse.json(
          { error: "Unable to create checkout attempt" },
          { status: 500 },
        );
      }

      const stripeSession = await createStripeSession({
        stripeSecret,
        origin,
        subtotal: computedSubtotal,
        customerEmail: body.customerEmail,
        successOrderId: attempt.id,
        metadata: {
          attempt_id: attempt.id,
          order_number: orderNumber,
          payment_method: "stripe",
          provider: "medusa",
          subtotal: `${computedSubtotal}`,
          delivery_date: body.deliveryDetails.deliveryDate,
        },
      });

      if (!stripeSession.ok) {
        await markCheckoutAttemptFailed(attempt.id);
        return NextResponse.json({ error: stripeSession.error }, { status: 500 });
      }

      return NextResponse.json({
        url: stripeSession.data.url,
        orderId: attempt.id,
        orderNumber,
      });
    }

    const checkoutResult = await createCheckout({
      auth: {
        userId: user.id,
        email: user.email,
      },
      items: body.items,
      subtotal: computedSubtotal,
      paymentMethod: body.paymentMethod,
      deliveryDetails: body.deliveryDetails,
      origin,
      orderNumber,
    });

    if (!checkoutResult.data) {
      return NextResponse.json(
        { error: checkoutResult.error || "Unable to create checkout order" },
        { status: 500 },
      );
    }

    if (body.paymentMethod === "cod") {
      return NextResponse.json({
        url:
          checkoutResult.data.url ??
          `${origin}/orders/${checkoutResult.data.orderId}`,
        orderId: checkoutResult.data.orderId,
        orderNumber: checkoutResult.data.orderNumber,
      });
    }

    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecret) {
      return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 });
    }

    const stripeSession = await createStripeSession({
      stripeSecret,
      origin,
      subtotal: computedSubtotal,
      customerEmail: body.customerEmail,
      successOrderId: checkoutResult.data.orderId,
      metadata: {
        order_id: checkoutResult.data.orderId,
        order_number: checkoutResult.data.orderNumber,
        payment_method: "stripe",
        provider: providerName,
        subtotal: `${computedSubtotal}`,
        delivery_date: body.deliveryDetails.deliveryDate,
      },
    });

    if (!stripeSession.ok) {
      return NextResponse.json({ error: stripeSession.error }, { status: 500 });
    }

    return NextResponse.json({
      url: stripeSession.data.url,
      orderId: checkoutResult.data.orderId,
      orderNumber: checkoutResult.data.orderNumber,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}
