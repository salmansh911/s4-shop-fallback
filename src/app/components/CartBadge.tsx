"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { cartItemCount, useCartStore } from "@/lib/cart-store";

export default function CartBadge() {
  const count = useCartStore((state) => cartItemCount(state.items));

  return (
    <Link
      href="/cart"
      className="btn-ghost gap-2"
    >
      <ShoppingCart size={15} />
      Cart
      <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-white">
        {count}
      </span>
    </Link>
  );
}
