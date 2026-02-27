import { NextRequest, NextResponse } from "next/server";
import { getMyOrders } from "@/lib/commerce";
import { getAuthenticatedUserFromRequest } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  const result = await getMyOrders({
    userId: user.id,
    email: user.email,
  });
  return NextResponse.json(result);
}
