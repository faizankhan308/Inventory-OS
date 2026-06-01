import React, { useState } from "react";
import { 
  Plus, 
  Search, 
  AlertCircle, 
  Check, 
  UserPlus, 
  Users, 
  Mail, 
  PhoneCall 
} from "lucide-react";

export default function CustomersTab({ customers, onAddCustomer, onDeleteCustomer }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter customers
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setErrorMsg("");
    setSuccessMsg("");
    setIsFormOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim()) {
      setErrorMsg("All customer fields are required.");
      return;
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      await onAddCustomer({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim()
      });
      setSuccessMsg("Customer account registered!");
      setTimeout(() => resetForm(), 800);
    } catch (err) {
      setErrorMsg(err.message || "Email address may already be in use.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to remove customer '${name}'? All references remain in archive history.`)) {
      try {
        await onDeleteCustomer(id);
      } catch (err) {
        alert(err.message || "Failed to delete customer.");
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header operations bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search customers by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border-2 border-[#E2E8F0] hover:border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-sm font-medium transition-colors"
          />
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 text-xs font-extrabold uppercase tracking-wider font-mono rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm self-start sm:self-auto cursor-pointer border border-blue-600"
          id="btn-add-customer"
        >
          <Plus className="w-4 h-4" />
          + Register Customer
        </button>
      </div>

      {/* Main customer list content */}
      <div className="bento-card overflow-hidden p-0" id="customers-table-container">
        <div className="p-4 border-b-2 border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <span className="bento-label">Active Registers</span>
            <h3 className="font-bold text-xs tracking-tight text-slate-800 mt-1">Customers Database Index</h3>
          </div>
          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-mono font-bold">
            {filteredCustomers.length} CUSTOMERS
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-slate-50/50 text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">
                <th className="px-6 py-4">Customer Name / ID</th>
                <th className="px-6 py-4">Email Address</th>
                <th className="px-6 py-4">Phone Number</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-medium">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <span className="text-xs uppercase tracking-wider font-bold font-mono">No customers found matched directory criteria</span>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-900 block text-xs" id={`c-name-${customer.id}`}>{customer.name}</span>
                      <span className="text-[9px] text-slate-400 block font-mono mt-0.5">ID: {customer.id}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <div className="flex items-center gap-1.5 font-sans">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[240px] text-xs font-semibold text-slate-700">{customer.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <div className="flex items-center gap-1.5 font-mono text-xs">
                        <PhoneCall className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-bold text-slate-700">{customer.phone}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(customer.id, customer.name)}
                        className="px-2.5 py-1 text-[10px] text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-200 transition-all font-bold uppercase tracking-wider font-mono duration-200 ml-auto"
                        title="Delete customer"
                      >
                        Unregister
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border-2 border-[#E2E8F0] animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xs font-bold font-mono tracking-widest text-[#0F172A] uppercase border-b border-slate-100 pb-2 flex items-center gap-2">
              <UserPlus className="w-4.5 h-4.5 text-blue-600" /> REGISTER_CUSTOMER_ROW
            </h3>
            <p className="text-[10px] text-slate-400 mt-1 uppercase font-mono font-bold tracking-wider">Sync contact files with the Postgres database</p>
            
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {errorMsg && (
                <div className="p-3 text-xs bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="font-mono text-[11px] font-bold">{errorMsg}</span>
                </div>
              )}
              {successMsg && (
                <div className="p-3 text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-start gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span className="font-mono text-[11px] font-bold">{successMsg}</span>
                </div>
              )}

              <div>
                <span className="bento-label mb-1">Full Name</span>
                <input
                  type="text"
                  placeholder="e.g. Richard Hendricks"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 border-2 border-[#E2E8F0] rounded-xl bg-white focus:outline-none focus:border-blue-500 font-medium"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <span className="bento-label mb-1">Email Address (Unique)</span>
                <input
                  type="email"
                  placeholder="richard@hooli-xyz.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 border-2 border-[#E2E8F0] rounded-xl bg-white focus:outline-none focus:border-blue-500 font-medium"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <span className="bento-label mb-1">Phone Number</span>
                <input
                  type="text"
                  placeholder="e.g. +1 (555) 019-2834"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 border-2 border-[#E2E8F0] rounded-xl bg-white focus:outline-none focus:border-blue-500 font-mono"
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-150">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3.5 py-2 border-2 border-slate-200 text-[10px] font-bold font-mono uppercase tracking-wider rounded-xl text-slate-500 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 border border-blue-600 text-[10px] font-bold font-mono uppercase tracking-wider rounded-xl text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? "SYNC...." : "REGISTER_CONTACT"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
