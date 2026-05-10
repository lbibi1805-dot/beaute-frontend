/**
 * AdminDashboard — analytics overlay for Admin users.
 * Uses pure Tailwind width-based bars (no chart library dependency).
 */
import { useEffect, useState } from "react";
import { X, TrendingUp, BarChart2, ShoppingBag } from "lucide-react";
import { useAuth } from "../../context/AuthContext.tsx";
import {
  getAnalyticsOverview,
  getAnalyticsBrands,
  deleteReview,
  type AnalyticsOverview,
  type BrandStat,
} from "../../api/client.ts";

interface AdminDashboardProps {
  onClose: () => void;
  /** Callback to notify parent a review was deleted, triggering a refresh */
  onReviewDeleted?: (reviewId: string) => void;
}

export function AdminDashboard({ onClose }: AdminDashboardProps) {
  const { token } = useAuth();
  const [overview, setOverview]   = useState<AnalyticsOverview | null>(null);
  const [brands, setBrands]       = useState<BrandStat[]>([]);
  const [loadingO, setLoadingO]   = useState(true);
  const [loadingB, setLoadingB]   = useState(true);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    getAnalyticsOverview(token)
      .then(setOverview)
      .catch(() => setError("Failed to load overview"))
      .finally(() => setLoadingO(false));

    getAnalyticsBrands(token)
      .then((r) => setBrands(r.brands))
      .catch(() => {})
      .finally(() => setLoadingB(false));
  }, [token]);

  if (!token) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex items-center justify-center">
        <p className="text-gray-500">Access denied — Admin login required.</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      <button
        onClick={onClose}
        className="fixed top-4 right-4 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 z-10"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-3 mb-8">
          <BarChart2 className="w-7 h-7 text-gray-800" />
          <h1 className="text-3xl font-light text-gray-900">Admin Dashboard</h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {/* ── Overview summary ── */}
        <section className="mb-10">
          <h2 className="text-lg font-medium text-gray-700 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" /> Review label overview
          </h2>

          {loadingO ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : overview ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <StatCard label="Total reviews" value={String(overview.total_reviews)} />
                <StatCard label="Buy" value={String(overview.buy_count)} color="text-green-600" />
                <StatCard label="Not Buy" value={String(overview.not_buy_count)} color="text-red-500" />
                <StatCard label="Buy rate" value={`${overview.buy_rate_percent}%`} color="text-blue-600" />
              </div>

              {/* Buy vs Not Buy bar */}
              <div className="bg-gray-50 rounded-xl p-5">
                <p className="text-sm text-gray-600 mb-3">
                  Buy vs Not Buy — last {overview.limit} reviews in {overview.time_window_days} days
                </p>
                <div className="flex rounded-full overflow-hidden h-6 text-xs font-medium">
                  <div
                    className="bg-green-400 flex items-center justify-center text-white transition-all"
                    style={{ width: `${overview.buy_rate_percent}%` }}
                  >
                    {overview.buy_rate_percent > 10 && `${overview.buy_rate_percent}%`}
                  </div>
                  <div
                    className="bg-red-300 flex items-center justify-center text-white transition-all"
                    style={{ width: `${100 - overview.buy_rate_percent}%` }}
                  >
                    {100 - overview.buy_rate_percent > 10 && `${(100 - overview.buy_rate_percent).toFixed(1)}%`}
                  </div>
                </div>
                <div className="flex gap-4 mt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-400 inline-block" /> Buy</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-300 inline-block" /> Not Buy</span>
                </div>
              </div>
            </>
          ) : null}
        </section>

        {/* ── Top brands ── */}
        <section className="mb-10">
          <h2 className="text-lg font-medium text-gray-700 mb-4 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" /> Top brands by buy rate
          </h2>

          {loadingB ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : brands.length === 0 ? (
            <p className="text-sm text-gray-400">
              No brand data yet — submit some reviews first.
            </p>
          ) : (
            <div className="space-y-3">
              {brands.map((b) => (
                <div key={b.brand_name} className="flex items-center gap-4">
                  <p className="text-sm text-gray-700 w-40 truncate flex-shrink-0">{b.brand_name}</p>
                  <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-gray-800 h-full rounded-full transition-all"
                      style={{ width: `${b.buy_rate_percent}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 w-12 text-right flex-shrink-0">
                    {b.buy_rate_percent}%
                  </p>
                  <p className="text-xs text-gray-400 w-20 text-right flex-shrink-0">
                    {b.total_reviews} reviews
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Moderation hint ── */}
        <section>
          <h2 className="text-lg font-medium text-gray-700 mb-2">Review moderation</h2>
          <p className="text-sm text-gray-500">
            To delete a review, open the product detail and use the delete button on any review.
            Deletion calls <code className="bg-gray-100 px-1 rounded">DELETE /api/admin/reviews/&lt;id&gt;</code> with your admin token.
          </p>
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value, color = "text-gray-900" }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-semibold ${color}`}>{value}</p>
    </div>
  );
}
