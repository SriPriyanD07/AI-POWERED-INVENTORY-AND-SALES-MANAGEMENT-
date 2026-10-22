import React, { useState, useEffect } from 'react';
import {
  Layers,
  ArrowRightLeft,
  Sliders,
  History,
  AlertTriangle,
  Building,
  Store,
  RefreshCw,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../services/api';
import Modal from '../components/Modal';

export default function InventoryPage({ onNotify }) {
  const [activeView, setActiveView] = useState('ALL'); // ALL, SHELF, WAREHOUSE
  const [stockList, setStockList] = useState([]);
  const [locations, setLocations] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isThresholdModalOpen, setIsThresholdModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Transfer Form state
  const [transferForm, setTransferForm] = useState({
    product_id: '',
    from_location_id: '',
    to_location_id: '',
    quantity: 10,
    employee_id: 5,
    triggered_by: 'MANUAL_DASHBOARD_DISPATCH',
  });

  // Threshold Form state
  const [thresholdForm, setThresholdForm] = useState({
    reorder_threshold: 15,
    reorder_quantity: 30,
  });

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (activeView !== 'ALL') params.location_type = activeView;

      const [stockRes, locsRes, txRes] = await Promise.all([
        api.getAllStock(params),
        api.getLocations(),
        api.getInventoryTransactions(25),
      ]);
      setStockList(stockRes || []);
      setLocations(locsRes || []);
      setTransactions(txRes || []);
    } catch (err) {
      onNotify({
        type: 'error',
        title: 'Inventory Data Error',
        message: err.message || 'Could not load inventory stock',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryData();
  }, [activeView]);

  const handleOpenTransfer = (prefillStock = null) => {
    const warehouseLoc = locations.find((l) => l.location_type === 'WAREHOUSE') || locations[0];
    const shelfLoc = locations.find((l) => l.location_type === 'SHELF') || locations[1];

    setTransferForm({
      product_id: prefillStock ? prefillStock.product_id : (stockList[0]?.product_id || 1),
      from_location_id: prefillStock?.location_type === 'SHELF' ? (warehouseLoc?.location_id || 1) : (prefillStock?.location_id || warehouseLoc?.location_id || 1),
      to_location_id: prefillStock?.location_type === 'SHELF' ? prefillStock.location_id : (shelfLoc?.location_id || 2),
      quantity: 15,
      employee_id: 5,
      triggered_by: 'MANUAL_DASHBOARD_DISPATCH',
    });
    setIsTransferModalOpen(true);
  };

  const handleOpenThreshold = (stock) => {
    setSelectedStock(stock);
    setThresholdForm({
      reorder_threshold: stock.reorder_threshold,
      reorder_quantity: stock.reorder_quantity,
    });
    setIsThresholdModalOpen(true);
  };

  const handleExecuteTransfer = async (e) => {
    e.preventDefault();
    if (Number(transferForm.from_location_id) === Number(transferForm.to_location_id)) {
      onNotify({
        type: 'error',
        title: 'Invalid Transfer',
        message: 'Source and destination locations cannot be identical',
      });
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.transferStock({
        product_id: Number(transferForm.product_id),
        from_location_id: Number(transferForm.from_location_id),
        to_location_id: Number(transferForm.to_location_id),
        quantity: Number(transferForm.quantity),
        employee_id: Number(transferForm.employee_id),
        triggered_by: transferForm.triggered_by,
      });

      onNotify({
        type: 'success',
        title: 'Stock Transferred',
        message: `Successfully moved ${transferForm.quantity} units from Loc #${transferForm.from_location_id} to Loc #${transferForm.to_location_id}`,
      });
      setIsTransferModalOpen(false);
      fetchInventoryData();
    } catch (err) {
      onNotify({
        type: 'error',
        title: 'Transfer Failed',
        message: err.message || 'Error executing inventory transfer',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveThreshold = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.updateThresholds(selectedStock.location_id, selectedStock.product_id, {
        reorder_threshold: Number(thresholdForm.reorder_threshold),
        reorder_quantity: Number(thresholdForm.reorder_quantity),
      });

      onNotify({
        type: 'success',
        title: 'Thresholds Updated',
        message: `Updated reorder safety rules for ${selectedStock.product_name} at ${selectedStock.location_code}`,
      });
      setIsThresholdModalOpen(false);
      fetchInventoryData();
    } catch (err) {
      onNotify({
        type: 'error',
        title: 'Threshold Update Failed',
        message: err.message || 'Error updating thresholds',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredStock = stockList.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.product_name?.toLowerCase().includes(q) ||
      s.sku?.toLowerCase().includes(q) ||
      s.location_code?.toLowerCase().includes(q) ||
      s.location_name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="px-6 py-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#17212B] tracking-tight">Inventory Stock & Location Bins</h2>
          <p className="text-xs text-[#52616B] font-medium mt-0.5">
            Real-time multi-location tracking: Warehouse replenishment, retail shelves, and audit ledger
          </p>
        </div>

        <button
          onClick={() => handleOpenTransfer()}
          className="flex items-center gap-1.5 bg-[#0F766E] hover:bg-[#115E59] text-white px-3.5 py-2 rounded-lg text-xs font-semibold border border-[#0F766E] transition-colors self-start md:self-auto"
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>Transfer Stock</span>
        </button>
      </div>

      {/* View Switcher & Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-[#DCE4E1] flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-1 bg-[#F5F7F6] p-1 rounded-lg w-full md:w-auto border border-[#DCE4E1]">
          <button
            onClick={() => setActiveView('ALL')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeView === 'ALL' ? 'bg-white text-[#17212B] shadow-xs' : 'text-[#52616B] hover:text-[#17212B]'
            }`}
          >
            All Locations
          </button>
          <button
            onClick={() => setActiveView('SHELF')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeView === 'SHELF' ? 'bg-white text-[#17212B] shadow-xs' : 'text-[#52616B] hover:text-[#17212B]'
            }`}
          >
            <Store className="w-3.5 h-3.5 text-[#0F766E]" />
            <span>Retail Shelves</span>
          </button>
          <button
            onClick={() => setActiveView('WAREHOUSE')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeView === 'WAREHOUSE' ? 'bg-white text-[#17212B] shadow-xs' : 'text-[#52616B] hover:text-[#17212B]'
            }`}
          >
            <Building className="w-3.5 h-3.5 text-[#6B9080]" />
            <span>Warehouses</span>
          </button>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-[#52616B] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search stock by SKU, product, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#DCE4E1] rounded-lg text-xs text-[#17212B] placeholder-[#52616B]"
          />
        </div>
      </div>

      {/* Stock Table */}
      <div className="bg-white rounded-xl border border-[#DCE4E1] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[#52616B]">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0F766E]" />
            <p className="text-xs font-medium">Querying MongoDB inventory_stock...</p>
          </div>
        ) : filteredStock.length === 0 ? (
          <div className="p-12 text-center text-[#52616B]">
            <Layers className="w-8 h-8 text-[#52616B] mx-auto mb-2" />
            <p className="text-sm font-bold text-[#17212B]">No stock entries found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#DCE4E1] bg-[#F5F7F6] text-[11px] font-bold text-[#52616B] uppercase tracking-wider">
                  <th className="py-2.5 px-3.5 whitespace-nowrap">Location</th>
                  <th className="py-2.5 px-3.5">Product / SKU</th>
                  <th className="py-2.5 px-3.5 whitespace-nowrap">Category</th>
                  <th className="py-2.5 px-3.5 text-center whitespace-nowrap">On Hand</th>
                  <th className="py-2.5 px-3.5 text-center whitespace-nowrap">Safety Threshold</th>
                  <th className="py-2.5 px-3.5 text-center whitespace-nowrap">Reorder Batch</th>
                  <th className="py-2.5 px-3.5 text-center whitespace-nowrap">Status</th>
                  <th className="py-2.5 px-3.5 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE4E1] text-xs">
                {filteredStock.map((s, idx) => {
                  const isLow = s.is_low_stock;
                  const isWarehouse = s.location_type === 'WAREHOUSE';

                  return (
                    <tr key={idx} className="hover:bg-[#F5F7F6] transition-colors">
                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className={`p-1.5 rounded border text-[10px] font-semibold shrink-0 ${
                              isWarehouse
                                ? 'bg-[#E4EBE7] text-[#2C3C35] border-[#C8D6CF]'
                                : 'bg-teal-50 text-[#0F766E] border-teal-200'
                            }`}
                          >
                            {s.location_code}
                          </span>
                          <div className="min-w-0">
                            <div className="font-semibold text-[#17212B] truncate">{s.location_name}</div>
                            <span className="text-[10px] text-[#52616B] font-medium">{s.location_type}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3.5 min-w-[170px]">
                        <div className="font-semibold text-[#17212B] line-clamp-1" title={s.product_name}>{s.product_name}</div>
                        <span className="text-[11px] font-mono text-[#52616B] font-semibold">{s.sku}</span>
                      </td>
                      <td className="py-2.5 px-3.5 text-[#52616B] font-medium whitespace-nowrap">{s.category_name}</td>
                      <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-xs ${
                            isLow ? 'bg-rose-50 text-[#B91C1C] font-extrabold border border-rose-200' : 'bg-slate-100 text-[#17212B]'
                          }`}
                        >
                          {s.quantity_on_hand}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-center text-[#52616B] font-medium whitespace-nowrap">{s.reorder_threshold} min</td>
                      <td className="py-2.5 px-3.5 text-center text-[#52616B] font-medium whitespace-nowrap">+{s.reorder_quantity}</td>
                      <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-[#B91C1C] border border-rose-200">
                            <AlertTriangle className="w-3 h-3 text-[#B91C1C]" />
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-[#15803D] border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-[#15803D]" />
                            Adequate
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenTransfer(s)}
                            className="px-2 py-1 text-[#17212B] hover:text-[#0F766E] hover:bg-[#F5F7F6] rounded-md border border-[#DCE4E1] text-xs font-semibold transition-colors flex items-center gap-1"
                            title="Transfer Stock"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                            <span>Transfer</span>
                          </button>
                          <button
                            onClick={() => handleOpenThreshold(s)}
                            className="p-1.5 text-[#52616B] hover:text-[#17212B] hover:bg-[#F5F7F6] rounded-md transition-colors"
                            title="Adjust Reorder Thresholds"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inventory Transactions Audit Ledger */}
      <div className="bg-white rounded-xl border border-[#DCE4E1] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#0F766E]" />
            <h3 className="font-bold text-[#17212B] text-sm">Inventory Audit Transactions</h3>
          </div>
          <span className="text-xs text-[#52616B] font-medium">Atomic updates ledger (inventory_transactions)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#DCE4E1] bg-[#F5F7F6] text-[11px] font-bold text-[#52616B] uppercase tracking-wider">
                <th className="py-2 px-3 whitespace-nowrap">Tx ID</th>
                <th className="py-2 px-3 whitespace-nowrap">Type</th>
                <th className="py-2 px-3">Product</th>
                <th className="py-2 px-3 whitespace-nowrap">Location</th>
                <th className="py-2 px-3 text-center whitespace-nowrap">Quantity Delta</th>
                <th className="py-2 px-3 whitespace-nowrap">Reference</th>
                <th className="py-2 px-3 text-right whitespace-nowrap">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE4E1] text-xs">
              {transactions.map((tx) => {
                const isNegative = tx.quantity < 0;
                return (
                  <tr key={tx.transaction_id} className="hover:bg-[#F5F7F6] transition-colors">
                    <td className="py-2 px-3 font-mono font-semibold text-[#17212B] whitespace-nowrap">#{tx.transaction_id}</td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span className="font-semibold text-[#17212B] font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded">
                        {tx.transaction_type}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-[#17212B] font-semibold min-w-[150px]">
                      <div className="line-clamp-1" title={tx.product_name || `Product #${tx.product_id}`}>
                        {tx.product_name || `Product #${tx.product_id}`}
                      </div>
                    </td>
                    <td className="py-2 px-3 text-[#52616B] font-medium whitespace-nowrap">
                      <span className="font-mono text-xs">{tx.location_code}</span> ({tx.location_type})
                    </td>
                    <td className="py-2 px-3 text-center whitespace-nowrap">
                      <span
                        className={`font-bold font-mono px-2 py-0.5 rounded ${
                          isNegative ? 'text-[#B91C1C] bg-rose-50' : 'text-[#15803D] bg-emerald-50'
                        }`}
                      >
                        {isNegative ? tx.quantity : `+${tx.quantity}`}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-[#52616B] text-[11px] font-mono whitespace-nowrap">
                      {tx.reference_type} #{tx.reference_id}
                    </td>
                    <td className="py-2 px-3 text-right text-[#52616B] text-[11px] font-medium whitespace-nowrap">
                      {new Date(tx.transaction_date).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transfer Stock Modal */}
      <Modal isOpen={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)} title="Execute Inventory Transfer" size="md">
        <form onSubmit={handleExecuteTransfer} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#17212B] mb-1">Select Product *</label>
            <select
              required
              value={transferForm.product_id}
              onChange={(e) => setTransferForm({ ...transferForm, product_id: e.target.value })}
              className="w-full px-3 py-2 bg-[#F5F7F6] border border-[#DCE4E1] rounded-xl text-xs text-[#17212B] focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-none"
            >
              {stockList
                .filter((v, i, a) => a.findIndex((t) => t.product_id === v.product_id) === i)
                .map((p) => (
                  <option key={p.product_id} value={p.product_id}>
                    {p.product_name} ({p.sku})
                  </option>
                ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#17212B] mb-1">From Location *</label>
              <select
                required
                value={transferForm.from_location_id}
                onChange={(e) => setTransferForm({ ...transferForm, from_location_id: e.target.value })}
                className="w-full px-3 py-2 bg-[#F5F7F6] border border-[#DCE4E1] rounded-xl text-xs text-[#17212B] focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-none"
              >
                {locations.map((l) => (
                  <option key={l.location_id} value={l.location_id}>
                    {l.location_code} - {l.location_name} ({l.location_type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#17212B] mb-1">To Location *</label>
              <select
                required
                value={transferForm.to_location_id}
                onChange={(e) => setTransferForm({ ...transferForm, to_location_id: e.target.value })}
                className="w-full px-3 py-2 bg-[#F5F7F6] border border-[#DCE4E1] rounded-xl text-xs text-[#17212B] focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-none"
              >
                {locations.map((l) => (
                  <option key={l.location_id} value={l.location_id}>
                    {l.location_code} - {l.location_name} ({l.location_type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#17212B] mb-1">Units to Move *</label>
              <input
                type="number"
                min="1"
                required
                value={transferForm.quantity}
                onChange={(e) => setTransferForm({ ...transferForm, quantity: e.target.value })}
                className="w-full px-3 py-2 bg-[#F5F7F6] border border-[#DCE4E1] rounded-xl text-xs text-[#17212B] focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#17212B] mb-1">Authorized Employee</label>
              <select
                value={transferForm.employee_id}
                onChange={(e) => setTransferForm({ ...transferForm, employee_id: e.target.value })}
                className="w-full px-3 py-2 bg-[#F5F7F6] border border-[#DCE4E1] rounded-xl text-xs text-[#17212B] focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-none"
              >
                <option value="5">EMP #5 - Rajesh Kumar (Warehouse Associate)</option>
                <option value="1">EMP #1 - Amit Sharma (Store Manager)</option>
              </select>
            </div>
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-[#B45309]">
            Note: Decrements source stock with atomic check preventing negative quantities, increments target stock, and generates two audit transaction records.
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#DCE4E1]">
            <button
              type="button"
              onClick={() => setIsTransferModalOpen(false)}
              className="px-3.5 py-2 border border-[#DCE4E1] text-[#17212B] hover:bg-[#F5F7F6] rounded-lg text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-3.5 py-2 bg-[#0F766E] hover:bg-[#115E59] text-white border border-[#0F766E] rounded-lg text-xs font-semibold disabled:opacity-50"
            >
              {submitting ? 'Executing Transfer...' : 'Confirm Transfer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Adjust Thresholds Modal */}
      <Modal isOpen={isThresholdModalOpen} onClose={() => setIsThresholdModalOpen(false)} title="Update Stock Thresholds" size="sm">
        <form onSubmit={handleSaveThreshold} className="space-y-4">
          <div className="bg-[#F5F7F6] p-3 rounded-lg border border-[#DCE4E1] text-xs">
            <div className="font-semibold text-[#17212B]">{selectedStock?.product_name}</div>
            <div className="text-[#52616B] font-medium">
              Location: {selectedStock?.location_code} ({selectedStock?.location_name})
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#17212B] mb-1">Reorder Safety Threshold (Min Units)</label>
            <input
              type="number"
              min="0"
              required
              value={thresholdForm.reorder_threshold}
              onChange={(e) => setThresholdForm({ ...thresholdForm, reorder_threshold: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-[#DCE4E1] rounded-lg text-xs text-[#17212B]"
            />
            <p className="text-[10px] text-[#52616B] mt-1 font-medium">Triggers warehouse transfer or PO when stock is at or below this level.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#17212B] mb-1">Reorder Batch Quantity</label>
            <input
              type="number"
              min="1"
              required
              value={thresholdForm.reorder_quantity}
              onChange={(e) => setThresholdForm({ ...thresholdForm, reorder_quantity: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-[#DCE4E1] rounded-lg text-xs text-[#17212B]"
            />
            <p className="text-[10px] text-[#52616B] mt-1 font-medium">Standard batch replenishment quantity.</p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#DCE4E1]">
            <button
              type="button"
              onClick={() => setIsThresholdModalOpen(false)}
              className="px-3.5 py-2 border border-[#DCE4E1] text-[#17212B] hover:bg-[#F5F7F6] rounded-lg text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-3.5 py-2 bg-[#0F766E] hover:bg-[#115E59] text-white border border-[#0F766E] rounded-lg text-xs font-semibold disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Update Rules'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
