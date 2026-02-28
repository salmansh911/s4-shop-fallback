import { getOptionalEnv } from "@/lib/env";

export type MarketingEventName =
  | "product_view"
  | "add_to_cart"
  | "checkout_started"
  | "checkout_completed"
  | "cod_order_placed";

export async function trackMarketingEvent(
  eventName: MarketingEventName,
  payload?: Record<string, unknown>,
) {
  if (typeof window === "undefined") return;
  const enabled = (getOptionalEnv("NEXT_PUBLIC_ANALYTICS_ENABLED") || "true") !== "false";
  if (!enabled) return;

  try {
    await fetch("/api/marketing/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventName, metadata: payload || {} }),
      keepalive: true,
    });
  } catch {
    // Non-blocking telemetry.
  }
}
