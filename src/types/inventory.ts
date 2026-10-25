export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export interface Product {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  category: string;
  currentStock: number;
  minThreshold: number;
  maxCapacity: number;
  costPrice: number;
  sellingPrice: number;
  unit: string;
  location: string;
  supplierId: string;
  supplierName: string;
  status: StockStatus;
  lastRestocked: string;
  notes?: string;
}

export type MovementType = 'in' | 'out' | 'adjustment' | 'transfer';

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  type: MovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reference: string;
  reason: string;
  timestamp: string;
  operator: string;
}

export interface PurchaseOrderItem {
  productId: string;
  productName: string;
  sku: string;
  orderedQty: number;
  receivedQty: number;
  unitCost: number;
}

export type OrderStatus = 'draft' | 'ordered' | 'partially_received' | 'received' | 'cancelled';

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseOrderItem[];
  totalAmount: number;
  status: OrderStatus;
  orderDate: string;
  expectedDeliveryDate: string;
  notes?: string;
}

export interface Supplier {
  id: string;
  name: string;
  code: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  category: string;
  rating: number;
  leadTimeDays: number;
}

export interface InventoryStats {
  totalItems: number;
  totalQuantity: number;
  totalCostValue: number;
  totalRetailValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  activeOrdersCount: number;
  suppliersCount: number;
}
