'use client';

import Image from 'next/image';
import { Product } from '../data/products';
import { useCartStore } from '../store/cart';
import { Plus } from 'lucide-react';

interface ProductCardProps {
    product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
    const addItem = useCartStore((state) => state.addItem);

    return (
        <div className="bg-card text-card-foreground rounded-lg border shadow-sm overflow-hidden flex flex-col">
            <div className="relative h-48 w-full bg-muted">
                {/* Placeholder for real image, using a colored div if image fails to load or for now */}
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground bg-gray-100">
                    {product.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={product.image} alt={product.name} className="object-cover w-full h-full" />
                    ) : (
                        <span>No Image</span>
                    )}
                </div>
            </div>
            <div className="p-4 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h3 className="font-semibold text-lg leading-none tracking-tight">{product.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{product.category}</p>
                    </div>
                    <span className="font-bold text-primary">
                        AED {product.price}
                        <span className="text-xs font-normal text-muted-foreground">/{product.unit}</span>
                    </span>
                </div>
                <p className="text-sm text-muted-foreground mb-4 flex-grow">{product.description}</p>
                <button
                    onClick={() => addItem(product)}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md flex items-center justify-center gap-2 transition-colors"
                >
                    <Plus className="h-4 w-4" /> Add to Order
                </button>
            </div>
        </div>
    );
}
