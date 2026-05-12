import { useEffect, useState, useRef, useMemo } from "react";
import { ArrowLeft, Star, ChevronLeft, ChevronRight, Sparkles, Copy, Check, ShoppingCart, BadgeCheck, AlertTriangle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Slider from "react-slick";
import { ImageWithFallback } from "./figma/ImageWithFallback.tsx";
import { useCart } from "../../context/CartContext.tsx";
import { useAuth } from "../../context/AuthContext.tsx";
import {
  getProductReviews,
  getSimilarProducts,
  getCooccurringProducts,
  getProductComplaints,
  createReview,
  deleteReviewByUser,
  type Product,
  type CooccurringProduct,
  type ComplaintTerm,
  type Review,
  type RecommendLabel,
} from "../../api/client";

interface ProductDetailProps {
  product: Product;
  onClose: () => void;
  onProductClick: (product: Product) => void;
  onLoginClick?: () => void;
}

const REC: RecommendLabel = "Recommended";
const NOT_REC: RecommendLabel = "Not Recommended";

export function ProductDetail({ product, onClose, onProductClick, onLoginClick }: ProductDetailProps) {
  const { addItem } = useCart();
  const { token, username } = useAuth();
  const [reviews, setReviews]         = useState<Review[]>([]);
  const [similar, setSimilar]         = useState<Product[]>([]);
  const [cooccurring, setCooccurring] = useState<CooccurringProduct[]>([]);
  const [complaints, setComplaints]   = useState<ComplaintTerm[]>([]);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewDesc, setReviewDesc]   = useState("");
  const [reviewRating, setReviewRating] = useState(0);
  const [aiLabel, setAiLabel]         = useState<RecommendLabel | null>(null);
  const [labelOverride, setLabelOverride] = useState<RecommendLabel | "">("");
  const [submitting, setSubmitting]   = useState(false);
  const [copiedUrl, setCopiedUrl]     = useState<string | null>(null);
  const [deletingReview, setDeletingReview] = useState<string | null>(null);

  // ── Review filter / sort state ──────────────────────────────────────────
  const [rvSort,     setRvSort]     = useState<"newest" | "oldest" | "rating_desc" | "rating_asc">("newest");
  const [rvRating,   setRvRating]   = useState<number | null>(null);
  const [rvLabel,    setRvLabel]    = useState<"" | "Recommended" | "Not Recommended">("" );
  const [rvVerified, setRvVerified] = useState(false);
  const [rvSource,   setRvSource]   = useState<"" | "historical" | "new">("" );
  const [rvAuthor,   setRvAuthor]   = useState<"" | "mine" | "others">("" );
  const similarSliderRef = useRef<Slider | null>(null);
  const coSliderRef      = useRef<Slider | null>(null);

  // ── Derived: filtered + sorted reviews ───────────────────────────────────
  const displayedReviews = useMemo(() => {
    let result = [...reviews];
    if (rvRating   !== null) result = result.filter((r) => r.rating === rvRating);
    if (rvLabel)             result = result.filter((r) => r.final_label === rvLabel);
    if (rvVerified)          result = result.filter((r) => r.is_verified_buyer);
    if (rvSource === "historical") result = result.filter((r) => r.source === "historical");
    if (rvSource === "new")        result = result.filter((r) => r.source !== "historical");
    if (rvAuthor === "mine")   result = result.filter((r) => r.author != null && r.author === username);
    if (rvAuthor === "others") result = result.filter((r) => r.author == null || r.author !== username);
    switch (rvSort) {
      case "oldest":      result.sort((a, b) => (a.created_at ?? "").localeCompare(b.created_at ?? "")); break;
      case "rating_desc": result.sort((a, b) => b.rating - a.rating); break;
      case "rating_asc":  result.sort((a, b) => a.rating - b.rating); break;
      default:            result.sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
    }
    return result;
  }, [reviews, rvRating, rvLabel, rvVerified, rvSource, rvAuthor, rvSort, username]);

  useEffect(() => {
    getProductReviews(product.product_id)
      .then((r) => setReviews(r.reviews))
      .catch(() => setReviews([]));

    getSimilarProducts(product.product_id)
      .then((r) => setSimilar(r.products))
      .catch(() => setSimilar([]));

    getCooccurringProducts(product.product_id)
      .then((r) => setCooccurring(r.products))
      .catch(() => setCooccurring([]));

    getProductComplaints(product.product_id, 6)
      .then((r) => setComplaints(r.complaints))
      .catch(() => setComplaints([]));
  }, [product.product_id]);

  const handleSubmitReview = async () => {
    if (!reviewTitle || !reviewDesc || reviewRating === 0) return;
    setSubmitting(true);
    try {
      const saved = await createReview(product.product_id, {
        title: reviewTitle,
        description: reviewDesc,
        rating: reviewRating,
        label_override: labelOverride || undefined,
      }, token ?? undefined);
      setAiLabel(saved.ai_label);
      setReviews((prev) => [...prev, saved]);
      setReviewTitle("");
      setReviewDesc("");
      setReviewRating(0);
      setLabelOverride("");
    } catch (err) {
      console.error("Failed to submit review", err);
    } finally {
      setSubmitting(false);
    }
  };

  const copyUrl = (reviewId: string) => {
    const base = window.location.origin;
    navigator.clipboard.writeText(`${base}/review.html?id=${reviewId}`).catch(() => {});
    setCopiedUrl(reviewId);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!token) return;
    setDeletingReview(reviewId);
    try {
      await deleteReviewByUser(product.product_id, reviewId, token);
      setReviews((prev) => prev.filter((r) => r.review_id !== reviewId));
      toast.success("Review deleted");
    } catch {
      toast.error("Could not delete review");
    } finally {
      setDeletingReview(null);
    }
  };

  const sliderSettings = {
    dots: false,
    infinite: false,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 1,
    arrows: false,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 3 } },
      { breakpoint: 768,  settings: { slidesToShow: 2 } },
      { breakpoint: 480,  settings: { slidesToShow: 1 } },
    ],
  };

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      <button
        onClick={onClose}
        className="fixed top-4 left-4 flex items-center gap-2 px-3 py-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-all z-10 text-sm text-gray-700"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="hidden sm:inline">Back</span>
      </button>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ── Product header ── */}
        <div className="grid md:grid-cols-2 gap-12 mb-16">
          <div className="aspect-square bg-[#FCE4EC] rounded-lg overflow-hidden">
            <ImageWithFallback
              src={product.image_url || ""}
              alt={product.product_name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex flex-col">
            <p className="text-sm text-gray-500 uppercase tracking-wide mb-2">{product.brand_name}</p>
            <h1 className="text-3xl text-gray-900 mb-4">{product.product_name}</h1>

            <div className="flex items-center gap-2 mb-6">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${
                    i < Math.floor(product.avg_rating)
                      ? "fill-gray-900 text-gray-900"
                      : "fill-gray-200 text-gray-200"
                  }`}
                />
              ))}
              <span className="text-sm text-gray-600">({product.review_count} reviews)</span>
            </div>

            {product.price > 0 && (
              <p className="text-3xl text-gray-900 mb-6">${product.price.toFixed(2)}</p>
            )}

            <p className="text-gray-600 mb-6">{product.description || "No description available."}</p>

            {complaints.length > 0 && (
              <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-700" />
                  <span className="text-sm font-medium text-amber-800">Common concerns from reviewers</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {complaints.map((c) => (
                    <span
                      key={c.term}
                      className="text-xs bg-white border border-amber-300 text-amber-800 px-2 py-1 rounded-full"
                    >
                      {c.term}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => { addItem(product); toast.success(`${product.product_title || product.product_name} added to cart`); }}
              className="w-full bg-gray-900 text-white py-4 rounded-lg hover:bg-gray-800 transition-colors mb-4 flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-5 h-5" />
              Add to Cart
            </button>
          </div>
        </div>

        {/* ── Similar products (content-based) ── */}
        {similar.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl text-gray-900">Similar Items You May Like</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => similarSliderRef.current?.slickPrev()}
                  className="p-2 border border-gray-300 rounded-full hover:bg-gray-50"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => similarSliderRef.current?.slickNext()}
                  className="p-2 border border-gray-300 rounded-full hover:bg-gray-50"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            <Slider ref={similarSliderRef} {...sliderSettings}>
              {similar.map((p) => (
                <ProductCarouselCard
                  key={p.product_id}
                  product={p}
                  onClick={() => onProductClick(p)}
                  onAddToCart={() => { addItem(p); toast.success(`${p.product_title || p.product_name} added to cart`); }}
                />
              ))}
            </Slider>
          </div>
        )}

        {/* ── Customers Also Bought (collaborative filtering) ── */}
        {cooccurring.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl text-gray-900">Customers Also Bought</h2>
                <p className="text-xs text-gray-500 mt-1">
                  Based on verified buyers who reviewed both products
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => coSliderRef.current?.slickPrev()}
                  className="p-2 border border-gray-300 rounded-full hover:bg-gray-50"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => coSliderRef.current?.slickNext()}
                  className="p-2 border border-gray-300 rounded-full hover:bg-gray-50"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            <Slider ref={coSliderRef} {...sliderSettings}>
              {cooccurring.map((p) => (
                <ProductCarouselCard
                  key={p.product_id}
                  product={p}
                  onClick={() => onProductClick(p)}
                  onAddToCart={() => { addItem(p); toast.success(`${p.product_title || p.product_name} added to cart`); }}
                  footnote={`${p.cf_shared_reviewers} shared reviewers`}
                />
              ))}
            </Slider>
          </div>
        )}

        {/* ── Review form ── */}
        {!token ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 mb-12 text-center">
            <h2 className="text-2xl text-gray-900 mb-4">Write a Review</h2>
            <p className="text-gray-500 mb-6">Sign in to share your experience with this product.</p>
            {onLoginClick && (
              <button
                onClick={onLoginClick}
                className="bg-gray-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Sign in
              </button>
            )}
          </div>
        ) : (
        <div className="bg-white border border-gray-200 rounded-lg p-8 mb-12">
          <h2 className="text-2xl text-gray-900 mb-6">Write a Review</h2>

          <div className="space-y-6">
            {/* Rating */}
            <div>
              <label className="block text-sm text-gray-700 mb-2">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setReviewRating(star)}
                    className="hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= reviewRating
                          ? "fill-gray-900 text-gray-900"
                          : "fill-gray-200 text-gray-200"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm text-gray-700 mb-2">Review Title</label>
              <input
                type="text"
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
                placeholder="Summarize your experience"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm text-gray-700 mb-2">Review Description</label>
              <textarea
                value={reviewDesc}
                onChange={(e) => setReviewDesc(e.target.value)}
                placeholder="Tell us about your experience with this product"
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
              />
            </div>

            {/* AI label override */}
            <div className="bg-[#FCE4EC] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-gray-900" />
                <span className="text-sm text-gray-700">
                  After submitting, the AI will predict whether you recommend this product.
                </span>
              </div>
              {aiLabel && (
                <p className="text-xs text-gray-600 mb-2">
                  Last AI prediction: <strong>{aiLabel}</strong>
                </p>
              )}
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-700">Override prediction (optional):</label>
                <select
                  value={labelOverride}
                  onChange={(e) => setLabelOverride(e.target.value as "" | RecommendLabel)}
                  className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
                >
                  <option value="">Use AI prediction</option>
                  <option value={REC}>Recommend Buying</option>
                  <option value={NOT_REC}>Do Not Recommend</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleSubmitReview}
              disabled={submitting || !reviewTitle || !reviewDesc || reviewRating === 0}
              className="w-full bg-gray-900 text-white py-4 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Submitting…" : "Submit Review"}
            </button>
          </div>
        </div>        )}
        {/* ── Existing reviews ── */}
        {reviews.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg font-medium mb-1">No reviews yet</p>
            <p className="text-sm">Be the first to share your experience with this product!</p>
          </div>
        ) : (
          <div>
            {/* header row */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl text-gray-900">
                Reviews{" "}
                <span className="text-base font-normal text-gray-500">
                  ({displayedReviews.length} of {reviews.length})
                </span>
              </h2>
              {/* reset filters */}
              {(rvRating !== null || rvLabel || rvVerified || rvSource || rvAuthor || rvSort !== "newest") && (
                <button
                  onClick={() => { setRvRating(null); setRvLabel(""); setRvVerified(false); setRvSource(""); setRvAuthor(""); setRvSort("newest"); }}
                  className="text-xs text-gray-500 hover:text-gray-900 underline"
                >
                  Clear filters
                </button>
              )}
            </div>

            {/* ── Filter / sort bar ── */}
            <div className="flex flex-wrap gap-x-5 gap-y-3 mb-5 p-3 bg-gray-50 rounded-lg text-xs">
              {/* Sort */}
              <div className="flex items-center gap-1.5">
                <span className="text-gray-500 font-medium shrink-0">Sort:</span>
                <select
                  value={rvSort}
                  onChange={(e) => setRvSort(e.target.value as typeof rvSort)}
                  className="border border-gray-300 rounded px-1.5 py-0.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-900"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="rating_desc">Rating ↑</option>
                  <option value="rating_asc">Rating ↓</option>
                </select>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-1">
                <span className="text-gray-500 font-medium shrink-0">Rating:</span>
                {[null, 5, 4, 3, 2, 1].map((v) => (
                  <button
                    key={v ?? "all"}
                    onClick={() => setRvRating(v)}
                    className={`px-1.5 py-0.5 rounded border transition-colors ${
                      rvRating === v
                        ? "bg-gray-900 text-white border-gray-900"
                        : "border-gray-300 text-gray-600 hover:border-gray-500"
                    }`}
                  >
                    {v === null ? "All" : `${v}★`}
                  </button>
                ))}
              </div>

              {/* Label */}
              <div className="flex items-center gap-1">
                <span className="text-gray-500 font-medium shrink-0">Label:</span>
                {(["", "Recommended", "Not Recommended"] as const).map((v) => (
                  <button
                    key={v || "all"}
                    onClick={() => setRvLabel(v)}
                    className={`px-1.5 py-0.5 rounded border transition-colors ${
                      rvLabel === v
                        ? "bg-gray-900 text-white border-gray-900"
                        : "border-gray-300 text-gray-600 hover:border-gray-500"
                    }`}
                  >
                    {v === "" ? "All" : v === "Recommended" ? "✓ Rec" : "✗ Not Rec"}
                  </button>
                ))}
              </div>

              {/* Source */}
              <div className="flex items-center gap-1">
                <span className="text-gray-500 font-medium shrink-0">Source:</span>
                {([["", "All"], ["new", "New"], ["historical", "Historical"]] as const).map(([v, label]) => (
                  <button
                    key={v || "all"}
                    onClick={() => setRvSource(v)}
                    className={`px-1.5 py-0.5 rounded border transition-colors ${
                      rvSource === v
                        ? "bg-gray-900 text-white border-gray-900"
                        : "border-gray-300 text-gray-600 hover:border-gray-500"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Author — only useful when logged in */}
              {username && (
                <div className="flex items-center gap-1">
                  <span className="text-gray-500 font-medium shrink-0">Author:</span>
                  {([["", "All"], ["mine", "Mine"], ["others", "Others"]] as const).map(([v, label]) => (
                    <button
                      key={v || "all"}
                      onClick={() => setRvAuthor(v)}
                      className={`px-1.5 py-0.5 rounded border transition-colors ${
                        rvAuthor === v
                          ? "bg-gray-900 text-white border-gray-900"
                          : "border-gray-300 text-gray-600 hover:border-gray-500"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}

              {/* Verified toggle */}
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rvVerified}
                  onChange={(e) => setRvVerified(e.target.checked)}
                  className="w-3.5 h-3.5 accent-gray-900"
                />
                <span className="text-gray-600">Verified only</span>
              </label>
            </div>

            {/* ── Review cards ── */}
            {displayedReviews.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                No reviews match your current filters.
              </div>
            ) : (
            <div className="space-y-4">
              {displayedReviews.map((r) => (
                <div key={r.review_id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < r.rating ? "fill-gray-900 text-gray-900" : "fill-gray-300 text-gray-300"
                        }`}
                      />
                    ))}
                    {r.is_verified_buyer && (
                      <span className="ml-2 inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        <BadgeCheck className="w-3 h-3" /> Verified Buyer
                      </span>
                    )}
                    {r.source === "historical" && (
                      <span className="text-[10px] uppercase tracking-wide text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full">
                        Historical
                      </span>
                    )}
                    {r.author && (
                      <span className="text-xs text-gray-500 ml-auto">— {r.author}</span>
                    )}
                  </div>
                  <h4 className="text-sm font-medium text-gray-900 mb-1">{r.title}</h4>
                  <p className="text-sm text-gray-600 mb-3">{r.description}</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span
                      className={`inline-block text-xs px-2 py-1 rounded ${
                        r.final_label === REC
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {r.final_label === REC ? "Recommended" : "Not Recommended"}
                    </span>
                    {r.overridden && (
                      <span className="text-xs text-gray-500">
                        (AI Label: {r.ai_label})
                      </span>
                    )}
                    <button
                      onClick={() => copyUrl(r.review_id)}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 transition-colors"
                    >
                      {copiedUrl === r.review_id ? (
                        <><Check className="w-3 h-3" /> Copied</>
                      ) : (
                        <><Copy className="w-3 h-3" /> Copy review URL</>
                      )}
                    </button>
                    {username && r.author === username && (
                      <button
                        onClick={() => handleDeleteReview(r.review_id)}
                        disabled={deletingReview === r.review_id}
                        className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 disabled:opacity-50"
                      >
                        <Trash2 className="w-3 h-3" />
                        {deletingReview === r.review_id ? "Deleting\u2026" : "Delete"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface CardProps {
  product: Product;
  onClick: () => void;
  onAddToCart: () => void;
  footnote?: string;
}

function ProductCarouselCard({ product, onClick, onAddToCart, footnote }: CardProps) {
  return (
    <div className="px-2">
      <div
        onClick={onClick}
        className="cursor-pointer bg-white rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
      >
        <div className="aspect-square bg-[#FCE4EC] overflow-hidden">
          <ImageWithFallback
            src={product.image_url || ""}
            alt={product.product_name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="p-3">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{product.brand_name}</p>
          <h3 className="text-sm text-gray-900 mb-1 line-clamp-2">{product.product_title || product.product_name}</h3>
          {product.price > 0 && <p className="text-gray-900 text-sm">${product.price.toFixed(2)}</p>}
          {footnote && <p className="text-[10px] text-gray-400 mt-0.5">{footnote}</p>}
          <button
            onClick={(e) => { e.stopPropagation(); onAddToCart(); }}
            className="mt-2 w-full text-xs border border-gray-300 rounded-lg py-1.5 hover:bg-gray-50 flex items-center justify-center gap-1"
          >
            <ShoppingCart className="w-3 h-3" /> Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
