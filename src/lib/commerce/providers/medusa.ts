import {
  getCheckoutAttemptById,
  markCheckoutAttemptFailed,
  markCheckoutAttemptPaid,
} from "@/lib/checkout-attempts";
import { mapMedusaOrderToOrder, mapMedusaProductToProduct } from "@/lib/commerce/mappers";
import type {
  CheckoutInput,
  CommerceProvider,
} from "@/lib/commerce/types";
import { buildOrderNumber } from "@/lib/commerce/types";
import { resolveMedusaCustomerId } from "@/lib/identity/customer-map";
import type { Order } from "@/lib/types";

function env() {
  return {
    baseUrl: process.env.MEDUSA_BACKEND_URL,
    adminApiKey: process.env.MEDUSA_ADMIN_API_KEY,
    adminAuthMode: (process.env.MEDUSA_ADMIN_AUTH_MODE || "auto").toLowerCase(),
    publishableKey: process.env.MEDUSA_PUBLISHABLE_KEY,
    regionId: process.env.MEDUSA_REGION_ID,
    salesChannelId: process.env.MEDUSA_SALES_CHANNEL_ID,
    countryCode: process.env.MEDUSA_DEFAULT_COUNTRY_CODE || "AE",
  };
}

async function medusaStoreRequest<T>(path: string): Promise<T | null> {
  const { baseUrl, publishableKey } = env();
  if (!baseUrl || !publishableKey) return null;

  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      "x-publishable-api-key": publishableKey,
    },
    cache: "no-store",
  });

  if (!response.ok) return null;
  return (await response.json()) as T;
}

async function medusaAdminRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T | null> {
  const { baseUrl, adminApiKey, adminAuthMode } = env();
  if (!baseUrl || !adminApiKey) return null;

  const method = init?.method ?? "GET";
  const body = init?.body;

  const makeInit = (
    authHeader: string,
    includeLegacyHeader: boolean,
  ): RequestInit => {
    const headers = new Headers(init?.headers);
    headers.set("Content-Type", "application/json");
    headers.set("Authorization", authHeader);
    if (includeLegacyHeader) {
      headers.set("x-medusa-access-token", adminApiKey);
    }

    const requestInit: RequestInit = {
      method,
      headers,
      cache: "no-store",
      signal: init?.signal,
      credentials: init?.credentials,
      mode: init?.mode,
      redirect: init?.redirect,
      referrer: init?.referrer,
      referrerPolicy: init?.referrerPolicy,
      integrity: init?.integrity,
      keepalive: init?.keepalive,
    };

    if (method !== "GET" && method !== "HEAD" && body !== undefined) {
      requestInit.body = body;
    }

    return requestInit;
  };

  const bearerInit = makeInit(`Bearer ${adminApiKey}`, true);
  const basicInit = makeInit(`Basic ${adminApiKey}`, false);

  const preferredInit =
    adminAuthMode === "basic"
      ? basicInit
      : adminAuthMode === "bearer"
        ? bearerInit
        : bearerInit;

  let response = await fetch(`${baseUrl}${path}`, preferredInit);

  if (
    adminAuthMode === "auto" &&
    (response.status === 401 || response.status === 403)
  ) {
    response = await fetch(`${baseUrl}${path}`, basicInit);
  }

  if (!response.ok) return null;
  return (await response.json()) as T;
}

function extractOrder(payload: Record<string, unknown>) {
  if (payload.order && typeof payload.order === "object") {
    return payload.order as Record<string, unknown>;
  }
  if (
    payload.data &&
    typeof payload.data === "object" &&
    (payload.data as Record<string, unknown>).order
  ) {
    return (payload.data as { order: Record<string, unknown> }).order;
  }
  return null;
}

function extractOrders(payload: Record<string, unknown>) {
  if (Array.isArray(payload.orders)) return payload.orders as Record<string, unknown>[];
  if (Array.isArray(payload.data)) return payload.data as Record<string, unknown>[];
  return [] as Record<string, unknown>[];
}

type CreateOrderPayload = {
  userId: string;
  customerId: string;
  orderNumber: string;
  paymentMethod: "stripe" | "cod";
  deliveryDate: string;
  specialInstructions: string;
  items: Array<{
    product_id: string;
    variant_id?: string;
    name: string;
    qty: number;
    price: number;
  }>;
  paid: boolean;
};

