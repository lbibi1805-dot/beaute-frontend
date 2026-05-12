/**
 * AdminDashboard — analytics overlay for Admin users.
 *
 * Six sections:
 *   1. Overview (live SQLite reviews)
 *   2. Model Trust (override rate, AI-vs-rating agreement, confusion matrix)
 *   3. Sentiment Trends (monthly recommendation rate per top brand, from CSV)
 *   4. Price Segments (Budget / Mid / Premium, from CSV)
 *   5. Top Brands by recommendation rate (live SQLite)
 *   6. Top Complaints (TF-IDF mining of negative reviews, from CSV)
 *
 * Charts are pure Tailwind / inline SVG to avoid a chart-library dependency.
 */
import { useEffect, useMemo, useState } from "react";
import {
  X, TrendingUp, BarChart2, ShoppingBag, Shield, LineChart as LineChartIcon,
  DollarSign, AlertTriangle, ArrowLeft,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.tsx";
import {
  getAnalyticsOverview,
  getAnalyticsBrands,
  getAnalyticsTrends,
  getAnalyticsPriceTiers,
  getAnalyticsComplaints,
  type AnalyticsOverview,
  type BrandStat,
  type TrendsResponse,
  type PriceTierStat,
  type ComplaintsResponse,
} from "../../api/client.ts";

interface AdminDashboardProps {
  onClose: () => void;
  onReviewDeleted?: (reviewId: string) => void;
}

export function AdminDashboard({ onClose }: AdminDashboardProps) {
  const { token } = useAuth();

  const [overview, setOverview]   = useState<AnalyticsOverview | null>(null);
  const [brands, setBrands]       = useState<BrandStat[]>([]);
  const [trends, setTrends]       = useState<TrendsResponse | null>(null);
  const [tiers, setTiers]         = useState<PriceTierStat[]>([]);
  const [complaints, setComplaints] = useState<ComplaintsResponse | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string>("");

  const [loadingO, setLoadingO]   = useState(true);
  const [loadingB, setLoadingB]   = useState(true);
  const [loadingT, setLoadingT]   = useState(true);
  const [loadingP, setLoadingP]   = useState(true);
  const [loadingC, setLoadingC]   = useState(true);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    getAnalyticsOverview(token).then(setOverview)
      .catch(() => setError("Failed to load overview"))
      .finally(() => setLoadingO(false));

    getAnalyticsBrands(token).then((r) => setBrands(r.brands))
      .catch(() => {})
      .finally(() => setLoadingB(false));

    getAnalyticsTrends(token).then(setTrends)
      .catch(() => {})
      .finally(() => setLoadingT(false));

    getAnalyticsPriceTiers(token).then((r) => setTiers(r.tiers))
      .catch(() => {})
      .finally(() => setLoadingP(false));

    getAnalyticsComplaints(token).then(setComplaints)
      .catch(() => {})
      .finally(() => setLoadingC(false));
  }, [token]);

  // Reload complaints when selected brand changes
  useEffect(() => {
    if (!token) return;
    setLoadingC(true);
    getAnalyticsComplaints(token, selectedBrand || undefined)
      .then((r) => setComplaints((prev) => ({
        ...r,
        available_brands: r.available_brands ?? prev?.available_brands,
      })))
      .catch(() => {})
      .finally(() => setLoadingC(false));
  }, [token, selectedBrand]);

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
        className="fixed top-4 left-4 flex items-center gap-2 px-3 py-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-all z-10 text-sm text-gray-700"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="hidden sm:inline">Back</span>
      </button>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        <div className="flex items-center gap-3">
          <BarChart2 className="w-7 h-7 text-gray-800" />
          <h1 className="text-3xl font-light text-gray-900">Admin Dashboard</h1>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {/* ── 1. Overview ── */}
        <Section icon={<TrendingUp className="w-5 h-5" />} title="Review label overview">
          {loadingO ? (
            <SkeletonGrid count={4} />
          ) : overview ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <StatCard label="Total reviews" value={String(overview.total_reviews)} />
                <StatCard label="Recommended" value={String(overview.recommend_count)} color="text-green-600" />
                <StatCard label="Not Recommended" value={String(overview.not_recommend_count)} color="text-red-500" />
                <StatCard label="Recommendation rate" value={`${overview.recommend_rate_percent}%`} color="text-blue-600" />
              </div>

              <div className="bg-gray-50 rounded-xl p-5">
                <p className="text-sm text-gray-600 mb-3">
                  Recommended vs Not Recommended — historical CSV + live app reviews
                </p>
                <SplitBar
                  leftPercent={overview.recommend_rate_percent}
                  leftLabel="Recommended"
                  rightLabel="Not Recommended"
                />
                {overview.recommend_rate_weighted_percent !== overview.recommend_rate_percent && (
                  <p className="text-xs text-gray-500 mt-2">
                    Trust-weighted rate: <strong>{overview.recommend_rate_weighted_percent}%</strong>
                    {" "}— gives verified buyers 1.0 weight, non-buyer reviews 0.3.
                  </p>
                )}
                {(overview.historical_review_count !== undefined || overview.live_review_count !== undefined) && (
                  <p className="text-xs text-gray-500 mt-2">
                    Mix: <strong>{overview.historical_review_count?.toLocaleString() ?? 0}</strong> historical CSV reviews
                    {" + "}
                    <strong>{overview.live_review_count?.toLocaleString() ?? 0}</strong> live app reviews
                    {" (last "}{overview.time_window_days} days, capped at {overview.limit}).
                  </p>
                )}
              </div>
            </>
          ) : null}
        </Section>

        {/* ── 2. Model Trust ── */}
        <Section icon={<Shield className="w-5 h-5" />} title="Model trust">
          {loadingO ? (
            <SkeletonGrid count={3} />
          ) : overview ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                <StatCard label="Override rate"
                          value={`${overview.override_rate_percent}%`}
                          hint={`${overview.override_count} of ${overview.total_reviews}`} />
                <StatCard label="AI ↔ rating agreement"
                          value={`${overview.ai_rating_agreement_percent}%`}
                          color="text-emerald-600"
                          hint="vs rating≥4 ground truth" />
                <StatCard label="Verified-buyer share"
                          value={`${overview.verified_buyer_share_percent}%`}
                          color="text-blue-600" />
              </div>

              <ConfusionMatrix conf={overview.confusion} />
            </>
          ) : null}
        </Section>

        {/* ── 3. Sentiment Trends ── */}
        <Section icon={<LineChartIcon className="w-5 h-5" />} title="Sentiment trends over time">
          {loadingT ? (
            <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
          ) : trends && trends.brands.length > 0 ? (
            <TrendsChart trends={trends} />
          ) : (
            <p className="text-sm text-gray-400">No trend data available.</p>
          )}
          <p className="text-xs text-gray-500 mt-3">
            Monthly trust-weighted recommendation rate for the top {trends?.brands.length ?? 0} brands by review count.
            Computed from the historical review corpus.
          </p>
        </Section>

        {/* ── 4. Price Segments ── */}
        <Section icon={<DollarSign className="w-5 h-5" />} title="Price segment behaviour">
          {loadingP ? (
            <SkeletonGrid count={3} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {tiers.map((t) => (
                <PriceTierCard key={t.tier} tier={t} />
              ))}
            </div>
          )}
          <p className="text-xs text-gray-500 mt-3">
            Trust-weighted satisfaction metrics across price tiers (historical corpus).
            Higher recommend rate at lower tiers may reflect customer expectation alignment.
          </p>
        </Section>

        {/* ── 5. Top Brands ── */}
        <Section icon={<ShoppingBag className="w-5 h-5" />} title="Top brands by recommendation rate">
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
                <BrandRow key={b.brand_name} brand={b} />
              ))}
            </div>
          )}
          <p className="text-xs text-gray-500 mt-3">
            Live ranking from app-submitted reviews. Brand percentages reflect the AI-confirmed (or user-overridden) recommendation label.
          </p>
        </Section>

        {/* ── 6. Top Complaints ── */}
        <Section icon={<AlertTriangle className="w-5 h-5" />} title="Top complaints (negative review mining)">
          <div className="mb-4 flex items-center gap-3 flex-wrap">
            <label className="text-sm text-gray-600">Filter by brand:</label>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              <option value="">All brands</option>
              {(complaints?.available_brands ?? []).map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {loadingC ? (
            <div className="h-40 bg-gray-100 rounded-lg animate-pulse" />
          ) : complaints && complaints.complaints.length > 0 ? (
            <ComplaintsList complaints={complaints.complaints} />
          ) : (
            <p className="text-sm text-gray-400">No complaint data available for this selection.</p>
          )}
          <p className="text-xs text-gray-500 mt-3">
            Discriminative TF-IDF (unigrams + bigrams) over negative reviews (rating ≤ 2). Trust-weighted.
          </p>
        </Section>

        {/* Moderation hint */}
        <section className="text-xs text-gray-400 border-t border-gray-100 pt-6">
          To delete a review, open its product detail and use the delete button.
          Deletion calls <code className="bg-gray-100 px-1 rounded">DELETE /api/admin/reviews/&lt;id&gt;</code> with your admin token.
        </section>
      </div>
    </div>
  );
}

