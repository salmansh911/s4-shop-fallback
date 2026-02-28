import { NextRequest, NextResponse } from "next/server";
import { recordMarketingEvent } from "@/lib/reliability-store";
import { getAuthenticatedUserFromRequest } from "@/lib/supabase-server";

type EventBody = {
  eventName:
    | "product_view"
    | "add_to_cart"
    | "checkout_started"
    | "checkout_completed"
    | "cod_order_placed";
  orderId?: string;
  metadata?: Record<string, unknown>;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as EventBody;
    if (!body.eventName) {
      return NextResponse.json({ error: "eventName is required" }, { status: 400 });
    }

    const user = await getAuthenticatedUserFromRequest(request);

    await recordMarketingEvent({
      eventName: body.eventName,
      userId: user?.id ?? null,
      orderId: body.orderId,
      metadata: body.metadata || {},
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to record event" },
      { status: 500 },
    );
  }
}
