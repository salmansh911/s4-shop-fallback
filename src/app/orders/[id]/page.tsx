import Link from "next/link";
import { CheckCircle2, Clock3, PackageCheck, Truck } from "lucide-react";
import { getOrderById, markOrderPaid } from "@/lib/supabase-rest";
import type { Order } from "@/lib/types";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ session_id?: string }>;
};

type StripeLineItem = {
  id: string;
  description?: string;
  quantity?: number;
  price?: {
    unit_amount?: number;
    currency?: string;
  };
};

type PaymentMethod = "stripe" | "cod";

function money(value: number) {
  return `AED ${value.toLocaleString("en-US")}`;
}

function extractPaymentMethodFromInstructions(notes?: string | null): PaymentMethod {
  if (!notes) return "stripe";
  return notes.includes("payment_method=cod") ? "cod" : "stripe";
}

async function getStripeSession(sessionId: string) {
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecret) return null;

  const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
    headers: {
      Authorization: `Bearer ${stripeSecret}`,
    },
    cache: "no-store",
  });

  if (!response.ok) return null;

  return (await response.json()) as {
    id: string;
    payment_status?: string;
    amount_total?: number;
    currency?: string;
    metadata?: Record<string, string | undefined>;
  };
}

async function getStripeLineItems(sessionId: string) {
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecret) return [];

  const response = await fetch(
    `https://api.stripe.com/v1/checkout/sessions/${sessionId}/line_items`,
    {
      headers: {
        Authorization: `Bearer ${stripeSecret}`,
      },
      cache: "no-store",
    },
  );

  if (!response.ok) return [];

  const data = (await response.json()) as { data?: StripeLineItem[] };
  return data.data ?? [];
}

function buildOrderFromStripe(
  orderId: string,
  stripeSession: NonNullable<Awaited<ReturnType<typeof getStripeSession>>>,
  lineItems: StripeLineItem[],
): Order {
  const subtotalFromMeta = Number(stripeSession.metadata?.subtotal ?? 0);
  const totalAmount =
    Number.isFinite(subtotalFromMeta) && subtotalFromMeta > 0
      ? subtotalFromMeta
      : Math.round((stripeSession.amount_total ?? 0) / 100);

  return {
    id: orderId,
    order_number:
      stripeSession.metadata?.order_number ?? `RAM-${new Date().getUTCFullYear()}-UNKNOWN`,
    user_id: "unknown",
    status: stripeSession.payment_status === "paid" ? "confirmed" : "pending",
    delivery_date: stripeSession.metadata?.delivery_date ?? "TBD",
    total_amount: totalAmount,
    deposit_amount: stripeSession.payment_status === "paid" ? totalAmount : 0,
    deposit_paid: stripeSession.payment_status === "paid",
    items:
      lineItems.length > 0
        ? lineItems.map((item, index) => ({
            product_id: `stripe-${index}`,
            name: item.description || "Order item",
            qty: item.quantity || 1,
            unit_price: ((item.price?.unit_amount || 0) / 100) || totalAmount,
          }))
        : [
            {
              product_id: "stripe-order",
              name: "Order Payment",
              qty: 1,
              unit_price: totalAmount,
            },
          ],
  };
}

export default async function OrderPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { session_id: sessionId } = await searchParams;

  const orderResult = await getOrderById(id);
  let order = orderResult.data;

  if (sessionId) {
    const paidUpdate = await markOrderPaid(id);
    if (paidUpdate.data) {
      order = paidUpdate.data;
    }
  }

  if (!order && sessionId) {
    const stripeSession = await getStripeSession(sessionId);
    if (stripeSession) {
      const lineItems = await getStripeLineItems(sessionId);
      order = buildOrderFromStripe(id, stripeSession, lineItems);
    }
  }

  if (!order) {
    return (
      <main className="mx-auto max-w-[900px] p-3 pb-8 sm:p-6">
        <section className="lux-panel p-6 text-center">
          <h1 className="text-3xl font-semibold text-slate-900">Order not found</h1>
          <p className="mt-2 text-sm text-slate-600">We could not locate this order record yet.</p>
          <Link href="/" className="mt-4 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white">
            Back to Home
          </Link>
        </section>
      </main>
    );
  }

  const paymentMethod = extractPaymentMethodFromInstructions(order.special_instructions);
  const paidNow = order.deposit_paid ? order.total_amount : 0;
  const paymentLabel = order.deposit_paid
    ? "Paid"
    : paymentMethod === "cod"
    ? "COD pending"
    : "Payment pending";

  const steps = [
    {
      icon: CheckCircle2,
      label: "Order received",
      done: true,
      detail: `Payment: ${paymentLabel}`,
    },
    {
      icon: PackageCheck,
      label: "Preparing order",
      done: order.status === "preparing" || order.status === "out_for_delivery" || order.status === "delivered",
      detail: "Pick and pack in progress",
    },
    {
      icon: Truck,
      label: "Out for delivery",
      done: order.status === "out_for_delivery" || order.status === "delivered",
      detail: order.delivery_date,
    },
    {
      icon: Clock3,
      label: "Delivered",
      done: order.status === "delivered",
      detail: order.status === "delivered" ? "Completed" : "Pending",
    },
  ];

  return (
    <main className="mx-auto max-w-[980px] p-3 pb-8 sm:p-6">
      <section className="lux-panel p-5 sm:p-6">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <h1 className="text-3xl font-semibold text-slate-900">Order confirmed!</h1>
          <p className="mt-1 text-sm text-slate-700">Order #{order.order_number}</p>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <article>
            <h2 className="text-xl font-semibold text-slate-900">Delivery timeline</h2>
            <div className="mt-3 space-y-2">
              {steps.map((step) => (
                <div key={step.label} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <step.icon size={16} className={step.done ? "text-emerald-600" : "text-slate-400"} />
                    {step.label}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">{step.detail}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h2 className="text-lg font-semibold text-slate-900">Order details</h2>
            <div className="mt-3 space-y-2 text-sm">
              {order.items.map((item) => (
                <p key={item.product_id} className="flex justify-between">
                  <span>{item.name} x {item.qty}</span>
                  <strong>{money(item.qty * item.unit_price)}</strong>
                </p>
              ))}
            </div>
            <div className="mt-4 space-y-1 border-t border-slate-200 pt-3 text-sm">
              <p className="flex justify-between"><span>Total</span><strong>{money(order.total_amount)}</strong></p>
              <p className="flex justify-between"><span>Paid now</span><strong>{money(paidNow)}</strong></p>
              <p className="flex justify-between"><span>Payment method</span><strong className="uppercase">{paymentMethod}</strong></p>
              <p className="flex justify-between"><span>Payment status</span><strong>{paymentLabel}</strong></p>
              <p className="flex justify-between"><span>Delivery date</span><strong>{order.delivery_date}</strong></p>
            </div>
          </article>
        </div>

        <Link href="/" className="mt-5 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white">
          Back to Home
        </Link>
      </section>
    </main>
  );
}
