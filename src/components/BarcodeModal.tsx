import React, { useState, useEffect } from 'react';
import { X, ScanLine, Printer, Check, ArrowDownToLine, ArrowUpFromLine, Search } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { Product } from '../types/inventory';

interface BarcodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product;
}

export const BarcodeModal: React.FC<BarcodeModalProps> = ({
  isOpen,
  onClose,
  product: initialProduct,
}) => {
  const { products, recordMovement } = useInventory();
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(initialProduct);
  const [searchQuery, setSearchQuery] = useState('');
  const [scannedAlert, setScannedAlert] = useState(false);

  useEffect(() => {
    if (initialProduct) {
      setSelectedProduct(initialProduct);
    } else if (products.length > 0 && !selectedProduct) {
      setSelectedProduct(products[0]);
    }
  }, [initialProduct, products]);

  if (!isOpen) return null;

  const currentProduct = selectedProduct || products[0];

  const handleSimulateScan = (direction: 'in' | 'out') => {
    if (!currentProduct) return;
    const success = recordMovement({
      productId: currentProduct.id,
      type: direction,
      quantity: 1,
      reference: 'SCAN-HANDHELD',
      reason: `Direct handheld barcode scan: ${direction.toUpperCase()}`,
      operator: 'Terminal Station 01',
    });

    if (success) {
      setScannedAlert(true);
      setTimeout(() => setScannedAlert(false), 2000);
    }
  };

  // Generate an SVG barcode pattern based on characters
  const generateBarcodeLines = (str: string) => {
    const lines = [];
    let seed = 0;
    for (let i = 0; i < str.length; i++) {
      seed = (seed * 31 + str.charCodeAt(i)) % 1000;
    }

    const totalBars = 45;
    for (let i = 0; i < totalBars; i++) {
      const isGuard = i < 3 || i > totalBars - 4 || (i >= 21 && i <= 23);
      const width = isGuard ? 2 : ((seed + i * 7) % 3) + 1;
      const height = isGuard ? 55 : 45;
      lines.push({ width, height, isGuard });
    }
    return lines;
  };

  const barcodeBars = currentProduct ? generateBarcodeLines(currentProduct.barcode) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <ScanLine className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">SKU & Barcode Terminal</h2>
              <p className="text-[11px] text-slate-400">Warehouse Label & Scanner Simulator</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Item Selector / Lookup */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Select or Scan SKU
            </label>
            <select
              value={currentProduct?.id}
              onChange={(e) => {
                const found = products.find((p) => p.id === e.target.value);
                setSelectedProduct(found);
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.sku}] {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Printable Label Card */}
          {currentProduct && (
            <div className="bg-white text-slate-900 rounded-xl p-5 border border-slate-300 shadow-md">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                    Not-Venda Logistics
                  </span>
                  <div className="font-mono font-bold text-base tracking-tight text-slate-900">
                    {currentProduct.sku}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-900 text-white px-2 py-0.5 rounded">
                    {currentProduct.location}
                  </span>
                </div>
              </div>

              <div className="text-xs font-bold text-slate-800 mt-2 line-clamp-1">
                {currentProduct.name}
              </div>

              {/* Barcode graphic */}
              <div className="mt-4 flex flex-col items-center justify-center bg-slate-50 p-2 rounded border border-slate-200">
                <div className="flex items-end justify-center gap-0.5 h-14 w-full px-2">
                  {barcodeBars.map((bar, i) => (
                    <div
                      key={i}
                      className="bg-black shrink-0"
                      style={{
                        width: `${bar.width}px`,
                        height: `${bar.height}px`,
                        marginRight: i % 2 === 0 ? '1px' : '0px',
                      }}
                    />
                  ))}
                </div>
                <span className="font-mono text-xs tracking-widest text-slate-700 mt-1 font-semibold">
                  {currentProduct.barcode}
                </span>
              </div>

              {/* Footer specs */}
              <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
                <span>Stock: <strong>{currentProduct.currentStock} {currentProduct.unit}</strong></span>
                <span>MSRP: <strong>${currentProduct.sellingPrice.toFixed(2)}</strong></span>
              </div>
            </div>
          )}

          {/* Scanner Feedback Notification */}
          {scannedAlert && (
            <div className="bg-emerald-950/80 border border-emerald-700 text-emerald-300 p-2.5 rounded-xl text-xs flex items-center justify-center gap-2 animate-pulse">
              <Check className="w-4 h-4" />
              <span>Barcode scanned successfully! Stock updated.</span>
            </div>
          )}

          {/* Handheld Scanner Simulation Controls */}
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2">
            <span className="text-xs font-semibold text-slate-400 block">
              Simulate Handheld Scanner Action:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleSimulateScan('in')}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
              >
                <ArrowDownToLine className="w-3.5 h-3.5" />
                Scan In (+1)
              </button>
              <button
                type="button"
                onClick={() => handleSimulateScan('out')}
                disabled={!currentProduct || currentProduct.currentStock <= 0}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-colors ${
                  !currentProduct || currentProduct.currentStock <= 0
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-amber-600 hover:bg-amber-500 text-white'
                }`}
              >
                <ArrowUpFromLine className="w-3.5 h-3.5" />
                Scan Out (-1)
              </button>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 text-slate-300 hover:text-white"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Shelf Label</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
