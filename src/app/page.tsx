import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle2,
  Clock3,
  PackageCheck,
  Search,
  ShieldCheck,
  Truck,
} from "lucide-react";
import AddToCartButton from "./components/AddToCartButton";
import AuthButton from "./components/AuthButton";
import CartBadge from "./components/CartBadge";
import { getProducts } from "@/lib/commerce";
import type { Order, Product } from "@/lib/types";

type Screen = "home" | "catalog" | "cart" | "checkout" | "tracking";
type LegacyScreen = Screen | "product";

type PageProps = {
  searchParams: Promise<{ screen?: LegacyScreen }>;
};

const tabs: { key: Screen; label: string }[] = [
  { key: "home", label: "Home" },
  { key: "catalog", label: "Catalog" },
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

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-[1520px] p-3 pb-8 sm:p-6">
      <header className="lux-panel overflow-hidden">
        <div className="border-b border-slate-200/80 bg-slate-50/80 px-4 py-2 text-[12px] text-slate-600 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-3">
              <Link href={href("catalog")} className="font-medium text-slate-700 underline-offset-2 hover:underline">
                Live stock updates
              </Link>
              <Link href="/checkout" className="font-medium text-slate-700 underline-offset-2 hover:underline">
                Secure checkout
              </Link>
            </div>
            <span className="w-full break-words text-left sm:w-auto sm:text-right">
              Contact us at{" "}
              <a href="mailto:sales@s4trading.com" className="font-medium text-slate-700 underline underline-offset-2">
                sales@s4trading.com
              </a>{" "}
              or{" "}
              <a href="tel:+971589615504" className="font-medium text-slate-700 underline underline-offset-2">
                +971589615504
              </a>{" "}
              for any enquiries.
            </span>
          </div>
        </div>

        <div className="px-4 py-4 sm:px-8">
          <div className="grid items-center gap-4 lg:grid-cols-[1.1fr_auto_1fr]">
            <div className="flex items-center gap-3">
              <Image
                src="/s4-logo.png"
                alt="S4 logo"
                width={84}
                height={84}
                className="h-[84px] w-[84px] object-contain"
                priority
              />
              <div>
                <h1 className="text-2xl font-semibold text-slate-900 sm:text-[2.1rem]">Commerce</h1>
                <p className="text-xs text-slate-500 sm:text-sm">Ordering for restaurant and wholesalers</p>
              </div>
            </div>

            <div className="hidden items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 lg:flex">
              <Search size={14} className="text-slate-500" />
              <input
                placeholder="Search Ramadan products"
                className="w-[280px] bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </div>

            <div className="flex flex-wrap items-center justify-start gap-2 sm:justify-end">
              <AuthButton />
              <CartBadge />
            </div>
          </div>
        </div>
      </header>

      <div className="mt-4">{children}</div>
      <Footer />
    </main>
  );
}

