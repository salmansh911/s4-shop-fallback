import Link from "next/link";
import { AlertTriangle, BarChart3, CircleDollarSign, Sparkles } from "lucide-react";
import { getMyOrders } from "@/lib/supabase-rest";

export default async function AdminPage() {
  const demoUserId = process.env.DEMO_CUSTOMER_ID ?? "e6a118e9-47f2-44d2-92f4-8e832f2cb10a";
  const orders = await getMyOrders(demoUserId);

  return (
    <main className="mx-auto max-w-7xl p-4 sm:p-6">
      <header className="rounded-3xl border border-[#0f707028] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#0f6f78]">TurnKey Admin</p>
            <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">Operations Command Center</h1>
            <p className="mt-1 text-sm text-slate-600">Manage orders, payment status, and fulfillment updates.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#0f6f7814] px-3 py-1 text-xs font-semibold text-[#0f6f78]">
              Data: {orders.source === "supabase" ? "Live Supabase" : "Fallback Seed"}
            </span>
            <Link href="/" className="rounded-xl border border-[#0f6f78] px-4 py-2 text-sm font-semibold text-[#0f6f78]">
              Customer App
            </Link>
          </div>
        </div>
      </header>

      <section className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="kpi"><p className="text-sm text-slate-500">New Orders</p><p className="mt-2 text-2xl font-semibold">12</p></article>
        <article className="kpi"><p className="text-sm text-slate-500">Payment Pending</p><p className="mt-2 text-2xl font-semibold">2</p></article>
        <article className="kpi"><p className="text-sm text-slate-500">Low Stock SKUs</p><p className="mt-2 text-2xl font-semibold">3</p></article>
        <article className="kpi"><p className="text-sm text-slate-500">Revenue (MTD)</p><p className="mt-2 text-2xl font-semibold">AED 145K</p></article>
      </section>

      <section className="mt-4 grid gap-3 xl:grid-cols-[1.6fr_1fr]">
        <article className="tile p-5">
          <h2 className="text-lg font-semibold">Incoming Orders</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="text-slate-500">
                  <th className="pb-2">Order</th>
                  <th className="pb-2">Delivery</th>
                  <th className="pb-2">Amount</th>
                  <th className="pb-2">Payment</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.data.map((row) => (
                  <tr key={row.id} className="border-t">
                    <td className="py-2 font-semibold">#{row.order_number}</td>
                    <td className="py-2">{row.delivery_date}</td>
                    <td className="py-2">AED {row.total_amount.toLocaleString("en-US")}</td>
                    <td className="py-2">{row.deposit_paid ? "Paid" : "Pending / COD"}</td>
                    <td className="py-2 capitalize">{row.status.replaceAll("_", " ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <div className="space-y-3">
          <article className="tile p-4">
            <h2 className="inline-flex items-center gap-2 text-lg font-semibold"><Sparkles size={18} className="text-[#0f6f78]" /> Ops Alerts</h2>
            <ul className="mt-2 space-y-2 text-sm text-slate-700">
              <li className="inline-flex items-start gap-2"><BarChart3 size={16} className="mt-0.5 text-[#0f6f78]" /> Frozen appetizer SKUs are moving fast this week.</li>
              <li className="inline-flex items-start gap-2"><AlertTriangle size={16} className="mt-0.5 text-amber-600" /> 3 COD orders need payment confirmation after delivery.</li>
            </ul>
          </article>
          <article className="tile p-4">
            <h2 className="inline-flex items-center gap-2 text-lg font-semibold"><CircleDollarSign size={18} className="text-emerald-700" /> Financial Snapshot</h2>
            <p className="mt-2 text-sm text-slate-700">Payments collected today: AED 11,240. COD reconciliations pending: 2.</p>
          </article>
        </div>
      </section>
    </main>
  );
}
