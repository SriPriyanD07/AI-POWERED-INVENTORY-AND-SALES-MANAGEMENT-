import React, { useState, useEffect } from 'react';
import {
  PackageCheck,
  Truck,
  ArrowDownCircle,
  Eye,
  CheckCircle2,
  Clock,
  Building,
  RefreshCw,
} from 'lucide-react';
import { api } from '../services/api';
import Modal from '../components/Modal';

export default function ShipmentsPage({ onNotify }) {
  const [shipments, setShipments] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Receive Form
  const [receiveForm, setReceiveForm] = useState({
    warehouse_location_id: 1, // default WH-MAIN
    received_by: 5, // warehouse associate
  });

  const fetchShipments = async () => {
    try {
      setLoading(true);
      const [shipRes, locsRes] = await Promise.all([
        api.getShipments(statusFilter),
        api.getLocations(),
      ]);
      setShipments(shipRes || []);
      const whs = (locsRes || []).filter((l) => l.location_type === 'WAREHOUSE');
      setLocations(whs.length > 0 ? whs : locsRes || []);
      if (whs.length > 0) {
        setReceiveForm((prev) => ({ ...prev, warehouse_location_id: whs[0].location_id }));
      }
    } catch (err) {
      onNotify({
        type: 'error',
        title: 'Error Loading Shipments',
        message: err.message || 'Could not fetch shipments',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, [statusFilter]);

  const handleOpenReceive = (shipment) => {
    setSelectedShipment(shipment);
    setIsReceiveModalOpen(true);
  };

  const handleExecuteReceive = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await api.receiveShipment({
        shipment_id: selectedShipment.shipment_id,
        warehouse_location_id: Number(receiveForm.warehouse_location_id),
        received_by: Number(receiveForm.received_by),
      });

      onNotify({
        type: 'success',
        title: 'Shipment Received into Warehouse',
        message: `Shipment #${selectedShipment.shipment_id} items added to warehouse stock!`,
      });
      setIsReceiveModalOpen(false);
      fetchShipments();
    } catch (err) {
      onNotify({
        type: 'error',
        title: 'Receipt Failed',
        message: err.message || 'Error processing shipment intake',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="px-6 py-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#17212B] tracking-tight">Inbound Shipments & Receiving</h2>
          <p className="text-xs text-[#52616B] font-medium mt-0.5">
            Track vendor logistics deliveries and receive incoming inventory stock into warehouse bins
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white p-3.5 rounded-xl border border-[#DCE4E1] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {['', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'RECEIVED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === st
                  ? 'bg-[#0F766E] text-white'
                  : 'bg-white border border-[#DCE4E1] text-[#52616B] hover:text-[#17212B]'
              }`}
            >
              {st === '' ? 'All Shipments' : st}
            </button>
          ))}
        </div>
        <span className="text-xs text-[#52616B] font-medium">{shipments.length} consignments</span>
      </div>

      {/* Shipments Table */}
      <div className="bg-white rounded-xl border border-[#DCE4E1] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[#52616B]">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0F766E]" />
            <p className="text-xs font-medium">Querying shipments collection...</p>
          </div>
        ) : shipments.length === 0 ? (
          <div className="p-12 text-center text-[#52616B]">
            <Truck className="w-8 h-8 text-[#52616B] mx-auto mb-2" />
            <p className="text-sm font-bold text-[#17212B]">No shipments found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#DCE4E1] bg-[#F5F7F6] text-[11px] font-bold text-[#52616B] uppercase tracking-wider">
                  <th className="py-2.5 px-3.5 whitespace-nowrap">Tracking Number</th>
                  <th className="py-2.5 px-3.5 whitespace-nowrap">Carrier</th>
                  <th className="py-2.5 px-3.5 whitespace-nowrap">PO Reference</th>
                  <th className="py-2.5 px-3.5 whitespace-nowrap">Ship Date</th>
                  <th className="py-2.5 px-3.5 text-center whitespace-nowrap">Items Count</th>
                  <th className="py-2.5 px-3.5 text-center whitespace-nowrap">Status</th>
                  <th className="py-2.5 px-3.5 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE4E1] text-xs">
                {shipments.map((ship) => {
                  const statusColors = {
                    IN_TRANSIT: 'bg-teal-50 text-[#0F766E] border-teal-200',
                    OUT_FOR_DELIVERY: 'bg-amber-50 text-[#B45309] border-amber-200',
                    DELIVERED: 'bg-[#E4EBE7] text-[#2C3C35] border-[#C8D6CF]',
                    RECEIVED: 'bg-emerald-50 text-[#15803D] border-emerald-200',
                  }[ship.status] || 'bg-slate-100 text-slate-700';

                  const canReceive = ship.status !== 'RECEIVED';

                  return (
                    <tr key={ship.shipment_id} className="hover:bg-[#F5F7F6] transition-colors">
                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        <div className="font-mono font-bold text-[#17212B]">{ship.tracking_number}</div>
                        <span className="text-[10px] text-[#52616B] font-mono">ID: #{ship.shipment_id}</span>
                      </td>
                      <td className="py-2.5 px-3.5 font-semibold text-[#17212B] whitespace-nowrap">{ship.carrier}</td>
                      <td className="py-2.5 px-3.5 font-mono text-[#52616B] font-semibold whitespace-nowrap">PO #{ship.po_id}</td>
                      <td className="py-2.5 px-3.5 text-[#52616B] font-medium whitespace-nowrap">{new Date(ship.ship_date).toLocaleDateString()}</td>
                      <td className="py-2.5 px-3.5 text-center font-semibold text-[#17212B] whitespace-nowrap">{ship.items?.length || 0} product(s)</td>
                      <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusColors}`}>
                          {ship.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedShipment(ship);
                              setIsViewModalOpen(true);
                            }}
                            className="p-1.5 text-[#52616B] hover:text-[#0F766E] hover:bg-[#F5F7F6] rounded-md transition-colors"
                            title="Inspect Manifest"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {canReceive && (
                            <button
                              onClick={() => handleOpenReceive(ship)}
                              className="flex items-center gap-1 px-2.5 py-1 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-md text-[11px] font-semibold transition-colors border border-[#0F766E]"
                            >
                              <ArrowDownCircle className="w-3.5 h-3.5" />
                              <span>Receive Stock</span>
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

      {/* Receive Shipment Modal */}
      <Modal isOpen={isReceiveModalOpen} onClose={() => setIsReceiveModalOpen(false)} title="Receive Shipment into Warehouse" size="md">
        {selectedShipment && (
          <form onSubmit={handleExecuteReceive} className="space-y-4">
            <div className="bg-[#F5F7F6] p-3.5 rounded-xl border border-[#DCE4E1] text-xs space-y-1">
              <div className="font-semibold text-[#17212B]">
                Tracking: <span className="font-mono">{selectedShipment.tracking_number}</span>
              </div>
              <div className="text-[#52616B]">
                Carrier: {selectedShipment.carrier} • PO Reference: #{selectedShipment.po_id}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#17212B] mb-1">Target Warehouse Location *</label>
              <select
                required
                value={receiveForm.warehouse_location_id}
                onChange={(e) => setReceiveForm({ ...receiveForm, warehouse_location_id: e.target.value })}
                className="w-full px-3 py-2 bg-[#F5F7F6] border border-[#DCE4E1] rounded-xl text-xs text-[#17212B] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20 outline-none"
              >
                {locations.map((loc) => (
                  <option key={loc.location_id} value={loc.location_id}>
                    {loc.location_code} - {loc.location_name} ({loc.location_type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#17212B] mb-1">Receiving Warehouse Officer</label>
              <select
                value={receiveForm.received_by}
                onChange={(e) => setReceiveForm({ ...receiveForm, received_by: e.target.value })}
                className="w-full px-3 py-2 bg-[#F5F7F6] border border-[#DCE4E1] rounded-xl text-xs text-[#17212B] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20 outline-none"
              >
                <option value="5">EMP #5 - Rajesh Kumar (Warehouse Associate)</option>
                <option value="4">EMP #4 - Sneha Patil (Inventory Lead)</option>
              </select>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-[#15803D]">
              Receiving this consignment will update inventory stock at the chosen warehouse and record an atomic shipment intake audit log.
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#DCE4E1]">
              <button
                type="button"
                onClick={() => setIsReceiveModalOpen(false)}
                className="px-4 py-2 border border-[#DCE4E1] text-[#17212B] hover:bg-[#F5F7F6] rounded-xl text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-[#0F766E] hover:bg-[#115E59] text-white border border-[#0F766E] rounded-xl text-xs font-semibold disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Receiving Stock...' : 'Confirm Intake'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Manifest Modal */}
      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title={`Manifest: ${selectedShipment?.tracking_number}`} size="md">
        {selectedShipment && (
          <div className="space-y-4 text-xs">
            <div className="space-y-2">
              <h4 className="font-bold text-[#17212B] text-xs">Consignment Manifest Line Items</h4>
              <div className="divide-y divide-[#DCE4E1] border border-[#DCE4E1] rounded-xl overflow-hidden">
                {(selectedShipment.items || []).map((item, i) => (
                  <div key={i} className="p-3 flex items-center justify-between bg-white gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-[#17212B] truncate">{item.product_name || `Product #${item.product_id}`}</div>
                      <div className="text-[11px] text-[#52616B] font-mono">Product ID: {item.product_id}</div>
                    </div>
                    <div className="font-bold text-[#17212B] shrink-0 text-right">{item.quantity_shipped} units</div>
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
