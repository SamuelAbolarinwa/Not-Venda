import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Truck, 
  Building2, 
  Calendar, 
  DollarSign,
  PackageCheck,
  X
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { PurchaseOrder, OrderStatus, PurchaseOrderItem } from '../types/inventory';

export const PurchaseOrdersView: React.FC = () => {
  const { purchaseOrders, suppliers, products, createPurchaseOrder, updateOrderStatus, receivePurchaseOrder } = useInventory();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || '');
  const [expectedDate, setExpectedDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });
  const [notes, setNotes] = useState('');
  
  // Selected order items in create modal
  const [orderItems, setOrderItems] = useState<Array<{ productId: string; orderedQty: number }>>([
    { productId: products[0]?.id || '', orderedQty: 25 },
  ]);

  const handleAddItemRow = () => {
    setOrderItems((prev) => [...prev, { productId: products[0]?.id || '', orderedQty: 10 }]);
  };

  const handleRemoveItemRow = (idx: number) => {
    setOrderItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx: number, field: 'productId' | 'orderedQty', val: any) => {
    setOrderItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: val } : item))
    );
  };

  // Auto-populate with low stock items
  const handleAutoPopulateLowStock = () => {
    const lowStockItems = products.filter((p) => p.currentStock <= p.minThreshold);
    if (lowStockItems.length === 0) {
      alert('No products currently need restocking!');
      return;
    }

    const items = lowStockItems.map((p) => ({
      productId: p.id,
      orderedQty: Math.max(10, p.minThreshold * 2 - p.currentStock),
    }));

    setOrderItems(items);
    if (lowStockItems[0]) {
      setSelectedSupplierId(lowStockItems[0].supplierId);
    }
  };

  const handleCreatePO = (e: React.FormEvent) => {
    e.preventDefault();
    const supplier = suppliers.find((s) => s.id === selectedSupplierId) || suppliers[0];

    let total = 0;
    const formattedItems: PurchaseOrderItem[] = [];

    for (const item of orderItems) {
      const prod = products.find((p) => p.id === item.productId);
      if (prod && item.orderedQty > 0) {
        const itemCost = prod.costPrice * item.orderedQty;
        total += itemCost;
        formattedItems.push({
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          orderedQty: Number(item.orderedQty),
          receivedQty: 0,
          unitCost: prod.costPrice,
        });
      }
    }

    if (formattedItems.length === 0) {
      alert('Please add at least one valid product item to this purchase order.');
      return;
    }

    createPurchaseOrder({
      supplierId: supplier.id,
      supplierName: supplier.name,
      items: formattedItems,
      totalAmount: total,
      expectedDeliveryDate: new Date(expectedDate).toISOString(),
      notes,
    });

    setIsCreateModalOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Top Bar */}
      <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Purchase Orders & Inbound Restock</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage vendor purchase agreements and streamline warehouse receiving
          </p>
        </div>

        <button
          onClick={() => {
            setIsCreateModalOpen(true);
            setOrderItems([{ productId: products[0]?.id || '', orderedQty: 20 }]);
          }}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Purchase Order</span>
        </button>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 gap-4">
        {purchaseOrders.length === 0 ? (
          <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-12 text-center text-slate-500 text-sm">
            No purchase orders created yet. Click "New Purchase Order" to issue one to your suppliers.
          </div>
        ) : (
          purchaseOrders.map((order) => {
            const isReceived = order.status === 'received';
            const isOrdered = order.status === 'ordered';
            const isDraft = order.status === 'draft';

            return (
              <div
                key={order.id}
                className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 hover:border-slate-700 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-mono font-bold text-xs">
                      PO
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-100 font-mono text-base">
                          {order.poNumber}
                        </span>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
                            isReceived
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                              : isOrdered
                              ? 'bg-indigo-950 text-indigo-400 border border-indigo-800/60'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {order.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-slate-500" />
                        <span className="font-medium text-slate-300">{order.supplierName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs text-slate-400">Order Total</div>
                      <div className="text-base font-bold text-emerald-400 font-mono">
                        ${order.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>

                    {isOrdered && (
                      <button
                        onClick={() => receivePurchaseOrder(order.id)}
                        className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/40 transition-colors"
                      >
                        <PackageCheck className="w-4 h-4" />
                        <span>Receive Delivery</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Items in PO */}
                <div className="mt-4">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Manifest Items
                  </div>
                  <div className="space-y-2">
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-semibold text-slate-200">{item.productName}</span>
                          <span className="font-mono text-slate-500 ml-2">[{item.sku}]</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-slate-400">
                            Ordered: <strong className="text-slate-200 font-mono">{item.orderedQty}</strong>
                          </span>
                          <span className="text-slate-400">
                            Unit: <strong className="text-slate-200 font-mono">${item.unitCost.toFixed(2)}</strong>
                          </span>
                          <span className="font-bold text-emerald-400 font-mono">
                            ${(item.orderedQty * item.unitCost).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer dates & notes */}
                <div className="mt-4 pt-3 border-t border-slate-800/60 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
                  <div className="flex items-center gap-4">
                    <span>
                      Ordered: {new Date(order.orderDate).toLocaleDateString()}
                    </span>
                    <span>
                      Expected: {new Date(order.expectedDeliveryDate).toLocaleDateString()}
                    </span>
                  </div>
                  {order.notes && <span className="italic text-slate-400">{order.notes}</span>}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create PO Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Create Vendor Purchase Order</h3>
                <p className="text-xs text-slate-400">Restock inventory directly from registered suppliers</p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePO} className="p-5 space-y-4">
              {/* Supplier and Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Vendor / Supplier
                  </label>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Expected Delivery Date
                  </label>
                  <input
                    type="date"
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Items Section Header */}
              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Order Line Items
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAutoPopulateLowStock}
                    className="text-xs font-medium text-amber-400 hover:text-amber-300 bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-800/40"
                  >
                    Auto-Fill Low Stock Items
                  </button>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-xs font-medium text-indigo-400 hover:text-indigo-300 bg-indigo-950/60 px-2.5 py-1 rounded-lg border border-indigo-800/40"
                  >
                    + Add Item
                  </button>
                </div>
              </div>

              {/* Items Rows */}
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {orderItems.map((item, idx) => {
                  const prod = products.find((p) => p.id === item.productId);
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800"
                    >
                      <select
                        value={item.productId}
                        onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            [{p.sku}] {p.name} (${p.costPrice.toFixed(2)})
                          </option>
                        ))}
                      </select>

                      <div className="w-24">
                        <input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          value={item.orderedQty}
                          onChange={(e) =>
                            handleItemChange(idx, 'orderedQty', parseInt(e.target.value) || 0)
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-mono text-center"
                        />
                      </div>

                      <div className="w-24 text-right font-mono text-xs text-emerald-400 font-bold">
                        ${((prod?.costPrice || 0) * (item.orderedQty || 0)).toFixed(2)}
                      </div>

                      {orderItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(idx)}
                          className="p-1 text-slate-500 hover:text-rose-400"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Purchase Order Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Rush freight requested, Net-30 payment terms"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-900/40"
                >
                  Submit Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
