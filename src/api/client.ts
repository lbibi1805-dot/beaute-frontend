/**
 * Typed API client — all communication with the Flask backend goes through here.
 * Base URL is the Flask dev server on port 5000.
 */

const BASE = "http://localhost:5000/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body?.error ?? `HTTP ${res.status}`);
  return body as T;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Product {
  product_id: string;
  product_name: string;
  brand_name: string;
  product_title: string;
  price: number;
  category: string;
  image_url: string;
  avg_rating: number;
  review_count: number;
  description: string;
}

export interface Review {
  review_id: string;
  product_id: string;
  title: string;
  description: string;
  rating: number;
  ai_label: "Buy" | "Not Buy";
  final_label: "Buy" | "Not Buy";
  overridden: boolean;
  review_url: string;
}

export interface SearchParams {
  q?: string;
  brand?: string;
  category?: string;
  min_price?: number;
  max_price?: number;
}

export interface FilterOptions {
  brands: string[];
  categories: string[];
  price_range: { min: number; max: number };
}

// ── Products ──────────────────────────────────────────────────────────────────

export async function searchProducts(params: SearchParams = {}): Promise<{ count: number; products: Product[] }> {
  const qs = new URLSearchParams();
  if (params.q)           qs.set("q", params.q);
  if (params.brand)       qs.set("brand", params.brand);
  if (params.category)    qs.set("category", params.category);
  if (params.min_price != null) qs.set("min_price", String(params.min_price));
  if (params.max_price != null) qs.set("max_price", String(params.max_price));
  const suffix = qs.toString() ? `?${qs}` : "";
  return request(`/products${suffix}`);
}

export async function getProduct(productId: string): Promise<Product> {
  return request(`/products/${productId}`);
}

export async function getProductReviews(productId: string): Promise<{ reviews: Review[] }> {
  return request(`/products/${productId}/reviews`);
}

export async function getSimilarProducts(productId: string): Promise<{ products: Product[] }> {
  return request(`/products/${productId}/similar`);
}

export async function getFilterOptions(): Promise<FilterOptions> {
  return request("/products/filters");
}

// ── Reviews ───────────────────────────────────────────────────────────────────

export interface CreateReviewBody {
  title: string;
  description: string;
  rating: number;
  label_override?: "Buy" | "Not Buy";
}

export async function createReview(productId: string, body: CreateReviewBody): Promise<Review> {
  return request(`/products/${productId}/reviews`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getReview(reviewId: string): Promise<Review> {
  return request(`/reviews/${reviewId}`);
}