function ScreenNav({ current }: { current: Screen }) {
  return (
    <div className="mb-4 grid grid-cols-5 gap-1 rounded-2xl border border-slate-200 bg-white p-1.5">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={href(tab.key)}
          className={`rounded-xl px-1.5 py-2 text-center text-sm font-medium transition sm:px-3 ${
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

function ProductGrid({ title, products }: { title: string; products: Product[] }) {
  return (
    <article className="lux-panel p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xl font-semibold text-slate-900 sm:text-2xl">{title}</h3>
        <Link href={href("catalog")} className="text-sm font-semibold text-primary">
          View all
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => {
          const copy = merchandisingCopy(product);
          return (
            <article key={product.id} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="h-40 overflow-hidden bg-slate-100">
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
              <div className="space-y-2 p-3">
                <h4 className="line-clamp-2 text-sm font-semibold text-slate-900">{product.name}</h4>
                <p className="text-xs text-slate-500">{product.unit}</p>
                <div className="flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                    {product.stock_status}
                  </span>
                </div>
                {copy.idealFor ? (
                  <p className="line-clamp-2 text-xs text-slate-600">
                    <span className="font-semibold">Ideal for:</span> {copy.idealFor}
                  </p>
                ) : null}
                {copy.dishIdeas ? (
                  <p className="line-clamp-2 text-xs text-slate-600">
                    <span className="font-semibold">Dish ideas:</span> {copy.dishIdeas}
                  </p>
                ) : null}
                <div className="flex items-center justify-between pt-1">
                  <p className="text-base font-semibold text-slate-900">{money(product.price)}</p>
                  <AddToCartButton
                    product={product}
                    className="btn-ghost px-3 py-1.5 text-xs"
                    label="Quick add"
                  />
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </article>
  );
}

function TrustCards() {
  const cards = [
    { icon: ShieldCheck, title: "Trusted sourcing", detail: "Halal-focused Ramadan catalog with clear product standards." },
    { icon: PackageCheck, title: "Fast checkout", detail: "Add products quickly and complete orders in minutes." },
    { icon: Truck, title: "Track delivery", detail: "Follow each order from confirmation to delivery." },
  ];
  return (
    <section className="grid gap-3 md:grid-cols-3">
      {cards.map((card) => (
        <article key={card.title} className="lux-panel p-5">
          <card.icon size={20} className="text-primary" />
          <h4 className="mt-3 text-lg font-semibold text-slate-900">{card.title}</h4>
          <p className="mt-2 text-sm text-slate-600">{card.detail}</p>
        </article>
      ))}
    </section>
  );
}

function Footer() {
  return (
    <footer className="mt-6 grid gap-3 md:grid-cols-3">
      <article className="lux-panel p-5 md:col-span-2">
        <Link href={href("home")} className="text-xl font-semibold text-slate-900 underline-offset-2 hover:underline sm:text-2xl">
          Commerce
        </Link>
        <p className="mt-2 text-sm text-slate-600">
          <Link href={href("catalog")} className="underline-offset-2 hover:underline">
            Premium ordering for restaurant and wholesalers.
          </Link>
        </p>
      </article>
      <article className="lux-panel p-5">
        <nav className="space-y-1 text-sm text-slate-600">
          <Link href={href("catalog")} className="block underline-offset-2 hover:underline">Browse Catalog</Link>
          <Link href="/cart" className="block underline-offset-2 hover:underline">Add to Cart</Link>
          <Link href="/checkout" className="block underline-offset-2 hover:underline">Checkout</Link>
          <Link href="/orders" className="block underline-offset-2 hover:underline">Track Order</Link>
        </nav>
      </article>
    </footer>
  );
}

function HomeScreen({ products }: { products: Product[] }) {
  const ramadan = products.filter((product) => product.category === "ramadan");
  const activeProducts = ramadan.length > 0 ? ramadan : products;
  const featured = activeProducts[0];
  const featuredCopy = featured ? merchandisingCopy(featured) : null;

  return (
    <section className="space-y-4">
      <article className="lux-panel overflow-hidden p-4 sm:p-6">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
          <div className="overflow-hidden rounded-2xl bg-slate-100">
            <img src={featured?.image_url} alt={featured?.name} className="h-full min-h-[220px] w-full object-cover sm:min-h-[290px]" />
          </div>
          <div className="flex flex-col justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-primary">Featured Ramadan Item</p>
              <h2 className="mt-2 text-2xl font-semibold leading-tight text-slate-900 sm:text-4xl">{featured?.name ?? "Featured product"}</h2>
              <ul className="mt-3 space-y-1 text-sm text-slate-700">
                <li>Ideal for: {featuredCopy?.idealFor ?? "High-volume kitchens and iftar prep teams"}</li>
                <li>Dish ideas: {featuredCopy?.dishIdeas ?? "Iftar platter, family meal packs, catering trays"}</li>
              </ul>
              <p className="mt-4 text-2xl font-semibold text-slate-900 sm:text-3xl">{featured ? money(featured.price) : "AED --"}</p>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {featured ? (
                <AddToCartButton
                  product={featured}
                  className="btn-primary w-full sm:w-auto"
                />
              ) : null}
              <Link href={href("catalog")} className="btn-secondary w-full sm:w-auto">
                Browse catalog
              </Link>
              <Link href={href("cart")} className="btn-ghost w-full sm:w-auto">
                View cart
              </Link>
            </div>
          </div>
        </div>
      </article>

      <ProductGrid title="Best sellers" products={activeProducts.slice(0, 6)} />
      <TrustCards />
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
        <h2 className="mt-1 text-2xl font-semibold text-slate-900 sm:text-3xl">Ramadan Collection</h2>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="signal-chip">Frozen</span>
          <span className="signal-chip">Beverages</span>
          <span className="signal-chip">Staples</span>
          <span className="signal-chip">Desserts</span>
        </div>
      </article>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {catalogProducts.map((product) => {
          const copy = merchandisingCopy(product);
          return (
            <article key={product.id} className="lux-panel overflow-hidden p-0">
              <div className="h-56 bg-slate-100">
                <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
              </div>
              <div className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">{product.name}</h2>
                  <span className="shrink-0 text-base font-semibold text-slate-900 sm:text-lg">{money(product.price)}</span>
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
                  className="btn-primary"
                />
              </div>
            </article>
          );
        })}
      </div>
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
      <Link href="/checkout" className="btn-primary mt-5">
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
  const screen: Screen = params.screen === "product" ? "catalog" : (params.screen ?? "home");
  const productResult = await getProducts();

  const products = productResult.data;
  const latestOrder = undefined;

  return (
    <AppShell>
      <ScreenNav current={screen} />
      {screen === "home" ? <HomeScreen products={products} /> : null}
      {screen === "catalog" ? <CatalogScreen products={products} /> : null}
      {screen === "cart" ? <CartScreen order={latestOrder} /> : null}
      {screen === "checkout" ? <CheckoutScreen order={latestOrder} /> : null}
      {screen === "tracking" ? <TrackingScreen order={latestOrder} /> : null}
    </AppShell>
  );
}
