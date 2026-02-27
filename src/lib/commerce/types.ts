import type { Order, Product } from "@/lib/types";

export type DataSource = "supabase" | "fallback" | "medusa";

export type DataError =
  | "SUPABASE_UNAVAILABLE"
  | "MEDUSA_UNAVAILABLE"
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "CHECKOUT_ERROR";

export type DataResult<T> = {
  source: DataSource;
  data: T;
  error?: DataError | string;
};

export type AuthContext = {
  userId: string;
  email?: string | null;
};

export type CheckoutItemInput = {
  product_id: string;
  name: string;
  qty: number;
  price: number;
  variant_id?: string;
};

export type DeliveryDetailsInput = {
  restaurantName: string;
  address: string;
  contactName: string;
  contactPhone: string;
  email: string;
  deliveryDate: string;
};

export type CheckoutInput = {
  auth: AuthContext;
  items: CheckoutItemInput[];
  subtotal: number;
  paymentMethod: "stripe" | "cod";
  deliveryDetails: DeliveryDetailsInput;
  origin: string;
  orderNumber?: string;
  attemptId?: string;
  medusaCustomerId?: string;
};

export type CheckoutResult = {
  orderId: string;
  orderNumber: string;
  status: "created" | "pending_payment";
  url?: string;
};

export type PaymentContext = {
  provider: "stripe" | "manual";
  attemptId?: string;
  sessionId?: string;
};

export interface CommerceProvider {
  getProducts(): Promise<DataResult<Product[]>>;
  getMyOrders(auth: AuthContext): Promise<DataResult<Order[]>>;
  getOrderById(orderId: string, auth: AuthContext): Promise<DataResult<Order | null>>;
  createCheckout(input: CheckoutInput): Promise<DataResult<CheckoutResult | null>>;
  markOrderPaid(
    orderId: string,
    auth: AuthContext,
    payment?: PaymentContext,
  ): Promise<DataResult<Order | null>>;
}

export function buildOrderNumber(now = new Date()) {
  const y = now.getUTCFullYear();
  const m = `${now.getUTCMonth() + 1}`.padStart(2, "0");
  const d = `${now.getUTCDate()}`.padStart(2, "0");
  const random = `${Math.floor(Math.random() * 9000) + 1000}`;
  return `RAM-${y}${m}${d}-${random}`;
}
