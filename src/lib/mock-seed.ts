import type { InsightCard, Order, Product } from "./types";

export const mockProducts: Product[] = [
  {
    id: "a30b8398-8f52-4f89-b3fa-0d89cd5fcb10",
    name: "Japanese Milk Bread (Shokupan)",
    category: "japanese",
    price: 45,
    unit: "6 loaves per pack",
    description:
      "Authentic Japanese milk bread with pillowy texture. Flash-frozen for freshness.",
    image_url:
      "https://images.unsplash.com/photo-1608198093002-ad4e005484ec?auto=format&fit=crop&w=1200&q=80",
    certifications: ["Imported", "Halal", "Cold Chain"],
    stock_level: 180,
    stock_status: "In Stock",
  },
  {
    id: "bfc29fb7-a28a-4858-af50-8f21b213f510",
    name: "Ultra-Coarse Panko",
    category: "japanese",
    price: 32,
    unit: "2kg bag",
    description: "Extra-crispy breadcrumb for premium fried texture.",
    image_url:
      "https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=1200&q=80",
    certifications: ["Imported", "Halal"],
    stock_level: 64,
    stock_status: "Low Stock",
    ai_note: "You usually reorder every 14 days",
  },
  {
    id: "93f96cc8-5e08-44a3-b2fe-8bbf7e53f8f0",
    name: "Premium Ramadan Dates",
    category: "ramadan",
    price: 85,
    unit: "1 box",
    description: "Jumbo medjool dates curated for Ramadan menus and gifting.",
    image_url:
      "https://images.unsplash.com/photo-1615485925600-97237c4fc1ec?auto=format&fit=crop&w=1200&q=80",
    certifications: ["Halal", "Premium Grade"],
    stock_level: 240,
    stock_status: "In Stock",
  },
];

export const mockOrders: Order[] = [
  {
    id: "d67fbfc2-f4c9-4565-a4d8-cd977a4f89ce",
    order_number: "RAM-2026-0147",
    user_id: "demo-customer-001",
    status: "confirmed",
    delivery_date: "2026-02-27",
    total_amount: 1248,
    deposit_amount: 624,
    deposit_paid: true,
    items: [
      {
        product_id: "a30b8398-8f52-4f89-b3fa-0d89cd5fcb10",
        name: "Japanese Milk Bread (Shokupan)",
        qty: 6,
        unit_price: 45,
      },
      {
        product_id: "bfc29fb7-a28a-4858-af50-8f21b213f510",
        name: "Ultra-Coarse Panko",
        qty: 4,
        unit_price: 32,
      },
      {
        product_id: "93f96cc8-5e08-44a3-b2fe-8bbf7e53f8f0",
        name: "Premium Ramadan Dates",
        qty: 10,
        unit_price: 85,
      },
    ],
  },
];

export const mockInsights: InsightCard[] = [
  {
    id: "ins-1",
    title: "Time to Reorder",
    message: "Panko is projected to run out in 3 days based on your usage.",
    action: "Quick Order AED 128",
  },
  {
    id: "ins-2",
    title: "Bundle Opportunity",
    message: "Add Yuzu Juice. 72% of similar restaurants order both.",
    action: "Add Bundle",
  },
  {
    id: "ins-3",
    title: "Container Share",
    message: "Tokyo container is 67% full. Join now to lock 25% savings.",
    action: "View Container",
  },
];
