import React, { useState } from "react";
import { 
  Search, 
  Package, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  Calendar, 
  Filter 
} from "lucide-react";

export default function InventoryTrackingTab({ transactions = [] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [reasonFilter, setReasonFilter] = useState("ALL");

  // Calculate Metrics
  const totalAdded = transactions
    .filter(t => t.change_quantity > 0)
    .reduce((sum, t) => sum + t.change_quantity, 0);

  const totalDeducted = Math.abs(
    transactions
      .filter(t => t.change_quantity < 0)
      .reduce((sum, t) => sum + t.change_quantity, 0)
  );

  const totalLogs = transactions.length;

  // Filter Logic
  const filteredTransactions = transactions.filter(t => {
    // 1. Text Search Filter (Product Name or SKU)
    const matchesSearch = 
      t.product_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      t.sku.toLowerCase().includes(searchTerm.toLowerCase());

    // 2. Dropdown Reason Filter
    if (reasonFilter === "ALL") return matchesSearch;
    if (reasonFilter === "INITIAL") return matchesSearch && t.reason.toLowerCase().includes("initial");
    if (reasonFilter === "MANUAL") return matchesSearch && t.reason.toLowerCase().includes("manual");
    if (reasonFilter === "SALE") return matchesSearch && t.reason.toLowerCase().includes("placed");
    if (reasonFilter === "CANCEL") return matchesSearch && t.reason.toLowerCase().includes("cancelled");
    if (reasonFilter === "DELETED") return matchesSearch && t.reason.toLowerCase().includes("deleted");

    return matchesSearch;
  });

  // Helper to get transaction reason styling and display text
  const getReasonBadge = (reason, changeQty) => {
    const lowercaseReason = reason.toLowerCase();
    
    if (lowercaseReason.includes("initial")) {
      return (
        <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
          Initial Stock
        </span>
      );
    }
    if (lowercaseReason.includes("placed")) {
      return (
        <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
          Order Placed
        </span>
      );
    }
    if (lowercaseReason.includes("cancelled")) {
      return (
        <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200">
          Order Cancelled
        </span>
      );
    }
    if (lowercaseReason.includes("deleted")) {
      return (
        <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
          Product Deleted
        </span>
      );
    }
    if (lowercaseReason.includes("manual")) {
      if (changeQty > 0) {
        return (
          <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
            Manual Restock
          </span>
        );
      } else {
        return (
          <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
            Manual Reduction
          </span>
        );
      }
    }
    
    return (
      <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-50 text-slate-700 border border-slate-200">
        {reason}
      </span>
    );
  };

  // Helper to format timestamps beautifully
  const formatTimestamp = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
    } catch (e) {
      return isoString;
    }
  };

  return (
    <div className="flex flex-col gap-6" id="inventory-tracking-tab">
      
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border-2 border-[#E2E8F0]">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-slate-700" />
            INVENTORY AUDIT TRACKING
          </h2>
          <p className="text-slate-500 text-xs font-semibold mt-1 uppercase tracking-wider font-mono">
            SECURE LEDGER RECORDING SYSTEM STOCK EVENTS IN REAL-TIME
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[10px] font-black tracking-widest text-slate-600 uppercase font-mono bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            AUDIT_LOG_ACTIVE
          </span>
        </div>
      </div>

      {/* 2. Glassmorphic Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Total Added */}
        <div className="bg-white p-6 rounded-2xl border-2 border-[#E2E8F0] shadow-sm flex items-center gap-4 relative overflow-hidden">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0 border border-emerald-100">
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Total Stock Replenished</p>
            <h3 className="text-2xl font-black text-slate-950 mt-1 flex items-baseline gap-1">
              +{totalAdded}
              <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider font-mono">units</span>
            </h3>
          </div>
          <div className="absolute right-[-10px] bottom-[-20px] text-emerald-50 opacity-[0.03] select-none">
            <ArrowUpRight className="w-32 h-32" />
          </div>
        </div>

        {/* Card 2: Total Deducted */}
        <div className="bg-white p-6 rounded-2xl border-2 border-[#E2E8F0] shadow-sm flex items-center gap-4 relative overflow-hidden">
          <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 shrink-0 border border-rose-100">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Total Stock Deducted</p>
            <h3 className="text-2xl font-black text-slate-950 mt-1 flex items-baseline gap-1">
              -{totalDeducted}
              <span className="text-[10px] text-rose-600 font-bold uppercase tracking-wider font-mono">units</span>
            </h3>
          </div>
          <div className="absolute right-[-10px] bottom-[-20px] text-rose-50 opacity-[0.03] select-none">
            <ArrowDownLeft className="w-32 h-32" />
          </div>
        </div>

        {/* Card 3: Total Logs */}
        <div className="bg-white p-6 rounded-2xl border-2 border-[#E2E8F0] shadow-sm flex items-center gap-4 relative overflow-hidden">
          <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600 shrink-0 border border-slate-100">
            <History className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Logged Audit Actions</p>
            <h3 className="text-2xl font-black text-slate-950 mt-1 flex items-baseline gap-1">
              {totalLogs}
              <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider font-mono">records</span>
            </h3>
          </div>
          <div className="absolute right-[-10px] bottom-[-20px] text-slate-50 opacity-[0.03] select-none">
            <History className="w-32 h-32" />
          </div>
        </div>

      </div>

      {/* 3. Controls & Filters Section */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch bg-white p-5 rounded-2xl border-2 border-[#E2E8F0]">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search logs by product name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-[#E2E8F0] text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-800 transition-all font-semibold"
          />
        </div>

        {/* Action filter */}
        <div className="relative shrink-0 flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider font-mono px-2">
            <Filter className="w-3.5 h-3.5" />
            Category:
          </div>
          <select
            value={reasonFilter}
            onChange={(e) => setReasonFilter(e.target.value)}
            className="min-w-[180px] bg-white border-2 border-[#E2E8F0] px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-slate-800 transition-all cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            <option value="INITIAL">Initial Stock</option>
            <option value="MANUAL">Manual Adjustments</option>
            <option value="SALE">Customer Purchases</option>
            <option value="CANCEL">Cancelled Orders</option>
            <option value="DELETED">Product Deletions</option>
          </select>
        </div>

      </div>

      {/* 4. Table Section */}
      <div className="bg-white rounded-2xl border-2 border-[#E2E8F0] overflow-hidden shadow-sm">
        
        {filteredTransactions.length === 0 ? (
          <div className="py-24 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 text-slate-400 flex items-center justify-center">
              <History className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 uppercase tracking-wider font-mono">No stock transactions found</p>
              <p className="text-slate-400 text-xs mt-1">Try relaxing your search terms or filters.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 border-b-2 border-[#E2E8F0]">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-wider font-mono">TIMESTAMP</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-wider font-mono">SKU / CODE</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-wider font-mono">PRODUCT NAME</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-wider font-mono text-center">QUANTITY ADJUSTMENT</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-wider font-mono">TRANSACTION REASON</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                    
                    {/* Timestamp */}
                    <td className="px-6 py-4 text-xs font-semibold text-slate-500 font-mono flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {formatTimestamp(tx.created_at)}
                    </td>

                    {/* SKU */}
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 font-mono text-xs font-bold uppercase border border-slate-200">
                        {tx.sku}
                      </span>
                    </td>

                    {/* Product Name */}
                    <td className="px-6 py-4">
                      <span className="text-sm font-black text-slate-850 truncate max-w-[280px] block">
                        {tx.product_name}
                      </span>
                    </td>

                    {/* Quantity Change */}
                    <td className="px-6 py-4 text-center">
                      {tx.change_quantity > 0 ? (
                        <span className="text-sm font-black text-emerald-600 font-mono bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
                          +{tx.change_quantity}
                        </span>
                      ) : (
                        <span className="text-sm font-black text-rose-600 font-mono bg-rose-50 border border-rose-200 px-3 py-1 rounded-xl">
                          {tx.change_quantity}
                        </span>
                      )}
                    </td>

                    {/* Reason Tag */}
                    <td className="px-6 py-4">
                      {getReasonBadge(tx.reason, tx.change_quantity)}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
}
