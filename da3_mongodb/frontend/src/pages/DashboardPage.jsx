import React, { useEffect, useState } from 'react';
import {
  Package,
  Layers,
  IndianRupee,
  AlertTriangle,
  FileText,
  TrendingUp,
  Clock,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import { StatCard, LineChart, BarChart } from '../components/Charts';

export default function DashboardPage({ setActiveTab, onNotify }) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [dailySales, setDailySales] = useState([]);
  const [categoryRev, setCategoryRev] = useState([]);
  const [lowStock, setLowStock] = useState({ shelf_below_threshold: [], warehouse_below_threshold: [] });
  const [recentSales, setRecentSales] = useState([]);
  const [forecastOverview, setForecastOverview] = useState(null);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [sumRes, dailyRes, catRes, lowRes, salesRes, forecastRes] = await Promise.all([
        api.getAnalyticsSummary(),
        api.getDailySales(),
        api.getCategoryRevenue(),
        api.getLowStock(),
        api.getSalesHistory({ limit: 5 }),
        api.getAIForecastOverview().catch(() => null),
      ]);
      setSummary(sumRes);
      setDailySales(dailyRes || []);
      setCategoryRev(catRes || []);
      setLowStock(lowRes || { shelf_below_threshold: [], warehouse_below_threshold: [] });
      setRecentSales(salesRes || []);
      setForecastOverview(forecastRes || null);
    } catch (err) {
      onNotify({
        type: 'error',
        title: 'Dashboard Load Error',
        message: err.message || 'Failed to fetch dashboard metrics',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading && !summary) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-3 border-[#0F766E] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[#52616B] text-xs mt-3 font-medium">Aggregating live MongoDB collections...</p>
      </div>
    );
  }

  const shelfAlerts = lowStock?.shelf_below_threshold || [];
  const warehouseAlerts = lowStock?.warehouse_below_threshold || [];
  const totalLowStock = shelfAlerts.length + warehouseAlerts.length;

  return (
    <div className="px-6 py-6 space-y-6 max-w-7xl mx-auto">
      {!summary && !loading && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900 text-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Unable to reach the live API. If using Render free tier, the backend may be waking up from sleep (typically 30–50 seconds).
            </span>
          </div>
          <button
            onClick={loadDashboardData}
            className="px-3 py-1.5 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-lg font-semibold shrink-0 transition-colors shadow-sm"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* 5 Operational KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard
          title="Total Products"
          value={summary?.total_products ?? 0}
          subtitle="Active Catalog SKUs"
          icon={Package}
          color="teal"
        />
        <StatCard
          title="Stock Units"
          value={summary?.inventory?.total_physical_units?.toLocaleString() ?? 0}
          subtitle={`Valuation: ₹${(summary?.inventory?.total_inventory_value_inr || 0).toLocaleString()}`}
          icon={Layers}
          color="sage"
        />
        <StatCard
          title="Sales Revenue"
          value={`₹${(summary?.sales?.total_revenue_inr || 0).toLocaleString()}`}
          subtitle={`${summary?.sales?.total_completed_sales || 0} POS orders`}
          icon={IndianRupee}
          color="emerald"
        />
        <StatCard
          title="Low-Stock Alerts"
          value={totalLowStock}
          subtitle={`${shelfAlerts.length} Shelf, ${warehouseAlerts.length} WH`}
          icon={AlertTriangle}
          color={totalLowStock > 0 ? 'rose' : 'emerald'}
        />
        <StatCard
          title="Pending POs"
          value={summary?.pending_purchase_orders ?? 0}
          subtitle="Inbound Orders"
          icon={FileText}
          color="amber"
        />
      </div>

      {/* Integrated Compact AI Insights Panel */}
      {forecastOverview && (
        <div
          className="rounded-xl p-3.5 sm:px-5 sm:py-3 text-white border border-[#2F6F68] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
          style={{ background: 'linear-gradient(110deg, #115E59 0%, #2F6F68 55%, #17212B 100%)' }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-white/10 rounded-lg text-teal-200 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-200 bg-white/10 px-2 py-0.5 rounded">
                  Predictive Inventory Intelligence
                </span>
                {forecastOverview.high_stockout_risk_count > 0 && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-200 bg-rose-500/30 px-2 py-0.5 rounded border border-rose-400/30">
                    {forecastOverview.high_stockout_risk_count} SKUs Near Stockout
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-200 mt-1 font-medium truncate sm:whitespace-normal">
                Autonomous regression tracking daily velocity, safety buffers, and lead-time replenishment.
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('ai_forecast')}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-colors border border-white/20 flex items-center gap-1.5"
          >
            <span>View Forecasts</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Sales Trend */}
        <div className="xl:col-span-2 bg-white rounded-xl p-5 border border-[#DCE4E1] flex flex-col justify-between min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="font-bold text-[#17212B] text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#0F766E]" />
                Daily Sales Revenue
              </h3>
              <p className="text-xs text-[#52616B] font-medium mt-0.5">Real-time aggregate from sales_transactions</p>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 bg-emerald-50 text-[#15803D] rounded border border-emerald-200 self-start sm:self-auto">
              Live Aggregate
            </span>
          </div>
          <div className="min-w-0">
            <LineChart data={dailySales} xKey="date" yKey="revenue" height={210} />
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-xl p-5 border border-[#DCE4E1] flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-[#17212B] text-sm">Category Revenue</h3>
              <p className="text-xs text-[#52616B] font-medium mt-0.5">Gross revenue by product line</p>
            </div>
          </div>
          <div className="min-w-0">
            <BarChart
              data={categoryRev.slice(0, 5)}
              xKey="category_name"
              yKey="revenue"
              height={210}
              color="bg-[#0F766E]"
              formatValue={(v) => `₹${v.toLocaleString()}`}
            />
          </div>
        </div>
      </div>

      {/* Bottom Grid: Low Stock Alerts & Recent Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Watchlist */}
        <div className="bg-white rounded-xl p-5 border border-[#DCE4E1] flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2 min-w-0 pr-2">
                <AlertTriangle className="w-4 h-4 text-[#B45309] shrink-0" />
                <h3 className="font-bold text-[#17212B] text-sm truncate">Inventory Threshold Alerts</h3>
              </div>
              <button
                onClick={() => setActiveTab('reorders')}
                className="text-xs font-semibold text-[#0F766E] hover:text-[#115E59] flex items-center gap-1 transition-colors shrink-0"
              >
                <span>Reorder Mgmt</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {totalLowStock === 0 ? (
              <div className="p-6 text-center bg-[#F5F7F6] rounded-lg border border-[#DCE4E1]">
                <ShieldCheck className="w-7 h-7 text-[#15803D] mx-auto mb-1.5" />
                <p className="text-xs font-bold text-[#17212B]">Healthy Stock Levels</p>
                <p className="text-[11px] text-[#52616B] mt-0.5 font-medium">All retail shelves and warehouse bins are above safety thresholds.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                {shelfAlerts.map((item, idx) => (
                  <div
                    key={`shelf-${idx}`}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-[#F5F7F6] border border-[#DCE4E1] text-xs gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-[#17212B] truncate" title={item.product_name}>{item.product_name}</div>
                      <div className="text-[#52616B] text-[11px] font-medium truncate">
                        Location: <span className="font-mono font-semibold text-[#17212B]">{item.location_code} (Shelf)</span> • SKU: {item.sku}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold text-[#B91C1C]">
                        {item.quantity_on_hand} / {item.reorder_threshold} min
                      </div>
                      <span className="text-[10px] text-[#B45309] font-semibold">Deficit: -{item.deficit}</span>
                    </div>
                  </div>
                ))}
                {warehouseAlerts.map((item, idx) => (
                  <div
                    key={`wh-${idx}`}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-[#F5F7F6] border border-[#DCE4E1] text-xs gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-[#17212B] truncate" title={item.product_name}>{item.product_name}</div>
                      <div className="text-[#52616B] text-[11px] font-medium truncate">
                        Location: <span className="font-mono font-semibold text-[#17212B]">{item.location_code} (Warehouse)</span> • SKU: {item.sku}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold text-[#B91C1C]">
                        {item.quantity_on_hand} / {item.reorder_threshold} min
                      </div>
                      <span className="text-[10px] text-[#B91C1C] font-semibold">Requires PO: +{item.reorder_quantity}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Completed Sales */}
        <div className="bg-white rounded-xl p-5 border border-[#DCE4E1] flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2 min-w-0 pr-2">
                <Clock className="w-4 h-4 text-[#52616B] shrink-0" />
                <h3 className="font-bold text-[#17212B] text-sm truncate">Recent Sales Receipts</h3>
              </div>
              <button
                onClick={() => setActiveTab('sales')}
                className="text-xs font-semibold text-[#0F766E] hover:text-[#115E59] flex items-center gap-1 transition-colors shrink-0"
              >
                <span>POS Terminal</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {recentSales.length === 0 ? (
              <div className="p-6 text-center bg-[#F5F7F6] rounded-lg border border-[#DCE4E1]">
                <p className="text-xs text-[#52616B] font-medium">No sales transactions found.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#DCE4E1] max-h-[280px] overflow-y-auto pr-1">
                {recentSales.map((sale, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between text-xs gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-[#17212B] font-mono truncate">{sale.receipt_number}</div>
                      <div className="text-[11px] text-[#52616B] font-medium truncate">
                        {new Date(sale.transaction_date).toLocaleString()} • {sale.items?.length || 0} item(s)
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold text-[#17212B]">₹{sale.total_amount?.toLocaleString()}</div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-[#15803D] font-bold border border-emerald-200">
                        {sale.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
