import { NextResponse } from "next/server";
import { getProducts } from "@/lib/supabase-rest";

export async function GET() {
  const result = await getProducts();
  return NextResponse.json(result);
}
