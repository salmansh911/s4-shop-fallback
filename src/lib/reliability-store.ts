import { getOptionalEnv, getRequiredEnv, isProductionRuntime } from "@/lib/env";

type Json = Record<string, unknown>;

function supabaseEnv() {
  const url = getOptionalEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key =
    getOptionalEnv("SUPABASE_SERVICE_ROLE_KEY") ||
    getOptionalEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (!url || !key) {
    if (isProductionRuntime()) {
      const required = !url ? "NEXT_PUBLIC_SUPABASE_URL" : "SUPABASE_SERVICE_ROLE_KEY";
      getRequiredEnv(required);
    }
    return null;
  }

  return { url, key };
}

async function restWrite(path: string, method: "POST" | "PATCH", body: unknown) {
  const env = supabaseEnv();
  if (!env) return null;

  const response = await fetch(`${env.url}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: env.key,
      Authorization: `Bearer ${env.key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase write failed (${response.status}): ${text}`);
  }

  return (await response.json()) as Json[];
}

async function restDelete(path: string) {
  const env = supabaseEnv();
  if (!env) return;

  const response = await fetch(`${env.url}/rest/v1/${path}`, {
    method: "DELETE",
    headers: {
      apikey: env.key,
      Authorization: `Bearer ${env.key}`,
      Prefer: "return=minimal",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase delete failed (${response.status}): ${text}`);
  }
}

async function restRead(path: string) {
  const env = supabaseEnv();
  if (!env) return null;

  const response = await fetch(`${env.url}/rest/v1/${path}`, {
    headers: {
      apikey: env.key,
      Authorization: `Bearer ${env.key}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase read failed (${response.status}): ${text}`);
  }

  return (await response.json()) as Json[];
}

export async function isStripeEventProcessed(eventId: string) {
  const rows = await restRead(
    `stripe_webhook_events?select=event_id&event_id=eq.${encodeURIComponent(eventId)}&limit=1`,
  );
  return Boolean(rows && rows.length > 0);
}

export async function recordStripeWebhookEvent(input: {
  eventId: string;
  eventType: string;
  status: "processed" | "ignored";
}) {
  try {
    await restWrite("stripe_webhook_events", "POST", [
      {
        event_id: input.eventId,
        event_type: input.eventType,
        status: input.status,
        processed_at: new Date().toISOString(),
      },
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    if (!message.includes("duplicate") && !message.includes("unique")) {
      throw error;
    }
  }
}

export async function claimOrderEmailSend(input: {
  orderId: string;
  emailType: "stripe_paid" | "cod_placed";
}) {
  try {
    await restWrite("order_email_events", "POST", [
      {
        order_id: input.orderId,
        email_type: input.emailType,
        sent_at: new Date().toISOString(),
      },
    ]);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    if (message.includes("duplicate") || message.includes("unique")) {
      return false;
    }
    throw error;
  }
}

export async function isOrderEmailSent(input: {
  orderId: string;
  emailType: "stripe_paid" | "cod_placed";
}) {
  const rows = await restRead(
    `order_email_events?select=order_id&order_id=eq.${encodeURIComponent(input.orderId)}&email_type=eq.${encodeURIComponent(input.emailType)}&limit=1`,
  );
  return Boolean(rows && rows.length > 0);
}

export async function markOrderEmailSendFailed(input: {
  orderId: string;
  emailType: "stripe_paid" | "cod_placed";
  errorMessage: string;
}) {
  await restWrite(
    `order_email_events?order_id=eq.${encodeURIComponent(input.orderId)}&email_type=eq.${encodeURIComponent(input.emailType)}`,
    "PATCH",
    {
      provider_message_id: null,
      last_error: input.errorMessage.slice(0, 700),
    },
  );
}

export async function clearOrderEmailFailure(input: {
  orderId: string;
  emailType: "stripe_paid" | "cod_placed";
}) {
  await restWrite(
    `order_email_events?order_id=eq.${encodeURIComponent(input.orderId)}&email_type=eq.${encodeURIComponent(input.emailType)}`,
    "PATCH",
    {
      last_error: null,
    },
  );
}

export async function releaseOrderEmailClaim(input: {
  orderId: string;
  emailType: "stripe_paid" | "cod_placed";
}) {
  await restDelete(
    `order_email_events?order_id=eq.${encodeURIComponent(input.orderId)}&email_type=eq.${encodeURIComponent(input.emailType)}&provider_message_id=is.null`,
  );
}

export async function markOrderEmailSentAt(input: {
  orderId: string;
  emailType: "stripe_paid" | "cod_placed";
}) {
  await restWrite(
    `order_email_events?order_id=eq.${encodeURIComponent(input.orderId)}&email_type=eq.${encodeURIComponent(input.emailType)}`,
    "PATCH",
    {
      sent_at: new Date().toISOString(),
    },
  );
}

export async function attachEmailProviderMessageId(input: {
  orderId: string;
  emailType: "stripe_paid" | "cod_placed";
  providerMessageId?: string;
}) {
  await restWrite(
    `order_email_events?order_id=eq.${encodeURIComponent(input.orderId)}&email_type=eq.${encodeURIComponent(input.emailType)}`,
    "PATCH",
    {
      provider_message_id: input.providerMessageId || null,
      last_error: null,
    },
  );
}

export async function upsertOrderEmailClaim(input: {
  orderId: string;
  emailType: "stripe_paid" | "cod_placed";
}) {
  try {
    await restWrite("order_email_events", "POST", [
      {
        order_id: input.orderId,
        email_type: input.emailType,
        sent_at: new Date().toISOString(),
      },
    ]);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    if (message.includes("duplicate") || message.includes("unique")) {
      return false;
    }
    return false;
  }
}

export async function recordMarketingLead(input: {
  email: string;
  source: string;
  notes?: string;
}) {
  await restWrite("marketing_leads", "POST", [
    {
      email: input.email,
      source: input.source,
      notes: input.notes || null,
      created_at: new Date().toISOString(),
    },
  ]);
}

export async function recordMarketingEvent(input: {
  eventName:
    | "product_view"
    | "add_to_cart"
    | "checkout_started"
    | "checkout_completed"
    | "cod_order_placed";
  userId?: string | null;
  orderId?: string;
  metadata?: Record<string, unknown>;
}) {
  await restWrite("marketing_events", "POST", [
    {
      event_name: input.eventName,
      user_id: input.userId || null,
      order_id: input.orderId || null,
      metadata: input.metadata || {},
      created_at: new Date().toISOString(),
    },
  ]);
}

export async function getTodayMarketingMetrics() {
  const now = new Date();
  const from = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0),
  ).toISOString();

  const rows = await restRead(
    `marketing_events?select=event_name&created_at=gte.${encodeURIComponent(from)}`,
  );

  const counts: Record<string, number> = {};
  for (const row of rows || []) {
    const eventName = String(row.event_name || "unknown");
    counts[eventName] = (counts[eventName] || 0) + 1;
  }

  return counts;
}
