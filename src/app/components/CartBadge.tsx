"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { cartItemCount, useCartStore } from "@/lib/cart-store";

export default function CartBadge() {
  const count = useCartStore((state) => cartItemCount(state.items));

  return (
    <Link
      href="/cart"
      className="btn-ghost gap-2 px-3 py-2 text-xs sm:px-4 sm:py-2 sm:text-sm"
    >
      <ShoppingCart size={15} />
      Cart
      <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-white">
        {count}
      </span>
    </Link>
  );
}
