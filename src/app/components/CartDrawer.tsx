'use client';

import { X, ShoppingCart, Trash2, MessageCircle } from 'lucide-react';
import { useCartStore } from '../store/cart';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils'; // We need to create this utility or just use clsx directly

// Simple utility for class merging if not present
function classNames(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(' ');
}

interface CartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
    const { items, removeItem, updateQuantity, totalPrice } = useCartStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const handleWhatsAppOrder = () => {
        const phoneNumber = '971589615504'; // S4 Trading Number

        let message = `*New Order Request from Shop*\n\n`;
        items.forEach((item) => {
            message += `- ${item.name} (${item.quantity} ${item.unit}) - AED ${item.price * item.quantity}\n`;
        });
        message += `\n*Total Estimated: AED ${totalPrice()}*\n\n`;
        message += `Please confirm availability and delivery time.`;

        const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 transition-opacity"
                    onClick={onClose}
                />
            )}

            {/* Drawer */}
            <div className={classNames(
                "fixed inset-y-0 right-0 z-50 w-full sm:w-[400px] bg-background shadow-xl transform transition-transform duration-300 ease-in-out",
                isOpen ? "translate-x-0" : "translate-x-full"
            )}>
                <div className="flex flex-col h-full">
                    <div className="p-4 border-b flex justify-between items-center">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <ShoppingCart className="h-5 w-5" /> Your Order
                        </h2>
                        <button onClick={onClose} className="p-2 hover:bg-muted rounded-full">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {items.length === 0 ? (
                            <div className="text-center text-muted-foreground py-10">
                                Your cart is empty.
                            </div>
                        ) : (
                            items.map((item) => (
                                <div key={item.id} className="flex gap-4 border-b pb-4">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={item.image} alt={item.name} className="h-20 w-20 object-cover rounded-md bg-muted" />
                                    <div className="flex-1">
                                        <h3 className="font-medium text-sm">{item.name}</h3>
                                        <p className="text-sm text-muted-foreground">AED {item.price} / {item.unit}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                className="w-8 h-8 flex items-center justify-center border rounded-md hover:bg-muted"
                                            >
                                                -
                                            </button>
                                            <span className="w-8 text-center text-sm">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                className="w-8 h-8 flex items-center justify-center border rounded-md hover:bg-muted"
                                            >
                                                +
                                            </button>
                                            <button
                                                onClick={() => removeItem(item.id)}
                                                className="ml-auto text-destructive hover:text-destructive/80"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-4 border-t bg-muted/20">
                        <div className="flex justify-between items-center mb-4">
                            <span className="font-semibold">Total Estimated</span>
                            <span className="font-bold text-xl text-primary">AED {totalPrice()}</span>
                        </div>
                        <button
                            onClick={handleWhatsAppOrder}
                            disabled={items.length === 0}
                            className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-bold py-3 px-4 rounded-md flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <MessageCircle className="h-5 w-5" />
                            Order via WhatsApp
                        </button>
                        <p className="text-xs text-center text-muted-foreground mt-2">
                            No payment required now. Pay on delivery.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
