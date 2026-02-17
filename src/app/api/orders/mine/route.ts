import { NextRequest, NextResponse } from "next/server";
import { getMyOrders } from "@/lib/supabase-rest";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId") ?? "demo-customer-001";
  const result = await getMyOrders(userId);
  return NextResponse.json(result);
}
