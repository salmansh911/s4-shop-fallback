"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { cartSubtotal, useCartStore } from "@/lib/cart-store";

const DELIVERY_OPTIONS = [
  { value: "2026-02-25", label: "Feb 25 (Standard)" },
  { value: "2026-02-26", label: "Feb 26 (Standard)" },
  { value: "2026-02-27", label: "Feb 27 (Recommended)" },
  { value: "2026-02-28", label: "Feb 28 (Rush)" },
];

function money(value: number) {
  return `AED ${value.toLocaleString("en-US")}`;
}

export default function CartPage() {
  const items = useCartStore((state) => state.items);
  const deliveryDate = useCartStore((state) => state.deliveryDate);
  const setDeliveryDate = useCartStore((state) => state.setDeliveryDate);
  const updateQty = useCartStore((state) => state.updateQty);
  const removeItem = useCartStore((state) => state.removeItem);

  const subtotal = cartSubtotal(items);

  return (
    <main className="mx-auto max-w-[1520px] p-3 pb-8 sm:p-6">
      <section className="lux-panel p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">Shopping Cart</h1>
          <Link href="/" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">
            Continue Shopping
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
            <p className="text-lg font-medium text-slate-800">Your cart is empty</p>
            <p className="mt-1 text-sm text-slate-600">Add products from catalog to continue checkout.</p>
          </div>
        ) : (
          <>
            <div className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
              <article className="space-y-3">
                {items.map((item) => (
                  <div key={item.product_id} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="grid gap-3 sm:grid-cols-[82px_1fr_auto] sm:items-center">
                      <img src={item.image_url} alt={item.name} className="h-20 w-20 rounded-xl object-cover" />
                      <div>
                        <p className="break-words font-semibold text-slate-900">{item.name}</p>
                        <p className="text-sm text-slate-500">{item.unit}</p>
                        <p className="mt-1 text-sm font-medium text-slate-900">{money(item.price)}</p>
                      </div>
                      <div className="flex items-center gap-2 sm:justify-end">
                        <button
                          className="h-9 w-9 rounded-full border border-slate-300"
                          onClick={() => updateQty(item.product_id, item.qty - 1)}
                        >
                          -
                        </button>
                        <span className="w-8 text-center">{item.qty}</span>
                        <button
                          className="h-9 w-9 rounded-full border border-slate-300"
                          onClick={() => updateQty(item.product_id, item.qty + 1)}
                        >
                          +
                        </button>
                        <button
                          className="ml-1 rounded-full border border-slate-300 p-2 text-slate-600"
                          onClick={() => removeItem(item.product_id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </article>

              <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h2 className="text-xl font-semibold text-slate-900">Order Summary</h2>
                <div className="mt-4 space-y-2 text-sm">
                  <p className="flex justify-between"><span>Subtotal</span><strong>{money(subtotal)}</strong></p>
                  <p className="flex justify-between text-primary"><span>Total payable</span><strong>{money(subtotal)}</strong></p>
                </div>

                <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Delivery date</label>
                  <select
                    value={deliveryDate}
                    onChange={(event) => setDeliveryDate(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none"
                  >
                    {DELIVERY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <Link
                  href="/checkout"
                  className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white"
                >
                  Proceed to Checkout
                </Link>
              </article>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
