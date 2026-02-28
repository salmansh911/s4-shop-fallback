import { mockInsights } from "./mock-seed";
import { resolveProductImageUrl } from "./product-images";
import type { InsightCard, Order, Product } from "./types";
import { getOptionalEnv, getRequiredEnv, isProductionRuntime } from "@/lib/env";

type DataSource = "supabase" | "fallback";
type DataError = "SUPABASE_UNAVAILABLE";
type DataResult<T> = {
  source: DataSource;
  data: T;
  error?: DataError;
};

function env() {
  const serviceRoleKey = getOptionalEnv("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = getOptionalEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const url = getOptionalEnv("NEXT_PUBLIC_SUPABASE_URL");

  if (isProductionRuntime()) {
    if (!url) getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
    if (!serviceRoleKey && !anonKey) {
      getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
    }
  }

  return {
    url,
    key: serviceRoleKey || anonKey,
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

export async function getProducts(): Promise<DataResult<Product[]>> {
  const data = await request<Product[]>("products?select=*");
  if (data) {
    return {
      source: "supabase",
      data: data.map((product) => ({
        ...product,
        image_url: resolveProductImageUrl(product.name, product.image_url),
      })),
    };
  }
  return { source: "supabase", data: [], error: "SUPABASE_UNAVAILABLE" };
}

export async function getMyOrders(
  userId: string,
): Promise<DataResult<Order[]>> {
  const data = await request<Order[]>(
    `orders?select=*&user_id=eq.${encodeURIComponent(userId)}&order=created_at.desc`,
  );
  if (data) {
    return { source: "supabase", data };
  }
  return {
    source: "supabase",
    data: [],
    error: "SUPABASE_UNAVAILABLE",
  };
}

export async function getInsights(
  _userId: string,
): Promise<DataResult<InsightCard[]>> {
  const data = await request<InsightCard[]>("ai_suggestions?select=*");
  if (data) {
    return { source: "supabase", data };
  }
  return { source: "fallback", data: mockInsights };
}

type UpsertUserInput = {
  id: string;
  restaurant_name: string;
  email: string;
  phone?: string;
  delivery_address?: Record<string, string>;
  medusa_customer_id?: string;
};

export async function upsertCustomerUser(
  payload: UpsertUserInput,
): Promise<DataResult<{ id: string } | null>> {
  const body = [
    {
      id: payload.id,
      role: "customer",
      restaurant_name: payload.restaurant_name || "Restaurant Account",
      email: payload.email,
      phone: payload.phone ?? null,
      delivery_address: payload.delivery_address ?? null,
      medusa_customer_id: payload.medusa_customer_id ?? null,
    },
  ];

  const data = await requestWrite<Array<{ id: string }>>(
    "users?on_conflict=id",
    "POST",
    body,
  );
  if (data && data.length > 0) {
    return { source: "supabase", data: data[0] };
  }

  return { source: "supabase", data: null, error: "SUPABASE_UNAVAILABLE" };
}

type CreateOrderInput = {
  id: string;
  order_number: string;
  user_id: string;
  items: Order["items"];
  total_amount: number;
  deposit_amount: number;
  delivery_date: string;
  status?: Order["status"];
  deposit_paid?: boolean;
  special_instructions?: string;
};

export async function createOrder(
  payload: CreateOrderInput,
): Promise<DataResult<Order | null>> {
  const body = [
    {
      ...payload,
      status: payload.status ?? "pending",
      deposit_paid: payload.deposit_paid ?? false,
    },
  ];

  const data = await requestWrite<Order[]>("orders", "POST", body);
  if (data && data.length > 0) {
    return { source: "supabase", data: data[0] };
  }

  return { source: "supabase", data: null, error: "SUPABASE_UNAVAILABLE" };
}

export async function getOrderById(
  orderId: string,
): Promise<DataResult<Order | null>> {
  const data = await request<Order[]>(
    `orders?select=*&id=eq.${encodeURIComponent(orderId)}&limit=1`,
  );
  if (data) {
    return { source: "supabase", data: data[0] ?? null };
  }
  return { source: "supabase", data: null, error: "SUPABASE_UNAVAILABLE" };
}

export async function markOrderPaid(
  orderId: string,
): Promise<DataResult<Order | null>> {
  const data = await requestWrite<Order[]>(
    `orders?id=eq.${encodeURIComponent(orderId)}`,
    "PATCH",
    { deposit_paid: true, status: "confirmed" },
  );
  if (data) {
    return { source: "supabase", data: data[0] ?? null };
  }
  return { source: "supabase", data: null, error: "SUPABASE_UNAVAILABLE" };
}
