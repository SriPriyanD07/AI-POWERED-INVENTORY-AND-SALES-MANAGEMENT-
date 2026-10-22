import React, { useState, useEffect } from 'react';
import {
  Truck,
  Plus,
  Search,
  Star,
  Mail,
  Phone,
  MapPin,
  Edit2,
  Trash2,
  RefreshCw,
  Building2,
} from 'lucide-react';
import { api } from '../services/api';
import Modal from '../components/Modal';

export default function SuppliersPage({ onNotify }) {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const initialForm = {
    supplier_name: '',
    contact_person: '',
    email: '',
    gst_number: '',
    phone_numbers: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    rating: 4.5,
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res = await api.getSuppliers();
      setSuppliers(res || []);
    } catch (err) {
      onNotify({
        type: 'error',
        title: 'Error Loading Suppliers',
        message: err.message || 'Could not fetch suppliers list',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleOpenAdd = () => {
    setFormData(initialForm);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (s) => {
    setCurrentSupplier(s);
    setFormData({
      supplier_name: s.supplier_name,
      contact_person: s.contact_person || '',
      email: s.email,
      gst_number: s.gst_number,
      phone_numbers: (s.phone_numbers || []).join(', '),
      street: s.address?.street || '',
      city: s.address?.city || '',
      state: s.address?.state || '',
      pincode: s.address?.pincode || '',
      rating: s.rating || 4.0,
    });
    setIsEditModalOpen(true);
  };

  const handleCreateSupplier = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const phones = formData.phone_numbers
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);

      await api.createSupplier({
        supplier_name: formData.supplier_name,
        contact_person: formData.contact_person,
        email: formData.email,
        gst_number: formData.gst_number,
        phone_numbers: phones,
        street: formData.street,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        rating: Number(formData.rating),
      });

      onNotify({
        type: 'success',
        title: 'Supplier Added',
        message: `Added supplier "${formData.supplier_name}" successfully.`,
      });
      setIsAddModalOpen(false);
      fetchSuppliers();
    } catch (err) {
      onNotify({
        type: 'error',
        title: 'Creation Failed',
        message: err.message || 'Error creating supplier',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateSupplier = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const phones = formData.phone_numbers
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);

      await api.updateSupplier(currentSupplier.supplier_id, {
        supplier_name: formData.supplier_name,
        contact_person: formData.contact_person,
        email: formData.email,
        gst_number: formData.gst_number,
        phone_numbers: phones,
        street: formData.street,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        rating: Number(formData.rating),
      });

      onNotify({
        type: 'success',
        title: 'Supplier Updated',
        message: `Updated supplier #${currentSupplier.supplier_id}`,
      });
      setIsEditModalOpen(false);
      fetchSuppliers();
    } catch (err) {
      onNotify({
        type: 'error',
        title: 'Update Failed',
        message: err.message || 'Error updating supplier',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSupplier = async (supplier) => {
    if (!window.confirm(`Delete supplier "${supplier.supplier_name}" (ID #${supplier.supplier_id})?`)) {
      return;
    }
    try {
      await api.deleteSupplier(supplier.supplier_id);
      onNotify({
        type: 'info',
        title: 'Supplier Deleted',
        message: `Supplier #${supplier.supplier_id} was removed.`,
      });
      fetchSuppliers();
    } catch (err) {
      onNotify({
        type: 'error',
        title: 'Delete Failed',
        message: err.message || 'Could not delete supplier',
      });
    }
  };

  const filteredSuppliers = suppliers.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.supplier_name?.toLowerCase().includes(q) ||
      s.contact_person?.toLowerCase().includes(q) ||
      s.gst_number?.toLowerCase().includes(q) ||
      s.address?.city?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="px-6 py-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#17212B]">Suppliers & Vendors</h2>
          <p className="text-xs text-[#52616B]">
            Maintain wholesale vendor contracts, GST registration, contact details, and performance ratings
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-[#0F766E] hover:bg-[#115E59] text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-none border border-[#0F766E] transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Supplier</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#DCE4E1] shadow-none flex items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#52616B] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search suppliers by name, contact, GST..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#F5F7F6] border border-[#DCE4E1] rounded-xl text-xs text-[#17212B] placeholder:text-[#52616B] focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-none"
          />
        </div>
        <span className="text-xs font-semibold text-[#52616B]">{filteredSuppliers.length} vendor partners</span>
      </div>

      {/* Suppliers Grid Cards */}
      {loading ? (
        <div className="p-12 text-center text-[#52616B]">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0F766E]" />
          <p className="text-xs">Loading suppliers from MongoDB...</p>
        </div>
      ) : filteredSuppliers.length === 0 ? (
        <div className="p-12 text-center text-[#52616B] bg-white rounded-xl border border-dashed border-[#DCE4E1]">
          <Truck className="w-8 h-8 text-[#52616B] mx-auto mb-2" />
          <p className="text-sm font-semibold text-[#17212B]">No suppliers found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSuppliers.map((s) => (
            <div
              key={s.supplier_id}
              className="bg-white rounded-xl border border-[#DCE4E1] shadow-none p-5 flex flex-col justify-between min-w-0 min-h-[240px] hover:border-[#6B9080] transition-colors relative overflow-hidden"
            >
              <div className="space-y-4 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-[#0F766E] font-bold shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-[#17212B] text-sm leading-snug line-clamp-2 break-words" title={s.supplier_name}>
                        {s.supplier_name}
                      </h3>
                      <span className="text-[10px] text-[#52616B] font-mono">ID: #{s.supplier_id}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-amber-50 text-[#B45309] px-2 py-0.5 rounded-lg border border-amber-200 text-xs font-bold shrink-0">
                    <Star className="w-3.5 h-3.5 fill-[#B45309] text-[#B45309]" />
                    <span>{s.rating?.toFixed(1) || '4.0'}</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-[#52616B] pt-2 border-t border-[#DCE4E1] min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#17212B] shrink-0">GST:</span>
                    <span className="font-mono text-[#17212B] bg-[#F5F7F6] border border-[#DCE4E1] px-2 py-0.5 rounded text-[11px] truncate">
                      {s.gst_number}
                    </span>
                  </div>
                  {s.contact_person && (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#17212B] shrink-0">Contact:</span>
                      <span className="text-[#17212B] truncate">{s.contact_person}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-[#52616B]">
                    <Mail className="w-3.5 h-3.5 shrink-0 text-[#52616B]" />
                    <span className="truncate" title={s.email}>{s.email}</span>
                  </div>
                  {s.phone_numbers && s.phone_numbers.length > 0 && (
                    <div className="flex items-center gap-2 text-[#52616B]">
                      <Phone className="w-3.5 h-3.5 shrink-0 text-[#52616B]" />
                      <span className="break-words">{s.phone_numbers.join(', ')}</span>
                    </div>
                  )}
                  {s.address && (
                    <div className="flex items-start gap-2 text-[#52616B] pt-1">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-[#52616B] mt-0.5" />
                      <span className="text-[11px] leading-tight break-words">
                        {[s.address.street, s.address.city, s.address.state, s.address.pincode]
                          .filter(Boolean)
                          .join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-[#DCE4E1]">
                <button
                  onClick={() => handleOpenEdit(s)}
                  className="flex items-center gap-1 px-3 py-1.5 text-[#52616B] hover:text-[#0F766E] hover:bg-[#F5F7F6] rounded-lg text-xs font-semibold transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDeleteSupplier(s)}
                  className="flex items-center gap-1 px-3 py-1.5 text-[#52616B] hover:text-[#B91C1C] hover:bg-rose-50 rounded-lg text-xs font-semibold transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Supplier Modal */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
        }}
        title={isEditModalOpen ? `Edit Supplier #${currentSupplier?.supplier_id}` : 'Register New Supplier'}
        size="lg"
      >
        <form onSubmit={isEditModalOpen ? handleUpdateSupplier : handleCreateSupplier} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#17212B] mb-1">Company / Supplier Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Acme Tech Distributors Pvt Ltd"
                value={formData.supplier_name}
                onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                className="w-full px-3 py-2 bg-[#F5F7F6] border border-[#DCE4E1] rounded-xl text-xs text-[#17212B] focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#17212B] mb-1">GST Number (15 chars) *</label>
              <input
                type="text"
                required
                maxLength={15}
                placeholder="e.g. 29ABCDE1234F1Z5"
                value={formData.gst_number}
                onChange={(e) => setFormData({ ...formData, gst_number: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 bg-[#F5F7F6] border border-[#DCE4E1] rounded-xl text-xs font-mono text-[#17212B] focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#17212B] mb-1">Contact Person</label>
              <input
                type="text"
                placeholder="e.g. Ramesh Patel"
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                className="w-full px-3 py-2 bg-[#F5F7F6] border border-[#DCE4E1] rounded-xl text-xs text-[#17212B] focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#17212B] mb-1">Email Address *</label>
              <input
                type="email"
                required
                placeholder="e.g. sales@acmetech.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 bg-[#F5F7F6] border border-[#DCE4E1] rounded-xl text-xs text-[#17212B] focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#17212B] mb-1">Phone Numbers (comma separated)</label>
              <input
                type="text"
                placeholder="e.g. +91 9876543210, +91 9876543211"
                value={formData.phone_numbers}
                onChange={(e) => setFormData({ ...formData, phone_numbers: e.target.value })}
                className="w-full px-3 py-2 bg-[#F5F7F6] border border-[#DCE4E1] rounded-xl text-xs text-[#17212B] focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#17212B] mb-1">Street Address</label>
              <input
                type="text"
                placeholder="e.g. 45 Industrial Area, Phase II"
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                className="w-full px-3 py-2 bg-[#F5F7F6] border border-[#DCE4E1] rounded-xl text-xs text-[#17212B] focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#17212B] mb-1">City</label>
              <input
                type="text"
                placeholder="e.g. Bangalore"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 bg-[#F5F7F6] border border-[#DCE4E1] rounded-xl text-xs text-[#17212B] focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#17212B] mb-1">State</label>
              <input
                type="text"
                placeholder="e.g. Karnataka"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-3 py-2 bg-[#F5F7F6] border border-[#DCE4E1] rounded-xl text-xs text-[#17212B] focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#17212B] mb-1">Pincode</label>
              <input
                type="text"
                placeholder="e.g. 560001"
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                className="w-full px-3 py-2 bg-[#F5F7F6] border border-[#DCE4E1] rounded-xl text-xs text-[#17212B] focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#17212B] mb-1">Performance Rating (1.0 to 5.0)</label>
              <input
                type="number"
                step="0.1"
                min="1.0"
                max="5.0"
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                className="w-full px-3 py-2 bg-[#F5F7F6] border border-[#DCE4E1] rounded-xl text-xs text-[#17212B] focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#DCE4E1]">
            <button
              type="button"
              onClick={() => {
                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
              }}
              className="px-4 py-2 border border-[#DCE4E1] text-[#17212B] hover:bg-[#F5F7F6] rounded-xl text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-xl text-xs font-semibold shadow-none border border-[#0F766E] disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Saving...' : isEditModalOpen ? 'Update Supplier' : 'Register Supplier'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
