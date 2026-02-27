import { medusaCommerceProvider } from "@/lib/commerce/providers/medusa";
import { supabaseCommerceProvider } from "@/lib/commerce/providers/supabase";
import type {
  AuthContext,
  CheckoutInput,
  PaymentContext,
} from "@/lib/commerce/types";

export function getActiveCommerceProviderName() {
  const provider = (process.env.COMMERCE_PROVIDER || "supabase").toLowerCase();
  return provider === "medusa" ? "medusa" : "supabase";
}

export function getCommerceProvider() {
  return getActiveCommerceProviderName() === "medusa"
    ? medusaCommerceProvider
    : supabaseCommerceProvider;
}

export async function getProducts() {
  return getCommerceProvider().getProducts();
}

export async function getMyOrders(auth: AuthContext) {
  return getCommerceProvider().getMyOrders(auth);
}

export async function getOrderById(orderId: string, auth: AuthContext) {
  return getCommerceProvider().getOrderById(orderId, auth);
}

export async function createCheckout(input: CheckoutInput) {
  return getCommerceProvider().createCheckout(input);
}

export async function markOrderPaid(
  orderId: string,
  auth: AuthContext,
  payment?: PaymentContext,
) {
  return getCommerceProvider().markOrderPaid(orderId, auth, payment);
}