async function createMedusaOrderInternal(payload: CreateOrderPayload) {
  const { regionId, salesChannelId } = env();
  const lineItems = payload.items.map((item) => ({
    title: item.name,
    quantity: item.qty,
    variant_id: item.variant_id || item.product_id,
    unit_price: Math.round(item.price * 100),
  }));

  const metadata = {
    supabase_user_id: payload.userId,
    order_number: payload.orderNumber,
    delivery_date: payload.deliveryDate,
    special_instructions: payload.specialInstructions,
    payment_method: payload.paymentMethod,
    turnkey_status: payload.paid ? "confirmed" : "pending",
  };

  const directOrder =
    (await medusaAdminRequest<Record<string, unknown>>("/admin/orders", {
      method: "POST",
      body: JSON.stringify({
        customer_id: payload.customerId,
        region_id: regionId,
        sales_channel_id: salesChannelId,
        items: lineItems,
        metadata,
      }),
    })) ?? null;

  const directOrderData = directOrder ? extractOrder(directOrder) : null;
  if (directOrderData) return directOrderData;

  const draft =
    (await medusaAdminRequest<Record<string, unknown>>("/admin/draft-orders", {
      method: "POST",
      body: JSON.stringify({
        customer_id: payload.customerId,
        region_id: regionId,
        sales_channel_id: salesChannelId,
        items: lineItems,
        metadata,
      }),
    })) ?? null;

  if (!draft || !draft.draft_order || typeof draft.draft_order !== "object") {
    return null;
  }

  const draftOrder = draft.draft_order as Record<string, unknown>;
  const draftId = draftOrder.id ? String(draftOrder.id) : "";
  if (!draftId) return null;

  const completed =
    (await medusaAdminRequest<Record<string, unknown>>(
      `/admin/draft-orders/${draftId}/complete`,
      {
        method: "POST",
        body: JSON.stringify({}),
      },
    )) ?? null;

  if (!completed) return null;
  return extractOrder(completed);
}

async function getMedusaOrderById(orderId: string) {
  const payload =
    (await medusaAdminRequest<Record<string, unknown>>(`/admin/orders/${orderId}`)) ??
    null;
  if (!payload) return null;
  return extractOrder(payload);
}

