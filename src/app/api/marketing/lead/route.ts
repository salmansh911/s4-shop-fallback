import { NextRequest, NextResponse } from "next/server";
import { recordMarketingLead } from "@/lib/reliability-store";

type LeadBody = {
  email: string;
  source?: string;
  notes?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as LeadBody;
    const email = body.email?.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    await recordMarketingLead({
      email,
      source: body.source || "site-footer",
      notes: body.notes,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to save lead" },
      { status: 500 },
    );
  }
}
