import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Package,
  PackageCheck,
  Search,
  ShieldCheck,
  Truck,
  Users,
} from "lucide-react";
import AddToCartButton from "./components/AddToCartButton";
import CartBadge from "./components/CartBadge";
import ProductExperience from "./components/ProductExperience";
import { getMyOrders, getProducts } from "@/lib/supabase-rest";
import type { Order, Product } from "@/lib/types";

type Screen =
  | "home"
  | "catalog"
  | "product"
  | "cart"
  | "checkout"
  | "tracking";

type PageProps = {
  searchParams: Promise<{ screen?: Screen }>;
};

const tabs: { key: Screen; label: string }[] = [
  { key: "home", label: "Home" },
  { key: "catalog", label: "Catalog" },
  { key: "product", label: "Product" },
  { key: "cart", label: "Cart" },
  { key: "checkout", label: "Checkout" },
  { key: "tracking", label: "Tracking" },
];

function money(value: number) {
  return `AED ${value.toLocaleString("en-US")}`;
}

function href(screen: Screen) {
  return `/?screen=${screen}`;
}

function paymentMethodFromOrder(order?: Order) {
  const notes = order?.special_instructions;
  if (!notes) return "stripe";
  return notes.includes("payment_method=cod") ? "cod" : "stripe";
}

function merchandisingCopy(product: Product) {
  const idealForFromDescription = product.description.match(/Ideal for:\s*([^.]*)\.?/i)?.[1]?.trim();
  const dishIdeasFromDescription = product.description.match(/Dish ideas:\s*([^.]*)\.?/i)?.[1]?.trim();
  return {
    idealFor: product.ideal_for ?? idealForFromDescription,
    dishIdeas: product.dish_ideas?.join(", ") ?? dishIdeasFromDescription,
  };
}

function AppShell({ children, source }: { children: React.ReactNode; source: "supabase" | "fallback" }) {
  return (
    <main className="mx-auto max-w-[1520px] p-3 pb-8 sm:p-6">
      <div className="lux-panel overflow-hidden">
        <div className="border-b border-slate-200/80 bg-slate-50/80 px-4 py-2 text-[12px] text-slate-600 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-4">
              <span className="inline-flex items-center gap-1.5"><Package size={13} /> Live stock updates</span>
              <span className="inline-flex items-center gap-1.5"><Truck size={13} /> Next-day delivery lanes</span>
              <span className="inline-flex items-center gap-1.5"><Users size={13} /> Multi-branch ordering</span>
            </div>
            <span className="brand-chip">
              Data: {source === "supabase" ? "Live Supabase" : "Fallback Seed"}
            </span>
          </div>
        </div>

        <header className="px-4 py-4 sm:px-8 sm:py-4">
          <div className="grid items-center gap-4 lg:grid-cols-[1.2fr_auto_1fr]">
            <div className="flex items-center gap-3">
              <Image
                src="/s4-logo.svg"
                alt="S4 logo"
                width={54}
                height={54}
                className="rounded-md border border-slate-200 bg-white p-1"
                priority
              />
              <div>
                <h1 className="text-3xl font-semibold text-slate-900 sm:text-[2.1rem]">S4 Commerce</h1>
                <p className="text-sm text-slate-500">Ramadan ordering for restaurants and wholesalers</p>
              </div>
            </div>

            <div className="hidden items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 lg:flex">
              <Search size={14} className="text-slate-500" />
              <input
                placeholder="Search product, category, brand"
                className="w-[280px] bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button className="rounded-full border border-secondary/50 px-4 py-2 text-sm font-medium text-secondary">
                Invite Team
              </button>
              <CartBadge />
              <Link href="/admin" className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white">
                Admin Dashboard
              </Link>
            </div>
          </div>
        </header>
      </div>

      <div className="mt-4">{children}</div>
      <Footer />
    </main>
  );
}

