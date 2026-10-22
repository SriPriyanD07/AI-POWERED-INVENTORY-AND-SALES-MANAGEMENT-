import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  Smartphone,
  Receipt,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  X,
} from 'lucide-react';
import { api } from '../services/api';
import Modal from '../components/Modal';

export default function SalesPage({ onNotify }) {
  const [activeTab, setActiveTab] = useState('pos'); // pos or history
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [salesHistory, setSalesHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // POS State
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(1);
  const [selectedLocationId, setSelectedLocationId] = useState(2); // Shelf-01
  const [cashierId] = useState(3); // Cashier ID
  const [paymentMethod, setPaymentMethod] = useState('CARD'); // CASH, CARD, UPI, WALLET

  // Receipt Modal State
  const [currentReceipt, setCurrentReceipt] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodsRes, custRes, locsRes, histRes] = await Promise.all([
        api.getProducts({ is_active: 'TRUE' }),
        api.getCustomers(),
        api.getLocations(),
        api.getSalesHistory({ limit: 30 }),
      ]);
      setProducts(prodsRes || []);
      setCustomers(custRes || []);
      const shelves = (locsRes || []).filter((l) => l.location_type === 'SHELF');
      setLocations(shelves.length > 0 ? shelves : locsRes || []);
      if (shelves.length > 0) setSelectedLocationId(shelves[0].location_id);
      setSalesHistory(histRes || []);
    } catch (err) {
      onNotify({
        type: 'error',
        title: 'Error Loading POS Data',
        message: err.message || 'Failed to initialize point-of-sale',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const addToCart = (product) => {
    const existing = cart.find((item) => item.product_id === product.product_id);
    if (existing) {
      setCart(
        cart.map((item) =>
          item.product_id === product.product_id ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          product_id: product.product_id,
          sku: product.sku,
          product_name: product.product_name,
          unit_price: Number(product.standard_unit_price),
          quantity: 1,
        },
      ]);
    }
  };

  const updateQuantity = (productId, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product_id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter((item) => item.product_id !== productId));
  };

  const subtotal = Math.round(cart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0) * 100) / 100;
  const gstInclusive = Math.round((subtotal * 0.05 / 1.05) * 100) / 100;
  const grandTotal = subtotal;

  const handleCheckout = async () => {
    if (cart.length === 0) {
      onNotify({ type: 'info', title: 'Cart Empty', message: 'Add products to cart before checkout.' });
      return;
    }

    try {
      setProcessing(true);
      const receiptNumber = `RCP-${Date.now().toString().slice(-8)}`;

      const itemsPayload = cart.map((item) => ({
        product_id: item.product_id,
        shelf_location_id: Number(selectedLocationId),
        quantity: item.quantity,
        unit_price: item.unit_price,
      }));

      const paymentsPayload = [
        {
          payment_method: paymentMethod,
          amount: grandTotal,
          payment_reference: `PAY-TXN-${Math.floor(100000 + Math.random() * 900000)}`,
        },
      ];

      const res = await api.processSale({
        receipt_number: receiptNumber,
        cashier_id: cashierId,
        customer_id: Number(selectedCustomerId),
        items: itemsPayload,
        payments: paymentsPayload,
      });

      onNotify({
        type: 'success',
        title: 'Checkout Complete',
        message: `Sale ${receiptNumber} recorded! ₹${grandTotal.toLocaleString()} charged.`,
      });

      // Clear cart
      setCart([]);
      setCurrentReceipt(res);
      setIsReceiptModalOpen(true);

      // Refresh sales history
      const updatedHist = await api.getSalesHistory({ limit: 30 });
      setSalesHistory(updatedHist || []);
    } catch (err) {
      onNotify({
        type: 'error',
        title: 'Checkout Failed',
        message: err.message || 'Error processing sales checkout',
      });
    } finally {
      setProcessing(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.product_name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q);
  });

  return (
    <div className="px-6 py-6 space-y-6 max-w-7xl mx-auto">
      {/* Tab Switcher Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#17212B] tracking-tight">Point of Sale & Checkout</h2>
          <p className="text-xs text-[#52616B] font-medium mt-0.5">
            Real-time cashier register: Deducts retail shelf inventory and evaluates replenishment triggers
          </p>
        </div>

        <div className="flex items-center gap-1 bg-[#F5F7F6] p-1 rounded-lg border border-[#DCE4E1]">
          <button
            onClick={() => setActiveTab('pos')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'pos' ? 'bg-white text-[#17212B] shadow-xs' : 'text-[#52616B] hover:text-[#17212B]'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5 text-[#0F766E]" />
            <span>Active Register</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'history' ? 'bg-white text-[#17212B] shadow-xs' : 'text-[#52616B] hover:text-[#17212B]'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-[#52616B]" />
            <span>Sales History</span>
          </button>
        </div>
      </div>

      {activeTab === 'pos' ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left 2 Cols: Product Catalog & Search */}
          <div className="xl:col-span-2 space-y-4 min-w-0">
            <div className="bg-white p-3.5 rounded-xl border border-[#DCE4E1] flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1 min-w-0">
                <Search className="w-3.5 h-3.5 text-[#52616B] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Quick search products by name or SKU..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#DCE4E1] rounded-lg text-xs text-[#17212B] placeholder-[#52616B]"
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-bold text-[#17212B] whitespace-nowrap">Shelf:</span>
                <select
                  value={selectedLocationId}
                  onChange={(e) => setSelectedLocationId(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-[#DCE4E1] rounded-lg text-xs font-semibold text-[#17212B]"
                >
                  {locations.map((loc) => (
                    <option key={loc.location_id} value={loc.location_id}>
                      {loc.location_code} - {loc.location_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Catalog Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 max-h-[560px] overflow-y-auto pr-1">
              {filteredProducts.map((p) => (
                <div
                  key={p.product_id}
                  onClick={() => addToCart(p)}
                  className="bg-white p-4 rounded-xl border border-[#DCE4E1] hover:border-[#0F766E] cursor-pointer transition-colors flex flex-col justify-between group min-w-0"
                >
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono text-[#52616B] font-semibold">{p.sku}</span>
                    <h4 className="text-xs font-bold text-[#17212B] line-clamp-2 mt-1 transition-colors" title={p.product_name}>
                      {p.product_name}
                    </h4>
                    <span className="text-[10px] text-[#52616B] font-medium block truncate mt-0.5">{p.category_name}</span>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-[#DCE4E1] flex items-center justify-between">
                    <span className="text-sm font-bold text-[#17212B]">
                      ₹{Number(p.standard_unit_price).toLocaleString()}
                    </span>
                    <button className="p-1 rounded bg-[#F5F7F6] text-[#0F766E] group-hover:bg-[#0F766E] group-hover:text-white border border-[#DCE4E1] transition-colors shrink-0">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Col: Cart & Split Payment Checkout */}
          <div className="bg-white rounded-xl border border-[#DCE4E1] p-5 flex flex-col justify-between space-y-4 min-w-0">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#DCE4E1]">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-[#0F766E]" />
                  <h3 className="font-bold text-[#17212B] text-sm">Cart Items ({cart.length})</h3>
                </div>
                {cart.length > 0 && (
                  <button
                    onClick={() => setCart([])}
                    className="text-[11px] text-[#B91C1C] hover:underline font-semibold"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Customer Selector */}
              <div>
                <label className="block text-[11px] font-bold text-[#17212B] mb-1 uppercase tracking-wider">
                  Customer
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-[#DCE4E1] rounded-lg text-xs font-semibold text-[#17212B]"
                >
                  {customers.map((c) => (
                    <option key={c.customer_id} value={c.customer_id}>
                      {c.first_name} {c.last_name} ({c.loyalty_tier || 'STANDARD'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Cart List */}
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {cart.length === 0 ? (
                  <div className="py-8 text-center text-[#52616B] text-xs border border-dashed border-[#DCE4E1] rounded-lg font-medium">
                    Cart is empty. Click items in catalog to add.
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.product_id}
                      className="p-2.5 rounded-lg bg-[#F5F7F6] border border-[#DCE4E1] flex items-center justify-between text-xs gap-2"
                    >
                      <div className="flex-1 min-w-0 pr-1">
                        <div className="font-semibold text-[#17212B] truncate" title={item.product_name}>{item.product_name}</div>
                        <div className="text-[11px] text-[#52616B] font-medium">₹{item.unit_price} each</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center border border-[#DCE4E1] rounded bg-white shrink-0">
                          <button
                            onClick={() => updateQuantity(item.product_id, -1)}
                            className="p-1 text-[#52616B] hover:text-[#17212B]"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 text-xs font-bold text-[#17212B]">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product_id, 1)}
                            className="p-1 text-[#52616B] hover:text-[#17212B]"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="font-bold text-[#17212B] min-w-[64px] text-right">
                          ₹{(item.unit_price * item.quantity).toLocaleString()}
                        </span>
                        <button
                          onClick={() => removeFromCart(item.product_id)}
                          className="text-[#52616B] hover:text-[#B91C1C] p-1 shrink-0"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Payment & Totals */}
            <div className="space-y-3.5 pt-3 border-t border-[#DCE4E1]">
              {/* Payment Method Selector */}
              <div>
                <label className="block text-[11px] font-bold text-[#17212B] mb-1.5 uppercase tracking-wider">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'CARD', label: 'Card', icon: CreditCard },
                    { id: 'CASH', label: 'Cash', icon: Banknote },
                    { id: 'UPI', label: 'UPI', icon: Smartphone },
                    { id: 'WALLET', label: 'Wallet', icon: Receipt },
                  ].map((m) => {
                    const Icon = m.icon;
                    const isSelected = paymentMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id)}
                        className={`flex flex-col items-center justify-center p-2 rounded-lg border text-[11px] font-semibold transition-colors ${
                          isSelected
                            ? 'bg-teal-50 border-[#0F766E] text-[#0F766E]'
                            : 'border-[#DCE4E1] text-[#52616B] hover:bg-[#F5F7F6]'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 mb-1" />
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Subtotal & Taxes Breakdown */}
              <div className="space-y-1.5 text-xs text-[#52616B]">
                <div className="flex justify-between">
                  <span>Net Amount:</span>
                  <span className="font-semibold text-[#17212B]">₹{(grandTotal - gstInclusive).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST Included (5%):</span>
                  <span className="font-semibold text-[#17212B]">₹{gstInclusive.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex justify-between text-base font-bold text-[#17212B] pt-2 border-t border-[#DCE4E1]">
                <span>Total Payable:</span>
                <span className="text-[#0F766E]">₹{grandTotal.toLocaleString()}</span>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                disabled={cart.length === 0 || processing}
                className="w-full py-2.5 bg-[#0F766E] hover:bg-[#115E59] disabled:opacity-50 text-white rounded-lg text-xs font-bold border border-[#0F766E] transition-colors flex items-center justify-center gap-1.5"
              >
                {processing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Deducting Shelf Stock & Syncing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Complete Sale (₹{grandTotal.toLocaleString()})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Sales History Table */
        <div className="bg-white rounded-xl border border-[#DCE4E1] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#DCE4E1] bg-[#F5F7F6] text-[11px] font-bold text-[#52616B] uppercase tracking-wider">
                  <th className="py-2.5 px-3.5 whitespace-nowrap">Receipt #</th>
                  <th className="py-2.5 px-3.5">Customer</th>
                  <th className="py-2.5 px-3.5 whitespace-nowrap">Timestamp</th>
                  <th className="py-2.5 px-3.5 text-center whitespace-nowrap">Items</th>
                  <th className="py-2.5 px-3.5 text-right whitespace-nowrap">Total Amount</th>
                  <th className="py-2.5 px-3.5 text-center whitespace-nowrap">Status</th>
                  <th className="py-2.5 px-3.5 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE4E1] text-xs">
                {salesHistory.map((s, idx) => (
                  <tr key={idx} className="hover:bg-[#F5F7F6] transition-colors">
                    <td className="py-2.5 px-3.5 font-mono font-bold text-[#17212B] whitespace-nowrap">{s.receipt_number}</td>
                    <td className="py-2.5 px-3.5 text-[#17212B] font-medium min-w-[140px]">
                      {s.customer ? `${s.customer.first_name} ${s.customer.last_name}` : `Customer #${s.customer_id}`}
                    </td>
                    <td className="py-2.5 px-3.5 text-[#52616B] font-medium whitespace-nowrap">
                      {new Date(s.transaction_date).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3.5 text-center font-semibold text-[#17212B] whitespace-nowrap">{s.items?.length || 0}</td>
                    <td className="py-2.5 px-3.5 text-right font-bold text-[#17212B] whitespace-nowrap">
                      ₹{s.total_amount?.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-[#15803D] border border-emerald-200">
                        {s.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => {
                          setCurrentReceipt(s);
                          setIsReceiptModalOpen(true);
                        }}
                        className="px-2.5 py-1 text-[#17212B] hover:text-[#0F766E] hover:bg-[#F5F7F6] rounded-md border border-[#DCE4E1] text-xs font-semibold transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      <Modal isOpen={isReceiptModalOpen} onClose={() => setIsReceiptModalOpen(false)} title="Sale Receipt" size="md">
        {currentReceipt && (
          <div className="space-y-4 font-mono text-xs">
            <div className="text-center border-b border-dashed border-slate-300 pb-3">
              <h3 className="font-extrabold text-base tracking-tight font-sans text-slate-900">SmartRetail POS</h3>
              <p className="text-[11px] text-slate-500 font-sans">Intelligent Retail Management Platform</p>
              <div className="mt-2 text-slate-700">
                Receipt: <span className="font-bold">{currentReceipt.receipt_number}</span>
              </div>
              <div className="text-[11px] text-slate-400">
                {new Date(currentReceipt.transaction_date || Date.now()).toLocaleString()}
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-2 border-b border-dashed border-slate-300 pb-3">
              {(currentReceipt.items || []).map((item, i) => (
                <div key={i} className="flex justify-between">
                  <div className="flex-1 pr-2 truncate">
                    <span>{item.product_name || `Product #${item.product_id}`}</span>
                    <span className="text-slate-400 block text-[10px]">
                      {item.quantity_sold || item.quantity} × ₹{item.unit_price}
                    </span>
                  </div>
                  <span className="font-bold">₹{(item.subtotal || item.unit_price * (item.quantity_sold || item.quantity)).toLocaleString()}</span>
                </div>
              ))}
            </div>

            {/* Financial Summary */}
            <div className="space-y-1 text-right">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{(currentReceipt.subtotal_amount || currentReceipt.total_amount * 0.95).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax / GST:</span>
                <span>₹{(currentReceipt.tax_amount || currentReceipt.total_amount * 0.05).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold pt-2 border-t border-slate-300 text-slate-900">
                <span>Grand Total:</span>
                <span className="text-emerald-700">₹{Number(currentReceipt.total_amount).toLocaleString()}</span>
              </div>
            </div>

            {/* Payments list */}
            {currentReceipt.payments && currentReceipt.payments.length > 0 && (
              <div className="pt-2 border-t border-dashed border-slate-300 text-[11px] text-slate-600">
                <span className="font-bold block mb-1">Tender Breakdown:</span>
                {currentReceipt.payments.map((p, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{p.payment_method} ({p.payment_reference || 'REF-OK'})</span>
                    <span className="font-semibold">₹{p.amount?.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl font-sans text-xs font-medium"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>
              <button
                type="button"
                onClick={() => setIsReceiptModalOpen(false)}
                className="px-4 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-sans text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
