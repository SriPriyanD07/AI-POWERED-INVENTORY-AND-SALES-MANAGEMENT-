import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  CheckCircle,
  Clock,
  Truck,
  Ban,
  PackageCheck,
  Eye,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { api } from '../services/api';
import Modal from '../components/Modal';

export default function PurchaseOrdersPage({ onNotify }) {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [poForm, setPoForm] = useState({
    po_number: '',
    supplier_id: 1,
    created_by: 4,
    items: [
      { product_id: 1, quantity_ordered: 25, unit_price: 50.0 },
    ],
  });

  const fetchPOs = async () => {
    try {
      setLoading(true);
      const [posRes, suppRes, prodsRes] = await Promise.all([
        api.getPurchaseOrders(statusFilter),
        api.getSuppliers(),
        api.getProducts({ is_active: 'TRUE' }),
      ]);
      setPurchaseOrders(posRes || []);
      setSuppliers(suppRes || []);
      setProducts(prodsRes || []);
    } catch (err) {
      onNotify({
        type: 'error',
        title: 'Error Loading POs',
        message: err.message || 'Could not fetch purchase orders',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPOs();
  }, [statusFilter]);

  const handleOpenCreate = () => {
    setPoForm({
      po_number: `PO-${Date.now().toString().slice(-6)}`,
      supplier_id: suppliers[0]?.supplier_id || 1,
      created_by: 4,
      items: [
        {
          product_id: products[0]?.product_id || 1,
          quantity_ordered: 50,
          unit_price: Number(products[0]?.standard_unit_price || 100) * 0.8,
        },
      ],
    });
    setIsCreateModalOpen(true);
  };

  const handleAddItem = () => {
    const firstProd = products[0];
    setPoForm({
      ...poForm,
      items: [
        ...poForm.items,
        {
          product_id: firstProd?.product_id || 1,
          quantity_ordered: 20,
          unit_price: Number(firstProd?.standard_unit_price || 100) * 0.8,
        },
      ],
    });
  };

  const handleUpdateItem = (index, field, value) => {
    const updated = [...poForm.items];
    updated[index][field] = value;
    if (field === 'product_id') {
      const prod = products.find((p) => p.product_id === Number(value));
      if (prod) {
        updated[index].unit_price = Number(prod.standard_unit_price) * 0.8;
      }
    }
    setPoForm({ ...poForm, items: updated });
  };

  const handleRemoveItem = (index) => {
    if (poForm.items.length === 1) return;
    setPoForm({ ...poForm, items: poForm.items.filter((_, i) => i !== index) });
  };

  const calculateTotal = () => {
    return poForm.items.reduce((sum, item) => sum + Number(item.quantity_ordered) * Number(item.unit_price), 0);
  };

  const handleCreatePO = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const itemsPayload = poForm.items.map((item) => ({
        product_id: Number(item.product_id),
        quantity_ordered: Number(item.quantity_ordered),
        unit_price: Number(item.unit_price),
      }));

      await api.createPurchaseOrder({
        po_number: poForm.po_number,
        supplier_id: Number(poForm.supplier_id),
        created_by: Number(poForm.created_by),
        items: itemsPayload,
        is_auto_generated: false,
      });

      onNotify({
        type: 'success',
        title: 'Purchase Order Created',
        message: `PO ${poForm.po_number} submitted to supplier!`,
      });
      setIsCreateModalOpen(false);
      fetchPOs();
    } catch (err) {
      onNotify({
        type: 'error',
        title: 'Creation Failed',
        message: err.message || 'Error creating purchase order',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (poId, nextStatus) => {
    try {
      await api.updatePOStatus(poId, nextStatus);
      onNotify({
        type: 'success',
        title: 'Status Updated',
        message: `Purchase Order #${poId} status set to ${nextStatus}`,
      });
      fetchPOs();
    } catch (err) {
      onNotify({
        type: 'error',
        title: 'Status Update Failed',
        message: err.message || 'Error updating PO status',
      });
    }
  };

  return (
    <div className="px-6 py-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#17212B] tracking-tight">Procurement & Purchase Orders</h2>
          <p className="text-xs text-[#52616B] font-medium mt-0.5">
            Contracted wholesale reorders: Embedded line items, lifecycle status workflows, and supplier fulfillment
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 bg-[#0F766E] hover:bg-[#115E59] text-white px-3.5 py-2 rounded-lg text-xs font-semibold border border-[#0F766E] transition-colors self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Purchase Order</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white p-3.5 rounded-xl border border-[#DCE4E1] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {['', 'PENDING', 'APPROVED', 'SHIPPED', 'RECEIVED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === st
                  ? 'bg-[#0F766E] text-white'
                  : 'bg-white border border-[#DCE4E1] text-[#52616B] hover:text-[#17212B]'
              }`}
            >
              {st === '' ? 'All Orders' : st}
            </button>
          ))}
        </div>
        <span className="text-xs text-[#52616B] font-medium">{purchaseOrders.length} orders found</span>
      </div>

      {/* Purchase Orders Table */}
      <div className="bg-white rounded-xl border border-[#DCE4E1] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[#52616B]">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0F766E]" />
            <p className="text-xs font-medium">Querying purchase_orders collection...</p>
          </div>
        ) : purchaseOrders.length === 0 ? (
          <div className="p-12 text-center text-[#52616B]">
            <FileText className="w-8 h-8 text-[#52616B] mx-auto mb-2" />
            <p className="text-sm font-bold text-[#17212B]">No purchase orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#DCE4E1] bg-[#F5F7F6] text-[11px] font-bold text-[#52616B] uppercase tracking-wider">
                  <th className="py-2.5 px-3.5 whitespace-nowrap">PO Number</th>
                  <th className="py-2.5 px-3.5">Supplier</th>
                  <th className="py-2.5 px-3.5 whitespace-nowrap">Order Date</th>
                  <th className="py-2.5 px-3.5 text-center whitespace-nowrap">Items</th>
                  <th className="py-2.5 px-3.5 text-right whitespace-nowrap">Total Amount</th>
                  <th className="py-2.5 px-3.5 text-center whitespace-nowrap">Status</th>
                  <th className="py-2.5 px-3.5 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE4E1] text-xs">
                {purchaseOrders.map((po) => {
                  const statusColors = {
                    PENDING: 'bg-amber-50 text-[#B45309] border-amber-200',
                    APPROVED: 'bg-teal-50 text-[#0F766E] border-teal-200',
                    SHIPPED: 'bg-[#E4EBE7] text-[#2C3C35] border-[#C8D6CF]',
                    RECEIVED: 'bg-emerald-50 text-[#15803D] border-emerald-200',
                    CANCELLED: 'bg-rose-50 text-[#B91C1C] border-rose-200',
                  }[po.status] || 'bg-slate-100 text-slate-700';

                  const supplierName =
                    po.supplier?.supplier_name ||
                    suppliers.find((s) => s.supplier_id === po.supplier_id)?.supplier_name ||
                    `Supplier #${po.supplier_id}`;

                  return (
                    <tr key={po.po_id} className="hover:bg-[#F5F7F6] transition-colors">
                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        <div className="font-mono font-bold text-[#17212B]">{po.po_number}</div>
                        {po.is_auto_generated && (
                          <span className="text-[10px] text-[#0F766E] font-semibold bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                            Auto-Replenish
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3.5 min-w-[150px] max-w-[220px]">
                        <div className="font-semibold text-[#17212B] line-clamp-2" title={supplierName}>{supplierName}</div>
                      </td>
                      <td className="py-2.5 px-3.5 text-[#52616B] font-medium whitespace-nowrap">{new Date(po.order_date).toLocaleDateString()}</td>
                      <td className="py-2.5 px-3.5 text-center font-semibold text-[#17212B] whitespace-nowrap">{po.items?.length || 0} SKU(s)</td>
                      <td className="py-2.5 px-3.5 text-right font-bold text-[#17212B] whitespace-nowrap">
                        ₹{Number(po.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusColors}`}>
                          {po.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedPO(po);
                              setIsViewModalOpen(true);
                            }}
                            className="p-1.5 text-[#52616B] hover:text-[#0F766E] hover:bg-[#F5F7F6] rounded-lg transition-colors"
                            title="Inspect Items"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {po.status === 'PENDING' && (
                            <button
                              onClick={() => handleUpdateStatus(po.po_id, 'APPROVED')}
                              className="px-2 py-1 bg-teal-50 text-[#0F766E] hover:bg-teal-100 border border-teal-200 rounded-lg text-[11px] font-bold transition-colors"
                            >
                              Approve
                            </button>
                          )}
                          {po.status === 'APPROVED' && (
                            <button
                              onClick={() => handleUpdateStatus(po.po_id, 'SHIPPED')}
                              className="px-2 py-1 bg-[#E4EBE7] text-[#40574D] hover:bg-[#d6e2dc] border border-[#C8D6CF] rounded-lg text-[11px] font-bold transition-colors"
                            >
                              Mark Shipped
                            </button>
                          )}
                          {po.status === 'SHIPPED' && (
                            <button
                              onClick={() => handleUpdateStatus(po.po_id, 'RECEIVED')}
                              className="px-2 py-1 bg-emerald-50 text-[#15803D] hover:bg-emerald-100 border border-emerald-200 rounded-lg text-[11px] font-bold transition-colors"
                            >
                              Mark Received
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
        )}
      </div>

      {/* Create PO Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create Purchase Order" size="lg">
        <form onSubmit={handleCreatePO} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#17212B] mb-1">PO Reference Number *</label>
              <input
                type="text"
                required
                value={poForm.po_number}
                onChange={(e) => setPoForm({ ...poForm, po_number: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 bg-[#F5F7F6] border border-[#DCE4E1] rounded-xl text-xs font-mono text-[#17212B] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#17212B] mb-1">Select Supplier *</label>
              <select
                required
                value={poForm.supplier_id}
                onChange={(e) => setPoForm({ ...poForm, supplier_id: e.target.value })}
                className="w-full px-3 py-2 bg-[#F5F7F6] border border-[#DCE4E1] rounded-xl text-xs text-[#17212B] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20 outline-none"
              >
                {suppliers.map((s) => (
                  <option key={s.supplier_id} value={s.supplier_id}>
                    {s.supplier_name} (GST: {s.gst_number})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dynamic Items Builder */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-[#17212B]">Order Line Items ({poForm.items.length})</label>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1 text-xs text-[#0F766E] hover:text-[#115E59] font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item Line</span>
              </button>
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {poForm.items.map((item, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-[#F5F7F6] p-2.5 rounded-xl border border-[#DCE4E1] text-xs">
                  <div className="flex-1 min-w-0">
                    <select
                      value={item.product_id}
                      onChange={(e) => handleUpdateItem(idx, 'product_id', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-[#DCE4E1] rounded-lg text-xs text-[#17212B]"
                    >
                      {products.map((p) => (
                        <option key={p.product_id} value={p.product_id}>
                          {p.product_name} ({p.sku})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-full sm:w-24">
                    <input
                      type="number"
                      min="1"
                      required
                      placeholder="Qty"
                      value={item.quantity_ordered}
                      onChange={(e) => handleUpdateItem(idx, 'quantity_ordered', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-[#DCE4E1] rounded-lg text-xs text-[#17212B]"
                    />
                  </div>
                  <div className="w-full sm:w-28">
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      placeholder="Price (₹)"
                      value={item.unit_price}
                      onChange={(e) => handleUpdateItem(idx, 'unit_price', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-[#DCE4E1] rounded-lg text-xs text-[#17212B]"
                    />
                  </div>
                  <div className="w-full sm:w-24 font-bold text-left sm:text-right text-[#17212B]">
                    ₹{(item.quantity_ordered * item.unit_price).toLocaleString()}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    disabled={poForm.items.length === 1}
                    className="text-[#52616B] hover:text-[#B91C1C] disabled:opacity-20 p-1 self-end sm:self-auto"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center p-3 rounded-xl bg-[#F5F7F6] border border-[#DCE4E1] font-semibold text-xs text-[#17212B]">
              <span>Estimated Purchase Value:</span>
              <span className="text-sm font-extrabold text-[#15803D]">₹{calculateTotal().toLocaleString()}</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#DCE4E1]">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 border border-[#DCE4E1] text-[#17212B] hover:bg-[#F5F7F6] rounded-xl text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-xl text-xs font-semibold disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Submitting PO...' : 'Issue Purchase Order'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Inspect Items Modal */}
      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title={`PO Details: ${selectedPO?.po_number}`} size="md">
        {selectedPO && (
          <div className="space-y-4 text-xs">
            <div className="bg-[#F5F7F6] p-4 rounded-xl border border-[#DCE4E1] space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#52616B]">Order Status:</span>
                <span className="font-bold text-[#0F766E]">{selectedPO.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#52616B]">Total Valuation:</span>
                <span className="font-extrabold text-[#15803D]">₹{Number(selectedPO.total_amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#52616B]">Date Issued:</span>
                <span className="font-medium text-[#17212B]">{new Date(selectedPO.order_date).toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-[#17212B] text-xs">Embedded Line Items</h4>
              <div className="divide-y divide-[#DCE4E1] border border-[#DCE4E1] rounded-xl overflow-hidden">
                {(selectedPO.items || []).map((item, i) => (
                  <div key={i} className="p-3 flex items-center justify-between bg-white gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-[#17212B] truncate">{item.product_name || `Product #${item.product_id}`}</div>
                      <div className="text-[11px] text-[#52616B] font-mono">
                        {item.quantity_ordered} units @ ₹{item.unit_price} each
                      </div>
                    </div>
                    <div className="font-bold text-[#17212B] shrink-0 text-right">
                      ₹{(item.subtotal || item.quantity_ordered * item.unit_price).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 bg-[#17212B] hover:bg-[#2C363D] text-white rounded-xl text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