function ScreenNav({ current }: { current: Screen }) {
  return (
    <div className="mb-4 flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={href(tab.key)}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
            current === tab.key
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}

function BuyerSignalStrip({ order }: { order?: Order }) {
  const paymentMethod = paymentMethodFromOrder(order).toUpperCase();
  return (
    <section className="lux-panel p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="signal-chip">In Stock Today</span>
        <span className="signal-chip">Next Delivery: {order?.delivery_date ?? "--"}</span>
        <span className="signal-chip">Payment: Full Pay or COD</span>
        <span className="signal-chip">Current Method: {paymentMethod}</span>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Open Basket</p>
          <p className="text-xl font-semibold text-slate-900">{money(order?.total_amount ?? 0)}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Paid now</p>
          <p className="text-xl font-semibold text-slate-900">{money(order?.deposit_amount ?? 0)}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Orders this week</p>
          <p className="text-xl font-semibold text-slate-900">12</p>
        </div>
      </div>
    </section>
  );
}

function ProductRail({ title, products }: { title: string; products: Product[] }) {
  return (
      <article className="lux-panel p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-2xl font-semibold text-slate-900">{title}</h3>
        <button className="inline-flex items-center gap-2 text-sm font-medium text-slate-600">
          View all <ArrowRight size={14} />
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => {
          const copy = merchandisingCopy(product);
          return <article key={product.id} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="h-36 overflow-hidden bg-slate-100">
              <img
                src={product.image_url}
                alt={product.name}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
            </div>
            <div className="p-3">
              <h4 className="line-clamp-2 text-sm font-semibold text-slate-900">{product.name}</h4>
              <p className="mt-1 text-xs text-slate-500">{product.unit}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">{product.stock_status}</span>
                {product.certifications.slice(0, 1).map((cert) => (
                  <span key={cert} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">{cert}</span>
                ))}
              </div>
              {copy.idealFor ? (
                <p className="mt-2 line-clamp-2 text-xs text-slate-600">
                  <span className="font-semibold">Ideal for:</span> {copy.idealFor}
                </p>
              ) : null}
              {copy.dishIdeas ? (
                <p className="mt-1 line-clamp-2 text-xs text-slate-600">
                  <span className="font-semibold">Dish ideas:</span> {copy.dishIdeas}
                </p>
              ) : null}
              <div className="mt-3 flex items-center justify-between">
                <p className="text-base font-semibold text-slate-900">{money(product.price)}</p>
                <AddToCartButton
                  product={product}
                  className="rounded-full border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700"
                  label="Quick add"
                />
              </div>
            </div>
          </article>;
        })}
      </div>
    </article>
  );
}

