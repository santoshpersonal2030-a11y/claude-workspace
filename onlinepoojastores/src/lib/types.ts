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
  currency: string;
  sku: string | null;
  stock: number;
  image_url: string | null;
  is_active: boolean;
};

// A product plus the list of category ids it belongs to (used for filtering).
export type ProductWithCategories = Product & {
  categoryIds: string[];
};
