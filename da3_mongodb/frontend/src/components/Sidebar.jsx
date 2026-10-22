import React from 'react';
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingCart,
  Truck,
  FileText,
  PackageCheck,
  RefreshCw,
  BarChart3,
  Database,
  CheckCircle2,
  Sparkles,
  X,
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, stats = {}, isOpen = false, onClose = () => {} }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package, badge: stats.totalProducts },
    { id: 'inventory', label: 'Inventory', icon: Layers, badge: stats.lowStockCount ? `${stats.lowStockCount} Low` : null, badgeColor: 'bg-amber-900/40 text-amber-300 border border-amber-700/50' },
    { id: 'sales', label: 'Sales / POS', icon: ShoppingCart },
    { id: 'suppliers', label: 'Suppliers', icon: Truck },
    { id: 'purchase_orders', label: 'Purchase Orders', icon: FileText, badge: stats.pendingPOCount ? `${stats.pendingPOCount} Pending` : null, badgeColor: 'bg-teal-900/40 text-teal-300 border border-teal-700/50' },
    { id: 'shipments', label: 'Shipments', icon: PackageCheck },
    { id: 'reorders', label: 'Reorder Mgmt', icon: RefreshCw, badge: (stats.restockCount || 0) + (stats.reorderCount || 0) > 0 ? (stats.restockCount || 0) + (stats.reorderCount || 0) : null, badgeColor: 'bg-rose-900/40 text-rose-300 border border-rose-700/50' },
    { id: 'ai_forecast', label: 'AI Demand Forecast', icon: Sparkles, badge: stats.highRiskCount ? `${stats.highRiskCount} Risk` : null, badgeColor: 'bg-teal-900/40 text-teal-300 border border-teal-700/50' },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  const sidebarContent = (
    <div className="w-64 bg-[#17212B] text-slate-300 flex flex-col h-full border-r border-[#243342] shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#243342]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#0F766E] flex items-center justify-center text-white shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-white text-base tracking-tight leading-tight">SmartRetail</h1>
              <p className="text-[9px] font-semibold tracking-wider uppercase text-teal-400/90 mt-0.5">
                INTELLIGENT RETAIL MANAGEMENT
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#1F2C38] transition-colors"
            title="Close Navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-[11px] text-[#8A9BA8] mt-2.5 font-normal leading-normal">
          Unified inventory, sales &amp; procurement
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                onClose();
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-[#0F766E] text-white font-semibold'
                  : 'text-[#B8C5C0] hover:text-white hover:bg-[#1F2C38]'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#8A9BA8]'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${
                    isActive ? 'bg-white/20 text-white' : item.badgeColor || 'bg-[#1F2C38] text-slate-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* MongoDB Database Badge in Footer */}
      <div className="p-4 border-t border-[#243342] text-xs shrink-0">
        <div className="bg-[#131B23] rounded-lg p-3 border border-[#243342]">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>MongoDB Local (27017)</span>
          </div>
          <p className="text-[11px] text-[#8A9BA8] mt-1 truncate">
            Database: <span className="text-slate-200 font-mono">smartretail_db</span>
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            14 Collections • Full ACID Support
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Static Sidebar */}
      <aside className="hidden lg:flex shrink-0 min-h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-[#17212B]/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={onClose}
          />
          <div className="relative z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
