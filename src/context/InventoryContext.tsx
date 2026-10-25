import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Product, Supplier, StockMovement, PurchaseOrder, InventoryStats, MovementType, OrderStatus } from '../types/inventory';
import { INITIAL_PRODUCTS, INITIAL_SUPPLIERS, INITIAL_MOVEMENTS, INITIAL_PURCHASE_ORDERS } from '../data/initialData';

interface InventoryContextType {
  products: Product[];
  suppliers: Supplier[];
  movements: StockMovement[];
  purchaseOrders: PurchaseOrder[];
  stats: InventoryStats;
  addProduct: (product: Omit<Product, 'id' | 'status' | 'lastRestocked'>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  recordMovement: (data: {
    productId: string;
    type: MovementType;
    quantity: number;
    reference: string;
    reason: string;
    operator?: string;
  }) => boolean;
  createPurchaseOrder: (order: Omit<PurchaseOrder, 'id' | 'poNumber' | 'status' | 'orderDate'>) => PurchaseOrder;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  receivePurchaseOrder: (orderId: string) => void;
  addSupplier: (supplier: Omit<Supplier, 'id'>) => Supplier;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  resetAllData: () => void;
  exportProductsCSV: () => void;
}

const STORAGE_KEYS = {
  PRODUCTS: 'notvenda_products_v1',
  SUPPLIERS: 'notvenda_suppliers_v1',
  MOVEMENTS: 'notvenda_movements_v1',
  ORDERS: 'notvenda_orders_v1',
};

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

function calculateStatus(stock: number, minThreshold: number): Product['status'] {
  if (stock <= 0) return 'out_of_stock';
  if (stock <= minThreshold) return 'low_stock';
  return 'in_stock';
}

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SUPPLIERS);
      return saved ? JSON.parse(saved) : INITIAL_SUPPLIERS;
    } catch {
      return INITIAL_SUPPLIERS;
    }
  });

  const [movements, setMovements] = useState<StockMovement[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MOVEMENTS);
      return saved ? JSON.parse(saved) : INITIAL_MOVEMENTS;
    } catch {
      return INITIAL_MOVEMENTS;
    }
  });

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
      return saved ? JSON.parse(saved) : INITIAL_PURCHASE_ORDERS;
    } catch {
      return INITIAL_PURCHASE_ORDERS;
    }
  });

  // Sync with LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(movements));
  }, [movements]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(purchaseOrders));
  }, [purchaseOrders]);

  // Derived stats
  const stats: InventoryStats = useMemo(() => {
    let totalQty = 0;
    let costVal = 0;
    let retailVal = 0;
    let lowStock = 0;
    let outStock = 0;

    for (const p of products) {
      totalQty += p.currentStock;
      costVal += p.currentStock * p.costPrice;
      retailVal += p.currentStock * p.sellingPrice;
      if (p.currentStock <= 0) {
        outStock++;
      } else if (p.currentStock <= p.minThreshold) {
        lowStock++;
      }
    }

    const activeOrders = purchaseOrders.filter(
      (o) => o.status === 'ordered' || o.status === 'partially_received'
    ).length;

    return {
      totalItems: products.length,
      totalQuantity: totalQty,
      totalCostValue: costVal,
      totalRetailValue: retailVal,
      lowStockCount: lowStock,
      outOfStockCount: outStock,
      activeOrdersCount: activeOrders,
      suppliersCount: suppliers.length,
    };
  }, [products, purchaseOrders, suppliers]);

  const addProduct = (data: Omit<Product, 'id' | 'status' | 'lastRestocked'>): Product => {
    const id = `prod-${Date.now()}`;
    const status = calculateStatus(data.currentStock, data.minThreshold);
    const newProduct: Product = {
      ...data,
      id,
      status,
      lastRestocked: new Date().toISOString(),
    };

    setProducts((prev) => [newProduct, ...prev]);

    // Record initial inventory movement if quantity > 0
    if (newProduct.currentStock > 0) {
      const movement: StockMovement = {
        id: `mov-${Date.now()}`,
        productId: newProduct.id,
        productName: newProduct.name,
        sku: newProduct.sku,
        type: 'in',
        quantity: newProduct.currentStock,
        previousStock: 0,
        newStock: newProduct.currentStock,
        reference: 'INIT-SETUP',
        reason: 'Initial stock on product creation',
        timestamp: new Date().toISOString(),
        operator: 'System Admin',
      };
      setMovements((prev) => [movement, ...prev]);
    }

    return newProduct;
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const updated = { ...p, ...updates };
        updated.status = calculateStatus(updated.currentStock, updated.minThreshold);
        return updated;
      })
    );
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const recordMovement = ({
    productId,
    type,
    quantity,
    reference,
    reason,
    operator = 'Warehouse Lead',
  }: {
    productId: string;
    type: MovementType;
    quantity: number;
    reference: string;
    reason: string;
    operator?: string;
  }): boolean => {
    const product = products.find((p) => p.id === productId);
    if (!product) return false;

    let newStock = product.currentStock;
    if (type === 'in') {
      newStock += quantity;
    } else if (type === 'out') {
      if (product.currentStock < quantity) {
        return false; // insufficient stock
      }
      newStock -= quantity;
    } else if (type === 'adjustment') {
      // adjustment replaces or applies delta
      newStock = quantity;
    }

    const previousStock = product.currentStock;
    const diff = Math.abs(newStock - previousStock);

    const movement: StockMovement = {
      id: `mov-${Date.now()}`,
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      type,
      quantity: type === 'adjustment' ? diff : quantity,
      previousStock,
      newStock,
      reference,
      reason,
      timestamp: new Date().toISOString(),
      operator,
    };

    setMovements((prev) => [movement, ...prev]);

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        return {
          ...p,
          currentStock: newStock,
          status: calculateStatus(newStock, p.minThreshold),
          lastRestocked: type === 'in' ? new Date().toISOString() : p.lastRestocked,
        };
      })
    );

    return true;
  };

  const createPurchaseOrder = (
    order: Omit<PurchaseOrder, 'id' | 'poNumber' | 'status' | 'orderDate'>
  ): PurchaseOrder => {
    const poNumber = `PO-${new Date().getFullYear()}-${String(purchaseOrders.length + 90).padStart(3, '0')}`;
    const newOrder: PurchaseOrder = {
      ...order,
      id: `po-${Date.now()}`,
      poNumber,
      status: 'ordered',
      orderDate: new Date().toISOString(),
    };

    setPurchaseOrders((prev) => [newOrder, ...prev]);
    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setPurchaseOrders((prev) =>
      prev.map((order) => (order.id === orderId ? { ...order, status } : order))
    );
  };

  const receivePurchaseOrder = (orderId: string) => {
    const order = purchaseOrders.find((o) => o.id === orderId);
    if (!order) return;

    // Apply stock in for every item in order
    order.items.forEach((item) => {
      const prod = products.find((p) => p.id === item.productId);
      if (prod) {
        const qtyToReceive = item.orderedQty - item.receivedQty;
        if (qtyToReceive > 0) {
          recordMovement({
            productId: item.productId,
            type: 'in',
            quantity: qtyToReceive,
            reference: order.poNumber,
            reason: `Purchase order delivery received from ${order.supplierName}`,
            operator: 'Receiving Dock',
          });
        }
      }
    });

    // Mark PO received
    setPurchaseOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'received',
              items: o.items.map((i) => ({ ...i, receivedQty: i.orderedQty })),
            }
          : o
      )
    );
  };

  const addSupplier = (supplierData: Omit<Supplier, 'id'>): Supplier => {
    const newSupplier: Supplier = {
      ...supplierData,
      id: `sup-${Date.now()}`,
    };
    setSuppliers((prev) => [newSupplier, ...prev]);
    return newSupplier;
  };

  const updateSupplier = (id: string, updates: Partial<Supplier>) => {
    setSuppliers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  const deleteSupplier = (id: string) => {
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
  };

  const resetAllData = () => {
    setProducts(INITIAL_PRODUCTS);
    setSuppliers(INITIAL_SUPPLIERS);
    setMovements(INITIAL_MOVEMENTS);
    setPurchaseOrders(INITIAL_PURCHASE_ORDERS);
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.SUPPLIERS);
    localStorage.removeItem(STORAGE_KEYS.MOVEMENTS);
    localStorage.removeItem(STORAGE_KEYS.ORDERS);
  };

  const exportProductsCSV = () => {
    const headers = [
      'SKU',
      'Barcode',
      'Product Name',
      'Category',
      'Current Stock',
      'Unit',
      'Min Threshold',
      'Cost Price ($)',
      'Selling Price ($)',
      'Total Value ($)',
      'Location',
      'Supplier',
      'Status',
    ];

    const rows = products.map((p) => [
      `"${p.sku}"`,
      `"${p.barcode}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.category}"`,
      p.currentStock,
      `"${p.unit}"`,
      p.minThreshold,
      p.costPrice.toFixed(2),
      p.sellingPrice.toFixed(2),
      (p.currentStock * p.costPrice).toFixed(2),
      `"${p.location}"`,
      `"${p.supplierName.replace(/"/g, '""')}"`,
      `"${p.status}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `not_venda_inventory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <InventoryContext.Provider
      value={{
        products,
        suppliers,
        movements,
        purchaseOrders,
        stats,
        addProduct,
        updateProduct,
        deleteProduct,
        recordMovement,
        createPurchaseOrder,
        updateOrderStatus,
        receivePurchaseOrder,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        resetAllData,
        exportProductsCSV,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
