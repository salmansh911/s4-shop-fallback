"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Clock3, PackageCheck, Truck } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { getSupabaseBrowserClient, hasSupabaseBrowserConfig } from "@/lib/supabase-browser";
import type { Order } from "@/lib/types";

type OrderResponse = {
  source: "supabase" | "fallback" | "medusa";
  data: Order | null;
};

function money(value: number) {
  return `AED ${value.toLocaleString("en-US")}`;
}

export default function OrderPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const replaceWithOrderItems = useCartStore((state) => state.replaceWithOrderItems);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const supabaseEnabled = hasSupabaseBrowserConfig();
  const sessionId = searchParams.get("session_id");
  const orderId = params.id;

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");

        if (!supabaseEnabled) {
          router.replace(`/auth?next=/orders/${orderId}`);
          return;
        }
        const supabase = getSupabaseBrowserClient();
        if (!supabase) {
          router.replace(`/auth?next=/orders/${orderId}`);
          return;
        }

        const { data } = await supabase.auth.getSession();
        const user = data.session?.user;
        const accessToken = data.session?.access_token ?? "";
        if (!user) {
          router.replace(`/auth?next=/orders/${orderId}`);
          return;
        }

        if (sessionId) {
          await fetch(`/api/orders/${orderId}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ markPaid: true, sessionId }),
          });
        }

        const response = await fetch(`/api/orders/${orderId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        if (!response.ok) {
          setOrder(null);
          return;
        }
        const result = (await response.json()) as OrderResponse;
        setOrder(result.data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unable to load order");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [orderId, router, sessionId, supabaseEnabled]);

  const paymentLabel = order?.deposit_paid ? "Paid" : "COD pending";
  const paidNow = order?.deposit_paid ? order.total_amount : 0;

  const steps = useMemo(
    () => [
      {
        icon: CheckCircle2,
        label: "Order received",
        done: true,
        detail: `Payment: ${paymentLabel}`,
      },
      {
        icon: PackageCheck,
        label: "Preparing order",
        done: order?.status === "preparing" || order?.status === "out_for_delivery" || order?.status === "delivered",
        detail: "Pick and pack in progress",
      },
      {
        icon: Truck,
        label: "Out for delivery",
        done: order?.status === "out_for_delivery" || order?.status === "delivered",
        detail: order?.delivery_date ?? "Pending",
      },
      {
        icon: Clock3,
        label: "Delivered",
        done: order?.status === "delivered",
        detail: order?.status === "delivered" ? "Completed" : "Pending",
      },
    ],
    [order?.delivery_date, order?.status, paymentLabel],
  );

  if (loading) {
    return (
      <main className="mx-auto max-w-[980px] p-3 pb-8 sm:p-6">
        <section className="lux-panel p-6 text-center text-slate-600">Loading order...</section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-[980px] p-3 pb-8 sm:p-6">
        <section className="lux-panel p-6 text-center">
          <h1 className="text-3xl font-semibold text-slate-900">Order not available</h1>
          <p className="mt-2 text-sm text-red-600">{error}</p>
          <Link href="/orders" className="mt-4 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white">
            Go to My Orders
          </Link>
        </section>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="mx-auto max-w-[980px] p-3 pb-8 sm:p-6">
        <section className="lux-panel p-6 text-center">
          <h1 className="text-3xl font-semibold text-slate-900">Order not found</h1>
          <p className="mt-2 text-sm text-slate-600">This order is not available for your account.</p>
          <Link href="/orders" className="mt-4 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white">
            Go to My Orders
          </Link>
        </section>
      </main>
    );
  }

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
              <p className="flex justify-between"><span>Payment status</span><strong>{paymentLabel}</strong></p>
              <p className="flex justify-between"><span>Delivery date</span><strong>{order.delivery_date}</strong></p>
            </div>
          </article>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            onClick={() => {
              replaceWithOrderItems(order.items);
              router.push("/cart");
            }}
            className="inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white"
          >
            Reorder
          </button>
          <Link href="/orders" className="inline-flex rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700">
            Back to My Orders
          </Link>
        </div>
      </section>
    </main>
  );
}
