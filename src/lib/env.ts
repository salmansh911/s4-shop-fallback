export function isProductionRuntime() {
  return process.env.NODE_ENV === "production";
}

export function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (value) return value;
  if (isProductionRuntime()) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return "";
}

export function getOptionalEnv(name: string) {
  return process.env[name]?.trim() || "";
}

export function getCommerceProviderName() {
  const provider = (process.env.COMMERCE_PROVIDER || "supabase").toLowerCase();
  return provider === "medusa" ? "medusa" : "supabase";
}
