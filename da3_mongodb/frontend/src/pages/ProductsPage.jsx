import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { api } from '../services/api';
import Modal from '../components/Modal';

export default function ProductsPage({ onNotify }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const initialForm = {
    sku: '',
    barcode: '',
    product_name: '',
    description: '',
    category_id: 1,
    unit_of_measure: 'PCS',
    standard_unit_price: '',
    is_active: 'TRUE',
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (selectedCategory) params.category_id = selectedCategory;
      if (selectedStatus) params.is_active = selectedStatus;

      const [prodsRes, catsRes] = await Promise.all([
        api.getProducts(params),
        api.getCategories(),
      ]);
      setProducts(prodsRes || []);
      setCategories(catsRes || []);
    } catch (err) {
      onNotify({
        type: 'error',
        title: 'Error Fetching Products',
        message: err.message || 'Could not load products',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, selectedStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleOpenAdd = () => {
    setFormData({
      ...initialForm,
      category_id: categories.length > 0 ? categories[0].category_id : 1,
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (p) => {
    setCurrentProduct(p);
    setFormData({
      sku: p.sku,
      barcode: p.barcode,
      product_name: p.product_name,
      description: p.description || '',
      category_id: p.category_id,
      unit_of_measure: p.unit_of_measure || 'PCS',
      standard_unit_price: p.standard_unit_price,
      is_active: p.is_active,
    });
    setIsEditModalOpen(true);
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.createProduct({
        ...formData,
        category_id: Number(formData.category_id),
        standard_unit_price: Number(formData.standard_unit_price),
      });
      onNotify({
        type: 'success',
        title: 'Product Created',
        message: `Successfully created "${formData.product_name}" (SKU: ${formData.sku})`,
      });
      setIsAddModalOpen(false);
      fetchProducts();
    } catch (err) {
      onNotify({
        type: 'error',
        title: 'Creation Failed',
        message: err.message || 'Could not create product',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.updateProduct(currentProduct.product_id, {
        product_name: formData.product_name,
        description: formData.description,
        category_id: Number(formData.category_id),
        unit_of_measure: formData.unit_of_measure,
        standard_unit_price: Number(formData.standard_unit_price),
        is_active: formData.is_active,
      });
      onNotify({
        type: 'success',
        title: 'Product Updated',
        message: `Product ID #${currentProduct.product_id} was updated successfully`,
      });
      setIsEditModalOpen(false);
      fetchProducts();
    } catch (err) {
      onNotify({
        type: 'error',
        title: 'Update Failed',
        message: err.message || 'Could not update product',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (product) => {
    if (!window.confirm(`Deactivate product "${product.product_name}" (SKU: ${product.sku})?`)) {
      return;
    }
    try {
      await api.deleteProduct(product.product_id);
      onNotify({
        type: 'info',
        title: 'Product Deactivated',
        message: `Product ${product.product_name} status set to Inactive.`,
      });
      fetchProducts();
    } catch (err) {
      onNotify({
        type: 'error',
        title: 'Operation Failed',
        message: err.message || 'Could not deactivate product',
      });
    }
  };

  return (
    <div className="px-6 py-6 space-y-6 max-w-7xl mx-auto">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#17212B] tracking-tight">Product Catalog</h2>
          <p className="text-xs text-[#52616B] font-medium mt-0.5">Manage SKUs, categories, units of measure, and pricing</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 bg-[#0F766E] hover:bg-[#115E59] text-white px-3.5 py-2 rounded-lg text-xs font-semibold border border-[#0F766E] transition-colors self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-[#DCE4E1] flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-[#52616B] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, SKU, barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#DCE4E1] rounded-lg text-xs text-[#17212B] placeholder-[#52616B]"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-1.5 bg-[#17212B] hover:bg-[#2C363D] text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-[#DCE4E1] rounded-lg text-xs font-semibold text-[#17212B]"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.category_id} value={c.category_id}>
                {c.category_name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-[#DCE4E1] rounded-lg text-xs font-semibold text-[#17212B]"
          >
            <option value="">All Statuses</option>
            <option value="TRUE">Active Only</option>
            <option value="FALSE">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-[#DCE4E1] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[#52616B]">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0F766E]" />
            <p className="text-xs font-medium">Loading products from MongoDB...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-[#52616B]">
            <Package className="w-8 h-8 text-[#52616B] mx-auto mb-2" />
            <p className="text-sm font-bold text-[#17212B]">No products match your query</p>
            <p className="text-xs text-[#52616B] mt-1 font-medium">Try resetting the search or filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#DCE4E1] bg-[#F5F7F6] text-[11px] font-bold text-[#52616B] uppercase tracking-wider">
                  <th className="py-2.5 px-3.5 whitespace-nowrap">ID / SKU</th>
                  <th className="py-2.5 px-3.5">Product Name</th>
                  <th className="py-2.5 px-3.5 whitespace-nowrap">Category</th>
                  <th className="py-2.5 px-3.5 text-right whitespace-nowrap">Unit Price</th>
                  <th className="py-2.5 px-3.5 text-center whitespace-nowrap">UOM</th>
                  <th className="py-2.5 px-3.5 whitespace-nowrap">Status</th>
                  <th className="py-2.5 px-3.5 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE4E1] text-xs">
                {products.map((p) => {
                  const isActive = p.is_active === 'TRUE';
                  return (
                    <tr key={p.product_id} className="hover:bg-[#F5F7F6] transition-colors">
                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        <span className="font-semibold text-[#17212B]">#{p.product_id}</span>
                        <div className="text-[11px] font-mono text-[#52616B] font-semibold">{p.sku}</div>
                      </td>
                      <td className="py-2.5 px-3.5 min-w-[160px] max-w-[280px]">
                        <div className="font-semibold text-[#17212B] line-clamp-2" title={p.product_name}>{p.product_name}</div>
                        {p.barcode && <div className="text-[10px] text-[#52616B] font-mono">Barcode: {p.barcode}</div>}
                      </td>
                      <td className="py-2.5 px-3.5 text-[#52616B] font-medium whitespace-nowrap">{p.category_name || 'General'}</td>
                      <td className="py-2.5 px-3.5 font-bold text-[#17212B] text-right whitespace-nowrap">
                        ₹{Number(p.standard_unit_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3.5 text-[#52616B] font-medium text-center whitespace-nowrap">{p.unit_of_measure}</td>
                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                            isActive
                              ? 'bg-emerald-50 text-[#15803D] border-emerald-200'
                              : 'bg-slate-100 text-[#52616B] border-slate-200'
                          }`}
                        >
                          {isActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 text-[#52616B] hover:text-[#0F766E] hover:bg-[#F5F7F6] rounded-md transition-colors"
                            title="Edit Product"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {isActive && (
                            <button
                              onClick={() => handleDeleteProduct(p)}
                              className="p-1.5 text-[#52616B] hover:text-[#B91C1C] hover:bg-rose-50 rounded-md transition-colors"
                              title="Deactivate Product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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

      {/* Add Product Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Create New Product" size="lg">
        <form onSubmit={handleCreateProduct} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#17212B] mb-1">SKU *</label>
              <input
                type="text"
                required
                placeholder="e.g. ELEC-KEYB-001"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 bg-[#F5F7F6] border border-[#DCE4E1] rounded-xl text-xs text-[#17212B] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#17212B] mb-1">Barcode (EAN-13) *</label>
              <input
                type="text"
                required
                placeholder="e.g. 8901234567890"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                className="w-full px-3 py-2 bg-[#F5F7F6] border border-[#DCE4E1] rounded-xl text-xs text-[#17212B] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20 outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#17212B] mb-1">Product Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Wireless Ergonomic Keyboard"
                value={formData.product_name}
                onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                className="w-full px-3 py-2 bg-[#F5F7F6] border border-[#DCE4E1] rounded-xl text-xs text-[#17212B] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20 outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#17212B] mb-1">Description</label>
              <textarea
                rows={2}
                placeholder="Product specifications..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 bg-[#F5F7F6] border border-[#DCE4E1] rounded-xl text-xs text-[#17212B] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#17212B] mb-1">Category *</label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-3 py-2 bg-[#F5F7F6] border border-[#DCE4E1] rounded-xl text-xs text-[#17212B] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20 outline-none"
              >
                {categories.map((c) => (
                  <option key={c.category_id} value={c.category_id}>
                    {c.category_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#17212B] mb-1">Unit of Measure *</label>
              <select
                value={formData.unit_of_measure}
                onChange={(e) => setFormData({ ...formData, unit_of_measure: e.target.value })}
                className="w-full px-3 py-2 bg-[#F5F7F6] border border-[#DCE4E1] rounded-xl text-xs text-[#17212B] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20 outline-none"
              >
                <option value="PCS">Pieces (PCS)</option>
                <option value="KG">Kilograms (KG)</option>
                <option value="L">Litres (L)</option>
                <option value="BOX">Box (BOX)</option>
                <option value="PACK">Pack (PACK)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#17212B] mb-1">Standard Unit Price (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="e.g. 1499.00"
                value={formData.standard_unit_price}
                onChange={(e) => setFormData({ ...formData, standard_unit_price: e.target.value })}
                className="w-full px-3 py-2 bg-[#F5F7F6] border border-[#DCE4E1] rounded-xl text-xs text-[#17212B] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#17212B] mb-1">Status</label>
              <select
                value={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.value })}
                className="w-full px-3 py-2 bg-[#F5F7F6] border border-[#DCE4E1] rounded-xl text-xs text-[#17212B] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20 outline-none"
              >
                <option value="TRUE">Active</option>
                <option value="FALSE">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#DCE4E1]">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-3.5 py-2 border border-[#DCE4E1] text-[#17212B] hover:bg-[#F5F7F6] rounded-lg text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-3.5 py-2 bg-[#0F766E] hover:bg-[#115E59] text-white border border-[#0F766E] rounded-lg text-xs font-semibold disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Creating...' : 'Create Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Product Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`Edit Product #${currentProduct?.product_id}`} size="lg">
        <form onSubmit={handleUpdateProduct} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#17212B] mb-1">SKU (Read-only)</label>
              <input
                type="text"
                disabled
                value={formData.sku}
                className="w-full px-3 py-2 bg-[#EAEFEc] border border-[#DCE4E1] rounded-xl text-xs text-[#52616B] cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#17212B] mb-1">Barcode (Read-only)</label>
              <input
                type="text"
                disabled
                value={formData.barcode}
                className="w-full px-3 py-2 bg-[#EAEFEc] border border-[#DCE4E1] rounded-xl text-xs text-[#52616B] cursor-not-allowed"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#17212B] mb-1">Product Name *</label>
              <input
                type="text"
                required
                value={formData.product_name}
                onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                className="w-full px-3 py-2 bg-[#F5F7F6] border border-[#DCE4E1] rounded-xl text-xs text-[#17212B] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20 outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#17212B] mb-1">Description</label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 bg-[#F5F7F6] border border-[#DCE4E1] rounded-xl text-xs text-[#17212B] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#17212B] mb-1">Category</label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-3 py-2 bg-[#F5F7F6] border border-[#DCE4E1] rounded-xl text-xs text-[#17212B] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20 outline-none"
              >
                {categories.map((c) => (
                  <option key={c.category_id} value={c.category_id}>
                    {c.category_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#17212B] mb-1">Unit of Measure</label>
              <select
                value={formData.unit_of_measure}
                onChange={(e) => setFormData({ ...formData, unit_of_measure: e.target.value })}
                className="w-full px-3 py-2 bg-[#F5F7F6] border border-[#DCE4E1] rounded-xl text-xs text-[#17212B] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20 outline-none"
              >
                <option value="PCS">Pieces (PCS)</option>
                <option value="KG">Kilograms (KG)</option>
                <option value="L">Litres (L)</option>
                <option value="BOX">Box (BOX)</option>
                <option value="PACK">Pack (PACK)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#17212B] mb-1">Standard Unit Price (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={formData.standard_unit_price}
                onChange={(e) => setFormData({ ...formData, standard_unit_price: e.target.value })}
                className="w-full px-3 py-2 bg-[#F5F7F6] border border-[#DCE4E1] rounded-xl text-xs text-[#17212B] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#17212B] mb-1">Status</label>
              <select
                value={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.value })}
                className="w-full px-3 py-2 bg-[#F5F7F6] border border-[#DCE4E1] rounded-xl text-xs text-[#17212B] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20 outline-none"
              >
                <option value="TRUE">Active</option>
                <option value="FALSE">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#DCE4E1]">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-3.5 py-2 border border-[#DCE4E1] text-[#17212B] hover:bg-[#F5F7F6] rounded-lg text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-3.5 py-2 bg-[#0F766E] hover:bg-[#115E59] text-white border border-[#0F766E] rounded-lg text-xs font-semibold disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
