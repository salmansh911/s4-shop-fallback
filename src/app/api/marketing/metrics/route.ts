import { NextResponse } from "next/server";
import { getTodayMarketingMetrics } from "@/lib/reliability-store";

export async function GET() {
  try {
    const metrics = await getTodayMarketingMetrics();
    return NextResponse.json({ date: new Date().toISOString().slice(0, 10), metrics });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load metrics" },
      { status: 500 },
    );
  }
}
