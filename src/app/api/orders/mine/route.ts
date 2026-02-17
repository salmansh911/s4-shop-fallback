import { NextRequest, NextResponse } from "next/server";
import { getMyOrders } from "@/lib/supabase-rest";

export async function GET(request: NextRequest) {
  const userId =
    request.nextUrl.searchParams.get("userId") ??
    process.env.DEMO_CUSTOMER_ID ??
    "e6a118e9-47f2-44d2-92f4-8e832f2cb10a";
  const result = await getMyOrders(userId);
  return NextResponse.json(result);
}
