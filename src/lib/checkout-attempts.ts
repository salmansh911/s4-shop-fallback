import type {
  CheckoutItemInput,
  DeliveryDetailsInput,
} from "@/lib/commerce/types";
import { getOptionalEnv, getRequiredEnv, isProductionRuntime } from "@/lib/env";

export type CheckoutAttempt = {
  id: string;
  user_id: string;
  medusa_customer_id?: string | null;
  order_number: string;
  payment_method: "stripe" | "cod";
  status: "pending_payment" | "paid" | "failed";
  items: CheckoutItemInput[];
  subtotal: number;
  customer_email: string;
  delivery_details: DeliveryDetailsInput;
  medusa_order_id?: string | null;
  stripe_session_id?: string | null;
};

function env() {
  const serviceRoleKey = getOptionalEnv("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = getOptionalEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const url = getOptionalEnv("NEXT_PUBLIC_SUPABASE_URL");
  if (isProductionRuntime()) {
    if (!url) getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
    if (!serviceRoleKey && !anonKey) getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  }
  return {
    url,
    key: serviceRoleKey || anonKey,
  };
}

async function request<T>(path: string): Promise<T | null> {
  const { url, key } = env();
  if (!url || !key) return null;

  const response = await fetch(`${url}/rest/v1/${path}`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
    cache: "no-store",
  });

  if (!response.ok) return null;
  return (await response.json()) as T;
}

async function requestWrite<T>(
  path: string,
  method: "POST" | "PATCH",
  body: unknown,
) {
  const { url, key } = env();
  if (!url || !key) return null;

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

  if (!response.ok) return null;
  return (await response.json()) as T;
}

type CreateAttemptInput = {
  userId: string;
  medusaCustomerId?: string | null;
  orderNumber: string;
  paymentMethod: "stripe" | "cod";
  items: CheckoutItemInput[];
  subtotal: number;
  customerEmail: string;
  deliveryDetails: DeliveryDetailsInput;
};

export async function createCheckoutAttempt(
  input: CreateAttemptInput,
): Promise<CheckoutAttempt | null> {
  const data = await requestWrite<CheckoutAttempt[]>("checkout_attempts", "POST", [
    {
      user_id: input.userId,
      medusa_customer_id: input.medusaCustomerId ?? null,
      order_number: input.orderNumber,
      payment_method: input.paymentMethod,
      status: "pending_payment",
      items: input.items,
      subtotal: input.subtotal,
      customer_email: input.customerEmail,
      delivery_details: input.deliveryDetails,
    },
  ]);
  return data?.[0] ?? null;
}

export async function getCheckoutAttemptById(attemptId: string) {
  const rows = await request<CheckoutAttempt[]>(
    `checkout_attempts?select=*&id=eq.${encodeURIComponent(attemptId)}&limit=1`,
  );
  return rows?.[0] ?? null;
}

export async function markCheckoutAttemptPaid(
  attemptId: string,
  payload: { medusaOrderId: string; stripeSessionId?: string },
) {
  const existing = await getCheckoutAttemptById(attemptId);
  if (!existing) return null;
  if (existing.status === "paid" && existing.medusa_order_id) {
    return existing;
  }
  if (existing.status === "failed") return null;

  const rows = await requestWrite<CheckoutAttempt[]>(
    `checkout_attempts?id=eq.${encodeURIComponent(attemptId)}`,
    "PATCH",
    {
      status: "paid",
      medusa_order_id: payload.medusaOrderId,
      stripe_session_id: payload.stripeSessionId ?? null,
      updated_at: new Date().toISOString(),
    },
  );
  return rows?.[0] ?? null;
}

export async function markCheckoutAttemptFailed(attemptId: string) {
  const existing = await getCheckoutAttemptById(attemptId);
  if (!existing) return null;
  if (existing.status === "paid") return existing;

  const rows = await requestWrite<CheckoutAttempt[]>(
    `checkout_attempts?id=eq.${encodeURIComponent(attemptId)}`,
    "PATCH",
    {
      status: "failed",
      updated_at: new Date().toISOString(),
    },
  );
  return rows?.[0] ?? null;
}
