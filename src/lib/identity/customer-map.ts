import type { AuthContext } from "@/lib/commerce/types";

type SupabaseUserRow = {
  id: string;
  email: string | null;
  restaurant_name: string | null;
  phone: string | null;
  delivery_address: Record<string, unknown> | null;
  medusa_customer_id: string | null;
};

function supabaseEnv() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: serviceRoleKey || anonKey,
  };
}

function medusaEnv() {
  return {
    baseUrl: process.env.MEDUSA_BACKEND_URL,
    adminKey: process.env.MEDUSA_ADMIN_API_KEY,
  };
}

async function supabaseRequest<T>(path: string): Promise<T | null> {
  const { url, key } = supabaseEnv();
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

async function supabasePatch<T>(path: string, body: unknown): Promise<T | null> {
  const { url, key } = supabaseEnv();
  if (!url || !key) return null;

  const response = await fetch(`${url}/rest/v1/${path}`, {
    method: "PATCH",
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

async function medusaAdminRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T | null> {
  const { baseUrl, adminKey } = medusaEnv();
  if (!baseUrl || !adminKey) return null;

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-medusa-access-token": adminKey,
      Authorization: `Bearer ${adminKey}`,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) return null;
  return (await response.json()) as T;
}

export async function getSupabaseUser(userId: string) {
  const rows = await supabaseRequest<SupabaseUserRow[]>(
    `users?select=id,email,restaurant_name,phone,delivery_address,medusa_customer_id&id=eq.${encodeURIComponent(userId)}&limit=1`,
  );
  return rows?.[0] ?? null;
}

export async function persistMedusaCustomerId(
  userId: string,
  medusaCustomerId: string,
) {
  await supabasePatch<SupabaseUserRow[]>(
    `users?id=eq.${encodeURIComponent(userId)}`,
    {
      medusa_customer_id: medusaCustomerId,
    },
  );
}

type MedusaCustomer = {
  id: string;
  email?: string;
};

function extractCustomers(payload: Record<string, unknown>): MedusaCustomer[] {
  const customers = payload.customers;
  if (Array.isArray(customers)) {
    return customers as MedusaCustomer[];
  }
  const data = payload.data;
  if (Array.isArray(data)) {
    return data as MedusaCustomer[];
  }
  return [];
}

function extractCreatedCustomer(payload: Record<string, unknown>): MedusaCustomer | null {
  if (payload.customer && typeof payload.customer === "object") {
    return payload.customer as MedusaCustomer;
  }
  const customers = extractCustomers(payload);
  return customers[0] ?? null;
}

async function findMedusaCustomerByEmail(email: string) {
  const query = encodeURIComponent(email);
  const payload =
    (await medusaAdminRequest<Record<string, unknown>>(
      `/admin/customers?email=${query}&limit=1`,
    )) ?? null;
  if (!payload) return null;
  const list = extractCustomers(payload);
  return list[0] ?? null;
}

async function createMedusaCustomer(input: {
  email: string;
  restaurantName?: string | null;
  phone?: string | null;
  supabaseUserId: string;
}) {
  const payload =
    (await medusaAdminRequest<Record<string, unknown>>("/admin/customers", {
      method: "POST",
      body: JSON.stringify({
        email: input.email,
        first_name: input.restaurantName || "S4",
        last_name: "Customer",
        phone: input.phone ?? undefined,
        metadata: {
          supabase_user_id: input.supabaseUserId,
          restaurant_name: input.restaurantName ?? "",
        },
      }),
    })) ?? null;
  if (!payload) return null;
  return extractCreatedCustomer(payload);
}

export async function resolveMedusaCustomerId(auth: AuthContext) {
  const user = await getSupabaseUser(auth.userId);
  const email = auth.email || user?.email;
  if (!email) return null;

  if (user?.medusa_customer_id) {
    return user.medusa_customer_id;
  }

  const existing = await findMedusaCustomerByEmail(email);
  if (existing?.id) {
    await persistMedusaCustomerId(auth.userId, existing.id);
    return existing.id;
  }

  const created = await createMedusaCustomer({
    email,
    restaurantName: user?.restaurant_name,
    phone: user?.phone,
    supabaseUserId: auth.userId,
  });

  if (!created?.id) {
    return null;
  }

  await persistMedusaCustomerId(auth.userId, created.id);
  return created.id;
}
