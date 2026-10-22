/**
 * SmartRetail — Frontend API Client
 * Connects directly to FastAPI backend on http://127.0.0.1:8000
 */

const rawBase =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_BASE ||
  'http://127.0.0.1:8000';

const API_BASE = rawBase.replace(/\/+$/, '');

async function request(endpoint, options = {}) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE}${cleanEndpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  let res;
  try {
    res = await fetch(url, config);
  } catch (networkErr) {
    const error = new Error(
      `Cannot connect to backend server at ${API_BASE}. If using Render free tier, the instance may be waking from sleep (takes ~45 seconds).`
    );
    error.isNetworkError = true;
    console.error(`Network Error reaching ${endpoint}:`, networkErr);
    throw error;
  }

  if (!res.ok) {
    let errorMsg = `Server error (HTTP ${res.status})`;
    try {
      const errorData = await res.json();
      if (typeof errorData.detail === 'string') {
        errorMsg = errorData.detail;
      } else if (Array.isArray(errorData.detail)) {
        errorMsg = errorData.detail
          .map((d) => (d.msg ? `${d.loc ? d.loc.slice(-1) + ': ' : ''}${d.msg}` : JSON.stringify(d)))
          .join('; ');
      } else if (errorData.detail && typeof errorData.detail === 'object') {
        errorMsg = errorData.detail.message || JSON.stringify(errorData.detail);
      } else if (errorData.message) {
        errorMsg = errorData.message;
      }
    } catch (_) {
      if (res.statusText) {
        errorMsg = `Server error: ${res.status} ${res.statusText}`;
      }
    }
    const err = new Error(errorMsg);
    err.status = res.status;
    console.error(`API Error ${res.status} on ${endpoint}:`, errorMsg);
    throw err;
  }

  return await res.json();
}

export const api = {
  // System Health
  getRoot: () => request('/'),

  // Products & Categories
  getCategories: () => request('/product-categories'),
  getProducts: (params = {}) => {
    const query = new URLSearchParams();
    if (params.category_id) query.append('category_id', params.category_id);
    if (params.search) query.append('search', params.search);
    if (params.is_active) query.append('is_active', params.is_active);
    const qs = query.toString();
    return request(`/products${qs ? `?${qs}` : ''}`);
  },
  getProduct: (id) => request(`/products/${id}`),
  createProduct: (data) => request('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id, data) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }),

  // Inventory & Locations
  getLocations: () => request('/inventory/locations'),
  getAllStock: (params = {}) => {
    const query = new URLSearchParams();
    if (params.location_id) query.append('location_id', params.location_id);
    if (params.location_type) query.append('location_type', params.location_type);
    const qs = query.toString();
    return request(`/inventory/all-stock${qs ? `?${qs}` : ''}`);
  },
  getProductStock: (id) => request(`/inventory/stock/${id}`),
  getLowStock: () => request('/inventory/low-stock'),
  updateThresholds: (locationId, productId, data) =>
    request(`/inventory/thresholds/${locationId}/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  transferStock: (data) => request('/inventory/transfer', { method: 'POST', body: JSON.stringify(data) }),
  getInventoryTransactions: (limit = 50) => request(`/inventory/transactions?limit=${limit}`),

  // Sales & POS
  getCustomers: () => request('/customers'),
  getEmployees: (role) => request(`/employees${role ? `?role=${role}` : ''}`),
  processSale: (data) => request('/sales/checkout', { method: 'POST', body: JSON.stringify(data) }),
  getSalesHistory: (params = {}) => {
    const query = new URLSearchParams();
    if (params.customer_id) query.append('customer_id', params.customer_id);
    if (params.limit) query.append('limit', params.limit);
    const qs = query.toString();
    return request(`/sales/history${qs ? `?${qs}` : ''}`);
  },

  // Suppliers
  getSuppliers: () => request('/suppliers'),
  createSupplier: (data) => request('/suppliers', { method: 'POST', body: JSON.stringify(data) }),
  updateSupplier: (id, data) => request(`/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSupplier: (id) => request(`/suppliers/${id}`, { method: 'DELETE' }),

  // Procurement (Purchase Orders & Shipments)
  getPurchaseOrders: (status) => request(`/procurement/purchase-orders${status ? `?status=${status}` : ''}`),
  createPurchaseOrder: (data) => request('/procurement/purchase-orders', { method: 'POST', body: JSON.stringify(data) }),
  updatePOStatus: (id, status) => request(`/procurement/purchase-orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  getShipments: (status) => request(`/procurement/shipments${status ? `?status=${status}` : ''}`),
  receiveShipment: (data) => request('/procurement/shipments/receive', { method: 'POST', body: JSON.stringify(data) }),

  // Reorders & Replenishment
  getRestockEvents: (status) => request(`/reorders/restock-events${status ? `?status=${status}` : ''}`),
  getReorderTriggers: (status) => request(`/reorders/reorder-triggers${status ? `?status=${status}` : ''}`),
  fulfillRestockEvent: (id, employeeId = 5) => request(`/reorders/restock-events/${id}/fulfill?employee_id=${employeeId}`, { method: 'POST' }),
  generatePOFromTrigger: (id) => request(`/reorders/reorder-triggers/${id}/generate-po`, { method: 'POST' }),

  // Analytics & Reports
  getAnalyticsSummary: () => request('/analytics/summary'),
  getDailySales: () => request('/analytics/daily-sales'),
  getCategoryRevenue: () => request('/reports/category-revenue'),
  getBestSellers: (limit = 10) => request(`/reports/best-sellers?limit=${limit}`),
  getInventoryValuation: () => request('/reports/inventory-valuation'),

  // Workflow Demo
  triggerWorkflowDemo: () => request('/workflow/demonstrate', { method: 'POST' }),

  // AI Demand Forecasting & Predictive Analytics
  getAIForecastOverview: (horizon = 7) => request(`/ai/forecast/overview?horizon_days=${horizon}`),
  getProductAIForecast: (id, horizon = 14) => request(`/ai/forecast/product/${id}?horizon_days=${horizon}`),
  applyAIRecommendation: (id) => request(`/ai/forecast/apply-recommendation/${id}`, { method: 'POST' }),
  generateAIPurchaseOrder: (id) => request(`/ai/forecast/generate-po/${id}`, { method: 'POST' }),
};
