export type Product = {
  id: string;
  name: string;
  unit: string;
  price: number;
  badges: string[];
  note?: string;
  stock: "In Stock" | "Low Stock" | "Pre-order";
};

export const products: Product[] = [
  {
    id: "shokupan",
    name: "Japanese Milk Bread (Shokupan)",
    unit: "6 loaves per pack",
    price: 45,
    badges: ["Imported", "Halal"],
    stock: "In Stock",
  },
  {
    id: "panko",
    name: "Ultra-Coarse Panko",
    unit: "2kg bag",
    price: 32,
    badges: ["Imported", "Halal"],
    note: "You order this bi-weekly",
    stock: "In Stock",
  },
  {
    id: "dates",
    name: "Premium Dates",
    unit: "1 box",
    price: 85,
    badges: ["Ramadan Essential", "Halal"],
    stock: "Low Stock",
  },
];

export const orderSummary = {
  orderNumber: "RAM-2026-0147",
  total: 1248,
  deposit: 624,
  deliveryDate: "Feb 27, 2026",
  items: [
    { name: "Shokupan", qty: 6, lineTotal: 270 },
    { name: "Panko", qty: 4, lineTotal: 128 },
    { name: "Premium Dates", qty: 10, lineTotal: 850 },
  ],
};

export const suggestions = [
  {
    title: "Time to Reorder",
    body: "Panko Breadcrumbs - every 14 days, last ordered Feb 1",
    cta: "Quick Order - AED 128",
  },
  {
    title: "You Might Need",
    body: "Yuzu Juice is often ordered with panko",
    cta: "Add to Cart - AED 65",
  },
  {
    title: "Running Low",
    body: "Shokupan (3 days left), Curry Roux (5 days left)",
    cta: "Restock Both - AED 112",
  },
];
