import { resolveProductImageUrl } from "@/lib/product-images";
import type { Order, Product } from "@/lib/types";

type Category = Product["category"];
type StockStatus = Product["stock_status"];

function normalizeCategory(value: string): Category {
  const input = value.toLowerCase();
  if (input.includes("ramadan")) return "ramadan";
  if (input.includes("japanese")) return "japanese";
  if (input.includes("beef")) return "premium_beef";
  return "general";
}

function stockStatusFromQuantity(
  quantity: number | null | undefined,
  allowBackorder: boolean,
): StockStatus {
  if ((quantity ?? 0) > 15) return "In Stock";
  if ((quantity ?? 0) > 0) return "Low Stock";
  if (allowBackorder) return "Pre-order";
  return "Low Stock";
}

function toNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function parsePriceFromVariant(variant: Record<string, unknown> | null | undefined) {
  if (!variant) return 0;
  const calculated = variant.calculated_price as
    | Record<string, unknown>
    | undefined;
  if (calculated) {
    const amount = toNumber(calculated.calculated_amount, NaN);
    if (Number.isFinite(amount)) return amount / 100;
  }
  const prices = variant.prices as Array<Record<string, unknown>> | undefined;
  if (prices?.length) {
    const amount = toNumber(prices[0]?.amount, NaN);
    if (Number.isFinite(amount)) return amount / 100;
  }
  return 0;
}

function getOrderStatus(value?: string): Order["status"] {
  switch (value) {
    case "pending":
    case "confirmed":
    case "preparing":
    case "out_for_delivery":
    case "delivered":
      return value;
    default:
      return "pending";
  }
}

export function mapMedusaProductToProduct(raw: Record<string, unknown>): Product {
  const variants = (raw.variants as Array<Record<string, unknown>> | undefined) ?? [];
  const firstVariant = variants[0];
  const metadata = (raw.metadata as Record<string, unknown> | undefined) ?? {};
  const categories = (raw.categories as Array<Record<string, unknown>> | undefined) ?? [];
  const categoryName =
    (categories[0]?.handle as string | undefined) ??
    (categories[0]?.name as string | undefined) ??
    "general";
  const imageUrl =
    (raw.thumbnail as string | undefined) ??
    ((raw.images as Array<Record<string, unknown>> | undefined)?.[0]?.url as
      | string
      | undefined) ??
    "";
  const stockLevel = toNumber(firstVariant?.inventory_quantity, 0);
  const allowBackorder = Boolean(firstVariant?.allow_backorder);
  const baseName = (raw.title as string | undefined) ?? "Product";
  const certifications = Array.isArray(metadata.certifications)
    ? (metadata.certifications as string[])
    : [];

  return {
    id: String(firstVariant?.id ?? raw.id ?? baseName),
    backend_product_id: String(raw.id ?? ""),
    variant_id: firstVariant?.id ? String(firstVariant.id) : undefined,
    name: baseName,
    category: normalizeCategory(categoryName),
    price: parsePriceFromVariant(firstVariant),
    unit:
      (firstVariant?.title as string | undefined) ??
      ((metadata.unit as string | undefined) || "Pack"),
    description:
      (raw.description as string | undefined) ??
      ((metadata.description as string | undefined) || ""),
    image_url: resolveProductImageUrl(baseName, imageUrl),
    certifications,
    stock_level: stockLevel,
    stock_status: stockStatusFromQuantity(stockLevel, allowBackorder),
    ideal_for: metadata.ideal_for as string | undefined,
    dish_ideas: Array.isArray(metadata.dish_ideas)
      ? (metadata.dish_ideas as string[])
      : undefined,
    ai_note: metadata.ai_note as string | undefined,
  };
}

export function mapMedusaOrderToOrder(raw: Record<string, unknown>): Order {
  const metadata = (raw.metadata as Record<string, unknown> | undefined) ?? {};
  const items = (raw.items as Array<Record<string, unknown>> | undefined) ?? [];
  const paymentStatus = String(raw.payment_status ?? "");
  const totalCents = toNumber(raw.total, 0);
  const totalAmount = totalCents / 100;
  const paid = paymentStatus === "captured" || paymentStatus === "paid";
  const mappedStatus = getOrderStatus(
    (metadata.turnkey_status as string | undefined) ??
      (raw.status as string | undefined),
  );

  return {
    id: String(raw.id ?? ""),
    order_number:
      (metadata.order_number as string | undefined) ??
      `RAM-${new Date().getUTCFullYear()}-UNKNOWN`,
    user_id:
      (metadata.supabase_user_id as string | undefined) ??
      (raw.customer_id as string | undefined) ??
      "",
    status: mappedStatus,
    delivery_date:
      (metadata.delivery_date as string | undefined) ??
      new Date().toISOString().slice(0, 10),
    total_amount: totalAmount,
    deposit_amount: paid ? totalAmount : 0,
    deposit_paid: paid,
    special_instructions: metadata.special_instructions as string | undefined,
    items: items.map((item) => ({
      product_id: String(item.variant_id ?? item.id ?? ""),
      name: String(item.title ?? "Item"),
      qty: toNumber(item.quantity, 1),
      unit_price: toNumber(item.unit_price, 0) / 100,
    })),
  };
}
