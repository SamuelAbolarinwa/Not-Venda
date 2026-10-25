import React, { useState, useEffect } from 'react';
import { X, Package, Save, AlertCircle } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { Product } from '../types/inventory';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
}) => {
  const { suppliers, addProduct, updateProduct } = useInventory();

  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [currentStock, setCurrentStock] = useState<number>(10);
  const [minThreshold, setMinThreshold] = useState<number>(5);
  const [maxCapacity, setMaxCapacity] = useState<number>(100);
  const [costPrice, setCostPrice] = useState<number>(10.0);
  const [sellingPrice, setSellingPrice] = useState<number>(25.0);
  const [unit, setUnit] = useState('pcs');
  const [location, setLocation] = useState('Aisle 1 - Shelf A');
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (productToEdit) {
      setSku(productToEdit.sku);
      setBarcode(productToEdit.barcode);
      setName(productToEdit.name);
      setCategory(productToEdit.category);
      setCurrentStock(productToEdit.currentStock);
      setMinThreshold(productToEdit.minThreshold);
      setMaxCapacity(productToEdit.maxCapacity);
      setCostPrice(productToEdit.costPrice);
      setSellingPrice(productToEdit.sellingPrice);
      setUnit(productToEdit.unit);
      setLocation(productToEdit.location);
      setSupplierId(productToEdit.supplierId);
      setNotes(productToEdit.notes || '');
    } else {
      // Auto-generate SKU & barcode for fast entry
      const rand = Math.floor(100 + Math.random() * 900);
      setSku(`SKU-GEN-${rand}`);
      setBarcode(`840192${Math.floor(100000 + Math.random() * 900000)}`);
      setName('');
      setCategory('Electronics');
      setCurrentStock(25);
      setMinThreshold(10);
      setMaxCapacity(150);
      setCostPrice(15.0);
      setSellingPrice(35.0);
      setUnit('pcs');
      setLocation('Aisle 2 - Shelf B');
      setSupplierId(suppliers[0]?.id || '');
      setNotes('');
    }
    setError('');
  }, [productToEdit, isOpen, suppliers]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!sku.trim() || !name.trim()) {
      setError('Please provide both SKU and Product Name.');
      return;
    }

    const selectedSupplier = suppliers.find((s) => s.id === supplierId) || suppliers[0];

    if (productToEdit) {
      updateProduct(productToEdit.id, {
        sku: sku.trim().toUpperCase(),
        barcode: barcode.trim(),
        name: name.trim(),
        category,
        currentStock: Number(currentStock),
        minThreshold: Number(minThreshold),
        maxCapacity: Number(maxCapacity),
        costPrice: Number(costPrice),
        sellingPrice: Number(sellingPrice),
        unit,
        location: location.trim(),
        supplierId: selectedSupplier.id,
        supplierName: selectedSupplier.name,
        notes: notes.trim(),
      });
    } else {
      addProduct({
        sku: sku.trim().toUpperCase(),
        barcode: barcode.trim(),
        name: name.trim(),
        category,
        currentStock: Number(currentStock),
        minThreshold: Number(minThreshold),
        maxCapacity: Number(maxCapacity),
        costPrice: Number(costPrice),
        sellingPrice: Number(sellingPrice),
        unit,
        location: location.trim(),
        supplierId: selectedSupplier.id,
        supplierName: selectedSupplier.name,
        notes: notes.trim(),
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {productToEdit ? 'Edit Product Details' : 'Register New Inventory Item'}
              </h2>
              <p className="text-xs text-slate-400">
                Configure SKU specs, storage location, and thresholds
              </p>
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

          {/* Row 1: SKU & Barcode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                SKU Code *
              </label>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. SKU-ELE-101"
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Barcode / UPC
              </label>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="e.g. 840192837411"
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Row 2: Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Product Title / Description *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. USB-C 120W Rapid Charging Station"
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Electronics">Electronics</option>
                <option value="Industrial Tools">Industrial Tools</option>
                <option value="Packaging">Packaging</option>
                <option value="Safety Gear">Safety Gear</option>
                <option value="Raw Materials">Raw Materials</option>
                <option value="Office Equipment">Office Equipment</option>
              </select>
            </div>
          </div>

          {/* Row 3: Quantities */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/50 p-3 rounded-xl border border-slate-800">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Current Stock</label>
              <input
                type="number"
                min="0"
                value={currentStock}
                onChange={(e) => setCurrentStock(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Min Threshold</label>
              <input
                type="number"
                min="0"
                value={minThreshold}
                onChange={(e) => setMinThreshold(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Max Capacity</label>
              <input
                type="number"
                min="1"
                value={maxCapacity}
                onChange={(e) => setMaxCapacity(parseInt(e.target.value) || 100)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Stock Unit</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="pcs, boxes"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-slate-100"
              />
            </div>
          </div>

          {/* Row 4: Pricing */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Cost Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={costPrice}
                onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Selling Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Row 5: Location & Supplier */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Warehouse Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Aisle 4 - Shelf B2"
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Preferred Supplier
              </label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 6: Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Technical / Handling Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Fragile glass, moisture sensitive, store in cool bay..."
              className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Footer Submit */}
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
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-900/40 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{productToEdit ? 'Save Changes' : 'Create Product'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
