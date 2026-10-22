import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  AlertTriangle,
  ArrowRightLeft,
  FileText,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  Building,
} from 'lucide-react';
import { api } from '../services/api';

export default function ReorderPage({ onNotify }) {
  const [restockEvents, setRestockEvents] = useState([]);
  const [reorderTriggers, setReorderTriggers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fulfillingId, setFulfillingId] = useState(null);
  const [generatingPoId, setGeneratingPoId] = useState(null);

  const fetchReorderData = async () => {
    try {
      setLoading(true);
      const [restockRes, triggersRes] = await Promise.all([
        api.getRestockEvents(),
        api.getReorderTriggers(),
      ]);
      setRestockEvents(restockRes || []);
      setReorderTriggers(triggersRes || []);
    } catch (err) {
      onNotify({
        type: 'error',
        title: 'Error Loading Reorder Data',
        message: err.message || 'Could not fetch replenishment rules',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReorderData();
  }, []);

  const handleFulfillRestock = async (restockId) => {
    try {
      setFulfillingId(restockId);
      const res = await api.fulfillRestockEvent(restockId, 5);
      onNotify({
        type: 'success',
        title: 'Restock Transfer Executed',
        message: `Restock #${restockId} fulfilled. Transferred stock from warehouse to retail shelf.`,
      });
      fetchReorderData();
    } catch (err) {
      onNotify({
        type: 'error',
        title: 'Fulfillment Failed',
        message: err.message || 'Error executing restock transfer',
      });
    } finally {
      setFulfillingId(null);
    }
  };

  const handleGeneratePO = async (triggerId) => {
    try {
      setGeneratingPoId(triggerId);
      const res = await api.generatePOFromTrigger(triggerId);
      onNotify({
        type: 'success',
        title: 'PO Generated from Trigger',
        message: `Trigger #${triggerId} converted to Purchase Order #${res.po_number || res.po_id}!`,
      });
      fetchReorderData();
    } catch (err) {
      onNotify({
        type: 'error',
        title: 'PO Generation Failed',
        message: err.message || 'Error converting trigger to purchase order',
      });
    } finally {
      setGeneratingPoId(null);
    }
  };

  return (
    <div className="px-6 py-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#17212B] tracking-tight">Autonomous Reorder & Replenishment</h2>
          <p className="text-xs text-[#52616B] font-medium mt-0.5">
            Real-time multi-echelon replenishment: Shelf restock events (Warehouse-to-Shelf) & Warehouse Reorder Triggers (PO Generation)
          </p>
        </div>

        <button
          onClick={fetchReorderData}
          className="flex items-center gap-1.5 bg-white border border-[#DCE4E1] hover:bg-[#F5F7F6] text-[#17212B] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Triggers</span>
        </button>
      </div>

      {/* Grid: 2 Columns for the 2 Reorder Stages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stage 1: Shelf Restock Events (restock_events) */}
        <div className="bg-white rounded-xl border border-[#DCE4E1] p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE4E1]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-[#B45309]">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-[#17212B] text-sm">Shelf Restock Events</h3>
                  <span className="text-[11px] text-[#52616B] font-mono">restock_events collection</span>
                </div>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 bg-amber-50 text-[#B45309] rounded border border-amber-200">
                {restockEvents.filter((e) => e.status === 'PENDING').length} Pending
              </span>
            </div>

            <p className="text-xs text-[#52616B] font-medium leading-relaxed">
              Triggered immediately when POS retail sales drive shelf stock below the minimum threshold. Fulfilling transfers stock from the central warehouse.
            </p>

            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
              {restockEvents.length === 0 ? (
                <div className="p-8 text-center text-[#52616B] text-xs border border-dashed border-[#DCE4E1] rounded-lg font-medium">
                  No restock events recorded. All shelves are adequately stocked.
                </div>
              ) : (
                restockEvents.map((evt) => {
                  const isPending = evt.status === 'PENDING';
                  return (
                    <div
                      key={evt.restock_id}
                      className={`p-3.5 rounded-lg border transition-all ${
                        isPending
                          ? 'bg-[#F5F7F6] border-[#DCE4E1]'
                          : 'bg-[#F5F7F6] border-[#DCE4E1] opacity-75'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#17212B] text-xs truncate" title={evt.product_name}>
                              {evt.product_name || `Product #${evt.product_id}`}
                            </span>
                            <span className="font-mono text-[10px] text-[#52616B] shrink-0">ID: #{evt.restock_id}</span>
                          </div>
                          <div className="text-[11px] text-[#52616B] mt-1 font-medium truncate">
                            Transfer: <span className="font-semibold text-[#17212B]">Loc #{evt.from_location_id} (WH)</span>{' '}
                            → <span className="font-semibold text-[#17212B]">Loc #{evt.to_location_id} (Shelf)</span>
                          </div>
                          <div className="text-[11px] text-[#52616B] mt-0.5 truncate">
                            Quantity Required: <span className="font-bold text-[#17212B]">{evt.quantity_moved} units</span> •{' '}
                            {new Date(evt.restock_date).toLocaleString()}
                          </div>
                        </div>

                        <div className="shrink-0">
                          {isPending ? (
                            <button
                              onClick={() => handleFulfillRestock(evt.restock_id)}
                              disabled={fulfillingId === evt.restock_id}
                              className="flex items-center gap-1 px-2.5 py-1 bg-[#B45309] hover:bg-amber-700 text-white rounded-md text-xs font-semibold border border-[#B45309] transition-colors disabled:opacity-50"
                            >
                              {fulfillingId === evt.restock_id ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <ArrowRightLeft className="w-3 h-3" />
                              )}
                              <span>Fulfill Stock</span>
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#15803D] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-[#15803D]" />
                              Transferred
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Stage 2: Warehouse Reorder Triggers (reorder_triggers) */}
        <div className="bg-white rounded-xl border border-[#DCE4E1] p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE4E1]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-[#B91C1C]">
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-[#17212B] text-sm">Warehouse Safety Triggers</h3>
                  <span className="text-[11px] text-[#52616B] font-mono">reorder_triggers collection</span>
                </div>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 bg-rose-50 text-[#B91C1C] rounded border border-rose-200">
                {reorderTriggers.filter((t) => t.status === 'OPEN').length} Open
              </span>
            </div>

            <p className="text-xs text-[#52616B] font-medium leading-relaxed">
              Generated when warehouse stock depletes below safety reserve. Creating a PO issues a contracted replenishment order directly to the wholesale supplier.
            </p>

            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
              {reorderTriggers.length === 0 ? (
                <div className="p-8 text-center text-[#52616B] text-xs border border-dashed border-[#DCE4E1] rounded-lg font-medium">
                  No warehouse triggers open. Central warehouse reserves are above threshold.
                </div>
              ) : (
                reorderTriggers.map((trig) => {
                  const isOpen = trig.status === 'OPEN';
                  return (
                    <div
                      key={trig.trigger_id}
                      className={`p-3.5 rounded-lg border transition-all ${
                        isOpen
                          ? 'bg-[#F5F7F6] border-[#DCE4E1]'
                          : 'bg-[#F5F7F6] border-[#DCE4E1] opacity-75'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#17212B] text-xs truncate" title={trig.product_name}>
                              {trig.product_name || `Product #${trig.product_id}`}
                            </span>
                            <span className="font-mono text-[10px] text-[#52616B] shrink-0">Trigger: #{trig.trigger_id}</span>
                          </div>
                          <div className="text-[11px] text-[#52616B] mt-1 font-medium truncate">
                            Warehouse Loc #{trig.location_id} • Current Level:{' '}
                            <span className="font-bold text-[#B91C1C]">{trig.stock_level_at_trigger} units</span>{' '}
                            (Threshold: {trig.threshold_value} min)
                          </div>
                          <div className="text-[11px] text-[#52616B] mt-0.5 truncate">
                            Triggered on: {new Date(trig.trigger_date).toLocaleString()}
                          </div>
                        </div>

                        <div className="shrink-0">
                          {isOpen ? (
                            <button
                              onClick={() => handleGeneratePO(trig.trigger_id)}
                              disabled={generatingPoId === trig.trigger_id}
                              className="flex items-center gap-1 px-2.5 py-1 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-md text-xs font-semibold border border-[#0F766E] transition-colors disabled:opacity-50"
                            >
                              {generatingPoId === trig.trigger_id ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <FileText className="w-3 h-3" />
                              )}
                              <span>Generate PO</span>
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0F766E] bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                              <CheckCircle2 className="w-3 h-3 text-[#0F766E]" />
                              PO Created
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
