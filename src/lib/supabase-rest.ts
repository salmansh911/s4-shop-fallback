import { mockInsights, mockOrders, mockProducts } from "./mock-seed";
import type { InsightCard, Order, Product } from "./types";

type DataSource = "supabase" | "fallback";

function env() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

async function request<T>(path: string): Promise<T | null> {
  const { url, key } = env();
  if (!url || !key) {
    return null;
  }

  const response = await fetch(`${url}/rest/v1/${path}`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as T;
}

async function requestWrite<T>(
  path: string,
  method: "POST" | "PATCH",
  body: unknown,
): Promise<T | null> {
  const { url, key } = env();
  if (!url || !key) {
    return null;
  }

  const response = await fetch(`${url}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as T;
}

export async function getProducts(): Promise<{ source: DataSource; data: Product[] }> {
  const data = await request<Product[]>("products?select=*");
  if (data && data.length > 0) {
    return { source: "supabase", data };
  }
  return { source: "fallback", data: mockProducts };
}

export async function getMyOrders(
  userId: string,
): Promise<{ source: DataSource; data: Order[] }> {
  const data = await request<Order[]>(
    `orders?select=*&user_id=eq.${encodeURIComponent(userId)}&order=created_at.desc`,
  );
  if (data && data.length > 0) {
    return { source: "supabase", data };
  }
  return {
    source: "fallback",
    data: mockOrders.filter((order) => order.user_id === userId),
  };
}

export async function getInsights(
  _userId: string,
): Promise<{ source: DataSource; data: InsightCard[] }> {
  const data = await request<InsightCard[]>("ai_suggestions?select=*");
  if (data && data.length > 0) {
    return { source: "supabase", data };
  }
  return { source: "fallback", data: mockInsights };
}

type CreateOrderInput = {
  id: string;
  order_number: string;
  user_id: string;
  items: Order["items"];
  total_amount: number;
  deposit_amount: number;
  delivery_date: string;
  special_instructions?: string;
};

export async function createOrder(
  payload: CreateOrderInput,
): Promise<{ source: DataSource; data: Order | null }> {
  const body = [
    {
      ...payload,
      status: "pending",
      deposit_paid: false,
    },
  ];

  const data = await requestWrite<Order[]>("orders", "POST", body);
  if (data && data.length > 0) {
    return { source: "supabase", data: data[0] };
  }

  const fallbackOrder: Order = {
    id: payload.id,
    order_number: payload.order_number,
    user_id: payload.user_id,
    status: "pending",
    delivery_date: payload.delivery_date,
    total_amount: payload.total_amount,
    deposit_amount: payload.deposit_amount,
    deposit_paid: false,
    items: payload.items,
  };
  mockOrders.unshift(fallbackOrder);
  return { source: "fallback", data: fallbackOrder };
}

export async function getOrderById(
  orderId: string,
): Promise<{ source: DataSource; data: Order | null }> {
  const data = await request<Order[]>(
    `orders?select=*&id=eq.${encodeURIComponent(orderId)}&limit=1`,
  );
  if (data && data.length > 0) {
    return { source: "supabase", data: data[0] };
  }
  const fallbackOrder = mockOrders.find((order) => order.id === orderId) ?? null;
  return { source: "fallback", data: fallbackOrder };
}

export async function markOrderDepositPaid(
  orderId: string,
): Promise<{ source: DataSource; data: Order | null }> {
  const data = await requestWrite<Order[]>(
    `orders?id=eq.${encodeURIComponent(orderId)}`,
    "PATCH",
    { deposit_paid: true, status: "confirmed" },
  );
  if (data && data.length > 0) {
    return { source: "supabase", data: data[0] };
  }
  const fallbackOrder = mockOrders.find((order) => order.id === orderId);
  if (fallbackOrder) {
    fallbackOrder.deposit_paid = true;
    fallbackOrder.status = "confirmed";
    return { source: "fallback", data: fallbackOrder };
  }
  return { source: "fallback", data: null };
}
