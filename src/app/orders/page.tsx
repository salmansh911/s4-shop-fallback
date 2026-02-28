"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/cart-store";
import { getSupabaseBrowserClient, hasSupabaseBrowserConfig } from "@/lib/supabase-browser";
import type { Order } from "@/lib/types";

type OrdersResponse = {
  source: "supabase" | "fallback" | "medusa";
  data: Order[];
};

function money(value: number) {
  return `AED ${value.toLocaleString("en-US")}`;
}

export default function OrdersPage() {
  const router = useRouter();
  const replaceWithOrderItems = useCartStore((state) => state.replaceWithOrderItems);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const supabaseEnabled = hasSupabaseBrowserConfig();

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");
        if (!supabaseEnabled) {
          router.replace("/auth?next=/orders");
          return;
        }
        const supabase = getSupabaseBrowserClient();
        if (!supabase) {
          router.replace("/auth?next=/orders");
          return;
        }
        const { data } = await supabase.auth.getSession();
        const user = data.session?.user;
        if (!user) {
          router.replace("/auth?next=/orders");
          return;
        }
        setUserId(user.id);
        const response = await fetch("/api/orders/mine", {
          headers: {
            Authorization: `Bearer ${data.session?.access_token ?? ""}`,
          },
        });
        const result = (await response.json()) as OrdersResponse;
        setOrders(result.data ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unable to load orders");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [router, supabaseEnabled]);

  const sortedOrders = useMemo(
    () => [...orders].sort((a, b) => a.order_number < b.order_number ? 1 : -1),
    [orders],
  );

  return (
    <main className="mx-auto max-w-[980px] p-3 pb-8 sm:p-6">
      <section className="lux-panel p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">My Orders</h1>
          <Link href="/" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">
            Back to Home
          </Link>
        </div>
        {userId ? <p className="mt-2 break-all text-xs text-slate-500">Account: {userId}</p> : null}

        {loading ? <p className="mt-4 text-sm text-slate-600">Loading orders...</p> : null}
        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

        {!loading && !error && sortedOrders.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">No orders yet.</p>
        ) : null}

        <div className="mt-4 space-y-3">
          {sortedOrders.map((order) => {
            const paymentStatus = order.deposit_paid ? "Paid" : "COD pending";
            return (
              <article key={order.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="break-words text-sm font-semibold text-slate-900">#{order.order_number}</p>
                    <p className="text-xs text-slate-500">Delivery: {order.delivery_date}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-semibold text-slate-900">{money(order.total_amount)}</p>
                    <p className="text-xs text-slate-500">{paymentStatus}</p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={`/orders/${order.id}`}
                    className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
                  >
                    Track order
                  </Link>
                  <button
                    onClick={() => {
                      replaceWithOrderItems(order.items);
                      router.push("/cart");
                    }}
                    className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white"
                  >
                    Reorder
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