// ─── helper subcomponents ──────────────────────────────────────────────────────

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-medium text-gray-700 mb-4 flex items-center gap-2">
        {icon} {title}
      </h2>
      {children}
    </section>
  );
}

function SkeletonGrid({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
      ))}
    </div>
  );
}

function StatCard({ label, value, color = "text-gray-900", hint }: { label: string; value: string; color?: string; hint?: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-semibold ${color}`}>{value}</p>
      {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

function SplitBar({ leftPercent, leftLabel, rightLabel }: { leftPercent: number; leftLabel: string; rightLabel: string }) {
  const rightPercent = 100 - leftPercent;
  return (
    <>
      <div className="flex rounded-full overflow-hidden h-6 text-xs font-medium">
        <div
          className="bg-green-400 flex items-center justify-center text-white transition-all"
          style={{ width: `${leftPercent}%` }}
        >
          {leftPercent > 10 && `${leftPercent}%`}
        </div>
        <div
          className="bg-red-300 flex items-center justify-center text-white transition-all"
          style={{ width: `${rightPercent}%` }}
        >
          {rightPercent > 10 && `${rightPercent.toFixed(1)}%`}
        </div>
      </div>
      <div className="flex gap-4 mt-2 text-xs text-gray-500">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-400 inline-block" /> {leftLabel}</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-300 inline-block" /> {rightLabel}</span>
      </div>
    </>
  );
}

function ConfusionMatrix({ conf }: { conf: { tp: number; fp: number; tn: number; fn: number } }) {
  const cell = "p-3 rounded-lg text-center";
  return (
    <div className="bg-gray-50 rounded-xl p-5">
      <p className="text-sm text-gray-600 mb-3">Confusion matrix — AI prediction vs rating-derived ground truth</p>
      <div className="grid grid-cols-[auto_1fr_1fr] gap-2 max-w-md text-sm">
        <div></div>
        <div className="text-xs text-center text-gray-500">Truth: Recommended</div>
        <div className="text-xs text-center text-gray-500">Truth: Not</div>

        <div className="text-xs text-gray-500 flex items-center">AI: Rec</div>
        <div className={`${cell} bg-emerald-100 text-emerald-800 font-semibold`}>{conf.tp}</div>
        <div className={`${cell} bg-amber-100 text-amber-800`}>{conf.fp}</div>

        <div className="text-xs text-gray-500 flex items-center">AI: Not</div>
        <div className={`${cell} bg-amber-100 text-amber-800`}>{conf.fn}</div>
        <div className={`${cell} bg-emerald-100 text-emerald-800 font-semibold`}>{conf.tn}</div>
      </div>
      <p className="text-[11px] text-gray-400 mt-3">
        Diagonal (TP + TN) = correct predictions. Off-diagonal = AI disagreed with rating.
      </p>
    </div>
  );
}

function TrendsChart({ trends }: { trends: TrendsResponse }) {
  const { width, height, padding } = { width: 760, height: 260, padding: 36 };

  // Collect all months across all brands for x-axis
  const allMonths = useMemo(() => {
    const set = new Set<string>();
    trends.brands.forEach((b) => trends.series[b]?.forEach((p) => set.add(p.month)));
    return Array.from(set).sort();
  }, [trends]);

  const x = (idx: number) =>
    padding + (allMonths.length <= 1 ? 0 : (idx * (width - 2 * padding)) / (allMonths.length - 1));
  const y = (rate: number) => height - padding - rate * (height - 2 * padding);

  const colors = ["#0ea5e9", "#f97316", "#84cc16", "#a855f7", "#ec4899"];

  return (
    <div className="bg-gray-50 rounded-xl p-5 overflow-x-auto">
      <svg width={width} height={height} className="text-gray-400">
        {/* y-axis grid + labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((r) => (
          <g key={r}>
            <line x1={padding} x2={width - padding} y1={y(r)} y2={y(r)} stroke="#e5e7eb" strokeDasharray="3 3" />
            <text x={4} y={y(r) + 4} fontSize={10} fill="#6b7280">{(r * 100).toFixed(0)}%</text>
          </g>
        ))}

        {/* x-axis: label first, middle, last */}
        {allMonths.length > 0 && [
          { i: 0, label: allMonths[0] },
          { i: Math.floor(allMonths.length / 2), label: allMonths[Math.floor(allMonths.length / 2)] },
          { i: allMonths.length - 1, label: allMonths[allMonths.length - 1] },
        ].map(({ i, label }) => (
          <text key={i} x={x(i)} y={height - padding + 18} fontSize={10} fill="#6b7280" textAnchor="middle">
            {label}
          </text>
        ))}

        {/* brand series */}
        {trends.brands.map((brand, bi) => {
          const points = trends.series[brand] ?? [];
          const pathData = points
            .map((p) => {
              const xi = allMonths.indexOf(p.month);
              return xi < 0 ? "" : `${x(xi)},${y(p.rate)}`;
            })
            .filter(Boolean)
            .join(" L ");
          return (
            <g key={brand}>
              {pathData && (
                <path d={`M ${pathData}`} fill="none" stroke={colors[bi % colors.length]} strokeWidth={2} opacity={0.85} />
              )}
              {points.map((p) => {
                const xi = allMonths.indexOf(p.month);
                if (xi < 0) return null;
                return <circle key={p.month} cx={x(xi)} cy={y(p.rate)} r={3} fill={colors[bi % colors.length]} />;
              })}
            </g>
          );
        })}
      </svg>
      <div className="flex flex-wrap gap-3 mt-3 text-xs">
        {trends.brands.map((brand, bi) => (
          <span key={brand} className="flex items-center gap-1.5 text-gray-700">
            <span
              className="w-3 h-3 rounded-full inline-block"
              style={{ backgroundColor: colors[bi % colors.length] }}
            />
            {brand}
          </span>
        ))}
      </div>
    </div>
  );
}

function PriceTierCard({ tier }: { tier: PriceTierStat }) {
  return (
    <div className="bg-gray-50 rounded-xl p-5">
      <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">{tier.tier}</p>
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-3xl font-semibold text-gray-900">{tier.recommend_rate_percent}%</span>
        <span className="text-xs text-gray-500">recommend rate</span>
      </div>
      <div className="space-y-1 text-xs text-gray-600">
        <div className="flex justify-between"><span>Avg rating</span><span>{tier.weighted_avg_rating.toFixed(2)} / 5</span></div>
        <div className="flex justify-between"><span>Verified buyers</span><span>{tier.verified_buyer_share_percent}%</span></div>
        <div className="flex justify-between"><span>Sample size</span><span>{tier.n_reviews.toLocaleString()}</span></div>
      </div>
    </div>
  );
}

function BrandRow({ brand: b }: { brand: BrandStat }) {
  return (
    <div className="flex items-center gap-4">
      <p className="text-sm text-gray-700 w-40 truncate flex-shrink-0">{b.brand_name}</p>
      <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
        <div
          className="bg-gray-800 h-full rounded-full transition-all"
          style={{ width: `${b.recommend_rate_percent}%` }}
        />
      </div>
      <p className="text-sm text-gray-600 w-12 text-right flex-shrink-0">{b.recommend_rate_percent}%</p>
      <p className="text-xs text-gray-400 w-16 text-right flex-shrink-0">
        ★ {b.avg_rating.toFixed(2)}
      </p>
      <p className="text-xs text-gray-400 w-20 text-right flex-shrink-0">
        {b.total_reviews} rev.
      </p>
    </div>
  );
}

function ComplaintsList({ complaints }: { complaints: { term: string; score: number }[] }) {
  const max = Math.max(...complaints.map((c) => c.score), 1e-9);
  return (
    <div className="space-y-2">
      {complaints.map((c) => (
        <div key={c.term} className="flex items-center gap-4">
          <p className="text-sm text-gray-700 w-48 truncate flex-shrink-0">{c.term}</p>
          <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
            <div
              className="bg-rose-400 h-full rounded-full transition-all"
              style={{ width: `${(c.score / max) * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 w-16 text-right flex-shrink-0">{c.score.toFixed(4)}</p>
        </div>
      ))}
    </div>
  );
}
