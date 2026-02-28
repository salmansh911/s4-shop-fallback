import { NextResponse } from "next/server";
import { getCommerceProviderName } from "@/lib/env";

function has(name: string) {
  return Boolean(process.env[name]?.trim());
}

export async function GET() {
  return NextResponse.json({
    provider: getCommerceProviderName(),
    runtime: process.version,
    env: process.env.NODE_ENV,
    checks: {
      supabaseUrl: has("NEXT_PUBLIC_SUPABASE_URL"),
      supabaseServiceRole: has("SUPABASE_SERVICE_ROLE_KEY"),
      stripeSecret: has("STRIPE_SECRET_KEY"),
      stripeWebhookSecret: has("STRIPE_WEBHOOK_SECRET"),
      medusaBackendUrl: has("MEDUSA_BACKEND_URL"),
      medusaAdminApiKey: has("MEDUSA_ADMIN_API_KEY"),
      medusaPublishableKey: has("MEDUSA_PUBLISHABLE_KEY"),
      emailProvider: has("EMAIL_PROVIDER"),
      emailApiKey: has("EMAIL_API_KEY"),
      emailFrom: has("EMAIL_FROM"),
    },
  });
}