function ComingSoonLanes() {
  const lanes = [
    {
      name: "Japanese Specialty",
      eta: "Coming soon",
      detail: "Imported pantry, frozen specialties, and chef-ready packs.",
    },
    {
      name: "General Essentials",
      eta: "Coming soon",
      detail: "Daily staples, produce, and high-rotation kitchen supplies.",
    },
  ];

  return (
    <article className="lux-panel p-5">
      <h3 className="text-2xl font-semibold text-slate-900">Upcoming categories</h3>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {lanes.map((lane) => (
          <div key={lane.name} className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{lane.eta}</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{lane.name}</p>
            <p className="mt-1 text-sm text-slate-600">{lane.detail}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

function ActionPanel() {
  return (
    <article className="lux-panel p-5">
      <h3 className="text-2xl font-semibold text-slate-900">Quick actions</h3>
      <div className="mt-4 grid gap-2">
        <button className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700">
          <span className="inline-flex items-center gap-2"><CalendarClock size={15} /> Schedule delivery</span>
          <ArrowRight size={14} />
        </button>
        <button className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700">
          <span className="inline-flex items-center gap-2"><Users size={15} /> Manage team buyers</span>
          <ArrowRight size={14} />
        </button>
        <button className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700">
          <span className="inline-flex items-center gap-2"><PackageCheck size={15} /> Review pending orders</span>
          <ArrowRight size={14} />
        </button>
        <button className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700">
          <span className="inline-flex items-center gap-2"><Package size={15} /> Build saved order list</span>
          <ArrowRight size={14} />
        </button>
        <button className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700">
          <span className="inline-flex items-center gap-2"><ShieldCheck size={15} /> Verify payment status</span>
          <ArrowRight size={14} />
        </button>
      </div>
      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Need help?</p>
        <p className="mt-1 text-sm text-slate-700">Your account manager can assist with sourcing, MOQ, and delivery slot planning.</p>
        <button className="mt-2 text-sm font-semibold text-primary">Contact support</button>
      </div>
    </article>
  );
}

function OperationsSnapshot({ order }: { order?: Order }) {
  return (
    <article className="lux-panel p-5">
      <h3 className="text-2xl font-semibold text-slate-900">Operations snapshot</h3>
      <div className="mt-4 space-y-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Current order</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">#{order?.order_number ?? "No active order"}</p>
          <p className="text-sm text-slate-600">Delivery: {order?.delivery_date ?? "--"}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Payment status</p>
          <p className="mt-1 text-sm text-slate-700">Method: <span className="font-semibold uppercase">{paymentMethodFromOrder(order)}</span></p>
          <p className="text-sm text-slate-700">Paid now: <span className="font-semibold">{money(order?.deposit_amount ?? 0)}</span></p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Fulfillment queue</p>
          <p className="mt-1 text-sm text-slate-700">5 confirmed orders awaiting preparation.</p>
          <button className="mt-1 text-sm font-semibold text-primary">Open fulfillment board</button>
        </div>
      </div>
    </article>
  );
}

function WhyTurnKey() {
  const items = [
    {
      icon: ShieldCheck,
      title: "Reliable Stock Visibility",
      desc: "Know what is in stock before checkout, with real-time availability across categories.",
    },
    {
      icon: CalendarClock,
      title: "Predictable Delivery",
      desc: "Choose delivery windows confidently and keep kitchen prep aligned with inbound shipments.",
    },
    {
      icon: PackageCheck,
      title: "Fast Checkout Flow",
      desc: "Move from cart to full payment or COD in minutes with secure checkout.",
    },
  ];

  return (
    <section className="grid gap-3 md:grid-cols-3">
      {items.map((item) => (
        <article key={item.title} className="lux-panel p-5">
          <item.icon className="text-primary" size={20} />
          <h4 className="mt-3 text-lg font-semibold text-slate-900">{item.title}</h4>
          <p className="mt-2 text-sm text-slate-600">{item.desc}</p>
        </article>
      ))}
    </section>
  );
}

function WorkflowSection() {
  const steps = [
    "Browse and add products in under 2 minutes",
    "Pay full amount via Stripe or place COD order",
    "Track preparation and delivery in real time",
  ];

  return (
    <article className="lux-panel p-5">
      <h3 className="text-2xl font-semibold text-slate-900">How it works</h3>
      <div className="mt-4 grid gap-2 md:grid-cols-3">
        {steps.map((step, index) => (
          <div key={step} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Step {index + 1}</p>
            <p className="mt-2 text-sm text-slate-700">{step}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

function CTASection() {
  return (
    <article className="lux-panel overflow-hidden bg-gradient-to-r from-[#0f6f78] to-[#0b5f66] p-6 text-white">
      <h3 className="text-3xl font-semibold">Ready to digitize your ordering operations?</h3>
      <p className="mt-2 max-w-2xl text-sm text-slate-100">
        S4 helps distributor teams reduce ordering friction, improve reorder consistency, and increase delivery confidence.
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <button className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#0b5f66]">Book onboarding call</button>
        <button className="rounded-full border border-white/60 px-5 py-2.5 text-sm font-semibold text-white">Download product brief</button>
      </div>
    </article>
  );
}

function Footer() {
  return (
    <footer className="mt-6 grid gap-3 md:grid-cols-4">
      <article className="lux-panel p-5 md:col-span-2">
        <h4 className="text-2xl font-semibold text-slate-900">S4 Commerce</h4>
        <p className="mt-2 text-sm text-slate-600">Built for restaurant procurement teams and supplier operations.</p>
      </article>
      <article className="lux-panel p-5">
        <h5 className="text-sm font-semibold text-slate-900">Platform</h5>
        <ul className="mt-2 space-y-1 text-sm text-slate-600">
          <li>Catalog</li>
          <li>Order Tracking</li>
          <li>Checkout & Payments</li>
          <li>Fulfillment Status</li>
        </ul>
      </article>
      <article className="lux-panel p-5">
        <h5 className="text-sm font-semibold text-slate-900">Support</h5>
        <ul className="mt-2 space-y-1 text-sm text-slate-600">
          <li>Help Center</li>
          <li>WhatsApp Support</li>
          <li>Billing</li>
          <li>Terms & Privacy</li>
        </ul>
      </article>
    </footer>
  );
}

function HomeScreen({ products, order }: { products: Product[]; order?: Order }) {
  const ramadan = products.filter((product) => product.category === "ramadan");
  const activeProducts = ramadan.length > 0 ? ramadan : products;
  const featured = activeProducts[0];
  const featuredCopy = featured ? merchandisingCopy(featured) : null;

  return (
    <section className="space-y-4">
      <BuyerSignalStrip order={order} />

      <article className="lux-panel p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">Ramadan Collection: Live</span>
          <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-600">Japanese Specialty: Coming soon</span>
          <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-600">General Essentials: Coming soon</span>
        </div>
      </article>

      <article className="lux-panel overflow-hidden p-4 sm:p-6">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
          <div className="overflow-hidden rounded-2xl bg-slate-100">
            <img src={featured?.image_url} alt={featured?.name} className="h-full min-h-[290px] w-full object-cover" />
          </div>
          <div className="flex flex-col justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-primary">Featured collection</p>
              <h2 className="mt-2 text-4xl font-semibold leading-tight text-slate-900">{featured?.name ?? "Featured Product"}</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Built for restaurant buyers: clear pricing, reliable stock visibility, and frictionless repeat ordering.
              </p>
              <ul className="mt-3 space-y-1 text-sm text-slate-700">
                <li>Ideal for: {featuredCopy?.idealFor ?? "High-volume kitchens and iftar prep teams"}</li>
                <li>Dish ideas: {featuredCopy?.dishIdeas ?? "Iftar platter, family meal packs, catering trays"}</li>
                <li>Fast fulfillment: 24-48 hr lead time on stocked SKUs</li>
              </ul>
              <p className="mt-4 text-3xl font-semibold text-slate-900">{featured ? money(featured.price) : "AED --"}</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Stock</p>
                  <p className="text-sm font-semibold text-slate-900">In stock</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Lead time</p>
                  <p className="text-sm font-semibold text-slate-900">24-48 hrs</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Payment</p>
                  <p className="text-sm font-semibold text-slate-900">Full pay or COD</p>
                </div>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {featured ? (
                <AddToCartButton
                  product={featured}
                  className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-white"
                />
              ) : null}
              <button className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700">View Ramadan best sellers</button>
            </div>
          </div>
        </div>
      </article>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <ProductRail title="Recommended for your weekly run" products={activeProducts.slice(0, 3)} />
        <ActionPanel />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <ProductRail title="High-rotation essentials" products={activeProducts.slice(0, 3)} />
        <OperationsSnapshot order={order} />
      </div>

      <WhyTurnKey />
      <WorkflowSection />

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <ProductRail title="Ramadan top movers" products={activeProducts.slice(0, 3)} />
        <article className="lux-panel p-5">
          <h3 className="text-2xl font-semibold text-slate-900">Order Pulse</h3>
          {order ? (
            <>
              <p className="mt-1 text-sm text-slate-500">Latest order #{order.order_number}</p>
              <div className="mt-4 space-y-2 border-t border-slate-200 pt-4 text-sm">
                <p className="flex justify-between"><span className="text-slate-500">Total</span><strong>{money(order.total_amount)}</strong></p>
                <p className="flex justify-between"><span className="text-slate-500">Paid now</span><strong>{money(order.deposit_amount)}</strong></p>
                <p className="flex justify-between"><span className="text-slate-500">Delivery</span><strong>{order.delivery_date}</strong></p>
              </div>
            </>
          ) : (
            <p className="mt-3 text-sm text-slate-500">No historical orders yet.</p>
          )}
          <button className="mt-5 inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">
            View all orders <ArrowRight size={14} />
          </button>
        </article>
      </div>

      <ProductRail title="Ramadan must-haves" products={activeProducts} />
      <ComingSoonLanes />
      <CTASection />
    </section>
  );
}

function CatalogScreen({ products }: { products: Product[] }) {
  const ramadanOnly = products.filter((product) => product.category === "ramadan");
  const catalogProducts = ramadanOnly.length > 0 ? ramadanOnly : products;

  return (
    <section className="space-y-4">
      <article className="lux-panel p-5">
        <p className="text-xs uppercase tracking-[0.18em] text-primary">Active catalog</p>
        <h2 className="mt-1 text-3xl font-semibold text-slate-900">Ramadan Collection</h2>
        <p className="mt-2 text-sm text-slate-600">Japanese Specialty and General Essentials are currently marked as coming soon.</p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="signal-chip">Frozen</span>
          <span className="signal-chip">Beverages</span>
          <span className="signal-chip">Staples</span>
          <span className="signal-chip">Desserts</span>
          <span className="ml-auto text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Sort: Best sellers</span>
        </div>
      </article>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {catalogProducts.map((product) => {
          const copy = merchandisingCopy(product);
          return <article key={product.id} className="lux-panel overflow-hidden p-0">
            <div className="h-56 bg-slate-100">
              <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
            </div>
            <div className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-xl font-semibold text-slate-900">{product.name}</h2>
                <span className="text-lg font-semibold text-slate-900">{money(product.price)}</span>
              </div>
              <p className="text-sm text-slate-500">{product.description}</p>
              {copy.idealFor ? (
                <p className="text-xs text-slate-600">
                  <span className="font-semibold">Ideal for:</span> {copy.idealFor}
                </p>
              ) : null}
              {copy.dishIdeas ? (
                <p className="text-xs text-slate-600">
                  <span className="font-semibold">Dish ideas:</span> {copy.dishIdeas}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-1.5">
                {product.certifications.map((cert) => (
                  <span key={cert} className="rounded-full border border-slate-300 px-2.5 py-1 text-[11px] text-slate-600">
                    {cert}
                  </span>
                ))}
              </div>
              <AddToCartButton
                product={product}
                className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white"
              />
            </div>
          </article>;
        })}
      </div>

      <ComingSoonLanes />
    </section>
  );
}

function CartScreen({ order }: { order?: Order }) {
  if (!order) return <section className="lux-panel p-5">Your cart is empty.</section>;
  return (
    <section className="lux-panel p-5 sm:p-6">
      <h2 className="text-3xl font-semibold text-slate-900">Cart</h2>
      <div className="mt-4 space-y-2">
        {order.items.map((item) => (
          <div key={item.product_id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="font-medium text-slate-900">{item.name}</p>
            <p className="text-sm text-slate-500">{item.qty} x {money(item.unit_price)}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 space-y-1 text-sm">
        <p className="flex justify-between"><span>Subtotal</span><strong>{money(order.total_amount)}</strong></p>
        <p className="flex justify-between"><span>Paid now</span><strong>{money(order.deposit_amount)}</strong></p>
      </div>
      <Link href="/checkout" className="mt-5 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-white">
        Proceed to checkout
      </Link>
    </section>
  );
}

function CheckoutScreen({ order }: { order?: Order }) {
  if (!order) return <section className="lux-panel p-5">No active checkout.</section>;
  return (
    <section className="space-y-3">
      {["Delivery Details", "Payment", "Confirmation"].map((step, index) => (
        <article key={step} className="lux-panel p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Step {index + 1}</p>
          <h3 className="mt-2 text-2xl font-semibold text-slate-900">{step}</h3>
          <p className="mt-1 text-sm text-slate-600">{index === 1 ? `Pay ${money(order.total_amount)} now or place COD.` : "Optimized for one-minute completion."}</p>
        </article>
      ))}
    </section>
  );
}

function TrackingScreen({ order }: { order?: Order }) {
  if (!order) return <section className="lux-panel p-5">No active order to track.</section>;
  const isCod = paymentMethodFromOrder(order) === "cod";
  return (
    <section className="lux-panel p-5">
      <h2 className="text-3xl font-semibold text-slate-900">Order #{order.order_number}</h2>
      <div className="mt-4 space-y-2 text-sm text-slate-700">
        <p className="inline-flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-600" /> Confirmed</p>
        <p className="inline-flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-600" /> {isCod ? "COD pending" : "Payment received"}</p>
        <p className="inline-flex items-center gap-2"><Clock3 size={16} className="text-amber-600" /> Preparing order</p>
        <p className="inline-flex items-center gap-2"><Truck size={16} className="text-slate-500" /> Out for delivery</p>
      </div>
    </section>
  );
}

export default async function Home({ searchParams }: PageProps) {
  const params = await searchParams;
  const screen = params.screen ?? "home";
  const demoUserId = process.env.DEMO_CUSTOMER_ID ?? "e6a118e9-47f2-44d2-92f4-8e832f2cb10a";

  const [productResult, orderResult] = await Promise.all([
    getProducts(),
    getMyOrders(demoUserId),
  ]);

  const products = productResult.data;
  const activeProducts = products.filter((product) => product.category === "ramadan");
  const productPool = activeProducts.length > 0 ? activeProducts : products;
  const latestOrder = orderResult.data[0];

  return (
    <AppShell source={productResult.source}>
      <ScreenNav current={screen} />
      {screen === "home" ? <HomeScreen products={products} order={latestOrder} /> : null}
      {screen === "catalog" ? <CatalogScreen products={products} /> : null}
      {screen === "product" ? <ProductExperience product={productPool[0]} related={productPool.slice(1)} /> : null}
      {screen === "cart" ? <CartScreen order={latestOrder} /> : null}
      {screen === "checkout" ? <CheckoutScreen order={latestOrder} /> : null}
      {screen === "tracking" ? <TrackingScreen order={latestOrder} /> : null}
    </AppShell>
  );
}
