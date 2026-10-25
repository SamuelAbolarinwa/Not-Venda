import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  ScanLine, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Layers, 
  LayoutGrid, 
  List, 
  DollarSign, 
  MapPin, 
  Truck
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { Product, StockStatus } from '../types/inventory';

interface ProductsViewProps {
  onOpenProductModal: (product?: Product) => void;
  onOpenMovementModal: (type?: 'in' | 'out', productId?: string) => void;
  onOpenBarcodeModal: (product?: Product) => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  onOpenProductModal,
  onOpenMovementModal,
  onOpenBarcodeModal,
}) => {
  const { products, deleteProduct } = useInventory();
  
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'value' | 'sku'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Extract all categories
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ['all', ...Array.from(set)];
  }, [products]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesSearch =
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.sku.toLowerCase().includes(search.toLowerCase()) ||
          p.barcode.includes(search) ||
          p.supplierName.toLowerCase().includes(search.toLowerCase()) ||
          p.location.toLowerCase().includes(search.toLowerCase());

        const matchesCategory =
          selectedCategory === 'all' || p.category === selectedCategory;

        const matchesStatus =
          selectedStatus === 'all' ||
          (selectedStatus === 'in_stock' && p.status === 'in_stock') ||
          (selectedStatus === 'low_stock' && p.status === 'low_stock') ||
          (selectedStatus === 'out_of_stock' && p.status === 'out_of_stock');

        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((a, b) => {
        let valA: any = a.name;
        let valB: any = b.name;

        if (sortBy === 'stock') {
          valA = a.currentStock;
          valB = b.currentStock;
        } else if (sortBy === 'value') {
          valA = a.currentStock * a.costPrice;
          valB = b.currentStock * b.costPrice;
        } else if (sortBy === 'sku') {
          valA = a.sku;
          valB = b.sku;
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [products, search, selectedCategory, selectedStatus, sortBy, sortOrder]);

  const handleDelete = (p: Product) => {
    if (window.confirm(`Are you sure you want to delete ${p.name} (${p.sku})? This cannot be undone.`)) {
      deleteProduct(p.id);
    }
  };

  return (
    <div className="space-y-5">
      {/* Search and Filters Toolbar */}
      <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by SKU, barcode, name, aisle..."
              className="w-full pl-9 pr-4 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Controls: View mode and Add item */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
            <div className="flex items-center bg-slate-950/80 border border-slate-700/80 rounded-xl p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  viewMode === 'table' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => onOpenProductModal()}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>New Product</span>
            </button>
          </div>
        </div>

        {/* Categories & Status Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Filter:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-slate-700 text-white border border-slate-600'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {cat === 'all' ? 'All Categories' : cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-950/80 border border-slate-700/80 text-slate-300 rounded-lg px-2.5 py-1 focus:outline-none"
            >
              <option value="all">All Stock Statuses</option>
              <option value="in_stock">In Stock Only</option>
              <option value="low_stock">Low Stock (At Risk)</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>

            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [by, order] = e.target.value.split('-');
                setSortBy(by as any);
                setSortOrder(order as any);
              }}
              className="bg-slate-950/80 border border-slate-700/80 text-slate-300 rounded-lg px-2.5 py-1 focus:outline-none"
            >
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="stock-desc">Stock (Highest)</option>
              <option value="stock-asc">Stock (Lowest)</option>
              <option value="value-desc">Value ($ High to Low)</option>
              <option value="sku-asc">SKU Code</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>
          Showing <strong className="text-slate-200">{filteredProducts.length}</strong> of{' '}
          <strong className="text-slate-200">{products.length}</strong> items
        </span>
        {filteredProducts.length === 0 && (
          <span className="text-amber-400">No items match your filter criteria.</span>
        )}
      </div>

      {/* Table View */}
      {viewMode === 'table' ? (
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Product & SKU</th>
                  <th className="py-3.5 px-3 font-semibold">Category</th>
                  <th className="py-3.5 px-3 font-semibold">Stock Level</th>
                  <th className="py-3.5 px-3 font-semibold">Pricing & Margin</th>
                  <th className="py-3.5 px-3 font-semibold">Location</th>
                  <th className="py-3.5 px-3 font-semibold">Supplier</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredProducts.map((p) => {
                  const margin = Math.round(((p.sellingPrice - p.costPrice) / p.sellingPrice) * 100);
                  const isDepleted = p.currentStock === 0;
                  const isLow = p.currentStock > 0 && p.currentStock <= p.minThreshold;

                  return (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Product Name & SKU */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-100">{p.name}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-xs text-indigo-400 bg-indigo-950/60 px-1.5 py-0.2 rounded border border-indigo-800/40">
                            {p.sku}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            UPC: {p.barcode}
                          </span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-3 text-xs text-slate-300">
                        <span className="bg-slate-800/90 text-slate-300 px-2.5 py-1 rounded-md border border-slate-700/60">
                          {p.category}
                        </span>
                      </td>

                      {/* Stock Level */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold font-mono text-sm ${
                              isDepleted
                                ? 'text-rose-400'
                                : isLow
                                ? 'text-amber-400'
                                : 'text-emerald-400'
                            }`}
                          >
                            {p.currentStock} {p.unit}
                          </span>
                          {isDepleted ? (
                            <span className="text-[10px] uppercase font-semibold text-rose-400 bg-rose-950/80 px-1.5 py-0.5 rounded border border-rose-800/40">
                              Out
                            </span>
                          ) : isLow ? (
                            <span className="text-[10px] uppercase font-semibold text-amber-400 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800/40">
                              Low
                            </span>
                          ) : null}
                        </div>
                        <div className="w-24 h-1.5 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isDepleted
                                ? 'bg-rose-500'
                                : isLow
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{
                              width: `${Math.min(100, (p.currentStock / (p.maxCapacity || 100)) * 100)}%`,
                            }}
                          />
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Safety: {p.minThreshold} {p.unit}
                        </div>
                      </td>

                      {/* Pricing */}
                      <td className="py-3.5 px-3 text-xs">
                        <div className="text-slate-200 font-medium">
                          ${p.sellingPrice.toFixed(2)}{' '}
                          <span className="text-emerald-400 font-bold ml-1">+{margin}%</span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Cost: ${p.costPrice.toFixed(2)}
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-3 text-xs text-slate-300">
                        <div className="flex items-center gap-1 text-slate-300">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{p.location}</span>
                        </div>
                      </td>

                      {/* Supplier */}
                      <td className="py-3.5 px-3 text-xs text-slate-300 truncate max-w-[140px]">
                        <div className="truncate font-medium">{p.supplierName}</div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onOpenMovementModal('in', p.id)}
                            title="Stock In"
                            className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/60 rounded-lg transition-colors"
                          >
                            <ArrowDownToLine className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onOpenMovementModal('out', p.id)}
                            title="Stock Out"
                            disabled={p.currentStock <= 0}
                            className={`p-1.5 rounded-lg transition-colors ${
                              p.currentStock <= 0
                                ? 'text-slate-600 cursor-not-allowed'
                                : 'text-amber-400 hover:text-amber-300 hover:bg-amber-950/60'
                            }`}
                          >
                            <ArrowUpFromLine className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onOpenBarcodeModal(p)}
                            title="Barcode / SKU Card"
                            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <ScanLine className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onOpenProductModal(p)}
                            title="Edit Product"
                            className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(p)}
                            title="Delete"
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Card Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((p) => {
            const isDepleted = p.currentStock === 0;
            const isLow = p.currentStock > 0 && p.currentStock <= p.minThreshold;
            const margin = Math.round(((p.sellingPrice - p.costPrice) / p.sellingPrice) * 100);

            return (
              <div
                key={p.id}
                className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 flex flex-col justify-between hover:border-slate-700 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-mono text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/40">
                        {p.sku}
                      </span>
                      <h3 className="font-bold text-slate-100 text-base mt-2 line-clamp-1">
                        {p.name}
                      </h3>
                    </div>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold shrink-0 ${
                        isDepleted
                          ? 'bg-rose-950 text-rose-400 border border-rose-800/60'
                          : isLow
                          ? 'bg-amber-950 text-amber-400 border border-amber-800/60'
                          : 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                      }`}
                    >
                      {isDepleted ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                    {p.notes || 'No notes specified.'}
                  </p>

                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-800/80 text-xs">
                    <div>
                      <span className="text-slate-500 block">Stock Level</span>
                      <span className="font-bold text-slate-200 text-sm font-mono">
                        {p.currentStock} {p.unit}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Price / Margin</span>
                      <span className="font-bold text-slate-200 text-sm">
                        ${p.sellingPrice.toFixed(2)}{' '}
                        <span className="text-emerald-400 text-xs">+{margin}%</span>
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      {p.location}
                    </span>
                    <span className="font-mono text-[11px]">{p.barcode}</span>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onOpenMovementModal('in', p.id)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/50 transition-colors"
                    >
                      + In
                    </button>
                    <button
                      onClick={() => onOpenMovementModal('out', p.id)}
                      disabled={p.currentStock <= 0}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                        p.currentStock <= 0
                          ? 'text-slate-600 border-slate-800 cursor-not-allowed'
                          : 'bg-amber-950/80 hover:bg-amber-900 text-amber-300 border-amber-800/50'
                      }`}
                    >
                      - Out
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onOpenBarcodeModal(p)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                    >
                      <ScanLine className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onOpenProductModal(p)}
                      className="p-1.5 text-slate-400 hover:text-indigo-400 rounded-lg hover:bg-slate-800"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(p)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
