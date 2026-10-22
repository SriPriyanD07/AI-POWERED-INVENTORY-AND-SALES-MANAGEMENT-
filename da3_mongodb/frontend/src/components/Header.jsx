import React, { useState } from 'react';
import { RefreshCw, CheckCircle2, Sparkles, Menu } from 'lucide-react';
import { api } from '../services/api';

export default function Header({ title, subtitle, onRefresh, isRefreshing, onNotify, onToggleMenu }) {
  const [isDemoRunning, setIsDemoRunning] = useState(false);

  const handleRunDemo = async () => {
    if (isDemoRunning) return; // Prevent duplicate concurrent runs

    if (
      !window.confirm(
        "Trigger the full end-to-end SmartRetail workflow?\n\nThis will execute:\n1. Incoming Shipment Receipt -> Warehouse\n2. Warehouse-to-Shelf Restock Transfer\n3. POS Customer Checkout -> Shelf Stock Decrement\n4. Low-Stock Detection -> Shelf Restock Event\n5. Warehouse Safety Stock Breach -> Reorder Trigger PO Generation"
      )
    ) {
      return;
    }

    try {
      setIsDemoRunning(true);
      const res = await api.triggerWorkflowDemo();

      const saleAmt = res.sale_total !== undefined ? Number(res.sale_total).toLocaleString() : '1,200';
      const receiptRef = res.receipt_number ? ` (${res.receipt_number})` : '';
      const poRef = res.generated_po_id || 'PO-AUTO';
      const restockState = res.restock_status || 'Transferred';
      const shipRef = res.shipment_id ? `Shipment #${res.shipment_id}` : 'Inbound shipment';

      onNotify({
        type: 'success',
        title: 'Workflow Demonstration Completed',
        message: `${shipRef} received. Sale${receiptRef} for ₹${saleAmt} recorded. Shelf restocked (${restockState}). Auto PO #${poRef} issued!`,
      });

      // Refresh KPIs, tables, alerts, and charts across dashboard
      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      onNotify({
        type: 'error',
        title: err.isNetworkError ? 'Backend Connection Offline' : 'Workflow Demonstration Rejected',
        message: err.message || 'An error occurred during workflow demonstration',
      });
    } finally {
      setIsDemoRunning(false);
    }
  };

  return (
    <header className="bg-white border-b border-[#DCE4E1] px-4 sm:px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleMenu}
          className="lg:hidden p-2 text-[#52616B] hover:text-[#17212B] hover:bg-[#F5F7F6] rounded-lg border border-[#DCE4E1] shrink-0"
          title="Open Navigation Menu"
        >
          <Menu className="w-4 h-4" />
        </button>
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-bold text-[#17212B] tracking-tight truncate">{title}</h2>
          {subtitle && <p className="text-xs text-[#52616B] mt-0.5 font-medium truncate hidden sm:block">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2 text-[#52616B] hover:text-[#17212B] hover:bg-[#F5F7F6] rounded-lg transition-colors border border-[#DCE4E1] shrink-0"
          title="Refresh Data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#0F766E]' : ''}`} />
        </button>

        {/* Workflow Demo Button */}
        <button
          onClick={handleRunDemo}
          disabled={isDemoRunning}
          className="flex items-center gap-1.5 bg-[#0F766E] hover:bg-[#115E59] text-white px-3 sm:px-3.5 py-2 rounded-lg text-xs font-semibold border border-[#0F766E] transition-colors disabled:opacity-50 shrink-0"
        >
          {isDemoRunning ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
              <span className="hidden sm:inline">Simulating Pipeline...</span>
              <span className="sm:hidden">Running...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-teal-200 shrink-0" />
              <span className="hidden sm:inline">Run Automated Workflow</span>
              <span className="sm:hidden">Workflow</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
