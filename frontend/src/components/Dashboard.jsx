import React, { useState } from "react";
import { 
  CheckCircle,
  Database
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from "recharts";

export default function Dashboard({ stats, products = [], onNavigate, onRestock }) {
  const [restockQty, setRestockQty] = useState({});
  const [isUpdating, setIsUpdating] = useState(null);

  const handleQuickRestock = async (productId, currentQty) => {
    const addQty = restockQty[productId] || 10;
    setIsUpdating(productId);
    try {
      await onRestock(productId, currentQty + addQty);
      setRestockQty(prev => ({ ...prev, [productId]: 10 })); // reset
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(null);
    }
  };

  // Use real products array for accurate stock chart — sorted by stock ascending (low stock first)
  const chartData = (products.length > 0 ? products : stats.lowStockProducts)
    .map(p => ({ name: p.name, stock: p.quantity }))
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 8);

  // Fallback if no products at all
  const displayChartData = chartData.length > 0 ? chartData : [
    { name: "Keeb Core", stock: 45 },
    { name: "Chair V2", stock: 4 },
    { name: "Monitor 4K", stock: 12 },
    { name: "Dock Station", stock: 3 },
    { name: "Pro Buds", stock: 60 }
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Products */}
        <div 
          onClick={() => onNavigate("products")}
          className="bento-card cursor-pointer flex flex-col justify-between group"
          id="kpi-products"
        >
          <span className="bento-label">Total Products</span>
          <div className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-2xl xl:text-3xl font-extrabold tracking-tight text-[#0F172A]">{stats.totalProducts}</span>
            <span className="text-xs text-blue-600 font-bold font-mono shrink-0">+12%</span>
          </div>
        </div>

        {/* Total Customers */}
        <div 
          onClick={() => onNavigate("customers")}
          className="bento-card cursor-pointer flex flex-col justify-between group"
          id="kpi-customers"
        >
          <span className="bento-label">Total Customers</span>
          <div className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-2xl xl:text-3xl font-extrabold tracking-tight text-[#0F172A]">{stats.totalCustomers}</span>
            <span className="text-xs text-slate-400 font-mono shrink-0">STABLE</span>
          </div>
        </div>

        {/* Total Orders */}
        <div 
          onClick={() => onNavigate("orders")}
          className="bento-card cursor-pointer flex flex-col justify-between group"
          id="kpi-orders"
        >
          <span className="bento-label">Pending Orders</span>
          <div className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-2xl xl:text-3xl font-extrabold tracking-tight text-[#0F172A]">{stats.totalOrders}</span>
            <span className="text-xs text-red-600 font-bold font-mono shrink-0">ACTIVE</span>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bento-card flex flex-col justify-between overflow-hidden" id="kpi-revenue">
          <span className="bento-label">Total Revenue</span>
          <div className="mt-4 flex items-baseline gap-x-2 overflow-hidden">
            <span className="text-lg font-extrabold tracking-tight text-[#0F172A] whitespace-nowrap overflow-hidden text-ellipsis">
              ₹{stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-green-600 font-bold font-mono shrink-0">NET</span>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div 
          className={`bento-card flex flex-col justify-between transition-all ${
            stats.lowStockCount > 0 
              ? "bg-red-50/60 border-red-300 hover:border-red-400" 
              : ""
          }`} 
          id="kpi-lowstock"
        >
          <span className={`bento-label ${stats.lowStockCount > 0 ? "text-red-700" : ""}`}>Low Stock Alerts</span>
          <div className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className={`text-2xl xl:text-3xl font-extrabold tracking-tight ${stats.lowStockCount > 0 ? "text-red-700" : "text-slate-900"}`}>
              {stats.lowStockCount}
            </span>
            <span className={`text-xs font-bold font-mono shrink-0 ${stats.lowStockCount > 0 ? "text-red-500 animate-pulse" : "text-slate-400"}`}>
              {stats.lowStockCount > 0 ? "ATTENTION" : "STABLE"}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid for Analytics & Low Stock Management */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Columns (8 cols): Interactive Stock Control & Recent Transactions */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Low Stock Quick Restock Panel */}
          <div className="bento-card flex flex-col" id="low-stock-panel">
            <div className="flex items-center justify-between mb-4 border-b-2 border-slate-50 pb-3">
              <div>
                <span className="bento-label">Emergency Stock Desk</span>
                <h3 className="font-bold text-sm tracking-tight text-slate-800 mt-1">Live Stock Refresh Engine</h3>
              </div>
              <span className="text-[10px] font-extrabold font-mono px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                PENDING ACTION
              </span>
            </div>

            {stats.lowStockProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 bg-slate-50/50 rounded-xl border border-[#E2E8F0] text-slate-500">
                <CheckCircle className="w-8 h-8 text-green-500 mb-2" />
                <p className="text-xs font-bold uppercase tracking-wider font-mono">All item stock quantities healthy</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                {stats.lowStockProducts.map((product) => (
                  <div 
                    key={product.id} 
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl gap-3 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-xs text-slate-900 truncate">{product.name}</p>
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-white border border-slate-200 text-slate-500 rounded">
                          {product.sku}
                        </span>
                      </div>
                      <p className="text-[11px] text-red-600 font-bold mt-1">
                        Critical Capacity: Only {product.quantity} remaining in Postgres ledger
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                      <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden h-8">
                        <button 
                          onClick={() => setRestockQty(prev => ({ ...prev, [product.id]: Math.max(1, (prev[product.id] || 10) - 5) }))}
                          className="px-2 text-slate-500 hover:bg-slate-100 border-r border-slate-200 h-full text-xs font-bold"
                        >
                          -5
                        </button>
                        <input
                          type="number"
                          value={restockQty[product.id] ?? 10}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            setRestockQty(prev => ({ ...prev, [product.id]: isNaN(val) ? 1 : val }));
                          }}
                          className="w-10 text-center text-xs font-bold focus:outline-none bg-slate-50/20"
                          min="1"
                        />
                        <button 
                          onClick={() => setRestockQty(prev => ({ ...prev, [product.id]: (prev[product.id] || 10) + 5 }))}
                          className="px-2 text-slate-500 hover:bg-slate-100 border-l border-slate-200 h-full text-xs font-bold"
                        >
                          +5
                        </button>
                      </div>
                      <button
                        onClick={() => handleQuickRestock(product.id, product.quantity)}
                        disabled={isUpdating === product.id}
                        className="h-8 px-3 text-[10px] bg-blue-600 font-bold text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors uppercase font-mono tracking-wider whitespace-nowrap shadow-sm"
                      >
                        {isUpdating === product.id ? "SYNCING..." : "+ REPLENISH"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Orders Timeline */}
          <div className="bento-card" id="recent-orders-panel">
            <div className="flex items-center justify-between mb-4 border-b-2 border-slate-50 pb-3">
              <div>
                <span className="bento-label">Accounting Ledger</span>
                <h3 className="font-bold text-sm tracking-tight text-slate-800 mt-1 font-sans">Live Transaction Monitor</h3>
              </div>
              <button 
                onClick={() => onNavigate("orders")}
                className="px-3 py-1 bg-[#0F172A] text-white text-[10px] font-bold rounded-md uppercase tracking-wider font-mono hover:bg-slate-800 transition-colors"
              >
                VIEW FULL PORTAL
              </button>
            </div>

            {stats.recentOrders.length === 0 ? (
              <div className="text-center py-12 bg-slate-50/50 rounded-xl border border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider font-mono">
                No orders processed yet
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[350px] overflow-y-auto pr-1">
                {stats.recentOrders.map((order) => (
                  <div key={order.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">
                          {order.customer_name}
                        </span>
                        <span className="text-[9px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          {order.id}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1.5 truncate">
                        {order.items.map(i => `${i.quantity}x ${i.product_name}`).join(", ")}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1 font-mono">
                        {new Date(order.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-bold text-[#0F172A] block">
                        ₹{order.total_amount.toFixed(2)}
                      </span>
                      <span className="inline-block mt-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md uppercase font-mono tracking-wider">
                        INVOICED
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Columns (4 cols): System Status & Analytics Charts */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Uptime and Health Monitor */}
          <div className="bento-card flex flex-col gap-4">
            <span className="bento-label">System Health</span>
            
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center text-[11px] border-b border-slate-50 pb-2">
                <span className="font-mono text-slate-500 font-bold">DOCKER_ENGINE</span>
                <span className="text-green-600 font-bold font-mono">v24.0.5</span>
              </div>
              <div className="flex justify-between items-center text-[11px] border-b border-slate-50 pb-2">
                <span className="font-mono text-slate-500 font-bold">POSTGRES_DB</span>
                <span className="text-green-600 font-bold font-mono text-xs">● ONLINE</span>
              </div>
              <div className="flex justify-between items-center text-[11px] border-b border-slate-50 pb-2">
                <span className="font-mono text-slate-500 font-bold">FAST_API_UPTIME</span>
                <span className="text-slate-900 font-extrabold font-mono">99.98%</span>
              </div>
              <div className="flex justify-between items-center text-[11px] pb-1">
                <span className="font-mono text-slate-500 font-bold">REDIS_CACHE</span>
                <span className="text-green-600 font-bold font-mono text-xs">● HEALTHY</span>
              </div>
            </div>

            <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full w-[78%]"></div>
              </div>
              <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-500 font-mono">
                <span>DISK USAGE STATUS</span>
                <span>78%</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bento-card flex flex-col gap-3">
            <span className="bento-label">Quick Actions</span>
            
            <button 
              onClick={() => onNavigate("customers")}
              className="w-full p-3.5 border-2 border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 rounded-xl text-left transition-all group"
            >
              <div className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">New Customer Registry</div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">ADD ENTRY TO POSTGRESQL</div>
            </button>
            
            <button 
              onClick={() => onNavigate("products")}
              className="w-full p-3.5 border-2 border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 rounded-xl text-left transition-all group"
            >
              <div className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">Bulk Inventory Upload</div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">SYNC PRODUCTS DIRECTORY</div>
            </button>

            <button 
              onClick={() => onNavigate("orders")}
              className="w-full p-3.5 border-2 border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 rounded-xl text-left transition-all group"
            >
              <div className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">Generate Reports</div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">EXPORT AS PDF / CSV DIRECTORY</div>
            </button>
          </div>

          {/* Distribution Chart */}
          <div className="bento-card flex flex-col" id="stats-chart-panel">
            <span className="bento-label">Inventory Breakdown</span>
            <p className="text-[11px] text-slate-500 mt-1">Telemetry stock distribution Index</p>
            
            <div className="w-full h-44 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={displayChartData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 9, fill: "#64748B", fontWeight: 500 }}
                    axisLine={{ stroke: "#E2E8F0" }}
                    tickLine={false}
                    tickFormatter={(value) => value.length > 8 ? `${value.substring(0, 8)}..` : value}
                  />
                  <YAxis 
                    tick={{ fontSize: 9, fill: "#64748B", fontWeight: 500 }}
                    axisLine={{ stroke: "#E2E8F0" }}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ background: "#ffffff", borderRadius: "10px", border: "2px solid #E2E8F0", fontSize: "11px" }}
                    cursor={{ fill: '#f8fafc' }}
                  />
                  <Bar dataKey="stock" radius={[4, 4, 0, 0]}>
                    {displayChartData.map((entry, index) => {
                      const color = entry.stock <= 5 ? "#EF4444" : "#3B82F6";
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[10px] font-bold font-mono text-slate-500">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                <span>STABLE (&gt;5)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                <span>LOW (&le;5)</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
