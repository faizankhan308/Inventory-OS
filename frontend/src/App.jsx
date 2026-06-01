import React, { useState, useEffect } from "react";
import { 
  Package, 
  Users, 
  ShoppingCart, 
  LayoutDashboard, 
  RefreshCw, 
  CheckCircle,
  Database,
  Sparkles
} from "lucide-react";
import Dashboard from "./components/Dashboard";
import ProductsTab from "./components/ProductsTab";
import CustomersTab from "./components/CustomersTab";
import OrdersTab from "./components/OrdersTab";

const getApiUrl = (endpoint) => {
  const base = import.meta.env.VITE_API_URL || "";
  if (base) {
    // In production, we call the backend directly (without local Nginx /api/ path)
    return `${base}${endpoint}`; // e.g. https://deployed-backend.com/products
  }
  // Local development: fallback to Nginx proxy
  return `/api${endpoint}`; // e.g. /api/products
};

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [alertInfo, setAlertInfo] = useState(null);

  // Trigger alert banner
  const triggerAlert = (type, text) => {
    setAlertInfo({ type, text });
    setTimeout(() => {
      setAlertInfo(null);
    }, 4000);
  };

  // Fetch core telemetry parameters
  const loadStatsAndData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      // Parallel fetches
      const [resProducts, resCustomers, resOrders, resStats] = await Promise.all([
        fetch(getApiUrl("/products")),
        fetch(getApiUrl("/customers")),
        fetch(getApiUrl("/orders")),
        fetch(getApiUrl("/dashboard-stats"))
      ]);

      if (!resProducts.ok || !resCustomers.ok || !resOrders.ok || !resStats.ok) {
        throw new Error("Failed to load telemetry registers.");
      }

      const rawProducts = await resProducts.json();
      const rawCustomers = await resCustomers.json();
      const rawOrders = await resOrders.json();
      const rawStats = await resStats.json();

      setProducts(rawProducts);
      setCustomers(rawCustomers);
      setOrders(rawOrders);
      setStats(rawStats);
    } catch (e) {
      console.error(e);
      triggerAlert("error", e.message || "Failed to communicate with fullstack server.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadStatsAndData();
  }, []);

  // API Call: Add Product
  const handleAddProduct = async (productData) => {
    const res = await fetch(getApiUrl("/products"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(productData)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to create product listing.");
    }

    triggerAlert("success", `Product '${productData.name}' created successfully!`);
    await loadStatsAndData(true);
  };

  // API Call: Update Product
  const handleUpdateProduct = async (id, productData) => {
    const res = await fetch(getApiUrl(`/products/${id}`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(productData)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to update product registration.");
    }

    triggerAlert("success", `Product '${productData.name}' details updated!`);
    await loadStatsAndData(true);
  };

  // Quick action from Dashboard Low Stock center
  const handleQuickRestock = async (productId, newQty) => {
    const targetProduct = products.find(p => p.id === productId);
    if (!targetProduct) return;

    try {
      const res = await fetch(getApiUrl(`/products/${productId}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: targetProduct.name,
          sku: targetProduct.sku,
          price: targetProduct.price,
          quantity: newQty
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to replenish stock level.");
      }

      triggerAlert("success", `Restocked listing of '${targetProduct.name}' sequentially.`);
      await loadStatsAndData(true);
    } catch (err) {
      triggerAlert("error", err.message || "Failed to restock.");
    }
  };

  // API Call: Delete Product
  const handleDeleteProduct = async (id) => {
    const res = await fetch(getApiUrl(`/products/${id}`), {
      method: "DELETE"
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Could not delete product listing.");
    }

    triggerAlert("success", "Product catalog listing unlinked successfully.");
    await loadStatsAndData(true);
  };

  // API Call: Add Customer
  const handleAddCustomer = async (customerData) => {
    const res = await fetch(getApiUrl("/customers"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(customerData)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to registers customer profile.");
    }

    triggerAlert("success", `Customer profile for '${customerData.name}' successfully integrated!`);
    await loadStatsAndData(true);
  };

  // API Call: Delete Customer
  const handleDeleteCustomer = async (id) => {
    const res = await fetch(getApiUrl(`/customers/${id}`), {
      method: "DELETE"
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Could not delete customer contact.");
    }

    triggerAlert("success", "Customer profiles details archived.");
    await loadStatsAndData(true);
  };

  // API Call: Create Order checkout
  const handleCreateOrder = async (orderData) => {
    const res = await fetch(getApiUrl("/orders"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to checkout checkout transaction.");
    }

    triggerAlert("success", "Checkout finalized. Stock deductions performed!");
    await loadStatsAndData(true);
  };

  // API Call: Delete/Cancel Order
  const handleDeleteOrder = async (id) => {
    const res = await fetch(getApiUrl(`/orders/${id}`), {
      method: "DELETE"
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Could not cancel transaction invoice.");
    }

    triggerAlert("success", "Order transaction reversed. Stock replenishment complete.");
    await loadStatsAndData(true);
  };

  return (
    <div className="h-screen bg-[#F8FAFC] text-[#1E293B] flex flex-col font-sans overflow-hidden" id="application-root">
      {/* Alert banner display */}
      {alertInfo && (
        <div 
          className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg border text-sm flex items-center gap-3 animate-in slide-in-from-top-4 duration-300 ${
            alertInfo.type === "success" 
              ? "bg-emerald-50 text-emerald-850 border-emerald-200" 
              : "bg-red-50 text-red-850 border-red-200"
          }`}
          id="global-toast-alert"
        >
          <CheckCircle className={`w-5 h-5 shrink-0 ${alertInfo.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`} />
          <span className="font-semibold">{alertInfo.text}</span>
        </div>
      )}

      {/* Top Header navbar panel */}
      <header className="h-16 px-6 sm:px-8 border-b-2 border-[#E2E8F0] flex items-center justify-between bg-white shrink-0 sticky top-0 z-30" id="global-navbar">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center shrink-0">
            <div className="w-4 h-4 border-2 border-white"></div>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase flex items-baseline gap-1">
            Inventory<span className="text-blue-600 font-black">OS</span>
          </h1>
          <div className="hidden md:flex ml-4 px-3 py-1 bg-slate-100 rounded-full items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span className="text-[10px] font-bold text-slate-500 font-mono">PROD-ENVIRONMENT: READY</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-bold font-mono border border-emerald-200">
            SYSTEM_ONLINE
          </div>
        </div>
      </header>

      {/* Main app navigation shell */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
        
        {/* Left navigation sidebar */}
        <nav className="w-full md:w-56 shrink-0 flex flex-row md:flex-col gap-1.5 overflow-x-auto md:overflow-visible" id="sidebar-menu">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-2 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border-2 ${
              activeTab === "dashboard"
                ? "bg-slate-900 text-white border-slate-950"
                : "bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-50 border-[#E2E8F0]"
            }`}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">Dashboard</span>
          </button>
          
          <button
            onClick={() => setActiveTab("products")}
            className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-2 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border-2 ${
              activeTab === "products"
                ? "bg-slate-900 text-white border-slate-950"
                : "bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-50 border-[#E2E8F0]"
            }`}
            id="menu-products"
          >
            <Package className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">Products</span>
          </button>

          <button
            onClick={() => setActiveTab("customers")}
            className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-2 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border-2 ${
              activeTab === "customers"
                ? "bg-slate-900 text-white border-slate-950"
                : "bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-50 border-[#E2E8F0]"
            }`}
            id="menu-customers"
          >
            <Users className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">Customers</span>
          </button>

          <button
            onClick={() => setActiveTab("orders")}
            className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-2 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border-2 ${
              activeTab === "orders"
                ? "bg-slate-900 text-white border-slate-950"
                : "bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-50 border-[#E2E8F0]"
            }`}
            id="menu-orders"
          >
            <ShoppingCart className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">Orders</span>
          </button>
        </nav>

        {/* Content body panel */}
        <main className="flex-1 bg-transparent min-w-0 overflow-y-auto pr-2 pb-6" id="main-content-pane">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border-2 border-[#E2E8F0] gap-3">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">QUERYING TELEMETRY SYSTEMS...</p>
            </div>
          ) : !stats ? (
            <div className="p-8 text-center bg-red-50 rounded-2xl border-2 border-red-200 text-red-700 font-bold">
              Database connection offline. Could not load metadata logs.
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              {activeTab === "dashboard" && (
                <Dashboard 
                  stats={stats} 
                  onNavigate={setActiveTab} 
                  onRestock={handleQuickRestock}
                />
              )}
              {activeTab === "products" && (
                <ProductsTab 
                  products={products}
                  onAddProduct={handleAddProduct}
                  onUpdateProduct={handleUpdateProduct}
                  onDeleteProduct={handleDeleteProduct}
                />
              )}
              {activeTab === "customers" && (
                <CustomersTab 
                  customers={customers}
                  onAddCustomer={handleAddCustomer}
                  onDeleteCustomer={handleDeleteCustomer}
                />
              )}
              {activeTab === "orders" && (
                <OrdersTab 
                  orders={orders}
                  customers={customers}
                  products={products}
                  onCreateOrder={handleCreateOrder}
                  onDeleteOrder={handleDeleteOrder}
                />
              )}
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="py-6 border-t-2 border-[#E2E8F0] bg-white text-center text-xs text-slate-400 font-mono shrink-0">
        Designed and Developed by <span className="font-bold text-blue-600">Faizan Khan</span> &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
