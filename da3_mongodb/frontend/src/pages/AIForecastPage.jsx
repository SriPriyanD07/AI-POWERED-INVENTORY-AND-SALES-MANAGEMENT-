import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  RefreshCw,
  Search,
  ShoppingCart,
  Sliders,
  Zap,
} from 'lucide-react';
import { api } from '../services/api';
import { StatCard } from '../components/Charts';

export default function AIForecastPage({ onNotify }) {
  const [overview, setOverview] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState(1);
  const [productForecast, setProductForecast] = useState(null);
  const [horizonDays, setHorizonDays] = useState(14);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('');

  const loadOverview = async () => {
    try {
      setLoadingOverview(true);
      const res = await api.getAIForecastOverview(7);
      setOverview(res);
      if (res?.products?.length > 0 && !selectedProductId) {
        setSelectedProductId(res.products[0].product_id);
      }
    } catch (err) {
      onNotify({
        type: 'error',
        title: 'Forecast Error',
        message: err.message || 'Could not load AI forecast overview',
      });
    } finally {
      setLoadingOverview(false);
    }
  };

  const loadProductDetail = async (prodId, days) => {
    try {
      setLoadingDetail(true);
      const res = await api.getProductAIForecast(prodId, days);
      setProductForecast(res);
    } catch (err) {
      onNotify({
        type: 'error',
        title: 'Detail Error',
        message: err.message || `Could not load forecast for SKU #${prodId}`,
      });
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  useEffect(() => {
    if (selectedProductId) {
      loadProductDetail(selectedProductId, horizonDays);
    }
  }, [selectedProductId, horizonDays]);

  const handleApplyThreshold = async (prodId) => {
    try {
      setActionLoading(true);
      const res = await api.applyAIRecommendation(prodId);
      onNotify({
        type: 'success',
        title: 'AI Rules Applied',
        message: `Updated reorder threshold to ${res.applied_threshold} units and batch to ${res.applied_batch_quantity} units.`,
      });
      loadOverview();
      loadProductDetail(prodId, horizonDays);
    } catch (err) {
      onNotify({
        type: 'error',
        title: 'Update Failed',
        message: err.message || 'Could not apply AI recommendation',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleGeneratePreventivePO = async (prodId) => {
    try {
      setActionLoading(true);
      const res = await api.generateAIPurchaseOrder(prodId);
      onNotify({
        type: 'success',
        title: 'Preventive PO Issued',
        message: `Generated Purchase Order #${res.po_number} for ${res.quantity_ordered} units to avert stockout!`,
      });
      loadOverview();
      loadProductDetail(prodId, horizonDays);
    } catch (err) {
      onNotify({
        type: 'error',
        title: 'PO Generation Failed',
        message: err.message || 'Could not issue preventive purchase order',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredProducts = (overview?.products || []).filter((p) => {
    if (riskFilter && p.stockout_risk !== riskFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return p.product_name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
  });

  // Confidence Bounds Time Series Chart Renderer
  const renderConfidenceChart = () => {
    if (!productForecast || !productForecast.forecast_points) {
      return (
        <div className="h-64 flex items-center justify-center text-[#52616B] text-xs">
          Select a product to view forecast curve.
        </div>
      );
    }

    const points = productForecast.forecast_points;
    const allVals = points.flatMap((p) => [p.lower_bound, p.predicted_quantity, p.upper_bound]);
    const maxVal = Math.max(...allVals, 10);
    const minVal = 0;
    const chartW = 600;
    const chartH = 220;
    const padX = 45;
    const padY = 25;

    const getX = (idx) => padX + (idx / Math.max(1, points.length - 1)) * (chartW - padX * 2);
    const getY = (val) => chartH - padY - ((val - minVal) / (maxVal - minVal)) * (chartH - padY * 2);

    // Predict Path
    const predPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p.predicted_quantity)}`).join(' ');
    // Upper Path
    const upperPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p.upper_bound)}`).join(' ');
    // Lower Path reverse for band
    const lowerRev = points
      .slice()
      .reverse()
      .map((p, i) => `L ${getX(points.length - 1 - i)} ${getY(p.lower_bound)}`)
      .join(' ');
    const bandPath = `${upperPath} ${lowerRev} Z`;

    return (
      <div className="w-full relative">
        <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-auto overflow-visible select-none">
          <defs>
            <linearGradient id="bandGradTeal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0F766E" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#0F766E" stopOpacity="0.04" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.5, 1].map((pct, i) => {
            const y = chartH - padY - pct * (chartH - padY * 2);
            return (
              <g key={i}>
                <line x1={padX} y1={y} x2={chartW - padX} y2={y} stroke="#DCE4E1" strokeDasharray="3 3" />
                <text x={padX - 8} y={y + 4} textAnchor="end" className="text-[10px] fill-[#52616B] font-mono">
                  {Math.round(pct * maxVal)}
                </text>
              </g>
            );
          })}

          {/* 95% Confidence Band */}
          <path d={bandPath} fill="url(#bandGradTeal)" />

          {/* Predicted Demand Trend Line */}
          <path d={predPath} fill="none" stroke="#0F766E" strokeWidth="2.5" strokeLinecap="round" />

          {/* Interactive dots */}
          {points.map((p, i) => (
            <g key={i} className="group cursor-pointer">
              <circle
                cx={getX(i)}
                cy={getY(p.predicted_quantity)}
                r={3.5}
                className="fill-white stroke-[#0F766E] stroke-2 hover:r-5 transition-all"
              />
              {i % 2 === 0 && (
                <text
                  x={getX(i)}
                  y={chartH - 8}
                  textAnchor="middle"
                  className="text-[9px] fill-[#52616B] font-mono"
                >
                  {p.date.slice(5)}
                </text>
              )}
            </g>
          ))}
        </svg>

        <div className="flex items-center justify-between text-[11px] text-[#52616B] mt-2 px-2 border-t border-[#DCE4E1] pt-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-3 h-0.5 bg-[#0F766E] inline-block"></span>
              Predicted Velocity
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-3 h-2 bg-teal-100 border border-teal-200 inline-block rounded-xs"></span>
              95% Confidence Interval
            </span>
          </div>
          <span className="font-bold text-[#0F766E] font-mono">
            Cumulative Period Demand: {productForecast.metrics.forecast_period_demand} units
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="px-6 py-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-teal-50 text-[#0F766E] border border-teal-200 font-bold">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-[#17212B] tracking-tight">AI Demand Forecasting & Optimization</h2>
              <p className="text-xs text-[#52616B] font-medium mt-0.5">
                Empirical consumption velocity, 95% confidence intervals, and safety stock tuning
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={loadOverview}
          className="flex items-center gap-1.5 bg-[#0F766E] hover:bg-[#115E59] text-white px-3.5 py-2 rounded-lg text-xs font-semibold border border-[#0F766E] transition-colors self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingOverview ? 'animate-spin' : ''}`} />
          <span>Re-compute Models</span>
        </button>
      </div>

      {/* Top AI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Portfolio Health"
          value={`${overview?.portfolio_health_score ?? 90}%`}
          subtitle="Stock Coverage Index"
          icon={ShieldCheck}
          color="sage"
        />
        <StatCard
          title="7-Day Predicted Units"
          value={overview?.total_predicted_units?.toLocaleString() ?? 0}
          subtitle="Aggregated catalog demand"
          icon={TrendingUp}
          color="teal"
        />
        <StatCard
          title="Stockout Risk Alerts"
          value={overview?.high_stockout_risk_count ?? 0}
          subtitle="SKUs depleting in <3 days"
          icon={AlertTriangle}
          color={overview?.high_stockout_risk_count > 0 ? 'rose' : 'emerald'}
        />
        <StatCard
          title="Actionable Reorders"
          value={overview?.reorder_action_required_count ?? 0}
          subtitle="Recommended batch POs"
          icon={Zap}
          color="amber"
        />
      </div>

      {/* Main Grid: SKU Forecast Curve & Operations Research Panel */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left 2 Cols: Time-Series Visual Curve */}
        <div className="xl:col-span-2 bg-white rounded-xl p-5 border border-[#DCE4E1] space-y-4 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DCE4E1]">
            <div>
              <h3 className="font-bold text-[#17212B] text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#0F766E]" />
                <span>Demand Prediction Curve</span>
              </h3>
              <p className="text-xs text-[#52616B] font-medium mt-0.5">
                Rolling regression & velocity with 95% confidence intervals
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Product Selector */}
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(Number(e.target.value))}
                className="px-2.5 py-1.5 bg-white border border-[#DCE4E1] rounded-lg text-xs font-semibold text-[#17212B] max-w-[200px] sm:max-w-[240px] truncate"
              >
                {(overview?.products || []).map((p) => (
                  <option key={p.product_id} value={p.product_id}>
                    {p.product_name} ({p.sku})
                  </option>
                ))}
              </select>

              {/* Horizon Switcher */}
              <select
                value={horizonDays}
                onChange={(e) => setHorizonDays(Number(e.target.value))}
                className="px-2.5 py-1.5 bg-white border border-[#DCE4E1] rounded-lg text-xs font-semibold text-[#17212B]"
              >
                <option value={7}>7 Days</option>
                <option value={14}>14 Days</option>
                <option value={30}>30 Days</option>
              </select>
            </div>
          </div>

          {loadingDetail ? (
            <div className="h-64 flex flex-col items-center justify-center text-[#52616B]">
              <RefreshCw className="w-6 h-6 animate-spin text-[#0F766E] mb-2" />
              <p className="text-xs font-medium">Computing time-series projection and confidence bounds...</p>
            </div>
          ) : (
            renderConfidenceChart()
          )}
        </div>

        {/* Right Col: AI Insights & Recommendation Action Card */}
        <div className="bg-white rounded-xl p-5 border border-[#DCE4E1] flex flex-col justify-between space-y-4 min-w-0">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE4E1]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#0F766E]" />
                <h3 className="font-bold text-[#17212B] text-sm">Stockout Risk Analysis</h3>
              </div>
              {productForecast && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${
                    productForecast.insights.stockout_risk_level === 'HIGH'
                      ? 'bg-rose-50 text-[#B91C1C] border-rose-200'
                      : productForecast.insights.stockout_risk_level === 'MEDIUM'
                      ? 'bg-amber-50 text-[#B45309] border-amber-200'
                      : 'bg-emerald-50 text-[#15803D] border-emerald-200'
                  }`}
                >
                  {productForecast.insights.stockout_risk_level} RISK
                </span>
              )}
            </div>

            {productForecast && (
              <>
                <p className="text-xs text-[#17212B] font-medium leading-relaxed bg-[#F5F7F6] p-3 rounded-lg border border-[#DCE4E1] break-words">
                  {productForecast.insights.ai_summary}
                </p>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-[#DCE4E1] gap-2">
                    <span className="text-[#52616B] font-medium">Average Daily Burn Rate:</span>
                    <span className="font-bold text-[#17212B] shrink-0">{productForecast.metrics.daily_velocity} units/day</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#DCE4E1] gap-2">
                    <span className="text-[#52616B] font-medium">Estimated Stock Runway:</span>
                    <span
                      className={`font-bold shrink-0 ${
                        productForecast.metrics.runout_days <= 3 ? 'text-[#B91C1C]' : 'text-[#17212B]'
                      }`}
                    >
                      {productForecast.metrics.runout_days} days
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#DCE4E1] gap-2">
                    <span className="text-[#52616B] font-medium">Current Total Stock:</span>
                    <span className="font-semibold text-[#17212B] text-right">
                      {productForecast.inventory.total_on_hand} units ({productForecast.inventory.shelf_stock} Shelf +{' '}
                      {productForecast.inventory.warehouse_stock} WH)
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#DCE4E1] gap-2">
                    <span className="text-[#52616B] font-medium">Suggested Safety Stock:</span>
                    <span className="font-bold text-[#0F766E] shrink-0">
                      {productForecast.recommendations.suggested_safety_stock} units
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#DCE4E1] gap-2">
                    <span className="text-[#52616B] font-medium">Optimal Reorder Point:</span>
                    <span className="font-bold text-[#0F766E] shrink-0">
                      {productForecast.recommendations.suggested_reorder_threshold} units
                    </span>
                  </div>
                  <div className="flex justify-between py-1 gap-2">
                    <span className="text-[#52616B] font-medium">Suggested Batch Quantity:</span>
                    <span className="font-bold text-[#0F766E] shrink-0">
                      +{productForecast.recommendations.suggested_reorder_quantity} units
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2 border-t border-[#DCE4E1]">
            <button
              onClick={() => handleApplyThreshold(selectedProductId)}
              disabled={actionLoading}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-[#F5F7F6] hover:bg-[#EAEFEc] text-[#0F766E] border border-[#DCE4E1] rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Apply AI Threshold Calibration</span>
            </button>

            <button
              onClick={() => handleGeneratePreventivePO(selectedProductId)}
              disabled={actionLoading}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-[#0F766E] hover:bg-[#115E59] text-white border border-[#0F766E] rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Issue Preventive Purchase Order</span>
            </button>
          </div>
        </div>
      </div>

      {/* Portfolio Matrix & Reorder Optimization Table */}
      <div className="bg-white rounded-xl border border-[#DCE4E1] p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-[#17212B] text-sm">Catalog Demand Matrix & Stockout Projections</h3>
            <p className="text-xs text-[#52616B] font-medium mt-0.5">
              Evaluated across lead times, forecasted burn rates, and inventory thresholds
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-[#52616B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search SKU or product..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#DCE4E1] rounded-lg text-xs text-[#17212B] placeholder-[#52616B]"
              />
            </div>

            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-[#DCE4E1] rounded-lg text-xs font-semibold text-[#17212B]"
            >
              <option value="">All Risk Levels</option>
              <option value="HIGH">High Risk Only</option>
              <option value="MEDIUM">Medium Risk</option>
              <option value="LOW">Low Risk</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#DCE4E1] bg-[#F5F7F6] text-[11px] font-bold text-[#52616B] uppercase tracking-wider">
                <th className="py-2.5 px-3">SKU / Product</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3 text-center">On-Hand Stock</th>
                <th className="py-2.5 px-3 text-center">Daily Burn</th>
                <th className="py-2.5 px-3 text-center">7-Day Demand</th>
                <th className="py-2.5 px-3 text-center">Runway</th>
                <th className="py-2.5 px-3 text-center">Stockout Risk</th>
                <th className="py-2.5 px-3 text-center">AI ROP / Batch</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE4E1]">
              {filteredProducts.map((p) => {
                const isSelected = p.product_id === selectedProductId;
                return (
                  <tr
                    key={p.product_id}
                    className={`hover:bg-[#F5F7F6] transition-colors cursor-pointer ${
                      isSelected ? 'bg-teal-50/60 font-medium' : ''
                    }`}
                    onClick={() => setSelectedProductId(p.product_id)}
                  >
                    <td className="py-2.5 px-3 min-w-[160px]">
                      <div className="font-semibold text-[#17212B] line-clamp-1" title={p.product_name}>{p.product_name}</div>
                      <span className="text-[10px] font-mono text-[#52616B]">{p.sku}</span>
                    </td>
                    <td className="py-2.5 px-3 text-[#52616B] font-medium whitespace-nowrap">{p.category_name}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-[#17212B] whitespace-nowrap">{p.current_stock} units</td>
                    <td className="py-2.5 px-3 text-center font-mono text-[#52616B] whitespace-nowrap">{p.daily_demand_rate}/day</td>
                    <td className="py-2.5 px-3 text-center font-bold text-[#0F766E] whitespace-nowrap">+{p.forecast_period_demand}</td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <span
                        className={`font-bold ${
                          p.runout_days <= 3
                            ? 'text-[#B91C1C]'
                            : p.runout_days <= 7
                            ? 'text-[#B45309]'
                            : 'text-[#17212B]'
                        }`}
                      >
                        {p.runout_days}d
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          p.stockout_risk === 'HIGH'
                            ? 'bg-rose-50 text-[#B91C1C] border-rose-200'
                            : p.stockout_risk === 'MEDIUM'
                            ? 'bg-amber-50 text-[#B45309] border-amber-200'
                            : 'bg-emerald-50 text-[#15803D] border-emerald-200'
                        }`}
                      >
                        {p.stockout_risk}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-[11px] text-[#52616B] whitespace-nowrap">
                      {p.recommended_threshold} min / +{p.recommended_batch}
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleApplyThreshold(p.product_id)}
                          className="px-2 py-1 bg-[#F5F7F6] hover:bg-[#EAEFEc] text-[#0F766E] rounded text-[10px] font-bold border border-[#DCE4E1] transition-colors"
                          title="Apply AI Thresholds"
                        >
                          Tune
                        </button>
                        {p.needs_action && (
                          <button
                            onClick={() => handleGeneratePreventivePO(p.product_id)}
                            className="px-2 py-1 bg-[#0F766E] hover:bg-[#115E59] text-white rounded text-[10px] font-bold border border-[#0F766E] transition-colors"
                            title="Preventive PO"
                          >
                            Auto PO
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
