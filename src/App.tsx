import React, { useState } from 'react';
import { InventoryProvider } from './context/InventoryContext';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { ProductsView } from './components/ProductsView';
import { MovementsLedgerView } from './components/MovementsLedgerView';
import { PurchaseOrdersView } from './components/PurchaseOrdersView';
import { SuppliersView } from './components/SuppliersView';
import { StockMovementModal } from './components/StockMovementModal';
import { ProductFormModal } from './components/ProductFormModal';
import { BarcodeModal } from './components/BarcodeModal';
import { Product, MovementType } from './types/inventory';

export const AppContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'products' | 'movements' | 'orders' | 'suppliers'>('dashboard');

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);

  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [movementType, setMovementType] = useState<MovementType>('in');
  const [movementProductId, setMovementProductId] = useState<string | undefined>(undefined);

  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [barcodeProduct, setBarcodeProduct] = useState<Product | undefined>(undefined);

  const handleOpenProductModal = (product?: Product) => {
    setEditingProduct(product);
    setIsProductModalOpen(true);
  };

  const handleOpenMovementModal = (type: MovementType = 'in', productId?: string) => {
    setMovementType(type);
    setMovementProductId(productId);
    setIsMovementModalOpen(true);
  };

  const handleOpenBarcodeModal = (product?: Product) => {
    setBarcodeProduct(product);
    setIsBarcodeModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Navigation Header */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenProductModal={() => handleOpenProductModal()}
        onOpenMovementModal={(type) => handleOpenMovementModal(type || 'in')}
        onOpenBarcodeModal={() => handleOpenBarcodeModal()}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'dashboard' && (
          <DashboardView
            onNavigateTab={setCurrentTab}
            onOpenMovementModal={handleOpenMovementModal}
            onOpenProductModal={handleOpenProductModal}
          />
        )}

        {currentTab === 'products' && (
          <ProductsView
            onOpenProductModal={handleOpenProductModal}
            onOpenMovementModal={handleOpenMovementModal}
            onOpenBarcodeModal={handleOpenBarcodeModal}
          />
        )}

        {currentTab === 'movements' && <MovementsLedgerView />}

        {currentTab === 'orders' && <PurchaseOrdersView />}

        {currentTab === 'suppliers' && <SuppliersView />}
      </main>

      {/* Modals */}
      <ProductFormModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        productToEdit={editingProduct}
      />

      <StockMovementModal
        isOpen={isMovementModalOpen}
        onClose={() => setIsMovementModalOpen(false)}
        initialType={movementType}
        initialProductId={movementProductId}
      />

      <BarcodeModal
        isOpen={isBarcodeModalOpen}
        onClose={() => setIsBarcodeModalOpen(false)}
        product={barcodeProduct}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-slate-300">Not-Venda Live Engine</span>
            <span>• Inventory Management System</span>
          </div>
          <div className="text-slate-400">
            Offline & Local-Ready • Automatic Ledger Audit Trail
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <InventoryProvider>
      <AppContent />
    </InventoryProvider>
  );
}
