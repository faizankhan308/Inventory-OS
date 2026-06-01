import React, { useState } from "react";
import { 
  Plus, 
  Trash2, 
  Search, 
  ShoppingCart, 
  PlusCircle, 
  AlertCircle, 
  Check, 
  Receipt, 
  ArrowLeft,
  X 
} from "lucide-react";

export default function OrdersTab({ orders, customers, products, onCreateOrder, onDeleteOrder }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // New Order Form state
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [cartItems, setCartItems] = useState([]);
  
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter orders
  const filteredOrders = orders.filter(o => 
    o.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (o.customer_name && o.customer_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const resetForm = () => {
    setSelectedCustomerId("");
    setCartItems([]);
    setFormError("");
    setFormSuccess("");
    setIsCreating(false);
  };

  const handleAddProductToCart = () => {
    // Find first available product that isn't fully selected yet
    const available = products.find(p => p.quantity > 0 && !cartItems.some(item => item.product_id === p.id));
    if (!available) {
      setFormError("No further fully-stocked products available to add.");
      return;
    }
    setCartItems(prev => [...prev, { product_id: available.id, quantity: 1 }]);
    setFormError("");
  };

  const handleUpdateCartItemProduct = (index, newProductId) => {
    if (cartItems.some((item, idx) => item.product_id === newProductId && idx !== index)) {
      setFormError("This product is already in the cart. Adjust its quantity instead.");
      return;
    }
    setCartItems(prev => {
      const copy = [...prev];
      copy[index].product_id = newProductId;
      // Reset quantity to 1
      copy[index].quantity = 1;
      return copy;
    });
    setFormError("");
  };

  const handleUpdateCartItemQty = (index, qtyChange) => {
    setCartItems(prev => {
      const copy = [...prev];
      const item = copy[index];
      const prod = products.find(p => p.id === item.product_id);
      if (prod) {
        const nextQty = item.quantity + qtyChange;
        if (nextQty > prod.quantity) {
          setFormError(`Only ${prod.quantity} units of '${prod.name}' are available.`);
          return prev;
        }
        if (nextQty < 1) return prev;
        item.quantity = nextQty;
      }
      return copy;
    });
  };

  const handleRemoveCartItem = (index) => {
    setCartItems(prev => prev.filter((_, idx) => idx !== index));
    setFormError("");
  };

  // Live amount calculation
  const calculatedTotal = cartItems.reduce((acc, cartItem) => {
    const prod = products.find(p => p.id === cartItem.product_id);
    return acc + (prod ? prod.price * cartItem.quantity : 0);
  }, 0);

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      setFormError("Please select a target customer checkout.");
      return;
    }
    if (cartItems.length === 0) {
      setFormError("Cart is completely empty. Please add at least one line item.");
      return;
    }

    // Double check stock levels client side
    for (const item of cartItems) {
      const prod = products.find(p => p.id === item.product_id);
      if (!prod) {
        setFormError("Invalid product reference found.");
        return;
      }
      if (prod.quantity < item.quantity) {
        setFormError(`Insufficient stock for product '${prod.name}'. Decrement standard quantity.`);
        return;
      }
    }

    setIsSubmitting(true);
    setFormError("");

    try {
      await onCreateOrder({
        customer_id: selectedCustomerId,
        items: cartItems
      });
      setFormSuccess("Order processed & stocks deducted successfully!");
      setTimeout(() => resetForm(), 900);
    } catch (err) {
      setFormError(err.message || "An unexpected error occurred during dispatch.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteOrder = async (id) => {
    if (window.confirm("Are you sure you want to delete/cancel this order? Stock counts will be refilled.")) {
      try {
        await onDeleteOrder(id);
        if (selectedOrder?.id === id) {
          setSelectedOrder(null);
        }
      } catch (err) {
        alert(err.message || "Failed to cancel/delete order.");
      }
    }
  };

  return (
    <div className="space-y-6">
      {!isCreating && !selectedOrder && (
        <>
          {/* Main List toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search orders by Order ID or customer name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border-2 border-[#E2E8F0] hover:border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-sm font-medium transition-colors"
              />
            </div>
            <button
              onClick={() => {
                resetForm();
                setIsCreating(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 text-xs font-extrabold uppercase tracking-wider font-mono rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm self-start sm:self-auto cursor-pointer border border-blue-600"
              id="btn-new-order"
            >
              <ShoppingCart className="w-4 h-4" />
              + New Checkout Order
            </button>
          </div>

          {/* Orders log database table */}
          <div className="bento-card overflow-hidden p-0" id="orders-table-container">
            <div className="p-4 border-b-2 border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <span className="bento-label">Ledger Volumes</span>
                <h3 className="font-bold text-xs tracking-tight text-slate-800 mt-1">Authorized Orders Journal</h3>
              </div>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-mono font-bold">
                {filteredOrders.length} DISBURSEMENTS
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-slate-50/50 text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">
                    <th className="px-6 py-4">Order Reference</th>
                    <th className="px-6 py-4">Customer Account</th>
                    <th className="px-6 py-4">Items Count</th>
                    <th className="px-6 py-4">Invoice Total</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Journal Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                        <Receipt className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                        <span className="text-xs uppercase tracking-wider font-bold font-mono">No transaction orders recorded yet</span>
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-mono text-xs font-bold text-slate-900 block" id={`o-id-${order.id}`}>{order.id}</span>
                          <span className="text-[10px] text-slate-400 block font-mono mt-0.5">
                            {new Date(order.created_at).toLocaleDateString()} AT {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-800">
                          <span className="font-bold text-slate-900 block text-xs">{order.customer_name}</span>
                          <span className="text-[9px] text-slate-400 font-mono">Ref ID: {order.customer_id}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-bold font-mono text-slate-650">
                            {order.items.reduce((sum, item) => sum + item.quantity, 0)} ITEMS
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold font-mono text-xs text-slate-900">₹{order.total_amount.toFixed(2)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-block text-[9px] font-extrabold font-mono text-green-700 bg-green-100 border border-green-200 px-2 py-0.5 rounded-md uppercase tracking-wide">
                            COMPLETED
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="px-2.5 py-1 text-[10px] text-slate-700 hover:text-blue-600 hover:bg-slate-50 rounded-lg border-2 border-slate-100 hover:border-blue-200 bg-white font-bold uppercase tracking-wider font-mono transition-all duration-200"
                              title="Invoice detail breakdown"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleDeleteOrder(order.id)}
                              className="px-2.5 py-1 text-[10px] text-slate-400 hover:text-red-750 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-200 transition-all font-bold uppercase tracking-wider font-mono duration-200"
                              title="Cancel & Restock"
                            >
                              Cancel
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Creating Checkout Form */}
      {isCreating && (
        <div className="bento-card" id="create-order-portal">
          <div className="flex items-center gap-2 mb-4 border-b-2 border-slate-100 pb-4">
            <button 
              onClick={() => setIsCreating(false)}
              className="p-1.5 hover:bg-slate-150 text-slate-500 hover:text-slate-900 rounded-lg transition-colors cursor-pointer border border-[#E2E8F0] bg-white shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <span className="bento-label">Transaction Checkout Gateway</span>
              <h3 className="font-bold text-sm text-slate-800 mt-1">Deduct Warehouse Stock Real-time</h3>
            </div>
          </div>

          <form onSubmit={handleSubmitOrder} className="space-y-6">
            {formError && (
              <div className="p-3 text-xs bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-2 max-w-xl">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="font-mono text-[11px] font-bold">{formError}</span>
              </div>
            )}
            {formSuccess && (
              <div className="p-3 text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-start gap-2 max-w-xl">
                <Check className="w-4 h-4 shrink-0" />
                <span className="font-mono text-[11px] font-bold">{formSuccess}</span>
              </div>
            )}

            {/* Customer select section */}
            <div className="max-w-md">
              <span className="bento-label mb-1">Select Customer Account</span>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full text-xs px-3.5 py-2 border-2 border-[#E2E8F0] rounded-xl bg-white focus:outline-none focus:border-blue-500 font-medium"
                disabled={isSubmitting}
              >
                <option value="">-- Choose Registered Profile --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Cart products lines items selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="bento-label">Dispatched Items Cart</span>
                <button
                  type="button"
                  onClick={handleAddProductToCart}
                  disabled={isSubmitting}
                  className="text-[10px] text-blue-600 hover:text-blue-700 font-bold font-mono uppercase tracking-wider flex items-center gap-1 bg-blue-50 hover:bg-blue-100/80 px-2.5 py-1 rounded-lg border border-blue-100 cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  + ADD PRODUCT LINE
                </button>
              </div>

              {cartItems.length === 0 ? (
                <div className="p-8 text-center text-xs font-bold font-mono uppercase tracking-wider text-slate-400 bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-200">
                  Add catalog items to configure ledger order disbursements.
                </div>
              ) : (
                <div className="space-y-2 max-w-4xl">
                  {cartItems.map((cartItem, index) => {
                    const currentProduct = products.find(p => p.id === cartItem.product_id);
                    const isOver = currentProduct ? cartItem.quantity > currentProduct.quantity : false;

                    return (
                      <div 
                        key={index} 
                        className={`flex flex-col sm:flex-row items-stretch sm:items-center p-3 border rounded-xl gap-3 bg-white justify-between ${isOver ? 'border-amber-300 bg-amber-50/10' : 'border-[#E2E8F0]'}`}
                      >
                        <div className="flex-1 min-w-[200px]">
                          <select
                            value={cartItem.product_id}
                            onChange={(e) => handleUpdateCartItemProduct(index, e.target.value)}
                            className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-[#F8FAFC]"
                            disabled={isSubmitting}
                          >
                            {products.map((p) => (
                              <option key={p.id} value={p.id} disabled={p.quantity === 0}>
                                {p.name} {p.quantity === 0 ? "(Out of stock)" : `(₹{p.price.toFixed(2)} - {p.quantity} units remaining)`}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center justify-between sm:justify-start gap-4 shrink-0">
                          {/* Live single line amount display */}
                          <div className="text-xs text-slate-500 font-bold shrink-0 font-mono">
                            UNIT COST: <span className="font-extrabold text-slate-900">₹{currentProduct ? currentProduct.price.toFixed(2) : "0.00"}</span>
                          </div>

                          {/* Item Quantity Incrementor */}
                          <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden h-7">
                            <button
                              type="button"
                              onClick={() => handleUpdateCartItemQty(index, -1)}
                              disabled={isSubmitting || cartItem.quantity <= 1}
                              className="px-2 text-slate-500 hover:bg-slate-100 border-r border-slate-200 h-full text-xs font-bold disabled:opacity-30"
                            >
                              -
                            </button>
                            <span className="w-8 text-center text-xs font-bold font-mono">
                              {cartItem.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateCartItemQty(index, 1)}
                              disabled={isSubmitting || (currentProduct ? cartItem.quantity >= currentProduct.quantity : true)}
                              className="px-2 text-slate-500 hover:bg-slate-100 border-l border-slate-200 h-full text-xs font-bold disabled:opacity-30"
                            >
                              +
                            </button>
                          </div>

                          {/* line cost total */}
                          <div className="text-xs font-extrabold font-mono text-slate-950 w-16 text-right shrink-0">
                            ₹{currentProduct ? (currentProduct.price * cartItem.quantity).toFixed(2) : "0.00"}
                          </div>

                          {/* Remove button */}
                          <button
                            type="button"
                            onClick={() => handleRemoveCartItem(index)}
                            disabled={isSubmitting}
                            className="text-slate-400 hover:text-red-500 p-1 rounded-lg hover:bg-slate-50 shrink-0 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Invoice checkout summary block */}
            <div className="max-w-xs ml-auto p-4 bg-slate-50 border border-[#E2E8F0] rounded-xl space-y-1">
              <span className="bento-label opacity-80">Ledger Checkout Net Total</span>
              <span className="text-2xl font-black font-mono text-[#0F172A] block">₹{calculatedTotal.toFixed(2)}</span>
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border-2 border-slate-200 text-[10px] font-bold font-mono uppercase tracking-wider rounded-xl text-slate-500 hover:bg-slate-50 transition-colors"
              >
                Discard Cart
              </button>
              <button
                type="submit"
                disabled={isSubmitting || cartItems.length === 0}
                className="px-5 py-2 bg-blue-600 border border-blue-600 text-[10px] font-bold font-mono uppercase tracking-wider rounded-xl text-white hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {isSubmitting ? "COMMIT ORDER..." : "AUTHORIZE_DISBURSEMENT"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Invoice Modal Details View */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border-2 border-[#E2E8F0] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header banner */}
            <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-blue-400" />
                <div>
                  <span className="text-[10px] font-extrabold uppercase font-mono tracking-widest text-[#64748B]">LEDGER_INVOICE_ROW</span>
                  <p className="text-[10px] font-mono font-bold text-slate-300 mt-0.5">UID: {selectedOrder.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="p-1 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer reference info */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs font-medium">
                <div>
                  <span className="bento-label mb-1">Customer Account</span>
                  <span className="text-slate-900 font-bold block text-sm">{selectedOrder.customer_name}</span>
                  <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">Ref ID: {selectedOrder.customer_id}</span>
                </div>
                <div className="text-right">
                  <span className="bento-label mb-1">Timestamp Authorized</span>
                  <span className="text-slate-900 font-semibold block font-mono text-[11px]">{new Date(selectedOrder.created_at).toLocaleString()}</span>
                  <span className="inline-block mt-1.5 text-[9px] font-extrabold font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md uppercase tracking-wider">
                    COMPLETED_SYNC
                  </span>
                </div>
              </div>

              {/* Items listing table */}
              <div className="border border-[#E2E8F0] rounded-xl overflow-hidden mt-4">
                <table className="w-full text-left text-xs bg-slate-50/10">
                  <thead className="bg-slate-50 text-slate-400 font-extrabold text-[9px] uppercase border-b border-[#E2E8F0]">
                    <tr>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3">SKU Code</th>
                      <th className="px-4 py-3 text-center">Qty</th>
                      <th className="px-4 py-3 text-right">Unit Price</th>
                      <th className="px-4 py-3 text-right">Sum Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {selectedOrder.items.map((item, idx) => (
                      <tr key={idx} className="text-slate-700">
                        <td className="px-4 py-3 font-bold text-slate-900 text-xs">{item.product_name || `Product (${item.product_id})`}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-500 font-bold">{item.sku || "-"}</td>
                        <td className="px-4 py-3 text-center font-mono font-bold text-slate-900">{item.quantity}</td>
                        <td className="px-4 py-3 text-right font-mono text-xs">₹{item.price.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-950">₹{(item.quantity * item.price).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  onClick={() => handleDeleteOrder(selectedOrder.id)}
                  className="px-3 py-1.5 text-[10px] font-bold font-mono uppercase tracking-wider text-red-600 hover:bg-red-50 border-2 border-transparent hover:border-red-200 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel Order
                </button>
                <div className="text-right">
                  <span className="bento-label">Grand Ledger Net Total</span>
                  <span className="text-xl font-black font-mono text-[#0F172A] block mt-0.5">₹{selectedOrder.total_amount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
