export interface Product {
  id: string;
  category: string;
  imageUrl: string;
  description: string;
  price: string;
  originalPrice: string;
  currency: string;
  currencyRate: string;
  weight?: number;
  product_code?: string;
  createdAt: string;
  isSelected: boolean;
  saleRate: "good" | "medium" | "bad" | "none";
  shippmentWay?: "air" | "sea" | "luggage";
}

export interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface EditProductPayload {
  description: string;
  weight: string;
  price: string;
  currency: string;
  currencyRate: string;
  shippmentWay?: "air" | "sea" | "luggage";
}
