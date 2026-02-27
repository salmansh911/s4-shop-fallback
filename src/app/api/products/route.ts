import { NextResponse } from "next/server";
import { getProducts } from "@/lib/commerce";

export async function GET() {
  const result = await getProducts();
  return NextResponse.json(result);
}