export const medusaCommerceProvider: CommerceProvider = {
  async getProducts() {
    const payload =
      (await medusaStoreRequest<Record<string, unknown>>("/store/products?limit=100")) ??
      null;
    if (!payload) {
      return {
        source: "medusa",
        data: [],
        error: "MEDUSA_UNAVAILABLE",
      };
    }

    const products = Array.isArray(payload.products)
      ? (payload.products as Record<string, unknown>[])
      : Array.isArray(payload.data)
        ? (payload.data as Record<string, unknown>[])
        : [];

    return {
      source: "medusa",
      data: products.map(mapMedusaProductToProduct),
    };
  },

  async getMyOrders(auth) {
    const medusaCustomerId = await resolveMedusaCustomerId(auth);
    if (!medusaCustomerId) {
      return { source: "medusa", data: [], error: "UNAUTHORIZED" };
    }

    const payload =
      (await medusaAdminRequest<Record<string, unknown>>(
        `/admin/orders?customer_id=${encodeURIComponent(medusaCustomerId)}&limit=100`,
      )) ?? null;

    if (!payload) {
      return { source: "medusa", data: [], error: "MEDUSA_UNAVAILABLE" };
    }

    const orders = extractOrders(payload).map(mapMedusaOrderToOrder);
    return { source: "medusa", data: orders };
  },

  async getOrderById(orderId, auth) {
    const medusaCustomerId = await resolveMedusaCustomerId(auth);
    if (!medusaCustomerId) {
      return { source: "medusa", data: null, error: "UNAUTHORIZED" };
    }

    const order = await getMedusaOrderById(orderId);
    if (!order) {
      return { source: "medusa", data: null, error: "NOT_FOUND" };
    }

    const customerId = String(order.customer_id ?? "");
    const metadata = (order.metadata as Record<string, unknown> | undefined) ?? {};
    const supabaseUserId = String(metadata.supabase_user_id ?? "");
    if (customerId !== medusaCustomerId && supabaseUserId !== auth.userId) {
      return { source: "medusa", data: null, error: "NOT_FOUND" };
    }

    return {
      source: "medusa",
      data: mapMedusaOrderToOrder(order),
    };
  },

  async createCheckout(input: CheckoutInput) {
    if (input.paymentMethod !== "cod") {
      return {
        source: "medusa",
        data: null,
        error: "CHECKOUT_ERROR",
      };
    }

    const medusaCustomerId =
      input.medusaCustomerId || (await resolveMedusaCustomerId(input.auth));
    if (!medusaCustomerId) {
      return {
        source: "medusa",
        data: null,
        error: "UNAUTHORIZED",
      };
    }

    const orderNumber = input.orderNumber || buildOrderNumber();
    const order = await createMedusaOrderInternal({
      userId: input.auth.userId,
      customerId: medusaCustomerId,
      orderNumber,
      paymentMethod: input.paymentMethod,
      deliveryDate: input.deliveryDetails.deliveryDate,
      specialInstructions: `payment_method=${input.paymentMethod}; restaurant=${input.deliveryDetails.restaurantName}; address=${input.deliveryDetails.address}; contact=${input.deliveryDetails.contactName} ${input.deliveryDetails.contactPhone}`,
      items: input.items,
      paid: false,
    });

    if (!order?.id) {
      return {
        source: "medusa",
        data: null,
        error: "CHECKOUT_ERROR",
      };
    }

    return {
      source: "medusa",
      data: {
        orderId: String(order.id),
        orderNumber,
        status: "created",
        url: `${input.origin}/orders/${order.id}`,
      },
    };
  },

  async markOrderPaid(orderId, auth) {
    const order = await getMedusaOrderById(orderId);
    if (!order) {
      return { source: "medusa", data: null, error: "NOT_FOUND" };
    }

    if (auth.userId !== "system") {
      const customerId = String(order.customer_id ?? "");
      const metadata = (order.metadata as Record<string, unknown> | undefined) ?? {};
      const supabaseUserId = String(metadata.supabase_user_id ?? "");
      const medusaCustomerId = await resolveMedusaCustomerId(auth);
      if (
        (!medusaCustomerId || customerId !== medusaCustomerId) &&
        supabaseUserId !== auth.userId
      ) {
        return { source: "medusa", data: null, error: "NOT_FOUND" };
      }
    }

    await medusaAdminRequest<Record<string, unknown>>(
      `/admin/orders/${encodeURIComponent(orderId)}/capture`,
      {
        method: "POST",
        body: JSON.stringify({}),
      },
    );

    const updated = await getMedusaOrderById(orderId);
    if (!updated) {
      return { source: "medusa", data: null, error: "NOT_FOUND" };
    }

    return {
      source: "medusa",
      data: mapMedusaOrderToOrder(updated),
    };
  },
};

export async function finalizeMedusaCheckoutAttemptById(input: {
  attemptId: string;
  sessionId?: string;
}) {
  const attempt = await getCheckoutAttemptById(input.attemptId);
  if (!attempt) return null;
  if (attempt.medusa_order_id) {
    return attempt.medusa_order_id;
  }
  if (attempt.status === "failed") return null;

  const customerId =
    attempt.medusa_customer_id ||
    (await resolveMedusaCustomerId({
      userId: attempt.user_id,
      email: attempt.customer_email,
    }));
  if (!customerId) {
    await markCheckoutAttemptFailed(attempt.id);
    return null;
  }

  const order = await createMedusaOrderInternal({
    userId: attempt.user_id,
    customerId,
    orderNumber: attempt.order_number || buildOrderNumber(),
    paymentMethod: "stripe",
    deliveryDate: attempt.delivery_details.deliveryDate,
    specialInstructions: `payment_method=stripe; restaurant=${attempt.delivery_details.restaurantName}; address=${attempt.delivery_details.address}; contact=${attempt.delivery_details.contactName} ${attempt.delivery_details.contactPhone}`,
    items: attempt.items.map((item) => ({
      ...item,
      variant_id: item.variant_id || item.product_id,
    })),
    paid: true,
  });

  if (!order?.id) {
    await markCheckoutAttemptFailed(attempt.id);
    return null;
  }

  await markCheckoutAttemptPaid(attempt.id, {
    medusaOrderId: String(order.id),
    stripeSessionId: input.sessionId,
  });
  return String(order.id);
}

export async function resolveMedusaOrderIdFromAttempt(attemptId: string) {
  const attempt = await getCheckoutAttemptById(attemptId);
  return attempt?.medusa_order_id ?? null;
}

export async function getCheckoutAttemptByIdForRead(attemptId: string) {
  return getCheckoutAttemptById(attemptId);
}
