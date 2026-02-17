import { NextRequest, NextResponse } from "next/server";
import { createOrder } from "@/lib/supabase-rest";

type CheckoutBody = {
  items: Array<{
    product_id: string;
    name: string;
    qty: number;
    price: number;
  }>;
  subtotal: number;
  depositAmount: number;
  customerEmail: string;
  deliveryDetails: {
    restaurantName: string;
    address: string;
    contactName: string;
    contactPhone: string;
    email: string;
    deliveryDate: string;
  };
};

function buildOrderNumber() {
  const today = new Date();
  const y = today.getUTCFullYear();
  const m = `${today.getUTCMonth() + 1}`.padStart(2, "0");
  const d = `${today.getUTCDate()}`.padStart(2, "0");
  const random = `${Math.floor(Math.random() * 9000) + 1000}`;
  return `RAM-${y}${m}${d}-${random}`;
}

export async function POST(request: NextRequest) {
  try {
    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecret) {
      return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 });
    }

    const body = (await request.json()) as CheckoutBody;
    if (!body.items?.length || !body.customerEmail || !body.depositAmount) {
      return NextResponse.json({ error: "Invalid checkout payload" }, { status: 400 });
    }

    const computedSubtotal = body.items.reduce((sum, item) => sum + item.qty * item.price, 0);
    const computedDeposit = Math.round(computedSubtotal * 0.5);
    if (Math.abs(computedDeposit - Math.round(body.depositAmount)) > 0) {
      return NextResponse.json({ error: "Invalid deposit amount" }, { status: 400 });
    }

    const orderId = crypto.randomUUID();
    const orderNumber = buildOrderNumber();
    const demoUserId =
      process.env.DEMO_CUSTOMER_ID || "e6a118e9-47f2-44d2-92f4-8e832f2cb10a";

    const orderItems = body.items.map((item) => ({
      product_id: item.product_id,
      name: item.name,
      qty: item.qty,
      unit_price: item.price,
    }));

    await createOrder({
      id: orderId,
      order_number: orderNumber,
      user_id: demoUserId,
      items: orderItems,
      total_amount: computedSubtotal,
      deposit_amount: computedDeposit,
      delivery_date: body.deliveryDetails.deliveryDate,
      special_instructions: `${body.deliveryDetails.restaurantName} | ${body.deliveryDetails.address} | ${body.deliveryDetails.contactName} ${body.deliveryDetails.contactPhone}`,
    });

    const origin = request.nextUrl.origin;
    const successUrl = `${origin}/orders/${orderId}?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/checkout?canceled=1`;

    const params = new URLSearchParams();
    params.append("mode", "payment");
    params.append("client_reference_id", orderId);
    params.append("success_url", successUrl);
    params.append("cancel_url", cancelUrl);
    params.append("customer_email", body.customerEmail);
    params.append("line_items[0][quantity]", "1");
    params.append("line_items[0][price_data][currency]", "aed");
    params.append("line_items[0][price_data][unit_amount]", `${computedDeposit * 100}`);
    params.append(
      "line_items[0][price_data][product_data][name]",
      `TurnKey Deposit (${orderNumber})`,
    );
    params.append("metadata[order_id]", orderId);
    params.append("metadata[order_number]", orderNumber);
    params.append("metadata[delivery_date]", body.deliveryDetails.deliveryDate);
    params.append("metadata[subtotal]", `${computedSubtotal}`);
    params.append("metadata[deposit_amount]", `${computedDeposit}`);

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecret}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    const stripeJson = (await stripeRes.json()) as { url?: string; error?: { message?: string } };

    if (!stripeRes.ok || !stripeJson.url) {
      return NextResponse.json(
        { error: stripeJson.error?.message || "Stripe session creation failed" },
        { status: 500 },
      );
    }

    return NextResponse.json({ url: stripeJson.url, orderId, orderNumber });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}
