export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  mrp?: number | null; // optional "compare at" price (needs migration 0005)
  currency: string;
  sku: string | null;
  stock: number;
  image_url: string | null;
  is_active: boolean;
  created_at?: string;
};

// A product plus the list of category ids it belongs to (used for filtering).
export type ProductWithCategories = Product & {
  categoryIds: string[];
};

export type ShippingZone = {
  id: string;
  name: string;
  code: string;
  pincode_start: number | null;
  pincode_end: number | null;
  state: string | null;
  is_default: boolean;
  priority: number;
  rate: number;
  free_above: number;
};

export type Address = {
  id: string;
  label: 'home' | 'work' | 'other';
  full_name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
};

export type Review = {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  created_at: string;
};

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'returned';

export type OrderItem = {
  id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  line_total: number;
};

export type Order = {
  id: string;
  order_number: string;
  status: OrderStatus;
  subtotal: number;
  shipping_fee: number;
  total: number;
  ship_full_name: string;
  ship_phone: string;
  ship_line1: string;
  ship_line2: string | null;
  ship_city: string;
  ship_state: string;
  ship_pincode: string;
  created_at: string;
  order_items?: OrderItem[];
};
