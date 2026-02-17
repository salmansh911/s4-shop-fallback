"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/lib/types";
import AddToCartButton from "./AddToCartButton";

type ProductExperienceProps = {
  product: Product;
  related: Product[];
};

const fallbackImages: Record<string, string[]> = {
  japanese: [
    "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1608198093002-ad4e005484ec?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1518131678677-a3ccec6f5799?auto=format&fit=crop&w=1200&q=80",
  ],
  ramadan: [
    "https://images.unsplash.com/photo-1615485925600-97237c4fc1ec?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1541599540903-216a46ca1dc0?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1551069613-1904dbdcda11?auto=format&fit=crop&w=1200&q=80",
  ],
  premium_beef: [
    "https://images.unsplash.com/photo-1603048297172-c92544798d5a?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80",
  ],
  general: [
    "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1519996521439-5a4a3f1f4b17?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1200&q=80",
  ],
};

function money(value: number) {
  return `AED ${value.toLocaleString("en-US")}`;
}

export default function ProductExperience({ product, related }: ProductExperienceProps) {
  const images = useMemo(() => {
    const bank = fallbackImages[product.category] ?? fallbackImages.general;
    return [product.image_url, ...bank.filter((url) => url !== product.image_url)].slice(0, 4);
  }, [product.category, product.image_url]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [qty, setQty] = useState(1);

  const total = qty * product.price;
  const deposit = Math.round(total * 0.5);

  return (
    <section className="space-y-4 pb-24">
      <article className="lux-panel overflow-hidden p-0">
        <div className="grid lg:grid-cols-[80px_1fr_1fr]">
          <div className="order-2 flex gap-2 overflow-x-auto border-t border-slate-200 p-3 lg:order-1 lg:flex-col lg:border-r lg:border-t-0">
            {images.map((url, index) => (
              <button
                key={url}
                onClick={() => setActiveIndex(index)}
                className={`h-14 w-16 shrink-0 overflow-hidden rounded-xl border ${
                  activeIndex === index ? "border-primary" : "border-slate-300"
                }`}
              >
                <img src={url} alt={`${product.name} view ${index + 1}`} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>

          <div className="order-1 bg-slate-100 p-4 lg:order-2 lg:p-6">
            <div className="group relative overflow-hidden rounded-2xl bg-slate-200">
              <img
                src={images[activeIndex]}
                alt={product.name}
                className="h-[420px] w-full object-cover transition duration-500 group-hover:scale-110"
              />
              <div className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
                Hover to zoom
              </div>
            </div>
          </div>

          <div className="order-3 p-5 sm:p-7">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Product Detail</p>
            <h2 className="mt-2 text-5xl font-semibold leading-[1.02] text-slate-900">{product.name}</h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">{product.description}</p>

            <div className="mt-6 border-y border-slate-200 py-5">
              <p className="text-4xl font-semibold text-slate-900">{money(product.price)}</p>
              <p className="mt-1 text-sm text-slate-500">{product.unit}</p>
              <p className="mt-1 text-sm text-slate-500">Stock: {product.stock_status}</p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {product.certifications.map((cert) => (
                <span key={cert} className="rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-600">
                  {cert}
                </span>
              ))}
            </div>

            <div className="mt-6 flex items-center gap-2">
              <button
                className="h-10 w-10 rounded-full border border-slate-300"
                onClick={() => setQty((v) => Math.max(1, v - 1))}
              >
                -
              </button>
              <div className="w-14 text-center text-lg">{qty}</div>
              <button className="h-10 w-10 rounded-full border border-slate-300" onClick={() => setQty((v) => v + 1)}>
                +
              </button>
            </div>

            <AddToCartButton
              product={product}
              qty={qty}
              className="mt-5 rounded-full bg-primary px-6 py-3 text-sm font-medium text-white"
              label={`Add to cart ${money(total)}`}
            />

            <p className="mt-3 text-sm text-slate-600">Deposit due today (50%): {money(deposit)}</p>
          </div>
        </div>
      </article>

      <article className="lux-panel p-5">
        <h3 className="text-2xl font-semibold text-slate-900">Frequently ordered together</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((item) => (
            <article key={item.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
              <div className="h-36">
                <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
              </div>
              <div className="p-3">
                <p className="text-sm font-medium text-slate-900">{item.name}</p>
                <p className="mt-1 text-xs text-slate-500">{money(item.price)}</p>
              </div>
            </article>
          ))}
        </div>
      </article>

      <div className="fixed inset-x-3 bottom-3 z-40 sm:inset-x-6">
        <div className="mx-auto flex max-w-[1520px] items-center justify-between gap-3 rounded-2xl border border-slate-300/90 bg-white/95 px-4 py-3 shadow-[0_12px_26px_rgba(20,40,70,0.16)] backdrop-blur">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Ready to checkout</p>
            <p className="text-sm text-slate-700">Deposit now: {money(deposit)} | Balance on delivery: {money(total - deposit)}</p>
          </div>
          <AddToCartButton
            product={product}
            qty={qty}
            className="shrink-0 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-white"
            label="Secure Order"
          />
        </div>
      </div>
    </section>
  );
}
