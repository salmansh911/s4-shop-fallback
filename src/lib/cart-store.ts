"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { OrderItem, Product } from "./types";

export type CartItem = {
  product_id: string;
  name: string;
  unit: string;
  price: number;
  image_url: string;
  qty: number;
};

type CartState = {
  items: CartItem[];
  deliveryDate: string;
  addItem: (product: Product, qty?: number) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  replaceWithOrderItems: (items: OrderItem[]) => void;
  clearCart: () => void;
  setDeliveryDate: (date: string) => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      deliveryDate: "2026-02-27",
      addItem: (product, qty = 1) =>
        set((state) => {
          const existing = state.items.find((item) => item.product_id === product.id);
          if (existing) {
            return {
              items: state.items.map((item) =>
                item.product_id === product.id ? { ...item, qty: item.qty + qty } : item,
              ),
            };
          }

          return {
            items: [
              ...state.items,
              {
                product_id: product.id,
                name: product.name,
                unit: product.unit,
                price: product.price,
                image_url: product.image_url,
                qty,
              },
            ],
          };
        }),
      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((item) => item.product_id !== productId),
        })),
      updateQty: (productId, qty) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.product_id === productId ? { ...item, qty: Math.max(1, qty) } : item,
          ),
        })),
      replaceWithOrderItems: (items) =>
        set({
          items: items.map((item) => ({
            product_id: item.product_id,
            name: item.name,
            unit: "Pack",
            price: item.unit_price,
            image_url: "/s4-logo.svg",
            qty: item.qty,
          })),
        }),
      clearCart: () => set({ items: [] }),
      setDeliveryDate: (date) => set({ deliveryDate: date }),
    }),
    {
      name: "turnkey-cart-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items, deliveryDate: state.deliveryDate }),
    },
  ),
);

export function cartItemCount(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.qty, 0);
}

export function cartSubtotal(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.qty * item.price, 0);
}
