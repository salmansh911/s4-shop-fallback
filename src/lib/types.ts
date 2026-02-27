export type Product = {
  id: string;
  variant_id?: string;
  backend_product_id?: string;
  name: string;
  category: "ramadan" | "japanese" | "premium_beef" | "general";
  price: number;
  unit: string;
  description: string;
  image_url: string;
  certifications: string[];
  stock_level: number;
  stock_status: "In Stock" | "Low Stock" | "Pre-order";
  ideal_for?: string;
  dish_ideas?: string[];
  ai_note?: string;
};

export type OrderItem = {
  product_id: string;
  name: string;
  qty: number;
  unit_price: number;
};

export type Order = {
  id: string;
  order_number: string;
  user_id: string;
  status: "pending" | "confirmed" | "preparing" | "out_for_delivery" | "delivered";
  delivery_date: string;
  total_amount: number;
  deposit_amount: number;
  deposit_paid: boolean;
  special_instructions?: string;
  items: OrderItem[];
};

export type InsightCard = {
  id: string;
  title: string;
  message: string;
  action: string;
};
