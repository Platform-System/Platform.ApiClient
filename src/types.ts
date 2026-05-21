export interface Result<T> {
  success: boolean;
  data?: T;
  statusCode?: number;
  message?: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface StoreItem {
  id: string;
  name: string;
  slug: string;
  location: string;
  tagline?: string;
  coverImageUrl?: string;
  isActive: boolean;
  ownerName?: string;
  ownerEmail?: string;
  createdAt: string;
  totalProducts?: number;
  totalSales?: number;
}

export interface Seller {
  id: string;
  name: string;
  slug: string;
  avatar: string;
  coverImage: string;
  rating: number;
  reviewCount: number;
  productCount: number;
  location: string;
  verified: boolean;
  categories: string[];
  description?: string;
  tagline?: string;
  responseTime?: string;
  policies?: {
    shipping: string;
    returns: string;
    warranty: string;
  };
}

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  rating: number;
  reviewCount: number;
  seller: {
    name: string;
    verified: boolean;
    avatar?: string;
    rating?: number;
    productCount?: number;
    location?: string;
  };
  badge?: "new" | "sale" | "bestseller";
  category?: string;
}

export interface StoreOrderItem {
  id: string | number;
  name: string;
  image: string;
  price: number;
  quantity: number;
  color?: string;
  size?: string;
}

export interface StoreOrder {
  id: string;
  createdAt: string;
  customerName: string;
  email: string;
  phone: string;
  city: string;
  district: string;
  ward: string;
  addressLine: string;
  deliveryNote: string;
  deliveryMethod: "standard" | "express";
  paymentMethod: "wallet" | "payment";
  items: StoreOrderItem[];
  subtotal: number;
  shippingFee: number;
  taxAmount: number;
  total: number;
  status: "pending" | "processing" | "shipped" | "delivered";
}

export interface StoreProfile {
  name: string;
  email: string;
  avatar: string;
  joinedDate: string;
}
