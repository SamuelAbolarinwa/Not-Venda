import React, { useState, useEffect } from 'react';
import { X, ArrowDownToLine, ArrowUpFromLine, RefreshCw, AlertCircle } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { MovementType } from '../types/inventory';

interface StockMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: MovementType;
  initialProductId?: string;
}

export const StockMovementModal: React.FC<StockMovementModalProps> = ({
  isOpen,
  onClose,
  initialType = 'in',
  initialProductId,
}) => {
  const { products, recordMovement } = useInventory();

  const [type, setType] = useState<MovementType>(initialType);
  const [selectedProductId, setSelectedProductId] = useState<string>(initialProductId || '');
  const [quantity, setQuantity] = useState<number>(1);
  const [reference, setReference] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [operator, setOperator] = useState<string>('Warehouse Specialist');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (initialProductId) {
      setSelectedProductId(initialProductId);
    } else if (products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id);
    }
  }, [initialProductId, products]);

  useEffect(() => {
    setType(initialType);
    if (initialType === 'in') {
      setReason('Inbound supplier shipment received');
      setReference(`RCV-${Math.floor(1000 + Math.random() * 9000)}`);
    } else if (initialType === 'out') {
      setReason('Customer order fulfillment');
      setReference(`ORD-${Math.floor(1000 + Math.random() * 9000)}`);
    } else {
      setReason('Cycle count audit recount');
      setReference(`AUD-${Math.floor(1000 + Math.random() * 9000)}`);
    }
  }, [initialType]);

  if (!isOpen) return null;

  const currentProduct = products.find((p) => p.id === selectedProductId) || products[0];

  const calculatedNewStock = () => {
    if (!currentProduct) return 0;
    if (type === 'in') return currentProduct.currentStock + (Number(quantity) || 0);
    if (type === 'out') return Math.max(0, currentProduct.currentStock - (Number(quantity) || 0));
    return Number(quantity) || 0; // adjustment sets exact new count
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!currentProduct) {
      setError('Please select a valid product.');
      return;
    }

    const qty = Number(quantity);
    if (isNaN(qty) || qty < 0) {
      setError('Please enter a valid positive quantity.');
      return;
    }

    if (type === 'out' && qty > currentProduct.currentStock) {
      setError(`Cannot dispatch ${qty} ${currentProduct.unit}. Only ${currentProduct.currentStock} in stock.`);
      return;
    }

    const success = recordMovement({
      productId: currentProduct.id,
      type,
      quantity: qty,
      reference: reference.trim() || 'MANUAL-ADJ',
      reason: reason.trim() || 'Routine stock operation',
      operator: operator.trim() || 'Warehouse Team',
    });

    if (success) {
      onClose();
    } else {
      setError('Transaction could not be completed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                type === 'in'
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : type === 'out'
                  ? 'bg-amber-500/10 text-amber-400'
                  : 'bg-indigo-500/10 text-indigo-400'
              }`}
            >
              {type === 'in' ? (
                <ArrowDownToLine className="w-4 h-4" />
              ) : type === 'out' ? (
                <ArrowUpFromLine className="w-4 h-4" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Record Stock Transaction</h2>
              <p className="text-xs text-slate-400">Updates live inventory count & audit ledger</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Transaction Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Action Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setType('in')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  type === 'in'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                    : 'bg-slate-950/80 text-slate-400 border border-slate-800 hover:bg-slate-800'
                }`}
              >
                <ArrowDownToLine className="w-3.5 h-3.5" />
                Stock In
              </button>
              <button
                type="button"
                onClick={() => setType('out')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  type === 'out'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-900/40'
                    : 'bg-slate-950/80 text-slate-400 border border-slate-800 hover:bg-slate-800'
                }`}
              >
                <ArrowUpFromLine className="w-3.5 h-3.5" />
                Stock Out
              </button>
              <button
                type="button"
                onClick={() => setType('adjustment')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  type === 'adjustment'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40'
                    : 'bg-slate-950/80 text-slate-400 border border-slate-800 hover:bg-slate-800'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Audit Count
              </button>
            </div>
          </div>

          {/* Product Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Select Product
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.sku}] {p.name} — Current: {p.currentStock} {p.unit}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Preview Banner */}
          {currentProduct && (
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 grid grid-cols-3 text-center text-xs">
              <div>
                <span className="text-slate-500 block">Current Stock</span>
                <span className="font-bold text-slate-200 text-sm font-mono">
                  {currentProduct.currentStock} {currentProduct.unit}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Operation</span>
                <span className="font-semibold text-indigo-400 text-sm">
                  {type === 'in' ? `+${quantity || 0}` : type === 'out' ? `-${quantity || 0}` : `Set to ${quantity || 0}`}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Resulting Stock</span>
                <span className="font-bold text-emerald-400 text-sm font-mono">
                  {calculatedNewStock()} {currentProduct.unit}
                </span>
              </div>
            </div>
          )}

          {/* Quantity Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              {type === 'adjustment' ? 'New Re-counted Quantity' : 'Quantity Units'}
            </label>
            <input
              type="number"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value) || 0))}
              required
              className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Reference & Operator */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Reference Code / PO
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. PO-9801 / SO-221"
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Staff / Operator
              </label>
              <input
                type="text"
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                placeholder="Your Name"
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Reason / Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Reason / Destination
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Supplier delivery, damage write-off, retail order"
              required
              className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Submit Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-lg transition-all ${
                type === 'in'
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/40'
                  : type === 'out'
                  ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/40'
                  : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/40'
              }`}
            >
              Post Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
