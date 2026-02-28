"use client";

import type { Product } from "@/lib/types";
import { useCartStore } from "@/lib/cart-store";
import { useToastStore } from "@/lib/toast-store";
import { trackMarketingEvent } from "@/lib/analytics/events";

type AddToCartButtonProps = {
  product: Product;
  qty?: number;
  className?: string;
  label?: string;
};

export default function AddToCartButton({
  product,
  qty = 1,
  className,
  label = "Add to cart",
}: AddToCartButtonProps) {
  const addItem = useCartStore((state) => state.addItem);
  const push = useToastStore((state) => state.push);

  return (
    <button
      className={className}
      onClick={() => {
        addItem(product, qty);
        push(`${product.name} added to cart`);
        void trackMarketingEvent("add_to_cart", {
          productId: product.id,
          productName: product.name,
          qty,
          unitPrice: product.price,
        });
      }}
    >
      {label}
    </button>
  );
}
