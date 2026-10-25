import React from 'react';
import { 
  Package, 
  Plus, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  ScanLine, 
  Download, 
  RotateCcw,
  AlertTriangle
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';

interface NavbarProps {
  currentTab: 'dashboard' | 'products' | 'movements' | 'orders' | 'suppliers';
  setCurrentTab: (tab: 'dashboard' | 'products' | 'movements' | 'orders' | 'suppliers') => void;
  onOpenProductModal: () => void;
  onOpenMovementModal: (type?: 'in' | 'out') => void;
  onOpenBarcodeModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenProductModal,
  onOpenMovementModal,
  onOpenBarcodeModal,
}) => {
  const { stats, exportProductsCSV, resetAllData } = useInventory();

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xl tracking-tight text-white">Not-Venda</span>
                <span className="text-[10px] uppercase tracking-wider font-semibold bg-indigo-950 text-indigo-400 px-2 py-0.5 rounded border border-indigo-800/60">
                  IMS Enterprise
                </span>
              </div>
              <p className="text-xs text-slate-400">Inventory & Stock Control</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80">
            <button
              onClick={() => setCurrentTab('dashboard')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'dashboard'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setCurrentTab('products')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                currentTab === 'products'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              Inventory
              {stats.lowStockCount + stats.outOfStockCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </button>
            <button
              onClick={() => setCurrentTab('movements')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'movements'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              Stock Ledger
            </button>
            <button
              onClick={() => setCurrentTab('orders')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                currentTab === 'orders'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              Purchase Orders
              {stats.activeOrdersCount > 0 && (
                <span className="text-[11px] bg-slate-800 text-slate-300 font-semibold px-1.5 py-0.2 rounded-full">
                  {stats.activeOrdersCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setCurrentTab('suppliers')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'suppliers'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              Suppliers
            </button>
          </nav>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenBarcodeModal}
              title="SKU & Barcode Scanner"
              className="p-2 rounded-lg text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 transition-colors"
            >
              <ScanLine className="w-4 h-4" />
            </button>

            <button
              onClick={() => onOpenMovementModal('in')}
              title="Stock In (Receive)"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-800/60 transition-colors"
            >
              <ArrowDownToLine className="w-3.5 h-3.5" />
              Stock In
            </button>

            <button
              onClick={() => onOpenMovementModal('out')}
              title="Stock Out (Dispatch)"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-amber-300 bg-amber-950/60 hover:bg-amber-900/80 border border-amber-800/60 transition-colors"
            >
              <ArrowUpFromLine className="w-3.5 h-3.5" />
              Stock Out
            </button>

            <button
              onClick={onOpenProductModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Item</span>
            </button>

            <div className="h-6 w-[1px] bg-slate-800 mx-1 hidden sm:block" />

            <button
              onClick={exportProductsCSV}
              title="Export Inventory CSV"
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors hidden sm:block"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                if (window.confirm('Reset all inventory records back to original demo data?')) {
                  resetAllData();
                }
              }}
              title="Reset Demo Data"
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-800/60 text-xs">
          <button
            onClick={() => setCurrentTab('dashboard')}
            className={`py-1 px-2 font-medium ${currentTab === 'dashboard' ? 'text-indigo-400' : 'text-slate-400'}`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setCurrentTab('products')}
            className={`py-1 px-2 font-medium ${currentTab === 'products' ? 'text-indigo-400' : 'text-slate-400'}`}
          >
            Inventory
          </button>
          <button
            onClick={() => setCurrentTab('movements')}
            className={`py-1 px-2 font-medium ${currentTab === 'movements' ? 'text-indigo-400' : 'text-slate-400'}`}
          >
            Ledger
          </button>
          <button
            onClick={() => setCurrentTab('orders')}
            className={`py-1 px-2 font-medium ${currentTab === 'orders' ? 'text-indigo-400' : 'text-slate-400'}`}
          >
            Orders
          </button>
          <button
            onClick={() => setCurrentTab('suppliers')}
            className={`py-1 px-2 font-medium ${currentTab === 'suppliers' ? 'text-indigo-400' : 'text-slate-400'}`}
          >
            Suppliers
          </button>
        </div>
      </div>
    </header>
  );
};
