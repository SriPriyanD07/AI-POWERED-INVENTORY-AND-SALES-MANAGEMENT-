import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Notification from './components/Notification';
import { api } from './services/api';

// Pages
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import InventoryPage from './pages/InventoryPage';
import SalesPage from './pages/SalesPage';
import SuppliersPage from './pages/SuppliersPage';
import PurchaseOrdersPage from './pages/PurchaseOrdersPage';
import ShipmentsPage from './pages/ShipmentsPage';
import ReorderPage from './pages/ReorderPage';
import ReportsPage from './pages/ReportsPage';
import AIForecastPage from './pages/AIForecastPage';

// URL pathname mapping for direct navigation and refresh support on Vercel
const pathToTab = (pathname) => {
  const clean = (pathname || '').replace(/^\/+|\/+$/g, '').toLowerCase();
  if (!clean || clean === 'dashboard') return 'dashboard';
  if (clean === 'products') return 'products';
  if (clean === 'inventory') return 'inventory';
  if (clean === 'sales') return 'sales';
  if (clean === 'suppliers') return 'suppliers';
  if (clean === 'purchase-orders' || clean === 'purchase_orders') return 'purchase_orders';
  if (clean === 'shipments') return 'shipments';
  if (clean === 'reorders' || clean === 'reorder') return 'reorders';
  if (clean === 'ai-forecast' || clean === 'ai_forecast') return 'ai_forecast';
  if (clean === 'reports') return 'reports';
  return 'dashboard';
};

const tabToPath = (tab) => {
  if (tab === 'dashboard') return '/';
  if (tab === 'purchase_orders') return '/purchase-orders';
  if (tab === 'ai_forecast') return '/ai-forecast';
  return `/${tab}`;
};

export default function App() {
  const [activeTab, setActiveTabState] = useState(() => {
    if (typeof window !== 'undefined') {
      return pathToTab(window.location.pathname);
    }
    return 'dashboard';
  });

  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      const newPath = tabToPath(tab);
      if (window.location.pathname !== newPath) {
        window.history.pushState(null, '', newPath);
      }
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      setActiveTabState(pathToTab(window.location.pathname));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [notification, setNotification] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // App-level badge stats for sidebar
  const [sidebarStats, setSidebarStats] = useState({
    totalProducts: null,
    lowStockCount: 0,
    pendingPOCount: 0,
    restockCount: 0,
    reorderCount: 0,
    highRiskCount: 0,
  });

  const loadSidebarStats = async () => {
    try {
      const [sum, low, restock, triggers, forecast] = await Promise.all([
        api.getAnalyticsSummary().catch(() => null),
        api.getLowStock().catch(() => null),
        api.getRestockEvents('PENDING').catch(() => []),
        api.getReorderTriggers('OPEN').catch(() => []),
        api.getAIForecastOverview().catch(() => null),
      ]);

      const shelfLow = low?.shelf_below_threshold?.length || 0;
      const whLow = low?.warehouse_below_threshold?.length || 0;

      setSidebarStats({
        totalProducts: sum?.total_products || null,
        lowStockCount: shelfLow + whLow,
        pendingPOCount: sum?.pending_purchase_orders || 0,
        restockCount: (restock || []).length,
        reorderCount: (triggers || []).length,
        highRiskCount: forecast?.high_stockout_risk_count || 0,
      });
    } catch (_) {
      // ignore badge fetch errors
    }
  };

  useEffect(() => {
    loadSidebarStats();
  }, [refreshKey, activeTab]);

  const handleGlobalRefresh = async () => {
    setIsRefreshing(true);
    setRefreshKey((prev) => prev + 1);
    await loadSidebarStats();
    setTimeout(() => {
      setIsRefreshing(false);
      setNotification({
        type: 'info',
        title: 'Synchronized',
        message: 'Aggregated latest MongoDB state and collections.',
      });
    }, 400);
  };

  const pageDetails = {
    dashboard: {
      title: 'SmartRetail Executive Dashboard',
      subtitle: 'Real-time inventory, sales and procurement insights',
      component: <DashboardPage key={refreshKey} setActiveTab={setActiveTab} onNotify={setNotification} />,
    },
    products: {
      title: 'Product Catalog & Pricing',
      subtitle: 'SKU registry, barcoding, unit prices, and category classification',
      component: <ProductsPage key={refreshKey} onNotify={setNotification} />,
    },
    inventory: {
      title: 'Multi-Location Inventory Management',
      subtitle: 'Central warehouse stock, retail shelf locations, and audit ledger',
      component: <InventoryPage key={refreshKey} onNotify={setNotification} />,
    },
    sales: {
      title: 'Point of Sale (POS) Terminal',
      subtitle: 'Cashier checkout register, split payments, and receipt generation',
      component: <SalesPage key={refreshKey} onNotify={setNotification} />,
    },
    suppliers: {
      title: 'Supplier & Vendor Relationship Management',
      subtitle: 'Wholesale suppliers, GST verification, and supplier performance',
      component: <SuppliersPage key={refreshKey} onNotify={setNotification} />,
    },
    purchase_orders: {
      title: 'Procurement & Purchase Orders',
      subtitle: 'Contracted order tracking, dynamic item manifests, and PO lifecycle',
      component: <PurchaseOrdersPage key={refreshKey} onNotify={setNotification} />,
    },
    shipments: {
      title: 'Inbound Logistics & Receiving',
      subtitle: 'Carrier consignments, manifest inspections, and warehouse receiving',
      component: <ShipmentsPage key={refreshKey} onNotify={setNotification} />,
    },
    reorders: {
      title: 'Autonomous Replenishment Engine',
      subtitle: 'Shelf restock events and automated warehouse purchase order triggers',
      component: <ReorderPage key={refreshKey} onNotify={setNotification} />,
    },
    ai_forecast: {
      title: 'Predictive Demand Forecasting & Neural Stock Optimization',
      subtitle: 'Time-series regression, 95% confidence intervals, and autonomous safety stock calibration',
      component: <AIForecastPage key={refreshKey} onNotify={setNotification} />,
    },
    reports: {
      title: 'Analytical Aggregations & Business Intelligence',
      subtitle: 'Category revenue shares, bestseller rankings, and inventory valuation',
      component: <ReportsPage key={refreshKey} onNotify={setNotification} />,
    },
  }[activeTab] || {
    title: 'SmartRetail Executive Dashboard',
    subtitle: 'Real-time inventory, sales and procurement insights',
    component: <DashboardPage setActiveTab={setActiveTab} onNotify={setNotification} />,
  };

  return (
    <div className="flex min-h-screen bg-[#F5F7F6] font-sans text-[#17212B] antialiased">
      {/* Sidebar (Desktop static & Mobile drawer) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        stats={sidebarStats}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header
          title={pageDetails.title}
          subtitle={pageDetails.subtitle}
          onRefresh={handleGlobalRefresh}
          isRefreshing={isRefreshing}
          onNotify={setNotification}
          onToggleMenu={() => setIsMobileMenuOpen((prev) => !prev)}
        />

        <main className="flex-1 pb-16">{pageDetails.component}</main>
      </div>

      {/* Floating Notifications */}
      <Notification notification={notification} onClose={() => setNotification(null)} />
    </div>
  );
}
