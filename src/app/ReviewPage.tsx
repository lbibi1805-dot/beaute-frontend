/**
 * ReviewPage — standalone page for viewing a single review by URL.
 *
 * Accessed via: /review.html?id=<review_id>
 * Fetches the review from GET /api/reviews/<review_id> and renders a
 * branded card with all review details.
 */
import { useEffect, useState } from "react";
import { Star, BadgeCheck, CheckCircle, XCircle, ArrowLeft } from "lucide-react";

const BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

interface ReviewData {
  review_id: string;
  product_id: string;
  author?: string | null;
  title: string;
  description: string;
  rating: number;
  ai_label: string;
  final_label: string;
  overridden: boolean;
  is_verified_buyer: boolean;
  created_at: string | null;
  review_url: string;
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`w-5 h-5 ${
            i < rating ? "fill-gray-900 text-gray-900" : "fill-gray-200 text-gray-200"
          }`}
        />
      ))}
      <span className="ml-2 text-sm text-gray-500">{rating}/5</span>
    </div>
  );
}

export function ReviewPage() {
  const [review, setReview] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (!id) {
      setError("No review ID provided.");
      setLoading(false);
      return;
    }
    fetch(`${BASE}/reviews/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Review not found (${res.status})`);
        return res.json() as Promise<ReviewData>;
      })
      .then((data) => setReview(data))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (iso: string | null) => {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <a
            href="/"
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to shop
          </a>
          <span className="text-xl tracking-tight text-gray-900 font-light">BEAUTÉ</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        {loading && (
          <div className="flex items-center justify-center py-24 text-gray-400">
            <span className="text-sm">Loading review…</span>
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-red-800 mb-2">Review not found</h2>
            <p className="text-sm text-red-600">{error}</p>
            <a
              href="/"
              className="inline-block mt-6 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors"
            >
              Browse products
            </a>
          </div>
        )}

        {review && !loading && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Review banner */}
            <div className="bg-[#FCE4EC] px-8 py-6">
              <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">Customer Review</p>
              <h1 className="text-2xl text-gray-900 font-light">{review.title}</h1>
            </div>

            <div className="px-8 py-6 space-y-6">
              {/* Rating */}
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Rating</p>
                <StarRow rating={review.rating} />
              </div>

              {/* Description */}
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Review</p>
                <p className="text-gray-700 leading-relaxed">{review.description}</p>
              </div>

              {/* AI label */}
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Recommendation</p>
                <div className="flex flex-wrap items-center gap-3">
                  {review.final_label === "Recommended" ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-800 text-sm rounded-full">
                      <CheckCircle className="w-4 h-4" /> Recommends this product
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-800 text-sm rounded-full">
                      <XCircle className="w-4 h-4" /> Does not recommend
                    </span>
                  )}
                  {review.overridden && (
                    <span className="text-xs text-gray-400">
                      (AI predicted: {review.ai_label})
                    </span>
                  )}
                </div>
              </div>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-gray-100">
                {review.author && (
                  <span className="text-sm text-gray-600">
                    By <strong>{review.author}</strong>
                  </span>
                )}
                {review.is_verified_buyer && (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    <BadgeCheck className="w-3 h-3" /> Verified Buyer
                  </span>
                )}
                {review.created_at && (
                  <span className="text-xs text-gray-400">{formatDate(review.created_at)}</span>
                )}
              </div>

              {/* CTA */}
              <a
                href={`/?product=${review.product_id}`}
                className="block w-full text-center py-3 bg-gray-900 text-white text-sm rounded-xl hover:bg-gray-800 transition-colors"
              >
                View product on BEAUTÉ
              </a>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
