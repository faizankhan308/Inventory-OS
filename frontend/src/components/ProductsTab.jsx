import React, { useState } from "react";
import { 
  Plus, 
  Search, 
  AlertCircle, 
  Check, 
  FileEdit, 
  Package 
} from "lucide-react";

export default function ProductsTab({ products, onAddProduct, onUpdateProduct, onDeleteProduct }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Form State
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter products
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setName("");
    setSku("");
    setPrice("");
    setQuantity("");
    setErrorMsg("");
    setSuccessMsg("");
    setEditingProduct(null);
    setIsFormOpen(false);
  };

  const openAddForm = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const openEditForm = (p) => {
    resetForm();
    setEditingProduct(p);
    setName(p.name);
    setSku(p.sku);
    setPrice(p.price.toString());
    setQuantity(p.quantity.toString());
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !sku.trim() || price === "" || quantity === "") {
      setErrorMsg("Please fill out all fields.");
      return;
    }

    const parsedPrice = parseFloat(price);
    const parsedQty = parseInt(quantity, 10);

    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setErrorMsg("Price must be a valid non-negative number.");
      return;
    }

    if (isNaN(parsedQty) || parsedQty < 0) {
      setErrorMsg("Quantity in stock cannot be negative.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      if (editingProduct) {
        await onUpdateProduct(editingProduct.id, {
          name: name.trim(),
          sku: sku.trim().toUpperCase(),
          price: parsedPrice,
          quantity: parsedQty
        });
        setSuccessMsg("Product updated successfully!");
        setTimeout(() => setIsFormOpen(false), 800);
      } else {
        await onAddProduct({
          name: name.trim(),
          sku: sku.trim().toUpperCase(),
          price: parsedPrice,
          quantity: parsedQty
        });
        setSuccessMsg("Product added successfully!");
        setTimeout(() => setIsFormOpen(false), 800);
      }
    } catch (err) {
      setErrorMsg(err.message || "An error occurred while saving the product.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, productName) => {
    if (window.confirm(`Are you sure you want to delete '${productName}'?`)) {
      try {
        await onDeleteProduct(id);
      } catch (err) {
        alert(err.message || "Failed to delete product.");
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
            placeholder="Search products by name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border-2 border-[#E2E8F0] hover:border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-sm font-medium transition-colors"
          />
        </div>
        <button
          onClick={openAddForm}
          className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 text-xs font-extrabold uppercase tracking-wider font-mono rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm self-start sm:self-auto cursor-pointer border border-blue-600"
          id="btn-add-product"
        >
          <Plus className="w-4 h-4" />
          + Create Product
        </button>
      </div>

      {/* Main product inventory list content */}
      <div className="bento-card overflow-hidden p-0" id="products-table-container">
        <div className="p-4 border-b-2 border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <span className="bento-label">Active Registers</span>
            <h3 className="font-bold text-xs tracking-tight text-slate-800 mt-1">Products Master Catalog</h3>
          </div>
          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-mono font-bold">
            {filteredProducts.length} RECORDS
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-slate-50/50 text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">
                <th className="px-6 py-3.5">Product Name / ID</th>
                <th className="px-6 py-3.5">SKU Code</th>
                <th className="px-6 py-3.5">Price Listing</th>
                <th className="px-6 py-3.5 text-center">Stock status</th>
                <th className="px-6 py-3.5 text-right">In Stock</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-medium">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <Package className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <span className="text-xs uppercase tracking-wider font-bold font-mono">No products matched catalog criteria</span>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const isLow = product.quantity <= 5;
                  const isOut = product.quantity === 0;

                  return (
                    <tr 
                      key={product.id} 
                      className={`hover:bg-slate-50/50 transition-colors ${isOut ? 'opacity-70 bg-slate-50/20' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-900 block text-xs" id={`p-name-${product.id}`}>{product.name}</span>
                        <span className="text-[9px] text-slate-400 block font-mono mt-0.5">UID: {product.id}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 border border-[#E2E8F0] rounded">
                          {product.sku}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-900 font-mono text-xs">₹{product.price.toFixed(2)}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {isOut ? (
                          <span className="inline-block text-[9px] font-extrabold font-mono text-red-700 bg-red-100 border border-red-200 px-2 py-0.5 rounded-md uppercase tracking-wide">
                            CRITICAL_EMPTY
                          </span>
                        ) : isLow ? (
                          <span className="inline-block text-[9px] font-extrabold font-mono text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-md uppercase tracking-wide animate-pulse">
                            LOW_CAPACITY
                          </span>
                        ) : (
                          <span className="inline-block text-[9px] font-extrabold font-mono text-green-700 bg-green-100 border border-green-200 px-2 py-0.5 rounded-md uppercase tracking-wide">
                            IN_STOCK
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`font-mono font-bold text-xs ${isLow ? 'text-amber-600 font-bold' : 'text-slate-900'}`}>{product.quantity}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditForm(product)}
                            className="px-2.5 py-1 text-[10px] text-slate-700 hover:text-blue-600 hover:bg-slate-50 rounded-lg border-2 border-slate-100 hover:border-blue-200 bg-white font-bold uppercase tracking-wider font-mono transition-all duration-200"
                            title="Edit details"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(product.id, product.name)}
                            className="px-2.5 py-1 text-[10px] text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-200 transition-all font-bold uppercase tracking-wider font-mono duration-200"
                            title="Delete product"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over or overlay model for Add/Edit product */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border-2 border-[#E2E8F0] animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xs font-bold font-mono tracking-widest text-[#0F172A] uppercase border-b border-slate-100 pb-2 flex items-center gap-2">
              {editingProduct ? (
                <>
                  <FileEdit className="w-4.5 h-4.5 text-blue-600" /> EDITING_CATALOG_ID
                </>
              ) : (
                <>
                  <Plus className="w-4.5 h-4.5 text-blue-600" /> REGISTER_NEW_ROW
                </>
              )}
            </h3>
            <p className="text-[10px] text-slate-400 mt-1 uppercase font-mono font-bold tracking-wider">Sync catalog inputs on the cluster</p>
            
            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
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
                <span className="bento-label mb-1">Product Name</span>
                <input
                  type="text"
                  placeholder="e.g. Optical Data Core"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 border-2 border-[#E2E8F0] rounded-xl bg-white focus:outline-none focus:border-blue-500 font-medium"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <span className="bento-label mb-1">SKU / Code (Unique)</span>
                <input
                  type="text"
                  placeholder="e.g. PRD-B22-442"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 border-2 border-[#E2E8F0] rounded-xl bg-white focus:outline-none focus:border-blue-500 font-mono font-extrabold uppercase"
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="bento-label mb-1">Unit Price (₹)</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="299.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full text-xs px-3.5 py-2 border-2 border-[#E2E8F0] rounded-xl bg-white focus:outline-none focus:border-blue-500 font-mono font-bold"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <span className="bento-label mb-1">Stock Level</span>
                  <input
                    type="number"
                    placeholder="85"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full text-xs px-3.5 py-2 border-2 border-[#E2E8F0] rounded-xl bg-white focus:outline-none focus:border-blue-500 font-mono font-bold"
                    disabled={isSubmitting}
                  />
                </div>
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
                  {isSubmitting ? "SYNC...." : editingProduct ? "COMMIT_CHANGES" : "CREATE_ROW"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
