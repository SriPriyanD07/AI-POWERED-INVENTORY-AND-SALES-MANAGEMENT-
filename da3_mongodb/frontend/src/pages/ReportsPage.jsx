import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Award,
  Layers,
  IndianRupee,
  TrendingUp,
  Download,
  Printer,
  RefreshCw,
  Building,
  Store,
} from 'lucide-react';
import { api } from '../services/api';
import { BarChart, StatCard } from '../components/Charts';

export default function ReportsPage({ onNotify }) {
  const [categoryRevenue, setCategoryRevenue] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [valuation, setValuation] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const [catRes, bestRes, valRes] = await Promise.all([
        api.getCategoryRevenue(),
        api.getBestSellers(10),
        api.getInventoryValuation(),
      ]);
      setCategoryRevenue(catRes || []);
      setBestSellers(bestRes || []);
      setValuation(valRes || []);
    } catch (err) {
      onNotify({
        type: 'error',
        title: 'Error Loading Reports',
        message: err.message || 'Could not fetch aggregation reports',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const totalCatRevenue = categoryRevenue.reduce((sum, c) => sum + (c.revenue || 0), 0);
  const totalValuation = valuation.reduce((sum, v) => sum + (v.total_valuation || 0), 0);
  const totalStockUnits = valuation.reduce((sum, v) => sum + (v.total_units || 0), 0);

  return (
    <div className="px-6 py-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#17212B]">Executive Analytics & Reports</h2>
          <p className="text-xs text-[#52616B]">
            High-performance MongoDB aggregation pipelines: Category revenue, bestsellers, and facility asset valuation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[#DCE4E1] text-[#17212B] hover:bg-[#F5F7F6] rounded-xl text-xs font-semibold shadow-none transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
          <button
            onClick={fetchReports}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-xl text-xs font-semibold shadow-none border border-[#0F766E] transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Re-compute Aggregations</span>
          </button>
        </div>
      </div>

      {/* High Level KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Aggregated Sales"
          value={`₹${totalCatRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          subtitle="Sum of completed receipts"
          icon={IndianRupee}
          color="emerald"
        />
        <StatCard
          title="Total Stock Valuation"
          value={`₹${totalValuation.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          subtitle="Asset value at standard cost"
          icon={Layers}
          color="sage"
        />
        <StatCard
          title="Total Units Managed"
          value={totalStockUnits.toLocaleString()}
          subtitle="Across shelves and warehouses"
          icon={Building}
          color="teal"
        />
      </div>

      {/* Grid: Category Revenue & Best Sellers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Revenue Breakdown */}
        <div className="bg-white rounded-xl border border-[#DCE4E1] shadow-none p-5 space-y-4 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#0F766E]" />
              <h3 className="font-bold text-[#17212B] text-base">Category Revenue Performance</h3>
            </div>
            <span className="text-[11px] font-mono text-[#52616B]">Pipeline: $unwind &rarr; $group</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#DCE4E1] bg-[#F5F7F6] text-[11px] font-semibold text-[#52616B] uppercase tracking-wider">
                  <th className="py-2.5 px-3 whitespace-nowrap">Category</th>
                  <th className="py-2.5 px-3 text-center whitespace-nowrap">Units Sold</th>
                  <th className="py-2.5 px-3 text-right whitespace-nowrap">Revenue (₹)</th>
                  <th className="py-2.5 px-3 text-right whitespace-nowrap">Revenue Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE4E1]">
                {categoryRevenue.map((cat, idx) => {
                  const pct = totalCatRevenue > 0 ? ((cat.revenue / totalCatRevenue) * 100).toFixed(1) : 0;
                  return (
                    <tr key={idx} className="hover:bg-[#F5F7F6]/60 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-[#17212B] whitespace-nowrap">{cat.category_name}</td>
                      <td className="py-2.5 px-3 text-center text-[#52616B] whitespace-nowrap">{cat.units_sold}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-[#15803D] whitespace-nowrap">
                        ₹{cat.revenue.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <span className="font-mono text-[11px] bg-[#F5F7F6] text-[#17212B] border border-[#DCE4E1] px-2 py-0.5 rounded">
                          {pct}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Best-Selling Products */}
        <div className="bg-white rounded-xl border border-[#DCE4E1] shadow-none p-5 space-y-4 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-[#B45309]" />
              <h3 className="font-bold text-[#17212B] text-base">Top 10 Best-Selling Products</h3>
            </div>
            <span className="text-[11px] font-mono text-[#52616B]">Ranked by Units Sold</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#DCE4E1] bg-[#F5F7F6] text-[11px] font-semibold text-[#52616B] uppercase tracking-wider">
                  <th className="py-2.5 px-3 whitespace-nowrap">Rank / SKU</th>
                  <th className="py-2.5 px-3">Product Name</th>
                  <th className="py-2.5 px-3 text-center whitespace-nowrap">Units Sold</th>
                  <th className="py-2.5 px-3 text-right whitespace-nowrap">Gross Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE4E1]">
                {bestSellers.map((item, idx) => (
                  <tr key={idx} className="hover:bg-[#F5F7F6]/60 transition-colors">
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="font-bold text-[#17212B]">#{idx + 1}</span>{' '}
                      <span className="font-mono text-[11px] text-[#0F766E] font-medium">{item.sku}</span>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-[#17212B] min-w-[150px]">
                      <div className="line-clamp-1" title={item.product_name}>{item.product_name}</div>
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-[#0F766E] whitespace-nowrap">{item.units_sold}</td>
                    <td className="py-2.5 px-3 text-right font-extrabold text-[#17212B] whitespace-nowrap">
                      ₹{item.gross_revenue?.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Inventory Valuation by Location Table */}
      <div className="bg-white rounded-xl border border-[#DCE4E1] shadow-none p-5 space-y-4 min-w-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#0F766E]" />
            <h3 className="font-bold text-[#17212B] text-base">Inventory Valuation by Location & Facility Type</h3>
          </div>
          <span className="text-xs text-[#52616B]">Computed via: $lookup(products) × quantity_on_hand</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#DCE4E1] bg-[#F5F7F6] text-[11px] font-semibold text-[#52616B] uppercase tracking-wider">
                <th className="py-3 px-4 whitespace-nowrap">Facility Type</th>
                <th className="py-3 px-4">Location Code & Name</th>
                <th className="py-3 px-4 text-center whitespace-nowrap">Unique SKUs</th>
                <th className="py-3 px-4 text-center whitespace-nowrap">Physical Units</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Total Valuation (₹)</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Asset Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE4E1]">
              {valuation.map((val, idx) => {
                const isWarehouse = val.location_type === 'WAREHOUSE';
                const share = totalValuation > 0 ? ((val.total_valuation / totalValuation) * 100).toFixed(1) : 0;
                return (
                  <tr key={idx} className="hover:bg-[#F5F7F6]/60 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                          isWarehouse
                            ? 'bg-[#E4EBE7] text-[#40574D] border-[#C8D6CF]'
                            : 'bg-teal-50 text-[#0F766E] border-teal-200'
                        }`}
                      >
                        {isWarehouse ? <Building className="w-3 h-3" /> : <Store className="w-3 h-3" />}
                        {val.location_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 min-w-[160px]">
                      <div className="font-semibold text-[#17212B]">{val.location_name}</div>
                      <span className="text-[11px] font-mono text-[#52616B]">{val.location_code}</span>
                    </td>
                    <td className="py-3 px-4 text-center font-medium text-[#52616B] whitespace-nowrap">{val.unique_skus}</td>
                    <td className="py-3 px-4 text-center font-bold text-[#17212B] whitespace-nowrap">{val.total_units} units</td>
                    <td className="py-3 px-4 text-right font-extrabold text-[#17212B] whitespace-nowrap">
                      ₹{val.total_valuation?.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[#52616B] whitespace-nowrap">{share}%</td>
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
