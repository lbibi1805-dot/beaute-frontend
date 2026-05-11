/**
 * Typed API client — all communication with the Flask backend goes through here.
 * Base URL is the Flask dev server on port 5000.
 */

const BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body?.error ?? `HTTP ${res.status}`);
  return body as T;
}

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type RecommendLabel = "Recommended" | "Not Recommended";

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

export interface CooccurringProduct extends Product {
  cf_jaccard: number;
  cf_shared_reviewers: number;
}

export interface Review {
  review_id: string;
  product_id: string;
  title: string;
  description: string;
  rating: number;
  ai_label: RecommendLabel;
  final_label: RecommendLabel;
  overridden: boolean;
  is_verified_buyer: boolean;
  review_url: string;
  created_at?: string;
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

export interface ComplaintTerm {
  term: string;
  score: number;
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

export async function getCooccurringProducts(productId: string): Promise<{ products: CooccurringProduct[] }> {
  return request(`/products/${productId}/cooccurring`);
}

export async function getProductComplaints(productId: string, limit = 10): Promise<{ complaints: ComplaintTerm[] }> {
  return request(`/products/${productId}/complaints?limit=${limit}`);
}

export async function getFilterOptions(): Promise<FilterOptions> {
  return request("/products/filters");
}

// ── Reviews ───────────────────────────────────────────────────────────────────

export interface CreateReviewBody {
  title: string;
  description: string;
  rating: number;
  label_override?: RecommendLabel;
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

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface AuthInfo {
  token: string;
  role: "admin" | "customer";
  expires_at: string;
}

export async function loginUser(username: string, password: string): Promise<AuthInfo> {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export interface AnalyticsOverview {
  total_reviews: number;
  recommend_count: number;
  not_recommend_count: number;
  recommend_rate_percent: number;
  recommend_rate_weighted_percent: number;
  override_count: number;
  override_rate_percent: number;
  verified_buyer_share_percent: number;
  ai_rating_agreement_percent: number;
  confusion: { tp: number; fp: number; tn: number; fn: number };
  time_window_days: number;
  limit: number;
}

export interface BrandStat {
  brand_name: string;
  total_reviews: number;
  recommend_count: number;
  recommend_rate_percent: number;
  avg_rating: number;
  verified_buyer_share_percent: number;
}

export interface TrendPoint {
  month: string;       // "2024-01"
  rate: number;        // 0..1
  n_reviews: number;
}

export interface TrendsResponse {
  brands: string[];
  series: Record<string, TrendPoint[]>;
}

export interface PriceTierStat {
  tier: string;
  n_reviews: number;
  weighted_recommend_rate: number;
  recommend_rate_percent: number;
  weighted_avg_rating: number;
  verified_buyer_share_percent: number;
}

export interface ComplaintsResponse {
  brand: string | null;
  complaints: ComplaintTerm[];
  available_brands?: string[];
}

export async function getAnalyticsOverview(token: string, limit = 100, days = 30): Promise<AnalyticsOverview> {
  return request(`/admin/analytics/overview?limit=${limit}&days=${days}`, {
    headers: authHeaders(token),
  });
}

export async function getAnalyticsBrands(token: string, limit = 10, minReviews = 5): Promise<{ brands: BrandStat[] }> {
  return request(`/admin/analytics/brands?limit=${limit}&min_reviews=${minReviews}`, {
    headers: authHeaders(token),
  });
}

export async function getAnalyticsTrends(token: string, topNBrands = 5, minPerMonth = 5): Promise<TrendsResponse> {
  return request(`/admin/analytics/trends?top_n_brands=${topNBrands}&min_reviews_per_month=${minPerMonth}`, {
    headers: authHeaders(token),
  });
}

export async function getAnalyticsPriceTiers(token: string): Promise<{ tiers: PriceTierStat[] }> {
  return request(`/admin/analytics/price-tiers`, {
    headers: authHeaders(token),
  });
}

export async function getAnalyticsComplaints(token: string, brand?: string, limit = 20): Promise<ComplaintsResponse> {
  const qs = new URLSearchParams();
  if (brand) qs.set("brand", brand);
  qs.set("limit", String(limit));
  return request(`/admin/analytics/complaints?${qs}`, {
    headers: authHeaders(token),
  });
}

export async function deleteReview(reviewId: string, token: string): Promise<void> {
  const res = await fetch(`${BASE}/admin/reviews/${reviewId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `HTTP ${res.status}`);
  }
}
