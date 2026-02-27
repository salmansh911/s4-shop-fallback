'use client';

import { ShoppingCart, Menu } from 'lucide-react';
import { useCartStore } from '../store/cart';
import { useState } from 'react';
import CartDrawer from './CartDrawer';
import Link from 'next/link';

export default function Header() {
    const totalItems = useCartStore((state) => state.totalItems());
    const [isCartOpen, setIsCartOpen] = useState(false);

    return (
        <>
            <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-16 items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Link href="/" className="flex items-center space-x-2">
                            <span className="font-bold text-xl tracking-tight">S4 Shop</span>
                        </Link>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsCartOpen(true)}
                            className="relative p-2 hover:bg-accent rounded-full transition-colors"
                        >
                            <ShoppingCart className="h-6 w-6" />
                            {totalItems > 0 && (
                                <span className="absolute top-0 right-0 h-5 w-5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
                                    {totalItems}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </header>
            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        </>
    );
}
