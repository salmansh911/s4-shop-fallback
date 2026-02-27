import {
  createOrder,
  getMyOrders,
  getOrderById,
  getProducts,
  markOrderPaid as markSupabaseOrderPaid,
  upsertCustomerUser,
} from "@/lib/supabase-rest";
import type { CommerceProvider } from "@/lib/commerce/types";
import { buildOrderNumber } from "@/lib/commerce/types";

export const supabaseCommerceProvider: CommerceProvider = {
  getProducts() {
    return getProducts();
  },

  getMyOrders(auth) {
    return getMyOrders(auth.userId);
  },

  async getOrderById(orderId, auth) {
    const result = await getOrderById(orderId);
    if (!result.data || result.data.user_id !== auth.userId) {
      return {
        source: result.source,
        data: null,
        error: "NOT_FOUND",
      };
    }
    return result;
  },

  async createCheckout(input) {
    const computedSubtotal = input.items.reduce(
      (sum, item) => sum + item.qty * item.price,
      0,
    );
    if (Math.abs(computedSubtotal - Math.round(input.subtotal || 0)) > 0) {
      return {
        source: "supabase",
        data: null,
        error: "CHECKOUT_ERROR",
      };
    }

    await upsertCustomerUser({
      id: input.auth.userId,
      restaurant_name: input.deliveryDetails.restaurantName || "Restaurant Account",
      email: input.auth.email || input.deliveryDetails.email,
      phone: input.deliveryDetails.contactPhone,
      delivery_address: {
        address: input.deliveryDetails.address,
        delivery_date: input.deliveryDetails.deliveryDate,
      },
    });

    const orderId = crypto.randomUUID();
    const orderNumber = input.orderNumber || buildOrderNumber();
    const orderItems = input.items.map((item) => ({
      product_id: item.product_id,
      name: item.name,
      qty: item.qty,
      unit_price: item.price,
    }));

    const paidNow = input.paymentMethod === "stripe" ? computedSubtotal : 0;

    const result = await createOrder({
      id: orderId,
      order_number: orderNumber,
      user_id: input.auth.userId,
      items: orderItems,
      total_amount: computedSubtotal,
      deposit_amount: paidNow,
      delivery_date: input.deliveryDetails.deliveryDate,
      status: "pending",
      deposit_paid: false,
      special_instructions: `payment_method=${input.paymentMethod}; restaurant=${input.deliveryDetails.restaurantName}; address=${input.deliveryDetails.address}; contact=${input.deliveryDetails.contactName} ${input.deliveryDetails.contactPhone}`,
    });

    if (!result.data) {
      return {
        source: "supabase",
        data: null,
        error: "CHECKOUT_ERROR",
      };
    }

    return {
      source: "supabase",
      data: {
        orderId,
        orderNumber,
        status: input.paymentMethod === "cod" ? "created" : "pending_payment",
        url:
          input.paymentMethod === "cod"
            ? `${input.origin}/orders/${orderId}`
            : undefined,
      },
    };
  },

  markOrderPaid(orderId, auth) {
    return markSupabaseOrderPaid(orderId).then((result) => {
      if (!result.data) {
        return {
          source: result.source,
          data: null,
          error: "NOT_FOUND",
        };
      }
      if (auth.userId !== "system" && result.data.user_id !== auth.userId) {
        return {
          source: result.source,
          data: null,
          error: "NOT_FOUND",
        };
      }
      return result;
    });
  },
};
