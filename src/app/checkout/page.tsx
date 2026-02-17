"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cartSubtotal, useCartStore } from "@/lib/cart-store";

type DeliveryForm = {
  restaurantName: string;
  address: string;
  contactName: string;
  contactPhone: string;
  email: string;
  deliveryDate: string;
};

function money(value: number) {
  return `AED ${value.toLocaleString("en-US")}`;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [canceled, setCanceled] = useState(false);
  const items = useCartStore((state) => state.items);
  const cartDate = useCartStore((state) => state.deliveryDate);
  const clearCart = useCartStore((state) => state.clearCart);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orderId, setOrderId] = useState<string>("");

  const [form, setForm] = useState<DeliveryForm>({
    restaurantName: "",
    address: "",
    contactName: "",
    contactPhone: "",
    email: "",
    deliveryDate: cartDate || "2026-02-27",
  });

  const subtotal = useMemo(() => cartSubtotal(items), [items]);
  const deposit = Math.round(subtotal * 0.5);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setCanceled(params.get("canceled") === "1");
  }, []);

  const isFormValid =
    form.restaurantName.trim() &&
    form.address.trim() &&
    form.contactName.trim() &&
    form.contactPhone.trim() &&
    form.email.trim() &&
    form.deliveryDate;

  async function handlePayDeposit() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          subtotal,
          depositAmount: deposit,
          customerEmail: form.email,
          deliveryDetails: form,
        }),
      });

      const result = (await response.json()) as { url?: string; orderId?: string; error?: string };

      if (!response.ok || !result.url || !result.orderId) {
        throw new Error(result.error || "Unable to create checkout session");
      }

      localStorage.setItem("turnkey-last-order-id", result.orderId);
      setOrderId(result.orderId);
      setStep(3);
      clearCart();
      window.location.href = result.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment failed");
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-[900px] p-3 pb-8 sm:p-6">
        <section className="lux-panel p-6 text-center">
          <h1 className="text-3xl font-semibold text-slate-900">Checkout</h1>
          <p className="mt-2 text-slate-600">Your cart is empty. Add items before checkout.</p>
          <Link href="/" className="mt-4 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white">
            Back to shopping
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[980px] p-3 pb-8 sm:p-6">
      <section className="lux-panel p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold text-slate-900">Checkout</h1>
          <p className="text-sm text-slate-500">Step {step} of 3</p>
        </div>

        <div className="mt-3 h-2 rounded-full bg-slate-100">
          <div className={`h-2 rounded-full bg-primary transition-all ${step === 1 ? "w-1/3" : step === 2 ? "w-2/3" : "w-full"}`} />
        </div>
        {canceled ? (
          <p className="mt-3 text-sm text-amber-700">Payment was canceled. You can retry the deposit payment.</p>
        ) : null}

        {step === 1 ? (
          <div className="mt-5 space-y-3">
            <h2 className="text-xl font-semibold text-slate-900">Delivery details</h2>
            <input
              placeholder="Restaurant name"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none"
              value={form.restaurantName}
              onChange={(event) => setForm({ ...form, restaurantName: event.target.value })}
            />
            <textarea
              placeholder="Delivery address"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none"
              rows={3}
              value={form.address}
              onChange={(event) => setForm({ ...form, address: event.target.value })}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                placeholder="Contact person"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none"
                value={form.contactName}
                onChange={(event) => setForm({ ...form, contactName: event.target.value })}
              />
              <input
                placeholder="Contact phone"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none"
                value={form.contactPhone}
                onChange={(event) => setForm({ ...form, contactPhone: event.target.value })}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                placeholder="Billing email"
                type="email"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
              />
              <select
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none"
                value={form.deliveryDate}
                onChange={(event) => setForm({ ...form, deliveryDate: event.target.value })}
              >
                <option value="2026-02-25">Feb 25</option>
                <option value="2026-02-26">Feb 26</option>
                <option value="2026-02-27">Feb 27</option>
                <option value="2026-02-28">Feb 28</option>
              </select>
            </div>

            <button
              disabled={!isFormValid}
              onClick={() => setStep(2)}
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
            >
              Continue to Payment
            </button>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="mt-5 space-y-4">
            <h2 className="text-xl font-semibold text-slate-900">Payment</h2>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-600">Subtotal: {money(subtotal)}</p>
              <p className="text-sm font-semibold text-primary">Pay now (50% deposit): {money(deposit)}</p>
              <p className="text-sm text-slate-600">Balance on delivery: {money(subtotal - deposit)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setStep(1)}
                className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700"
              >
                Back
              </button>
              <button
                onClick={handlePayDeposit}
                disabled={loading}
                className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {loading ? "Redirecting..." : `Pay deposit ${money(deposit)}`}
              </button>
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </div>
        ) : null}

        {step === 3 ? (
          <div className="mt-5 space-y-3">
            <h2 className="text-xl font-semibold text-slate-900">Confirmation</h2>
            <p className="text-sm text-slate-600">Redirecting to secure Stripe checkout...</p>
            {orderId ? (
              <button
                onClick={() => router.push(`/orders/${orderId}`)}
                className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700"
              >
                View order
              </button>
            ) : null}
          </div>
        ) : null}
      </section>
    </main>
  );
}
