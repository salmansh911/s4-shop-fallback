import { NextRequest, NextResponse } from "next/server";
import {
  getActiveCommerceProviderName,
  getOrderById,
  markOrderPaid,
} from "@/lib/commerce";
import {
  finalizeMedusaCheckoutAttemptById,
  getCheckoutAttemptByIdForRead,
  resolveMedusaOrderIdFromAttempt,
} from "@/lib/commerce/providers/medusa";
import { getAuthenticatedUserFromRequest } from "@/lib/supabase-server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const user = await getAuthenticatedUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const auth = { userId: user.id, email: user.email };
  const result = await getOrderById(id, auth);
  if (result.data) {
    return NextResponse.json(result);
  }

  if (getActiveCommerceProviderName() === "medusa") {
    const medusaOrderId = await resolveMedusaOrderIdFromAttempt(id);
    if (medusaOrderId) {
      const attemptOrder = await getOrderById(medusaOrderId, auth);
      if (attemptOrder.data) {
        return NextResponse.json(attemptOrder);
      }
    }
    const attempt = await getCheckoutAttemptByIdForRead(id);
    if (attempt && attempt.user_id === user.id) {
      return NextResponse.json(
        { error: "Order is still being finalized" },
        { status: 404 },
      );
    }
  }

  return NextResponse.json({ error: "Order not found" }, { status: 404 });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const user = await getAuthenticatedUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  const body = (await request.json()) as { markPaid?: boolean; sessionId?: string };
  const auth = { userId: user.id, email: user.email };

  if (body.markPaid) {
    let targetOrderId = id;
    if (getActiveCommerceProviderName() === "medusa") {
      const resolvedFromAttempt = await resolveMedusaOrderIdFromAttempt(id);
      if (resolvedFromAttempt) {
        targetOrderId = resolvedFromAttempt;
      } else {
        const attempt = await getCheckoutAttemptByIdForRead(id);
        if (attempt && attempt.user_id !== user.id) {
          return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }
        const finalized = await finalizeMedusaCheckoutAttemptById({
          attemptId: id,
          sessionId: body.sessionId,
        });
        if (finalized) {
          targetOrderId = finalized;
        }
      }
    }

    const result = await markOrderPaid(targetOrderId, auth, {
      provider: "stripe",
      sessionId: body.sessionId,
    });
    if (!result.data) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json(result);
  }

  const current = await getOrderById(id, auth);
  if (!current.data) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  return NextResponse.json(current);
}
