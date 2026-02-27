"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { cartSubtotal, useCartStore } from "@/lib/cart-store";
import { getSupabaseBrowserClient, hasSupabaseBrowserConfig } from "@/lib/supabase-browser";

type DeliveryForm = {
  restaurantName: string;
  address: string;
  contactName: string;
  contactPhone: string;
  email: string;
  deliveryDate: string;
};

type PaymentMethod = "stripe" | "cod";

const CHECKOUT_DRAFT_KEY = "s4-checkout-draft-v1";

function money(value: number) {
  return `AED ${value.toLocaleString("en-US")}`;
}

export default function CheckoutPage() {
  const [canceled, setCanceled] = useState(false);
  const items = useCartStore((state) => state.items);
  const cartDate = useCartStore((state) => state.deliveryDate);
  const clearCart = useCartStore((state) => state.clearCart);

  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("stripe");
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loginChecked, setLoginChecked] = useState(false);

  const [form, setForm] = useState<DeliveryForm>({
    restaurantName: "",
    address: "",
    contactName: "",
    contactPhone: "",
    email: "",
    deliveryDate: cartDate || "2026-02-27",
  });

  const subtotal = useMemo(() => cartSubtotal(items), [items]);
  const supabaseEnabled = hasSupabaseBrowserConfig();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setCanceled(params.get("canceled") === "1");
  }, []);

  useEffect(() => {
    const raw = sessionStorage.getItem(CHECKOUT_DRAFT_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Partial<DeliveryForm>;
      setForm((prev) => ({ ...prev, ...parsed }));
    } catch {
      sessionStorage.removeItem(CHECKOUT_DRAFT_KEY);
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify(form));
  }, [form]);

  useEffect(() => {
    if (!supabaseEnabled) {
      setLoginChecked(true);
      return;
    }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setLoginChecked(true);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
        const user = data.session?.user ?? null;
        setCustomerId(user?.id ?? null);
        setAccessToken(data.session?.access_token ?? null);
        if (user?.email) {
          setForm((prev) => ({ ...prev, email: user.email ?? prev.email }));
        }
      setLoginChecked(true);
    });
  }, [supabaseEnabled]);

  const isFormValid =
    form.restaurantName.trim() &&
    form.address.trim() &&
    form.contactName.trim() &&
    form.contactPhone.trim() &&
    form.email.trim() &&
    form.deliveryDate;

  async function handlePlaceOrder() {
    try {
      setLoading(true);
      setError("");

      if (!customerId || !accessToken) {
        throw new Error("Login is required before placing an order.");
      }

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          items,
          subtotal,
          customerEmail: form.email,
          paymentMethod,
          deliveryDetails: form,
        }),
      });

      const result = (await response.json()) as { url?: string; orderId?: string; error?: string };

      if (!response.ok || !result.url || !result.orderId) {
        throw new Error(result.error || "Unable to create checkout session");
      }

      localStorage.setItem("turnkey-last-order-id", result.orderId);
      clearCart();
      sessionStorage.removeItem(CHECKOUT_DRAFT_KEY);
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

  if (loginChecked && !customerId) {
    return (
      <main className="mx-auto max-w-[980px] p-3 pb-8 sm:p-6">
        <section className="lux-panel p-6">
          <h1 className="text-3xl font-semibold text-slate-900">Login required</h1>
          <p className="mt-2 text-sm text-slate-600">
            Please login to place orders, track delivery, and reorder from purchase history.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/auth?next=/checkout" className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white">
              Login to continue
            </Link>
            <Link href="/cart" className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700">
              Back to cart
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[980px] p-3 pb-8 sm:p-6">
      <section className="lux-panel p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold text-slate-900">Checkout</h1>
          <p className="text-sm text-slate-500">Step {step} of 2</p>
        </div>

        <div className="mt-3 h-2 rounded-full bg-slate-100">
          <div className={`h-2 rounded-full bg-primary transition-all ${step === 1 ? "w-1/3" : "w-2/3"}`} />
        </div>
        {canceled ? (
          <p className="mt-3 text-sm text-amber-700">Payment was canceled. You can retry checkout.</p>
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
              <p className="text-sm text-slate-600">Order total: {money(subtotal)}</p>
              <p className="text-sm text-slate-600">Delivery date: {form.deliveryDate}</p>
            </div>
            <div className="grid gap-2 rounded-xl border border-slate-200 bg-white p-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 sm:grid-cols-3">
              <span>Secure Stripe</span>
              <span>COD Supported</span>
              <span>Invoice on confirmation</span>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => setPaymentMethod("stripe")}
                className={`w-full rounded-xl border px-4 py-3 text-left text-sm ${
                  paymentMethod === "stripe" ? "border-primary bg-primary/5" : "border-slate-300"
                }`}
              >
                <p className="font-semibold text-slate-900">Pay now (Stripe)</p>
                <p className="text-slate-600">Pay full amount securely now.</p>
              </button>

              <button
                onClick={() => setPaymentMethod("cod")}
                className={`w-full rounded-xl border px-4 py-3 text-left text-sm ${
                  paymentMethod === "cod" ? "border-primary bg-primary/5" : "border-slate-300"
                }`}
              >
                <p className="font-semibold text-slate-900">Cash on Delivery</p>
                <p className="text-slate-600">Place order now and pay when delivered.</p>
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setStep(1)}
                className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700"
              >
                Back
              </button>
              <button
                onClick={handlePlaceOrder}
                disabled={loading}
                className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {loading
                  ? "Processing..."
                  : paymentMethod === "stripe"
                  ? `Pay now ${money(subtotal)}`
                  : "Place COD order"}
              </button>
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </div>
        ) : null}
      </section>
    </main>
  );
}
